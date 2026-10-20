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

async function insertEvent(accessToken, eventPayload, params, calendarId = 'primary') {
  const res = await fetch(`${CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events?${params}`, {
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
 * Crea el evento en el calendario principal (o en `calendarId`, el calendario
 * que un cliente compartió con la cuenta de Atiéndeme la Pyme).
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
    withMeet = true,
    calendarId = 'primary'
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
      }, meetParams, calendarId);
      if (!result.res.ok) {
        console.error('Google Calendar: no se pudo crear con Meet, se reintenta sin videollamada:', result.data.error?.message);
      }
    }
    if (!result || !result.res.ok) {
      result = await insertEvent(accessToken, eventPayload, params, calendarId);
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

// ---------------------------------------------------------------------------
// Disponibilidad en el calendario de un cliente (agenda automática del bot).
// ---------------------------------------------------------------------------

const WEEKDAY_KEYS = ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab'];

function toMinutes(hhmm) {
  const [h, m] = String(hhmm).split(':').map(Number);
  return h * 60 + m;
}

function toHHMM(minutes) {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

/** Rangos de atención de un día: ["09:00","18:00"] o [["09:00","13:00"],["15:00","19:00"]]. */
function rangesFor(horario, date) {
  const key = WEEKDAY_KEYS[new Date(`${date}T12:00:00Z`).getUTCDay()];
  const value = horario?.[key];
  if (!Array.isArray(value) || value.length === 0) return [];
  return (Array.isArray(value[0]) ? value : [value]).map(([a, b]) => [toMinutes(a), toMinutes(b)]);
}

/**
 * Horas libres de un día (función pura).
 * @param {object} opts
 * @param {object} opts.horario - { lun: ["09:00","18:00"], sab: [["10:00","14:00"]], ... } (dom..sab; falta = cerrado)
 * @param {number} opts.slotMinutes - duración de cada hora
 * @param {Array<[number, number]>} opts.busy - ocupado ese día, en minutos desde medianoche (hora de Chile)
 * @param {string} opts.date - YYYY-MM-DD
 * @param {string} [opts.nowDate] - hoy (YYYY-MM-DD) y [opts.nowMinutes] - minuto actual: no se ofrecen horas pasadas
 * @returns {string[]} ["09:00", "10:00", ...]
 */
export function freeSlots({ horario, slotMinutes, busy = [], date, nowDate, nowMinutes = 0 }) {
  if (nowDate && date < nowDate) return [];
  const slots = [];
  for (const [start, end] of rangesFor(horario, date)) {
    for (let t = start; t + slotMinutes <= end; t += slotMinutes) {
      if (date === nowDate && t <= nowMinutes) continue;
      if (busy.some(([b0, b1]) => t < b1 && t + slotMinutes > b0)) continue;
      slots.push(toHHMM(t));
    }
  }
  return slots;
}

// Offset de Chile para una fecha ("-03:00" o "-04:00"): cambia con el horario de verano.
function chileOffset(date) {
  const part = new Intl.DateTimeFormat('en-US', { timeZone: CALENDAR_TIMEZONE, timeZoneName: 'longOffset' })
    .formatToParts(new Date(`${date}T12:00:00Z`))
    .find((p) => p.type === 'timeZoneName').value; // "GMT-03:00"
  return part.replace('GMT', '') || '+00:00';
}

// Minutos desde medianoche, en hora de Chile, de un instante.
function chileMinutes(instant) {
  const [h, m] = new Intl.DateTimeFormat('en-GB', { timeZone: CALENDAR_TIMEZONE, hour: '2-digit', minute: '2-digit', hour12: false })
    .format(new Date(instant)).split(':').map(Number);
  return (h % 24) * 60 + m;
}

/** Fecha (YYYY-MM-DD) y minuto actual en Chile. */
export function chileNow(now = new Date()) {
  const date = new Intl.DateTimeFormat('en-CA', { timeZone: CALENDAR_TIMEZONE }).format(now);
  return { date, minutes: chileMinutes(now) };
}

/**
 * Tramos ocupados de un día en un calendario, en minutos desde medianoche
 * (hora de Chile). Un evento de día completo ocupa todo el día.
 */
export async function busyRanges(env, calendarId, date) {
  const accessToken = await getAccessToken(env);
  const offset = chileOffset(date);
  const params = new URLSearchParams({
    timeMin: `${date}T00:00:00${offset}`,
    timeMax: `${date}T23:59:59${offset}`,
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '250'
  });
  const res = await fetch(`${CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  const data = await res.json();
  if (!res.ok) throw new ApiError(`Google Calendar: ${data.error?.message || 'error al leer el calendario'}`, res.status);
  return (data.items || [])
    .filter((e) => e.status !== 'cancelled' && e.transparency !== 'transparent')
    .map((e) => {
      if (e.start?.date) return [0, 24 * 60];
      const startDay = new Intl.DateTimeFormat('en-CA', { timeZone: CALENDAR_TIMEZONE }).format(new Date(e.start.dateTime));
      const endDay = new Intl.DateTimeFormat('en-CA', { timeZone: CALENDAR_TIMEZONE }).format(new Date(e.end.dateTime));
      const start = startDay < date ? 0 : chileMinutes(e.start.dateTime);
      const end = endDay > date ? 24 * 60 : chileMinutes(e.end.dateTime);
      return [start, end];
    });
}

/**
 * Correo de la cuenta de Google que usa el sistema (la del
 * GOOGLE_REFRESH_TOKEN): con esa cuenta comparten su calendario los clientes.
 */
export async function googleAccountEmail(env) {
  const accessToken = await getAccessToken(env);
  const res = await fetch(`${CALENDAR_API}/calendars/primary`, { headers: { Authorization: `Bearer ${accessToken}` } });
  const data = await res.json();
  if (!res.ok) throw new ApiError(`Google Calendar: ${data.error?.message || 'error'}`, res.status);
  return data.id;
}
