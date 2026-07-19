// src/lib/email.js
// Envío de emails - OSCURO EN MOBILE Y DESKTOP

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

export async function sendConfirmationEmail(options, env) {
  const { clientName, clientEmail, date, time, calendarLink } = options;

  console.log('[EMAIL] Starting sendConfirmationEmail...');

  if (!env.RESEND_API_KEY) {
    console.error('[EMAIL] RESEND_API_KEY not configured!');
    return null;
  }

  const fromEmail = env.RESEND_FROM_EMAIL || 'Atiéndeme la Pyme <noreply@atiendemelapyme.cl>';
  const dateFormatted = formatDateSpanish(date);

  const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>Confirmación de tu reunión — Atiéndeme la Pyme</title>
<style>
* {
  -webkit-text-size-adjust: 100%;
  -ms-text-size-adjust: 100%;
}
body, table, td, div, p, a {
  -webkit-font-smoothing: antialiased;
  -webkit-text-size-adjust: 100%;
  -moz-osx-font-smoothing: grayscale;
  -moz-text-size-adjust: 100%;
  -ms-text-size-adjust: 100%;
}
table, td {
  mso-table-lspace: 0;
  mso-table-rspace: 0;
}
img {
  -ms-interpolation-mode: nearest-neighbor;
  border: 0;
  outline: 0;
  text-decoration: none;
}
@media only screen and (max-width:620px) {
  body {
    width: 100% !important;
    min-width: 100% !important;
  }
  .wrap {
    width: 100% !important;
    max-width: 100% !important;
  }
  .px {
    padding-left: 20px !important;
    padding-right: 20px !important;
  }
  table[role="presentation"] {
    width: 100% !important;
  }
  td {
    width: 100% !important;
    max-width: 100% !important;
  }
}
@media (prefers-color-scheme: dark) {
  body {
    background-color: #111111 !important;
    color: #EDEDE8 !important;
  }
  table, td {
    background-color: #161616 !important;
    border-color: #EDEDE8 !important;
    color: #EDEDE8 !important;
  }
  a {
    color: #E8A33D !important;
  }
}
</style>
</head>
<body style="background-color:#111111; color:#EDEDE8; margin:0; padding:0; font-family:Arial,sans-serif;">

<div style="display:none;font-size:0;line-height:0;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">Tu cita quedó agendada ✓</div>

<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#111111; mso-table-lspace:0; mso-table-rspace:0;">
<tr><td align="center" style="padding:32px 12px; background-color:#111111;">

  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" class="wrap" style="width:600px; max-width:600px; background-color:#111111;">

    <!-- HEADER -->
    <tr><td style="border:2px solid #EDEDE8; background-color:#161616;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr style="background-color:#161616;">
          <td class="px" style="padding:18px 28px; font-family:'Courier New',monospace; font-size:13px; font-weight:bold; letter-spacing:2px; color:#EDEDE8; background-color:#161616;">ATIÉNDEME_LA_PYME<span style="color:#E8A33D;">_</span></td>
          <td align="right" style="padding:18px 28px; font-family:'Courier New',monospace; font-size:11px; letter-spacing:1px; color:#E8A33D; background-color:#161616;">[CITA CONFIRMADA ✓]</td>
        </tr>
      </table>
    </td></tr>

    <!-- spacer -->
    <tr><td style="height:12px; line-height:12px; font-size:1px; background-color:#111111;">&nbsp;</td></tr>

    <!-- BODY CARD -->
    <tr><td style="border:2px solid #EDEDE8; background-color:#161616;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr><td style="background-color:#E8A33D; height:6px; line-height:6px; font-size:1px;">&nbsp;</td></tr>
        <tr style="background-color:#161616;"><td class="px" style="padding:34px 32px 0 32px; background-color:#161616;">

          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr><td style="font-family:'Courier New',monospace; font-size:11px; letter-spacing:2px; color:#8A8A82;">// CONFIRMACIÓN DE REUNIÓN</td></tr>
            <tr><td style="height:14px; line-height:14px; font-size:1px;">&nbsp;</td></tr>
            <tr><td style="font-family:Arial,Helvetica,sans-serif; font-size:26px; line-height:32px; font-weight:bold; color:#EDEDE8; text-transform:uppercase; letter-spacing:-0.5px;">Todo listo: tu reunión quedó agendada 🚀</td></tr>
            <tr><td style="height:22px; line-height:22px; font-size:1px;">&nbsp;</td></tr>

            <tr><td style="font-family:Arial,Helvetica,sans-serif; font-size:15px; line-height:24px; color:#C9C9C0;">
              Hola, <strong style="color:#EDEDE8;">${clientName}</strong>:<br><br>
              ¿Cómo estás? Por aquí <strong style="color:#E8A33D;">Dominga</strong>. Te escribo para confirmarte que tu cita quedó agendada correctamente en nuestro calendario.<br><br>
              Ya está todo coordinado para encontrarnos el <strong style="color:#EDEDE8;">${dateFormatted}</strong> a las <strong style="color:#EDEDE8;">${time}</strong>. En esta sesión de <strong style="color:#EDEDE8;">20 minutos</strong> revisaremos tu caso en vivo y veremos exactamente cómo implementar un asistente que venda, atienda y agende citas por ti las 24/7, logrando que tu negocio crezca sin que tengas que gastar en contratar más personal. 💻
            </td></tr>

            <tr><td style="height:28px; line-height:28px; font-size:1px;">&nbsp;</td></tr>

            <!-- DETALLES -->
            <tr><td style="border:2px solid #EDEDE8; background-color:#0F0F0F;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr style="background-color:#0F0F0F;"><td colspan="2" style="padding:14px 20px; border-bottom:1px solid #333330; font-family:'Courier New',monospace; font-size:11px; letter-spacing:2px; color:#E8A33D; background-color:#0F0F0F;">📆 DETALLES PARA CONECTARNOS</td></tr>
                <tr style="background-color:#0F0F0F;">
                  <td width="140" style="padding:14px 0 14px 20px; font-family:'Courier New',monospace; font-size:12px; color:#8A8A82; border-bottom:1px solid #333330; background-color:#0F0F0F;">FECHA_Y_HORA</td>
                  <td style="padding:14px 20px 14px 0; font-family:Arial,Helvetica,sans-serif; font-size:14px; color:#EDEDE8; border-bottom:1px solid #333330; background-color:#0F0F0F;"><strong>${dateFormatted}</strong> a las <strong>${time}</strong> en punto</td>
                </tr>
                <tr style="background-color:#0F0F0F;">
                  <td width="140" style="padding:14px 0 14px 20px; font-family:'Courier New',monospace; font-size:12px; color:#8A8A82; background-color:#0F0F0F;">DURACIÓN</td>
                  <td style="padding:14px 20px 14px 0; font-family:Arial,Helvetica,sans-serif; font-size:14px; color:#EDEDE8; background-color:#0F0F0F;">20 minutos · demo en vivo de tu caso</td>
                </tr>
              </table>
            </td></tr>

            <tr><td style="height:24px; line-height:24px; font-size:1px;">&nbsp;</td></tr>

            <!-- BOTÓN -->
            <tr><td align="center">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr><td style="border:2px solid #E8A33D; background-color:#E8A33D;">
                  <a href="${calendarLink}" style="display:block; padding:15px 38px; font-family:Arial,Helvetica,sans-serif; font-size:14px; font-weight:bold; letter-spacing:2px; text-transform:uppercase; color:#111111; text-decoration:none; white-space:nowrap;">Unirse a Google Meet →</a>
                </td></tr>
              </table>
            </td></tr>
            <tr><td align="center" style="padding-top:10px; font-family:'Courier New',monospace; font-size:11px; color:#8A8A82;">Si el botón no funciona, copia este enlace: <a href="${calendarLink}" style="color:#E8A33D; text-decoration:underline;">${calendarLink}</a></td></tr>

            <tr><td style="height:28px; line-height:28px; font-size:1px;">&nbsp;</td></tr>

            <!-- NOTA -->
            <tr><td style="border-left:4px solid #E8A33D; background-color:#0F0F0F; padding:16px 20px; font-family:Arial,Helvetica,sans-serif; font-size:13px; line-height:21px; color:#C9C9C0;">
              <strong style="color:#EDEDE8;">Nota:</strong> Te enviamos una invitación directa a tu correo para que quede guardada en tu agenda. Si te surge cualquier imprevisto y necesitas reagendar, avísanos con un poquito de anticipación respondiendo este correo o desde el evento del calendario.
            </td></tr>

            <tr><td style="height:26px; line-height:26px; font-size:1px;">&nbsp;</td></tr>

            <tr><td style="font-family:Arial,Helvetica,sans-serif; font-size:15px; line-height:24px; color:#C9C9C0;">
              ¡Nos vemos pronto! Que tengas un excelente día. 😊<br><br>
              Un abrazo,<br><br>
              <strong style="color:#EDEDE8;">Dominga</strong><br>
              <span style="font-family:'Courier New',monospace; font-size:12px; color:#E8A33D;">Asistente Virtual de Atiéndeme la Pyme</span>
            </td></tr>

            <tr><td style="height:34px; line-height:34px; font-size:1px;">&nbsp;</td></tr>
          </table>

        </td></tr>
      </table>
    </td></tr>

    <!-- spacer -->
    <tr><td style="height:12px; line-height:12px; font-size:1px; background-color:#111111;">&nbsp;</td></tr>

    <!-- FOOTER -->
    <tr><td style="border:2px solid #333330; background-color:#111111; padding:20px 28px;" class="px">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr><td style="font-family:'Courier New',monospace; font-size:11px; line-height:18px; color:#8A8A82; background-color:#111111;">
          <span style="color:#4F9D8C;">●</span> SYS.OK — © 2026 Atiéndeme la Pyme · Santiago, Chile<br>
          Recibiste este correo porque agendaste una reunión con nosotros.
        </td></tr>
      </table>
    </td></tr>

  </table>

</td></tr>
</table>
</body>
</html>`;

  const payload = {
    from: fromEmail,
    to: clientEmail,
    subject: `Cita confirmada para ${dateFormatted}`,
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
      console.error('[EMAIL] Resend API error:', data);
      return { success: false, error: data };
    }

    return { success: true, emailId: data.id };
  } catch (err) {
    console.error('[EMAIL] Exception caught:', err.message);
    return { success: false, error: err.message };
  }
}

export async function sendReminderEmail(options, env) {
  const { clientName, clientEmail, date, time, calendarLink } = options;

  if (!env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not configured, skipping reminder');
    return null;
  }

  const fromEmail = env.RESEND_FROM_EMAIL || 'Atiéndeme la Pyme <noreply@atiendemelapyme.cl>';
  const dateFormatted = formatDateSpanish(date);

  const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5; margin: 0; padding: 0; }
    .container { max-width: 500px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #E8A33D 0%, #d97706 100%); color: white; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 22px; }
    .content { padding: 30px; }
    .detail-box { background: #fef3e2; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #E8A33D; }
    .detail-row { display: flex; justify-content: space-between; padding: 8px 0; }
    .detail-label { color: #666; font-size: 14px; }
    .detail-value { color: #333; font-weight: 600; font-size: 14px; }
    .button { display: inline-block; background: #E8A33D; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; margin-top: 20px; font-weight: 600; }
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

    return { success: true, emailId: data.id };
  } catch (err) {
    console.error('[REMINDER] Reminder email error:', err.message);
    return { success: false, error: err.message };
  }
}
