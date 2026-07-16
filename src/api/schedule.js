import { createCalendarEvent } from '../lib/google-calendar.js';
import { ApiError, sendError, sendSuccess, parseJSON } from '../lib/errors.js';
import { checkRateLimit } from '../lib/rateLimit.js';

async function checkAvailability(date, time, env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) {
    console.warn('Supabase not configured, skipping availability check');
    return { available: true };
  }

  try {
    const response = await fetch(
      `${env.SUPABASE_URL}/rest/v1/scheduled_appointments?appointment_date=eq.${date}&appointment_time=eq.${time}`,
      {
        method: 'GET',
        headers: {
          'apikey': env.SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`
        }
      }
    );

    if (!response.ok) {
      console.error(`Availability check failed: ${response.status}`);
      return { available: true };
    }

    const data = await response.json();
    const isAvailable = data.length === 0;

    return {
      available: isAvailable,
      conflicting: data[0] || null
    };
  } catch (err) {
    console.error('Availability check error:', err.message);
    return { available: true };
  }
}

async function saveAppointment(eventId, name, email, date, time, calendarLink, env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) {
    console.warn('Supabase not configured, skipping appointment save');
    return null;
  }

  try {
    const response = await fetch(
      `${env.SUPABASE_URL}/rest/v1/scheduled_appointments`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': env.SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`
        },
        body: JSON.stringify({
          event_id: eventId,
          client_name: name,
          client_email: email,
          appointment_date: date,
          appointment_time: time,
          calendar_link: calendarLink
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Appointment save failed [${response.status}]: ${errorText.substring(0, 200)}`);
      return null;
    }

    return { success: true };
  } catch (err) {
    console.error('Appointment save error:', err.message);
    return null;
  }
}

export async function onRequestPost(context) {
  try {
    const body = await parseJSON(context.request);
    const { date, time, name, email, sessionId } = body;

    // Validar campos requeridos
    if (!date || !time || !name || !email) {
      throw new ApiError('Faltan campos: date, time, name, email', 400);
    }

    // Validar formato de fecha (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new ApiError('Formato de fecha inválido. Usa YYYY-MM-DD', 400);
    }

    // Validar formato de hora (HH:MM)
    if (!/^\d{2}:\d{2}$/.test(time)) {
      throw new ApiError('Formato de hora inválido. Usa HH:MM', 400);
    }

    // Validar email
    if (!/[\w.+-]+@[\w-]+\.[\w.-]+/.test(email)) {
      throw new ApiError('Email inválido', 400);
    }

    // Rate limiting por email
    const rlCheck = await checkRateLimit(email, context.env.RATE_LIMIT_KV, {
      maxRequests: 5,
      windowSeconds: 3600 // 1 hora
    });

    if (!rlCheck.allowed) {
      throw new ApiError(
        `Demasiadas solicitudes de agendamiento. Intenta de nuevo en ${rlCheck.retryAfter}s`,
        429
      );
    }

    // VERIFICAR DISPONIBILIDAD
    const availability = await checkAvailability(date, time, context.env);

    if (!availability.available) {
      throw new ApiError(
        `La cita para ${date} a las ${time} ya está agendada. Por favor elige otro horario.`,
        409
      );
    }

    // CREAR EVENTO EN GOOGLE CALENDAR
    const eventResult = await createCalendarEvent(
      {
        title: `Cita - ${name}`,
        date,
        time,
        attendeeEmail: email,
        description: `Cita agendada por ${name} (${email})`
      },
      context
    );

    // GUARDAR EN SUPABASE
    await saveAppointment(
      eventResult.eventId,
      name,
      email,
      date,
      time,
      eventResult.htmlLink,
      context.env
    );

    return sendSuccess({
      success: true,
      eventId: eventResult.eventId,
      message: eventResult.message,
      details: {
        date,
        time,
        clientName: name,
        clientEmail: email,
        calendarLink: eventResult.htmlLink
      }
    });

  } catch (err) {
    const apiErr = err instanceof ApiError ? err : new ApiError(err.message, 500);
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
