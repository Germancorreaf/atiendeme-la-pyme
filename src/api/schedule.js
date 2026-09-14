import { createCalendarEvent, DEMO_DURATION_MINUTES } from '../lib/google-calendar.js';
import { getTodayInfo } from '../lib/dominga-prompt.js';
import { sendConfirmationEmail } from '../lib/email.js';
import { ApiError, sendError, sendSuccess, parseJSON } from '../lib/errors.js';
import { checkRateLimit } from '../lib/rateLimit.js';
import { validateDate, validateTime, validateEmail, validateName, ValidationError } from '../lib/validator.js';

function supabaseHeaders(env, extra = {}) {
  return {
    'apikey': env.SUPABASE_SERVICE_KEY,
    'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
    'Content-Type': 'application/json',
    ...extra
  };
}

function toMinutes(hhmm) {
  const [h, m] = String(hhmm).slice(0, 5).split(':').map(Number);
  return h * 60 + m;
}

/**
 * Revisa si el horario choca con otra cita del mismo día (se consideran
 * citas de DEMO_DURATION_MINUTES). Falla cerrado: si no se puede consultar,
 * devuelve { error } en vez de asumir que está libre — el copy promete
 * "sin dobles reservas".
 */
async function checkAvailability(date, time, env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) {
    console.warn('Supabase not configured, skipping availability check');
    return { available: true };
  }

  try {
    const response = await fetch(
      `${env.SUPABASE_URL}/rest/v1/scheduled_appointments?appointment_date=eq.${date}&select=appointment_time`,
      { headers: supabaseHeaders(env) }
    );
    if (!response.ok) {
      console.error(`Availability check failed: ${response.status} - ${await response.text()}`);
      return { available: false, error: true };
    }
    const rows = await response.json();
    if (!Array.isArray(rows)) return { available: false, error: true };

    const requested = toMinutes(time);
    const clash = rows.some((r) => Math.abs(toMinutes(r.appointment_time) - requested) < DEMO_DURATION_MINUTES);
    return { available: !clash };
  } catch (err) {
    console.error('Availability check error:', err.message);
    return { available: false, error: true };
  }
}

/**
 * Reserva el horario en Supabase ANTES de crear el evento en Google Calendar,
 * con un event_id provisional. Si la tabla tiene el índice único
 * (appointment_date, appointment_time), una segunda reserva simultánea recibe
 * 409 y no se crea un evento duplicado en el calendario.
 * @returns {Promise<{ id: string } | { conflict: true } | { skipped: true }>}
 */
async function reserveSlot({ name, email, date, time }, env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) {
    console.warn('Supabase not configured, skipping appointment save');
    return { skipped: true };
  }

  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/scheduled_appointments`, {
    method: 'POST',
    headers: supabaseHeaders(env, { Prefer: 'return=representation' }),
    body: JSON.stringify({
      event_id: `pending:${crypto.randomUUID()}`,
      client_name: name,
      client_email: email,
      appointment_date: date,
      appointment_time: time
    })
  });

  if (response.status === 409) return { conflict: true };
  if (!response.ok) {
    throw new ApiError(`Appointment reserve failed [${response.status}]: ${await response.text()}`, 503);
  }
  const rows = await response.json();
  return { id: rows[0]?.id };
}

async function confirmSlot(id, eventId, calendarLink, env) {
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/scheduled_appointments?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: supabaseHeaders(env, { Prefer: 'return=minimal' }),
    body: JSON.stringify({ event_id: eventId, calendar_link: calendarLink, updated_at: new Date().toISOString() })
  });
  if (!response.ok) {
    // La cita ya existe en el calendario y la reserva en la tabla; solo falta
    // el link. Se loguea para revisarlo a mano, sin fallarle al visitante.
    console.error(`Appointment confirm failed [${response.status}]: ${await response.text()}`);
  }
}

async function releaseSlot(id, env) {
  try {
    await fetch(`${env.SUPABASE_URL}/rest/v1/scheduled_appointments?id=eq.${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: supabaseHeaders(env)
    });
  } catch (err) {
    console.error('Appointment release error:', err.message);
  }
}

const SLOT_TAKEN_MESSAGE = (date, time) =>
  `La cita para ${date} a las ${time} ya está agendada. Por favor elige otro horario.`;

export async function onRequestPost(context) {
  try {
    const body = await parseJSON(context.request);

    let date, time, name, email;
    try {
      date = validateDate(body.date);
      time = validateTime(body.time);
      name = validateName(body.name);
      email = validateEmail(body.email);
    } catch (err) {
      if (err instanceof ValidationError) {
        throw new ApiError(err.message, 400);
      }
      throw err;
    }

    if (date < getTodayInfo().todayISO) {
      throw new ApiError('Esa fecha ya pasó. Por favor elige una fecha desde hoy en adelante.', 400);
    }

    // Se limita tanto por email (evita spam a una misma casilla) como por IP
    // (evita que alguien rote emails de terceros para bombardearlos de
    // confirmaciones, ya que el email destino lo controla quien llama).
    const clientIP = context.request.headers.get('CF-Connecting-IP') || 'unknown-ip';
    const ipCheck = await checkRateLimit(clientIP, context.env.RATE_LIMIT_KV, 15, 3600);

    if (!ipCheck.allowed) {
      throw new ApiError(
        `Demasiadas solicitudes de agendamiento. Intenta de nuevo en ${ipCheck.retryAfter}s`,
        429
      );
    }

    const rlCheck = await checkRateLimit(email, context.env.RATE_LIMIT_KV, 5, 3600);

    if (!rlCheck.allowed) {
      throw new ApiError(
        `Demasiadas solicitudes de agendamiento. Intenta de nuevo en ${rlCheck.retryAfter}s`,
        429
      );
    }

    const availability = await checkAvailability(date, time, context.env);
    if (availability.error) {
      throw new ApiError('No pudimos confirmar la disponibilidad en este momento. Intenta de nuevo en unos minutos.', 503);
    }
    if (!availability.available) {
      throw new ApiError(SLOT_TAKEN_MESSAGE(date, time), 409);
    }

    const reservation = await reserveSlot({ name, email, date, time }, context.env);
    if (reservation.conflict) {
      throw new ApiError(SLOT_TAKEN_MESSAGE(date, time), 409);
    }

    let eventResult;
    try {
      eventResult = await createCalendarEvent(
        {
          title: `Demo Atiéndeme la Pyme - ${name}`,
          date,
          time,
          attendeeEmail: email,
          description: `Cita agendada por ${name} (${email}) desde el chat de atiendemelapyme.cl`
        },
        context
      );
    } catch (err) {
      if (reservation.id) await releaseSlot(reservation.id, context.env);
      throw err;
    }

    // El link que recibe el cliente: la videollamada si se pudo crear, si no
    // el evento en Google Calendar.
    const joinLink = eventResult.meetLink || eventResult.htmlLink;
    if (reservation.id) await confirmSlot(reservation.id, eventResult.eventId, joinLink, context.env);

    const emailResult = await sendConfirmationEmail(
      {
        clientName: name,
        clientEmail: email,
        date,
        time,
        calendarLink: joinLink
      },
      context.env
    );

    if (emailResult && !emailResult.success) {
      console.error('Failed to send confirmation email:', emailResult.error);
    } else if (!emailResult) {
      console.error('Email function returned null - RESEND_API_KEY likely not configured');
    }

    return sendSuccess({
      success: true,
      eventId: eventResult.eventId,
      message: eventResult.message,
      emailSent: emailResult?.success || false,
      details: {
        date,
        time,
        clientName: name,
        clientEmail: email,
        calendarLink: joinLink
      }
    });

  } catch (err) {
    const apiErr = err instanceof ApiError ? err : new ApiError(err.message, 500);
    console.error('Schedule error:', apiErr);
    return sendError(apiErr, context.request.url);
  }
}

export async function onRequestGet(context) {
  return sendSuccess({
    status: 'ok',
    service: 'schedule',
    timestamp: new Date().toISOString()
  });
}
