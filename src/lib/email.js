// src/lib/email.js
// Envío de emails usando Resend API

const RESEND_API = 'https://api.resend.com/emails';

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
 * Envía email de confirmación de cita desde RESEND
 */
export async function sendConfirmationEmail(options, env) {
  const { clientName, clientEmail, date, time, calendarLink } = options;

  console.log('[EMAIL] Starting sendConfirmationEmail...');
  console.log('[EMAIL] clientName:', clientName);
  console.log('[EMAIL] clientEmail:', clientEmail);
  console.log('[EMAIL] date:', date);
  console.log('[EMAIL] time:', time);

  if (!env.RESEND_API_KEY) {
    console.error('[EMAIL] RESEND_API_KEY not configured!');
    return null;
  }

  console.log('[EMAIL] RESEND_API_KEY is configured');

  const fromEmail = env.RESEND_FROM_EMAIL || 'noreply@atiendemelapyme.cl';
  const dateFormatted = formatDateSpanish(date);

  console.log('[EMAIL] fromEmail:', fromEmail);
  console.log('[EMAIL] dateFormatted:', dateFormatted);

  const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Confirmación de tu reunión</title>
</head>
<body style="margin:0;padding:0;background-color:#111111;font-family:Arial,Helvetica,sans-serif;">
<div style="background-color:#111111;padding:32px 12px;">
<div style="width:600px;max-width:100%;margin:0 auto;border:2px solid #EDEDE8;background-color:#161616;">
<div style="padding:18px 28px;font-family:'Courier New',Courier,monospace;font-size:13px;font-weight:bold;letter-spacing:2px;color:#EDEDE8;border-bottom:2px solid #EDEDE8;">
ATIÉNDEME_LA_PYME <span style="color:#E8A33D;">✓</span>
</div>
<div style="background-color:#E8A33D;height:6px;line-height:6px;font-size:1px;">&nbsp;</div>
<div style="padding:34px 32px;">
<div style="font-family:'Courier New',Courier,monospace;font-size:11px;letter-spacing:2px;color:#8A8A82;margin-bottom:14px;">// CONFIRMACIÓN DE REUNIÓN</div>
<h1 style="font-size:24px;font-weight:bold;color:#EDEDE8;text-transform:uppercase;margin:14px 0;">Tu reunión quedó agendada 🚀</h1>
<div style="margin-bottom:28px;">
<p style="font-size:14px;line-height:22px;color:#C9C9C0;margin:0 0 12px 0;">
Hola <strong style="color:#EDEDE8;">${clientName}</strong>,
</p>
<p style="font-size:14px;line-height:22px;color:#C9C9C0;margin:0;">
Por aquí Dominga. Tu cita quedó confirmada para <strong style="color:#EDEDE8;">${dateFormatted}</strong> a las <strong style="color:#EDEDE8;">${time}</strong>. Son 20 minutos para revisar tu caso en vivo. 💻
</p>
</div>
<div style="border:2px solid #EDEDE8;background-color:#0F0F0F;padding:0;">
<div style="padding:14px 20px;border-bottom:1px solid #333330;font-family:'Courier New',Courier,monospace;font-size:11px;color:#E8A33D;">📆 DETALLES</div>
<div style="padding:14px 20px;border-bottom:1px solid #333330;font-family:Arial,sans-serif;font-size:13px;color:#EDEDE8;">
<strong>${dateFormatted}</strong> a las <strong>${time}</strong>
</div>
<div style="padding:14px 20px;font-family:Arial,sans-serif;font-size:13px;color:#EDEDE8;">
20 minutos · demo en vivo
</div>
</div>
<div style="margin-top:20px;text-align:center;">
<a href="${calendarLink || '#'}" style="display:inline-block;background-color:#E8A33D;border:2px solid #E8A33D;padding:12px 30px;font-family:Arial,sans-serif;font-size:12px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:#111111;text-decoration:none;">Abrir Google Meet</a>
</div>
<div style="margin-top:28px;border-left:4px solid #E8A33D;background-color:#0F0F0F;padding:14px 20px;font-family:Arial,sans-serif;font-size:12px;line-height:18px;color:#C9C9C0;">
<strong style="color:#EDEDE8;">Nota:</strong> También recibiste invitación en tu calendario. Si necesitas reagendar, responde este correo.
</div>
<div style="margin-top:26px;font-family:Arial,sans-serif;font-size:13px;line-height:20px;color:#C9C9C0;">
¡Nos vemos pronto! 😊<br><br>
Dominga<br>
<span style="color:#8A8A82;">Asistente Virtual</span>
</div>
</div>
<div style="margin-top:12px;border:2px solid #333330;background-color:#111111;padding:16px 24px;">
<div style="font-family:'Courier New',Courier,monospace;font-size:10px;line-height:16px;color:#8A8A82;">
● © 2026 Atiéndeme la Pyme · Santiago, Chile
</div>
</div>
</div>
</div>
</body>
</html>`;

  console.log('[EMAIL] HTML generated, length:', htmlContent.length);

  const payload = {
    from: fromEmail,
    to: clientEmail,
    subject: `Cita confirmada para ${dateFormatted}`,
    html: htmlContent
  };

  console.log('[EMAIL] Payload created');
  console.log('[EMAIL] from:', payload.from);
  console.log('[EMAIL] to:', payload.to);
  console.log('[EMAIL] subject:', payload.subject);

  try {
    console.log('[EMAIL] Making fetch request to Resend API...');

    const response = await fetch(RESEND_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    console.log('[EMAIL] Response status:', response.status);

    const data = await response.json();
    console.log('[EMAIL] Response data:', JSON.stringify(data));

    if (!response.ok) {
      console.error('[EMAIL] Resend API error:', data);
      return { success: false, error: data };
    }

    console.log('[EMAIL] Confirmation email sent successfully! ID:', data.id);
    return { success: true, emailId: data.id };

  } catch (err) {
    console.error('[EMAIL] Exception caught:', err.message);
    console.error('[EMAIL] Stack:', err.stack);
    return { success: false, error: err.message };
  }
}

/**
 * Envía email de recordatorio (1 día antes)
 */
export async function sendReminderEmail(options, env) {
  const { clientName, clientEmail, date, time, calendarLink } = options;

  console.log('[REMINDER] Starting sendReminderEmail...');

  if (!env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not configured, skipping reminder');
    return null;
  }

  const fromEmail = env.RESEND_FROM_EMAIL || 'noreply@atiendemelapyme.cl';
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
        from: fromEmail,
        to: clientEmail,
        subject: `Recordatorio: Tu cita es mañana ${dateFormatted}`,
        html: htmlContent
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Resend reminder error:', data);
      return { success: false, error: data };
    }

    console.log('[REMINDER] Reminder email sent:', data.id);
    return { success: true, emailId: data.id };
  } catch (err) {
    console.error('[REMINDER] Reminder email error:', err.message);
    return { success: false, error: err.message };
  }
}
