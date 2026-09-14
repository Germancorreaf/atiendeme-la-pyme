// src/lib/google-calendar.js
// Google Calendar API usando OAuth2 con Refresh Token

import { ApiError } from './errors.js';

const CALENDAR_API = 'https://www.googleapis.com/calendar/v3';
const CALENDAR_TIMEZONE = 'America/Santiago';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';

async function getAccessToken(env) {
  const clientId = env.GOOGLE_CLIENT_ID;
  const clientSecret = env.GOOGLE_CLIENT_SECRET;
  const refreshToken = env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new ApiError('Faltan variables: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN', 500);
  }

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken
    })
  });

  const data = await response.json();

  if (!response.ok || !data.access_token) {
    throw new ApiError(`Error obteniendo token: ${data.error}`, 500);
  }

  return data.access_token;
}

// Duración de la demo que se agenda desde el chat. El correo de confirmación
// y el sitio ("20 minutos, sin compromiso") dicen lo mismo.
export const DEMO_DURATION_MINUTES = 20;

async function insertEvent(accessToken, eventPayload, params) {
  const res = await fetch(`${CALENDAR_API}/calendars/primary/events?${params}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify(eventPayload)
  });
  return { res, data: await res.json() };
}

/**
 * Crea el evento en el calendario principal.
 * - withMeet: agrega una videollamada de Google Meet. Si la cuenta no puede
 *   crearla, reintenta sin Meet para no perder la cita (meetLink queda null).
 * - Con attendeeEmail, Google le envía la invitación al invitado (sendUpdates=all).
 */
export async function createCalendarEvent(options, context) {
  const {
    title,
    date,
    time,
    attendeeEmail = null,
    description = 'Cita agendada via Dominga',
    durationMinutes = DEMO_DURATION_MINUTES,
    withMeet = true
  } = options;

  if (!title || !date || !time) throw new ApiError('Faltan: title, date, time', 400);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new ApiError('Fecha invalida. Usa YYYY-MM-DD', 400);
  if (!/^\d{2}:\d{2}$/.test(time)) throw new ApiError('Hora invalida. Usa HH:MM', 400);

  try {
    const accessToken = await getAccessToken(context.env);

    // Fecha/hora "de pared" en America/Santiago: se suma la duración en UTC
    // solo como aritmética y se vuelve a formatear sin zona horaria.
    const startDateTime = `${date}T${time}:00`;
    const endDateTime = new Date(new Date(`${startDateTime}Z`).getTime() + durationMinutes * 60 * 1000).toISOString().slice(0, 19);

    const eventPayload = {
      summary: title,
      description,
      start: { dateTime: startDateTime, timeZone: CALENDAR_TIMEZONE },
      end: { dateTime: endDateTime, timeZone: CALENDAR_TIMEZONE }
    };

    const params = new URLSearchParams();
    if (attendeeEmail) {
      eventPayload.attendees = [{ email: attendeeEmail }];
      params.set('sendUpdates', 'all');
    }

    let result;
    if (withMeet) {
      const meetParams = new URLSearchParams(params);
      meetParams.set('conferenceDataVersion', '1');
      result = await insertEvent(accessToken, {
        ...eventPayload,
        conferenceData: {
          createRequest: { requestId: crypto.randomUUID(), conferenceSolutionKey: { type: 'hangoutsMeet' } }
        }
      }, meetParams);
      if (!result.res.ok) {
        console.error('Google Calendar: no se pudo crear con Meet, se reintenta sin videollamada:', result.data.error?.message);
      }
    }
    if (!result || !result.res.ok) {
      result = await insertEvent(accessToken, eventPayload, params);
    }

    const { res, data } = result;
    if (!res.ok) throw new ApiError(`Google Calendar: ${data.error?.message || 'Error desconocido'}`, res.status);

    return {
      success: true,
      eventId: data.id,
      htmlLink: data.htmlLink,
      meetLink: data.hangoutLink || null,
      message: `Cita agendada para ${date} a las ${time}`
    };
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(`Error: ${err.message}`, 500);
  }
}
