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

  // Estilos inline a propósito (no <style> ni fuentes web): Gmail y Outlook
  // ignoran/eliminan la mayoría de eso. Monospace de sistema como aproximación
  // a JetBrains Mono, y la paleta oscuro+ámbar del sitio para que se sienta
  // igual a atiendemelapyme.cl aunque el motor de render sea limitado.
  const mono = "'SF Mono', 'JetBrains Mono', Consolas, 'Courier New', monospace";
  const bg = '#0A0A0A', panel = '#0F0F0F', line = '#242424', text = '#EDEDE8', muted = '#8A8A82', accent = '#E8A33D';

  const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#EFEDE4;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#EFEDE4;padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${bg};border:2px solid ${text};">

  <!-- header -->
  <tr><td style="padding:20px 28px;border-bottom:2px solid ${text};">
    <span style="font-family:${mono};font-size:13px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:${text};">ATIÉNDEME_LA_PYME</span>
    <span style="font-family:${mono};font-size:11px;color:${accent};display:inline-block;margin-left:8px;">// dominga</span>
  </td></tr>

  <!-- title -->
  <tr><td style="padding:28px 28px 4px;">
    <span style="font-family:${mono};font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:${muted};">./ nuevo correo</span>
    <div style="font-family:${mono};font-size:20px;font-weight:700;color:${text};margin-top:6px;line-height:1.3;">📩 hola@atiendemelapyme.cl</div>
  </td></tr>

  <!-- meta -->
  <tr><td style="padding:14px 28px 0;">
    <table role="presentation" cellpadding="0" cellspacing="0" style="font-family:${mono};font-size:12.5px;color:${muted};">
      <tr><td style="padding:3px 10px 3px 0;color:${muted};">De:</td><td style="padding:3px 0;color:${text};">${escapeHtml(fromDisplay)}</td></tr>
      <tr><td style="padding:3px 10px 3px 0;color:${muted};">Asunto:</td><td style="padding:3px 0;color:${text};">${escapeHtml(subject || '(sin asunto)')}</td></tr>
    </table>
  </td></tr>

  <!-- original message -->
  <tr><td style="padding:20px 28px 0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${panel};border-left:3px solid ${line};">
      <tr><td style="padding:14px 16px;font-family:${mono};font-size:13px;line-height:1.7;color:${muted};white-space:pre-wrap;">${escapeHtml(originalText || '(sin contenido de texto)')}</td></tr>
    </table>
  </td></tr>

  <!-- draft -->
  <tr><td style="padding:26px 28px 0;">
    <span style="font-family:${mono};font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:${accent};">✍️ ./ borrador de dominga</span>
  </td></tr>
  <tr><td style="padding:10px 28px 0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border:2px solid ${accent};">
      <tr><td style="padding:18px;font-family:${mono};font-size:13.5px;line-height:1.75;color:#111111;white-space:pre-wrap;">${escapeHtml(draftText)}</td></tr>
    </table>
  </td></tr>

  <!-- cta -->
  <tr><td style="padding:24px 28px 8px;">
    <table role="presentation" cellpadding="0" cellspacing="0">
      <tr><td style="background:${accent};">
        <a href="${mailtoLink}" style="display:inline-block;font-family:${mono};font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#0A0A0A;text-decoration:none;padding:14px 26px;">Revisar y responder →</a>
      </td></tr>
    </table>
  </td></tr>
  <tr><td style="padding:0 28px 24px;">
    <span style="font-family:${mono};font-size:11px;color:${muted};line-height:1.6;">Este botón abre tu correo con la respuesta de Dominga ya escrita. Revísala, ajústala si quieres, y presiona enviar.</span>
  </td></tr>

  <!-- footer -->
  <tr><td style="padding:16px 28px;border-top:1px solid ${line};">
    <span style="font-family:${mono};font-size:10.5px;letter-spacing:.06em;color:${muted};">SYS.OK — © 2026 ATIÉNDEME LA PYME</span>
  </td></tr>

</table>
</td></tr>
</table>
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
        // Remitente fijo a hola@ para esta notificación específica, sin
        // depender de RESEND_FROM_EMAIL (esa variable la comparten los
        // correos de confirmación de citas en lib/email.js, y no queremos
        // cambiar el remitente de esos también).
        from: 'Dominga <hola@atiendemelapyme.cl>',
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
