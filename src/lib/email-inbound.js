// src/lib/email-inbound.js
// Maneja correos entrantes a hola@atiendemelapyme.cl vía Cloudflare Email
// Routing (regla: hola@atiendemelapyme.cl -> Send to Worker). Dominga
// redacta un borrador de respuesta con Claude, y en vez de enviarlo
// directo al remitente, le llega una notificación a Germán con:
//   - el correo original
//   - el borrador de Dominga
//   - un link "mailto:" con la respuesta ya escrita, lista para revisar y enviar
//
// Nada se envía al cliente sin que Germán lo apruebe manualmente.

import PostalMime from 'postal-mime';
import { callClaude } from './anthropic.js';
import { buildEmailSystemPrompt } from './dominga-prompt.js';

const RESEND_API = 'https://api.resend.com/emails';

function escapeHtml(str = '') {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildMailtoLink(toEmail, subject, body) {
  const params = new URLSearchParams({ subject, body });
  return `mailto:${encodeURIComponent(toEmail)}?${params.toString().replace(/\+/g, '%20')}`;
}

async function notifyGerman({ fromEmail, fromName, subject, originalText, draftText, env }) {
  const notifyTo = env.DRAFT_NOTIFICATION_EMAIL;
  if (!notifyTo) {
    console.error('[EMAIL-INBOUND] Falta DRAFT_NOTIFICATION_EMAIL, no se puede notificar el borrador');
    return { success: false, error: 'DRAFT_NOTIFICATION_EMAIL no configurado' };
  }

  const fromDisplay = fromName ? `${fromName} <${fromEmail}>` : fromEmail;
  const replySubject = subject && !/^re:/i.test(subject) ? `Re: ${subject}` : (subject || 'Re: tu consulta');
  const mailtoLink = buildMailtoLink(fromEmail, replySubject, draftText);

  const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"></head>
<body style="font-family:-apple-system,Arial,sans-serif;line-height:1.6;color:#222;max-width:640px;margin:0 auto;padding:20px;">
  <h2 style="margin:0 0 4px;">📩 Nuevo correo en hola@atiendemelapyme.cl</h2>
  <p style="color:#666;margin:0 0 24px;">De: <strong>${escapeHtml(fromDisplay)}</strong><br>Asunto: ${escapeHtml(subject || '(sin asunto)')}</p>

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
        reply_to: fromEmail,
        subject: `[Borrador] ${subject || 'Nuevo correo de ' + fromDisplay}`,
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

/**
 * Handler de Cloudflare Email Workers. Se registra como `email` en el
 * export default del Worker (ver src/index.js). Se invoca automáticamente
 * cuando llega un correo a una dirección con una regla de Email Routing
 * apuntando a este Worker (ej: hola@atiendemelapyme.cl -> Send to Worker).
 */
export async function handleInboundEmail(message, env, ctx) {
  try {
    const parsed = await PostalMime.parse(message.raw);

    const fromEmail = parsed.from?.address || message.from;
    const fromName = parsed.from?.name || '';
    const subject = parsed.subject || '';
    const bodyText = (parsed.text || '').trim();

    if (!bodyText) {
      console.warn('[EMAIL-INBOUND] Correo sin texto plano, se omite:', fromEmail);
      return;
    }

    const draftText = await callClaude(
      [{ role: 'user', content: bodyText }],
      buildEmailSystemPrompt(),
      { env },
      { maxTokens: 600 }
    );

    const result = await notifyGerman({ fromEmail, fromName, subject, originalText: bodyText, draftText, env });

    if (!result.success) {
      console.error('[EMAIL-INBOUND] No se pudo notificar el borrador para', fromEmail, result.error);
    }
  } catch (err) {
    console.error('[EMAIL-INBOUND] Error procesando correo entrante:', err.message);
  }
}
