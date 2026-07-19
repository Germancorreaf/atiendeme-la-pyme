// src/lib/email.js
// Envío de emails usando Resend API

const RESEND_API = 'https://api.resend.com/emails';

/**
 * Formatea fecha YYYY-MM-DD a formato legible en español
 */
function formatDateSpanish(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  
  const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  
  const dayName = days[date.getDay()];
  const monthName = months[date.getMonth()];
  
  return `${dayName} ${day} de ${monthName} de ${year}`;
}

/**
 * Genera el HTML del email de confirmación
 */
function generateConfirmationEmailHTML(clientName, dateFormatted, time, calendarLink) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Confirmación de tu reunión — Atiéndeme la Pyme</title>
<style>
@media only screen and (max-width:620px){
  .wrap{width:100% !important;}
  .px{padding-left:20px !important;padding-right:20px !important;}
}
</style>
</head>
<body style="margin:0;padding:0;background-color:#111111;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#111111;">
<tr><td align="center" style="padding:32px 12px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px;max-width:600px;">
<tr><td style="border:2px solid #EDEDE8;background-color:#161616;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
<tr>
<td style="padding:18px 28px;font-family:'Courier New',Courier,monospace;font-size:13px;font-weight:bold;letter-spacing:2px;color:#EDEDE8;">ATIÉNDEME_LA_PYME<span style="color:#E8A33D;">_</span></td>
<td align="right" style="padding:18px 28px;font-family:'Courier New',Courier,monospace;font-size:11px;letter-spacing:1px;color:#E8A33D;">[CITA CONFIRMADA]</td>
</tr>
</table>
</td></tr>
<tr><td style="height:12px;line-height:12px;font-size:1px;">&nbsp;</td></tr>
<tr><td style="border:2px solid #EDEDE8;background-color:#161616;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
<tr><td style="background-color:#E8A33D;height:6px;line-height:6px;font-size:1px;">&nbsp;</td></tr>
<tr><td style="padding:34px 32px 0 32px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
<tr><td style="font-family:'Courier New',Courier,monospace;font-size:11px;letter-spacing:2px;color:#8A8A82;">// CONFIRMACIÓN DE REUNIÓN</td></tr>
<tr><td style="height:14px;line-height:14px;font-size:1px;">&nbsp;</td></tr>
<tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:24px;line-height:32px;font-weight:bold;color:#EDEDE8;text-transform:uppercase;">Todo listo: tu reunión quedó agendada 🚀</td></tr>
<tr><td style="height:22px;line-height:22px;font-size:1px;">&nbsp;</td></tr>
<tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:22px;color:#C9C9C0;">
Hola <strong style="color:#EDEDE8;">${clientName}</strong>,<br><br>
Por aquí Dominga. Te confirmo que tu cita quedó agendada correctamente.<br><br>
<strong style="color:#EDEDE8;">${dateFormatted}</strong> a las <strong style="color:#EDEDE8;">${time}</strong> — 20 minutos para revisar tu caso en vivo y ver cómo implementar un asistente que venda, atienda y agende 24/7. 💻
</td></tr>
<tr><td style="height:28px;line-height:28px;font-size:1px;">&nbsp;</td></tr>
<tr><td style="border:2px solid #EDEDE8;background-color:#0F0F0F;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
<tr><td style="padding:14px 20px;border-bottom:1px solid #333330;font-family:'Courier New',Courier,monospace;font-size:11px;color:#E8A33D;">📆 DETALLES</td></tr>
<tr>
<td style="padding:14px 20px;font-family:Arial,sans-serif;font-size:13px;color:#EDEDE8;"><strong>${dateFormatted}</strong> a las <strong>${time}</strong></td>
</tr>
<tr>
<td style="padding:14px 20px;border-top:1px solid #333330;font-family:Arial,sans-serif;font-size:13px;color:#EDEDE8;">20 minutos · demo en vivo</td>
</tr>
</table>
</td></tr>
<tr><td style="height:20px;line-height:20px;font-size:1px;">&nbsp;</td></tr>
<tr><td align="center">
<table role="presentation" cellpadding="0" cellspacing="0" border="0">
<tr><td bgcolor="#E8A33D" style="border:2px solid #E8A33D;">
<a href="${calendarLink || '#'}" style="display:block;padding:12px 30px;font-family:Arial,sans-serif;font-size:12px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:#111111;text-decoration:none;">Abrir Google Meet</a>
</td></tr>
</table>
</td></tr>
<tr><td style="height:28px;line-height:28px;font-size:1px;">&nbsp;</td></tr>
<tr><td style="border-left:4px solid #E8A33D;background-color:#0F0F0F;padding:14px 20px;font-family:Arial,sans-serif;font-size:12px;line-height:18px;color:#C9C9C0;">
<strong style="color:#EDEDE8;">Nota:</strong> También recibiste invitación en tu calendario. Si necesitas reagendar, responde este correo.
</td></tr>
<tr><td style="height:26px;line-height:26px;font-size:1px;">&nbsp;</td></tr>
<tr><td style="font-family:Arial,sans-serif;font-size:13px;line-height:20px;color:#C9C9C0;">
¡Nos vemos pronto! 😊<br><br>
Dominga<br>
<span style="color:#8A8A82;">Asistente Virtual · Atiéndeme la Pyme</span>
</td></tr>
<tr><td style="height:30px;line-height:30px;font-size:1px;">&nbsp;</td></tr>
</table>
</td></tr>
</table>
</td></tr>
<tr><td style="height:12px;line-height:12px;font-size:1px;">&nbsp;</td></tr>
<tr><td style="border:2px solid #333330;background-color:#111111;padding:16px 24px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
<tr><td style="font-family:'Courier New',Courier,monospace;font-size:10px;line-height:16px;color:#8A8A82;">
● SYS.OK — © 2026 Atiéndeme la Pyme · Santiago, Chile<br>
<a href="mailto:contacto@atiendemelapyme.cl" style="color:#8A8A82;">contacto@atiendemelapyme.cl</a>
</td></tr>
</table>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

/**
 * Envía email de confirmación de cita desde RESEND
 */
export async function sendConfirmationEmail(options, env) {
  const { clientName, clientEmail, date, time, calendarLink } = options;

  if (!env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not configured, skipping email');
    return null;
  }

  const fromEmail = env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
  const dateFormatted = formatDateSpanish(date);
  const htmlContent = generateConfirmationEmailHTML(clientName, dateFormatted, time, calendarLink);

  try {
    const response = await fetch(RESEND_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: `Atiéndeme la Pyme <${fromEmail}>`,
        to: [clientEmail],
        subject: `Cita confirmada para ${dateFormatted}`,
        html: htmlContent
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Resend error:', data);
      return { success: false, error: data };
    }

    console.log('Confirmation email sent:', data.id);
    return { success: true, emailId: data.id };
  } catch (err) {
    console.error('Email send error:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Envía email de recordatorio (1 día antes)
 */
export async function sendReminderEmail(options, env) {
  const { clientName, clientEmail, date, time, calendarLink } = options;

  if (!env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not configured, skipping reminder');
    return null;
  }

  const fromEmail = env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
  const dateFormatted = formatDateSpanish(date);

  const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5; margin: 0; padding: 0; }
    .container { max-width: 500px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 22px; }
    .content { padding: 30px; }
    .detail-box { background: #fef3e2; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #f59e0b; }
    .detail-row { display: flex; justify-content: space-between; padding: 8px 0; }
    .detail-label { color: #666; font-size: 14px; }
    .detail-value { color: #333; font-weight: 600; font-size: 14px; }
    .button { display: inline-block; background: #f59e0b; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; margin-top: 20px; font-weight: 600; }
    .footer { text-align: center; padding: 20px; color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⏰ Recordatorio de Cita</h1>
    </div>
    <div class="content">
      <p>Hola <strong>${clientName}</strong>,</p>
      <p>Te recordamos que tienes una cita <strong>mañana</strong>:</p>
      
      <div class="detail-box">
        <div class="detail-row">
          <span class="detail-label">📅 Fecha</span>
          <span class="detail-value">${dateFormatted}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">🕐 Hora</span>
          <span class="detail-value">${time}</span>
        </div>
      </div>

      ${calendarLink ? `<a href="${calendarLink}" class="button">Ver en Google Calendar</a>` : ''}
      
      <p style="margin-top: 30px; color: #666; font-size: 14px;">
        Si necesitas reagendar, responde a este correo.
      </p>
    </div>
    <div class="footer">
      Atiéndeme la Pyme · Automatización con IA para tu negocio
    </div>
  </div>
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
        from: `Atiéndeme la Pyme <${fromEmail}>`,
        to: [clientEmail],
        subject: `Recordatorio: Tu cita es mañana ${dateFormatted}`,
        html: htmlContent
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Resend reminder error:', data);
      return { success: false, error: data };
    }

    console.log('Reminder email sent:', data.id);
    return { success: true, emailId: data.id };
  } catch (err) {
    console.error('Reminder email error:', err.message);
    return { success: false, error: err.message };
  }
}
