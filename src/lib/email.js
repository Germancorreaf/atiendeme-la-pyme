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
 * Envía email de confirmación de cita
 */
export async function sendConfirmationEmail(options, env) {
  const { clientName, clientEmail, date, time, calendarLink } = options;

  if (!env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not configured, skipping email');
    return null;
  }

  const fromEmail = env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
  const dateFormatted = formatDateSpanish(date);

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5; margin: 0; padding: 0; }
    .container { max-width: 500px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 22px; }
    .content { padding: 30px; }
    .detail-box { background: #f8f9fb; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { color: #666; font-size: 14px; }
    .detail-value { color: #333; font-weight: 600; font-size: 14px; }
    .button { display: inline-block; background: #667eea; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; margin-top: 20px; font-weight: 600; }
    .footer { text-align: center; padding: 20px; color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Cita Confirmada</h1>
    </div>
    <div class="content">
      <p>Hola <strong>${clientName}</strong>,</p>
      <p>Tu cita ha sido agendada exitosamente. Aquí están los detalles:</p>
      
      <div class="detail-box">
        <div class="detail-row">
          <span class="detail-label">📅 Fecha</span>
          <span class="detail-value">${dateFormatted}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">🕐 Hora</span>
          <span class="detail-value">${time} hrs</span>
        </div>
      </div>

      ${calendarLink ? `<a href="${calendarLink}" class="button">Ver en Google Calendar</a>` : ''}
      
      <p style="margin-top: 30px; color: #666; font-size: 14px;">
        Te enviaremos un recordatorio 1 día antes de tu cita.
      </p>
      <p style="color: #666; font-size: 14px;">
        Si necesitas cancelar o reagendar, responde a este correo.
      </p>
    </div>
    <div class="footer">
      Atiéndeme la Pyme · Automatización con IA para tu negocio
    </div>
  </div>
</body>
</html>
  `;

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
        subject: `✅ Cita confirmada para ${dateFormatted}`,
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

  const htmlContent = `
<!DOCTYPE html>
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
          <span class="detail-value">${time} hrs</span>
        </div>
      </div>

      ${calendarLink ? `<a href="${calendarLink}" class="button">Ver en Google Calendar</a>` : ''}
      
      <p style="margin-top: 30px; color: #666; font-size: 14px;">
        Si necesitas cancelar o reagendar, responde a este correo lo antes posible.
      </p>
    </div>
    <div class="footer">
      Atiéndeme la Pyme · Automatización con IA para tu negocio
    </div>
  </div>
</body>
</html>
  `;

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
        subject: `⏰ Recordatorio: Tu cita es mañana ${dateFormatted}`,
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
