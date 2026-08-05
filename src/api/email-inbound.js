// src/api/email-inbound.js
// Recibe el webhook saliente de Zoho Mail cuando llega un correo a
// hola@atiendemelapyme.cl (configurado en Zoho: Settings > Integrations >
// Developer Space > Outgoing Webhooks). Dominga redacta un borrador con
// Claude y le manda una notificación a Germán para que la revise y la
// envíe manualmente — nunca se responde al cliente en automático.
//
// Verificación: Zoho firma cada request con HMAC-SHA256 usando un secreto
// (x-hook-secret) que solo llega en el header del primer POST al guardar
// la config del webhook. Ese primer secreto se guarda en KV; en los
// siguientes requests se valida x-hook-signature contra ese secreto.

import { callClaude } from '../lib/anthropic.js';
import { buildEmailSystemPrompt } from '../lib/dominga-prompt.js';
import { ApiError, sendError, sendSuccess } from '../lib/errors.js';

const RESEND_API = 'https://api.resend.com/emails';
const ZOHO_SECRET_KV_KEY = 'zoho_webhook_secret';

function escapeHtml(str = '') {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function stripHtml(html = '') {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function extractEmailAddress(rawFrom = '') {
  const match = rawFrom.match(/<([^>]+)>/);
  return match ? match[1] : rawFrom.trim();
}

async function hmacSha256Base64(secret, message) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)));
}

function buildMailtoLink(toEmail, subject, body) {
  const params = new URLSearchParams({ subject, body });
  return `mailto:${encodeURIComponent(toEmail)}?${params.toString().replace(/\+/g, '%20')}`;
}

async function notifyGerman({ fromAddress, subject, originalText, draftText, env }) {
  const notifyTo = env.DRAFT_NOTIFICATION_EMAIL;
  if (!notifyTo) {
    console.error('[EMAIL-INBOUND] Falta DRAFT_NOTIFICATION_EMAIL, no se puede notificar el borrador');
    return { success: false, error: 'DRAFT_NOTIFICATION_EMAIL no configurado' };
  }

  const replySubject = subject && !/^re:/i.test(subject) ? `Re: ${subject}` : (subject || 'Re: tu consulta');
  const mailtoLink = buildMailtoLink(fromAddress, replySubject, draftText);

  const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"></head>
<body style="font-family:-apple-system,Arial,sans-serif;line-height:1.6;color:#222;max-width:640px;margin:0 auto;padding:20px;">
  <h2 style="margin:0 0 4px;">📩 Nuevo correo en hola@atiendemelapyme.cl</h2>
  <p style="color:#666;margin:0 0 24px;">De: <strong>${escapeHtml(fromAddress)}</strong><br>Asunto: ${escapeHtml(subject || '(sin asunto)')}</p>

  <div style="border-left:3px solid #ccc;padding:10px 16px;background:#fafafa;margin-bottom:24px;white-space:pre-wrap;color:#444;">${escapeHtml(originalText || '(sin contenido de texto)')}</div>

  <h3 style="margin:0 0 8px;color:#E8A33D;">✍️ Borrador de Dominga</h3>
  <div style="border:1px solid #E8A33D;border-radius:6px;padding:16px;white-space:pre-wrap;margin-bottom:24px;">${escapeHtml(draftText)}</div>

  <a href="${mailtoLink}" style="display:inline-block;background:#E8A33D;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:bold;">Revisar y responder →</a>
  <p style="color:#999;font-size:12px;margin-top:24px;">Este botón abre tu correo con la respuesta de Dominga ya escrita. Revísala, ajústala si quieres, y presiona enviar.</p>
</body>
</html>`;

  try {
    const response = await fetch(RESEND_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: env.RESEND_FROM_EMAIL || 'contacto@atiendemelapyme.cl',
        to: notifyTo,
        reply_to: fromAddress,
        subject: `[Borrador] ${subject || 'Nuevo correo de ' + fromAddress}`,
        html
      })
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('[EMAIL-INBOUND] Resend error:', data);
      return { success: false, error: data };
    }
    return { success: true, emailId: data.id };
  } catch (err) {
    console.error('[EMAIL-INBOUND] Error notificando a Germán:', err.message);
    return { success: false, error: err.message };
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const rawBody = await request.text();
    const incomingSecret = request.headers.get('x-hook-secret');
    const signature = request.headers.get('x-hook-signature');

    // Primer request al guardar la config en Zoho: trae el secreto, lo
    // guardamos en KV para validar todos los requests futuros.
    if (incomingSecret) {
      await env.RATE_LIMIT_KV.put(ZOHO_SECRET_KV_KEY, incomingSecret);
      return sendSuccess({ status: 'webhook registered' });
    }

    const secret = await env.RATE_LIMIT_KV.get(ZOHO_SECRET_KV_KEY);
    if (!secret) {
      throw new ApiError('Webhook de Zoho no inicializado (falta el secreto inicial)', 401);
    }

    if (!signature) {
      throw new ApiError('Falta x-hook-signature', 401);
    }

    const expectedSignature = await hmacSha256Base64(secret, rawBody);
    if (expectedSignature !== signature) {
      throw new ApiError('Firma inválida', 401);
    }

    const payload = JSON.parse(rawBody);

    const fromAddress = extractEmailAddress(payload.fromAddress || payload.sender || '');
    const subject = payload.subject || '';
    const bodyText = (payload.summary || stripHtml(payload.html || '')).trim();

    if (!fromAddress || !bodyText) {
      console.warn('[EMAIL-INBOUND] Payload incompleto, se omite:', JSON.stringify(payload).slice(0, 200));
      return sendSuccess({ status: 'skipped', reason: 'incomplete payload' });
    }

    const draftText = await callClaude(
      [{ role: 'user', content: bodyText }],
      buildEmailSystemPrompt(),
      { env },
      { maxTokens: 600 }
    );

    const result = await notifyGerman({ fromAddress, subject, originalText: bodyText, draftText, env });

    if (!result.success) {
      console.error('[EMAIL-INBOUND] No se pudo notificar el borrador para', fromAddress, result.error);
    }

    return sendSuccess({ status: 'ok' });
  } catch (err) {
    const apiErr = err instanceof ApiError ? err : new ApiError(err.message, 500);
    console.error('[EMAIL-INBOUND] Error:', apiErr);
    return sendError(apiErr, context.request.url);
  }
}

export async function onRequestGet() {
  return sendSuccess({ status: 'ok', service: 'email-inbound', timestamp: new Date().toISOString() });
}
