// src/lib/email.js
// Correos con el estilo brutalista oscuro del sitio (ver
// src/lib/email-template.js para el shell compartido: logo, paleta y CSS).

import { renderEmailShell, escapeHtml, COLORS } from './email-template.js';

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

  const bodyHtml = `
    <div class="greeting">
      Hola, <strong>${escapeHtml(clientName)}</strong>:<br>
      ¿Cómo estás? Por aquí <strong>Dominga</strong>.
    </div>

    <p style="color: ${COLORS.textMuted}; line-height: 1.8;">
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
        En esta sesión revisaremos tu caso en vivo y veremos exactamente cómo implementar un asistente que venda, atienda y agende citas por ti <strong style="color:${COLORS.text};">24/7</strong>, logrando que tu negocio crezca sin que tengas que gastar en contratar más personal.
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

    <p style="color: ${COLORS.textMuted}; margin-top: 36px; padding-top: 18px; border-top: 1px solid ${COLORS.border};">
      ¡Nos vemos pronto! Que tengas un excelente día. 😊<br><br>
      <strong style="color:${COLORS.text};">Dominga</strong><br>
      <span class="signature">Asistente Virtual de Atiéndeme la Pyme</span>
    </p>
`;

  const htmlContent = renderEmailShell({
    tag: '[CITA CONFIRMADA ✓]',
    bodyHtml,
    footerNote: 'Recibiste este correo porque agendaste una reunión con nosotros.'
  });

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

const ESCALATION_REASON_LABELS = {
  user_requested_human: 'El visitante pidió hablar con una persona',
  bot_could_not_resolve: 'Dominga no pudo resolver la consulta'
};

/**
 * Notifica al dueño cuando el chat web necesita intervención humana real
 * (ver src/lib/escalation.js). Reusa el mismo buzón que ya recibe los
 * borradores de correo entrante (DRAFT_NOTIFICATION_EMAIL) para no requerir
 * un secret nuevo.
 */
export async function sendEscalationNotification(options, env) {
  const { sessionId, reason, userMessage, botReply, leadContact } = options;

  const notifyTo = env.DRAFT_NOTIFICATION_EMAIL;
  if (!env.RESEND_API_KEY || !notifyTo) {
    console.error('[ESCALATION] Falta RESEND_API_KEY o DRAFT_NOTIFICATION_EMAIL, no se pudo notificar');
    return { success: false, error: 'RESEND_API_KEY o DRAFT_NOTIFICATION_EMAIL no configurado' };
  }

  const fromEmail = env.RESEND_FROM_EMAIL || 'contacto@atiendemelapyme.cl';
  const reasonLabel = ESCALATION_REASON_LABELS[reason] || 'El chat necesita revisión';

  const bodyHtml = `
    <div class="greeting">
      🙋 <strong>Chat web necesita una persona</strong>
    </div>
    <p style="color:${COLORS.textMuted};margin:0 0 24px;">${escapeHtml(reasonLabel)}${leadContact ? ` — contacto dejado: <strong style="color:${COLORS.text};">${escapeHtml(leadContact)}</strong>` : ''}</p>

    <div class="quote-title">Último mensaje del visitante</div>
    <div class="quote">${escapeHtml(userMessage || '(sin texto)')}</div>

    <div class="highlight-title">✍️ Respuesta de Dominga</div>
    <div class="highlight">${escapeHtml(botReply || '(sin respuesta)')}</div>

    <div class="button-center">
      <a href="https://atiendemelapyme.cl/admin#conversaciones" class="button">Ver conversación completa →</a>
    </div>
`;

  const html = renderEmailShell({
    tag: '[CHAT ESCALADO A HUMANO]',
    bodyHtml,
    footerNote: sessionId ? `session_id: ${escapeHtml(sessionId)}` : ''
  });

  try {
    const response = await fetch(RESEND_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: fromEmail,
        to: notifyTo,
        subject: `[Chat] ${reasonLabel}`,
        html
      })
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('[ESCALATION] Resend error:', data);
      return { success: false, error: data };
    }
    return { success: true, emailId: data.id };
  } catch (err) {
    console.error('[ESCALATION] Error notificando:', err.message);
    return { success: false, error: err.message };
  }
}

export async function sendReminderEmail(options, env) {
  const { clientName, clientEmail, date, time, calendarLink } = options;

  if (!env.RESEND_API_KEY) return null;

  const fromEmail = env.RESEND_FROM_EMAIL || 'contacto@atiendemelapyme.cl';
  const dateFormatted = formatDateSpanish(date);

  const bodyHtml = `
    <div class="greeting">⏰ Hola, <strong>${escapeHtml(clientName)}</strong>:</div>

    <p style="color:${COLORS.textMuted};">Te escribo para recordarte que tu reunión es <strong style="color:${COLORS.text};">mañana</strong>.</p>

    <div class="details">
      <div class="detail-header">📆 CUÁNDO</div>
      <div class="detail-row">
        <div class="detail-label">FECHA_Y_HORA</div>
        <div class="detail-value">${dateFormatted} a las ${time}</div>
      </div>
    </div>

    ${calendarLink ? `<div class="button-center"><a href="${calendarLink}" class="button">Unirse a Google Meet →</a></div>` : ''}

    <p style="color:${COLORS.textMuted};">Si necesitas cambiar la hora, responde este correo.</p>
    <p style="color:${COLORS.textMuted};">¡Nos vemos! 😊</p>
`;

  const htmlContent = renderEmailShell({
    tag: '[RECORDATORIO DE CITA]',
    bodyHtml
  });

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
