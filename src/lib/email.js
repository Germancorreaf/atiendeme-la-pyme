// src/lib/email.js
// Email CLARO con detalles brutalistas - FUNCIONA EN MOBILE Y DESKTOP

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
.wrapper { background: #f5f5f5; padding: 20px; }
.container { max-width: 600px; margin: 0 auto; background: white; border: 2px solid #2d2d2d; }
.header { background: #2d2d2d; padding: 30px; border-bottom: 4px solid #E8A33D; }
.header h1 { margin: 0; color: white; font-size: 20px; font-family: 'Courier New', monospace; letter-spacing: 2px; font-weight: bold; }
.header .tag { font-size: 11px; color: #E8A33D; font-family: 'Courier New', monospace; margin-top: 8px; }
.content { padding: 40px 30px; }
.greeting { font-size: 15px; margin-bottom: 20px; }
.greeting strong { color: #E8A33D; }
.title { font-size: 22px; font-weight: bold; color: #2d2d2d; text-transform: uppercase; margin: 30px 0 20px 0; border-bottom: 2px solid #E8A33D; padding-bottom: 10px; font-family: 'Courier New', monospace; }
.details { border: 2px solid #2d2d2d; background: #fafafa; margin: 20px 0; }
.detail-header { background: #2d2d2d; color: #E8A33D; padding: 12px 20px; font-family: 'Courier New', monospace; font-size: 11px; letter-spacing: 2px; border-bottom: 1px solid #E8A33D; }
.detail-row { display: flex; padding: 14px 20px; border-bottom: 1px solid #ddd; }
.detail-row:last-child { border-bottom: none; }
.detail-label { font-family: 'Courier New', monospace; font-size: 12px; color: #666; width: 140px; font-weight: 600; }
.detail-value { flex: 1; color: #2d2d2d; font-weight: 600; }
.button { display: inline-block; background: #E8A33D; color: white; padding: 12px 30px; text-decoration: none; font-weight: bold; border: 2px solid #E8A33D; margin: 25px 0; font-size: 13px; letter-spacing: 1px; }
.button:hover { background: #d97706; border-color: #d97706; }
.button-center { text-align: center; }
.fallback { font-family: 'Courier New', monospace; font-size: 11px; color: #666; text-align: center; margin: 15px 0; word-break: break-all; }
.fallback a { color: #E8A33D; text-decoration: underline; }
.note { border-left: 4px solid #E8A33D; background: #fafafa; padding: 15px 20px; margin: 25px 0; font-size: 13px; line-height: 1.6; color: #555; }
.note strong { color: #2d2d2d; }
.section { margin-top: 30px; }
.section p { color: #555; line-height: 1.8; margin: 12px 0; }
.section ul { color: #555; margin: 15px 0; padding-left: 20px; }
.section li { margin: 8px 0; }
.footer { background: #f5f5f5; padding: 30px; border-top: 1px solid #ddd; text-align: center; font-size: 12px; color: #999; }
.footer a { color: #E8A33D; text-decoration: none; }
.signature { margin-top: 20px; font-family: 'Courier New', monospace; font-size: 11px; color: #666; }
@media (max-width: 620px) {
  .content { padding: 20px 15px; }
  .detail-row { flex-direction: column; }
  .detail-label { width: 100%; margin-bottom: 4px; }
}
</style>
</head>
<body>

<div class="wrapper">
<div class="container">

  <div class="header">
    <h1>ATIÉNDEME_LA_PYME<span style="color:#E8A33D;">_</span></h1>
    <div class="tag">[CITA CONFIRMADA ✓]</div>
  </div>

  <div class="content">
    
    <div class="greeting">
      Hola, <strong>${clientName}</strong>:<br>
      ¿Cómo estás? Por aquí <strong>Dominga</strong>. 
    </div>

    <p style="color: #555; line-height: 1.8;">
      Te escribo para confirmarte que tu cita quedó agendada correctamente en nuestro calendario.
    </p>

    <div class="title">// DETALLES DE LA REUNIÓN</div>
    
    <div class="details">
      <div class="detail-header">📆 CUÁNDO Y DÓNDE</div>
      <div class="detail-row">
        <div class="detail-label">FECHA_Y_HORA</div>
        <div class="detail-value">${dateFormatted} a las ${time}</div>
      </div>
      <div class="detail-row">
        <div class="detail-label">DURACIÓN</div>
        <div class="detail-value">20 minutos · demo en vivo de tu caso</div>
      </div>
    </div>

    <div class="button-center">
      <a href="${calendarLink}" class="button">Unirse a Google Meet →</a>
    </div>

    <div class="fallback">
      Si el botón no funciona, copia este enlace:<br>
      <a href="${calendarLink}">${calendarLink}</a>
    </div>

    <div class="note">
      <strong>Nota:</strong> También recibirás una invitación directa en tu calendario. Si necesitas cambiar la hora, responde este correo.
    </div>

    <div class="section">
      <div class="title">// QUÉ HAREMOS EN LA REUNIÓN</div>
      <p>
        En esta sesión revisaremos tu caso en vivo y veremos exactamente cómo implementar un asistente que venda, atienda y agende citas por ti <strong>24/7</strong>, logrando que tu negocio crezca sin que tengas que gastar en contratar más personal.
      </p>
      <p>
        Veremos las posibilidades específicas para tu negocio y cómo empezar.
      </p>
    </div>

    <div class="section">
      <div class="title">// ANTES DE LA REUNIÓN</div>
      <ul>
        <li>Revisa la invitación en tu calendario</li>
        <li>Asegúrate de tener buena conexión a internet</li>
        <li>Si surge algo, avísame y reagendamos</li>
      </ul>
    </div>

    <p style="color: #555; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd;">
      ¡Nos vemos pronto! Que tengas un excelente día. 😊<br><br>
      <strong>Dominga</strong><br>
      <span class="signature">Asistente Virtual de Atiéndeme la Pyme</span>
    </p>

  </div>

  <div class="footer">
    <strong>Atiéndeme la Pyme</strong><br>
    Santiago, Chile<br><br>
    <a href="mailto:contacto@atiendemelapyme.cl">Contáctanos</a> · 
    <a href="https://atiendemelapyme.cl">Visita nuestro sitio</a><br><br>
    <span style="color: #ccc;">Recibiste este correo porque agendaste una reunión con nosotros.</span>
  </div>

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
  <style>
    body { font-family: Arial, sans-serif; color: #333; background: #f5f5f5; }
    .container { max-width: 500px; margin: 40px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { background: #E8A33D; color: white; padding: 20px; text-align: center; }
    .content { padding: 30px; }
    .button { display: inline-block; background: #E8A33D; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin-top: 15px; }
    .footer { text-align: center; padding: 20px; color: #999; font-size: 12px; }
  </style>
</head>
<body>
<div class="container">
<div class="header"><h1>⏰ Recordatorio</h1></div>
<div class="content">
<p>Hola <strong>${clientName}</strong>,</p>
<p>Tu reunión es <strong>mañana</strong> a las <strong>${time}</strong>.</p>
<p><strong>Fecha:</strong> ${dateFormatted}</p>
${calendarLink ? `<a href="${calendarLink}" class="button">Ver Evento</a>` : ''}
<p>Si necesitas cambiar la hora, responde este correo.</p>
<p>¡Nos vemos!</p>
</div>
<div class="footer">Atiéndeme la Pyme · Automatización con IA para tu negocio</div>
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
