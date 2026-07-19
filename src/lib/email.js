// src/lib/email.js
// Email BLANCO y LIMPIO - Funciona en todas partes

const RESEND_API = 'https://api.resend.com/emails';

function formatDateSpanish(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  return `${days[date.getDay()]} ${day} de ${months[date.getMonth()]} de ${year}`;
}

export async function sendConfirmationEmail(options, env) {
  const { clientName, clientEmail, date, time, calendarLink } = options;

  if (!env.RESEND_API_KEY) {
    console.error('[EMAIL] RESEND_API_KEY not configured!');
    return null;
  }

  const fromEmail = env.RESEND_FROM_EMAIL || 'contacto@atiendemelapyme.cl';
  const dateFormatted = formatDateSpanish(date);

  const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Cita confirmada</title>
<style>
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; margin: 0; padding: 0; }
.container { max-width: 600px; margin: 0 auto; background: white; }
.header { background: #E8A33D; padding: 30px; text-align: center; color: white; }
.header h1 { margin: 0; font-size: 24px; font-weight: bold; }
.content { padding: 40px 30px; }
.greeting { font-size: 16px; margin-bottom: 20px; }
.greeting strong { color: #E8A33D; }
.section-title { font-size: 18px; font-weight: bold; color: #0A0A0A; margin-top: 30px; margin-bottom: 15px; border-bottom: 2px solid #E8A33D; padding-bottom: 10px; }
.details { background: #f9f9f9; border-left: 4px solid #E8A33D; padding: 15px 20px; margin: 20px 0; }
.detail-row { display: flex; justify-content: space-between; padding: 8px 0; }
.detail-label { font-weight: 600; color: #666; }
.detail-value { color: #0A0A0A; }
.button { display: inline-block; background: #E8A33D; color: white; padding: 12px 30px; text-decoration: none; font-weight: bold; border-radius: 4px; margin: 20px 0; }
.button:hover { background: #d97706; }
.footer { background: #f5f5f5; padding: 20px 30px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
.footer a { color: #E8A33D; text-decoration: none; }
@media (max-width: 620px) {
  .content { padding: 20px 15px; }
  .detail-row { flex-direction: column; }
}
</style>
</head>
<body>

<div class="container">
  
  <div class="header">
    <h1>✓ Cita Confirmada</h1>
  </div>

  <div class="content">
    
    <div class="greeting">
      Hola <strong>${clientName}</strong>,<br>
      Tu reunión ha sido confirmada con éxito.
    </div>

    <div class="section-title">Detalles de tu reunión</div>
    
    <div class="details">
      <div class="detail-row">
        <span class="detail-label">📅 Fecha y Hora</span>
        <span class="detail-value">${dateFormatted} a las ${time}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">⏱ Duración</span>
        <span class="detail-value">20 minutos</span>
      </div>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${calendarLink}" class="button">Unirse a la Reunión</a>
    </div>

    <div style="font-size: 13px; color: #666; text-align: center; margin: 20px 0;">
      Si el botón no funciona, copia este enlace:<br>
      <a href="${calendarLink}" style="color: #E8A33D; text-decoration: underline; word-break: break-all;">
        ${calendarLink}
      </a>
    </div>

    <div class="section-title">¿Qué pasará en la reunión?</div>
    
    <p style="color: #555; line-height: 1.8;">
      Nos reuniremos para revisar tu caso en detalle y mostrarte exactamente cómo implementar un asistente de IA que venda, atienda y agende citas por ti <strong>24/7</strong>.<br><br>
      Veremos cómo puedes crecer tu negocio sin necesidad de contratar más personal.
    </p>

    <div class="section-title">Recordatorios Importantes</div>
    
    <ul style="color: #555; line-height: 1.8;">
      <li>También recibirás una invitación directa en tu calendario</li>
      <li>Si necesitas cambiar la hora, responde este correo</li>
      <li>Asegúrate de tener buena conexión a internet</li>
    </ul>

    <p style="color: #555; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
      ¿Preguntas? Contáctanos en <a href="mailto:contacto@atiendemelapyme.cl" style="color: #E8A33D; text-decoration: none;">contacto@atiendemelapyme.cl</a><br><br>
      <strong>Atiéndeme la Pyme</strong><br>
      <em style="color: #999; font-size: 12px;">Automatización con IA para tu negocio</em>
    </p>

  </div>

  <div class="footer">
    <strong>Atiéndeme la Pyme</strong><br>
    Santiago, Chile<br><br>
    Recibiste este correo porque agendaste una reunión con nosotros.<br>
    <a href="mailto:contacto@atiendemelapyme.cl">Contáctanos</a> · 
    <a href="https://atiendemelapyme.cl">Visita nuestro sitio</a>
  </div>

</div>

</body>
</html>`;

  const payload = {
    from: fromEmail,
    to: clientEmail,
    subject: `Cita confirmada - ${dateFormatted}`,
    html: htmlContent
  };

  try {
    const response = await fetch(RESEND_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[EMAIL] Resend error:', data);
      return { success: false, error: data };
    }

    console.log('[EMAIL] Sent successfully');
    return { success: true, emailId: data.id };
  } catch (err) {
    console.error('[EMAIL] Error:', err.message);
    return { success: false, error: err.message };
  }
}

export async function sendReminderEmail(options, env) {
  const { clientName, clientEmail, date, time, calendarLink } = options;

  if (!env.RESEND_API_KEY) return null;

  const fromEmail = env.RESEND_FROM_EMAIL || 'contacto@atiendemelapyme.cl';
  const dateFormatted = formatDateSpanish(date);

  const htmlContent = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
body { font-family: Arial, sans-serif; color: #333; background: #f5f5f5; }
.container { max-width: 500px; margin: 40px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
.header { background: #E8A33D; color: white; padding: 20px; text-align: center; }
.content { padding: 30px; }
.button { display: inline-block; background: #E8A33D; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin-top: 15px; }
</style>
</head>
<body>
<div class="container">
<div class="header"><h1>⏰ Recordatorio</h1></div>
<div class="content">
<p>Hola <strong>${clientName}</strong>,</p>
<p>Tu reunión es <strong>mañana</strong> a las ${time}.</p>
<p><strong>Fecha:</strong> ${dateFormatted}</p>
${calendarLink ? `<a href="${calendarLink}" class="button">Ver Evento</a>` : ''}
<p>Si necesitas cambiar la hora, responde este correo.</p>
<p>¡Nos vemos!</p>
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
        subject: `Recordatorio: Tu reunión es mañana`,
        html: htmlContent
      })
    });

    const data = await response.json();
    return !response.ok ? { success: false, error: data } : { success: true, emailId: data.id };
  } catch (err) {
    console.error('[REMINDER] Error:', err.message);
    return { success: false };
  }
}
