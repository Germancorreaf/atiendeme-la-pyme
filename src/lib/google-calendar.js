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

export async function createCalendarEvent(options, context) {
  const { title, date, time, attendeeEmail = null, description = 'Cita agendada via Dominga', durationMinutes = 60 } = options;

  if (!title || !date || !time) throw new ApiError('Faltan: title, date, time', 400);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new ApiError('Fecha invalida. Usa YYYY-MM-DD', 400);
  if (!/^\d{2}:\d{2}$/.test(time)) throw new ApiError('Hora invalida. Usa HH:MM', 400);

  try {
    const accessToken = await getAccessToken(context.env);

    const startDateTime = `${date}T${time}:00`;
    const endDateTime = new Date(new Date(startDateTime).getTime() + durationMinutes * 60 * 1000).toISOString().slice(0, 19);

    const eventPayload = {
      summary: title,
      description,
      start: { dateTime: startDateTime, timeZone: CALENDAR_TIMEZONE },
      end: { dateTime: endDateTime, timeZone: CALENDAR_TIMEZONE }
    };

    if (attendeeEmail) eventPayload.attendees = [{ email: attendeeEmail }];

    const res = await fetch(`${CALENDAR_API}/calendars/primary/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(eventPayload)
    });

    const data = await res.json();

    if (!res.ok) throw new ApiError(`Google Calendar: ${data.error?.message || 'Error desconocido'}`, res.status);

    return {
      success: true,
      eventId: data.id,
      htmlLink: data.htmlLink,
      message: `Cita agendada para ${date} a las ${time}`
    };
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(`Error: ${err.message}`, 500);
  }
}

export async function cancelCalendarEvent(eventId, context) {
  if (!eventId) throw new ApiError('Se requiere eventId', 400);
  try {
    const accessToken = await getAccessToken(context.env);
    const res = await fetch(`${CALENDAR_API}/calendars/primary/events/${eventId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    if (!res.ok && res.status !== 204) throw new ApiError('Error cancelando evento', res.status);
    return { success: true, eventId };
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(`Error: ${err.message}`, 500);
  }
}
