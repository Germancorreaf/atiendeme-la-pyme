// src/lib/booking.js
// Agenda automática del bot de un cliente: herramientas que Claude usa para
// ver las horas realmente libres en el Google Calendar del cliente y reservar.
// El cliente comparte su calendario con la cuenta de Google de Atiéndeme la
// Pyme (la del GOOGLE_REFRESH_TOKEN) con permiso para hacer cambios.
//
// Claude no puede inventar disponibilidad: solo se reserva una hora que el
// calendario confirma libre en ese momento. Quien escribe al bot es un
// desconocido, así que hay un tope de reservas por persona y por día.

import { busyRanges, freeSlots, chileNow, createCalendarEvent } from './google-calendar.js';
import { checkRateLimit } from './rateLimit.js';

const MAX_BOOKINGS_PER_DAY = 3;

export const BOOKING_TOOLS = [
  {
    name: 'consultar_disponibilidad',
    description: 'Devuelve las horas libres de un día en la agenda del negocio y las horas que esta misma persona ya reservó ese día (reservas_de_esta_persona: están confirmadas). Úsala antes de ofrecer horarios, y otra vez si la persona pide otro día.',
    input_schema: {
      type: 'object',
      properties: { fecha: { type: 'string', description: 'Día a consultar, en formato AAAA-MM-DD.' } },
      required: ['fecha'],
      additionalProperties: false
    }
  },
  {
    name: 'agendar_hora',
    description: 'Reserva una hora en la agenda del negocio. Úsala solo cuando la persona eligió el día y la hora y te dio su nombre.',
    input_schema: {
      type: 'object',
      properties: {
        fecha: { type: 'string', description: 'Día, en formato AAAA-MM-DD.' },
        hora: { type: 'string', description: 'Hora de inicio en formato HH:MM, una de las horas libres.' },
        nombre: { type: 'string', description: 'Nombre de la persona.' },
        motivo: { type: 'string', description: 'Servicio o motivo, si lo dijo.' }
      },
      required: ['fecha', 'hora', 'nombre'],
      additionalProperties: false
    }
  }
];

// Una respuesta que nombra una hora (09:00, 9 am, 13 hrs…) sin haber mirado la
// agenda en este turno se le devuelve a Claude para que la consulte primero.
export const BOOKING_CHECK = {
  test: (text) => /\b\d{1,2}(:\d{2}|\s?(am|pm|hrs?\b|horas\b))/i.test(text),
  reminder: '(Mensaje del sistema, no de la persona) Antes de responder, revisa la agenda con consultar_disponibilidad: no ofrezcas ni confirmes ninguna hora que la herramienta no haya devuelto en este turno (una hora que ya quedó reservada en esta conversación sí puedes nombrarla). Luego responde de nuevo a la persona.'
};

/** ¿El cliente tiene configurada la agenda automática? */
export function hasBooking(cliente) {
  return Boolean(cliente?.calendar_id && cliente?.horario && typeof cliente.horario === 'object');
}

/**
 * Ejecutor de las herramientas para una conversación.
 * @param {object} cliente - fila de `clientes` (calendar_id, horario, slot_minutes, nombre)
 * @param {object} env
 * @param {object} who - { sessionId, contact, channel } de quien escribe
 * @returns {(name: string, input: object) => Promise<object>}
 */
export function bookingRunner(cliente, env, { sessionId, contact, channel }) {
  const slotMinutes = Number(cliente.slot_minutes) || 60;

  // Marca en la descripción del evento: así se reconocen las reservas de esta
  // conversación (el historial que ve Claude no guarda las llamadas a herramientas).
  const marker = `Conversación: ${sessionId}`;
  const hhmm = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

  async function slotsFor(fecha) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(fecha || ''))) throw new Error('Fecha inválida: usa el formato AAAA-MM-DD.');
    const now = chileNow();
    const busy = await busyRanges(env, cliente.calendar_id, fecha, { mineMarker: marker });
    return {
      libres: freeSlots({ horario: cliente.horario, slotMinutes, busy, date: fecha, nowDate: now.date, nowMinutes: now.minutes }),
      mias: busy.filter(([, , mine]) => mine).map(([start]) => hhmm(start))
    };
  }

  return async (name, input = {}) => {
    if (name === 'consultar_disponibilidad') {
      const { libres, mias } = await slotsFor(input.fecha);
      return {
        fecha: input.fecha,
        horas_libres: libres,
        ...(mias.length && { reservas_de_esta_persona: mias }),
        ...(!libres.length && { nota: 'Ese día no hay horas libres (cerrado o con la agenda llena).' })
      };
    }

    if (name === 'agendar_hora') {
      const { fecha, hora, motivo } = input;
      const nombre = String(input.nombre || '').trim().slice(0, 80);
      if (!/^\d{2}:\d{2}$/.test(String(hora || ''))) throw new Error('Hora inválida: usa el formato HH:MM.');
      if (!nombre) throw new Error('Falta el nombre de la persona.');

      const { libres, mias } = await slotsFor(fecha);
      if (mias.includes(hora)) return { ok: true, fecha, hora, nombre, ya_estaba_reservada: true };
      if (!libres.includes(hora)) {
        throw new Error(`La hora ${hora} del ${fecha} no está disponible. Horas libres ese día: ${libres.join(', ') || 'ninguna'}.`);
      }
      const quota = await checkRateLimit(`booking:${sessionId}`, env.RATE_LIMIT_KV, MAX_BOOKINGS_PER_DAY, 24 * 60 * 60);
      if (!quota.allowed) throw new Error('Esta persona ya agendó varias horas hoy. Ofrécele que el equipo la contacte.');

      const titulo = `${motivo ? `${String(motivo).slice(0, 60)} — ` : ''}${nombre}`;
      await createCalendarEvent({
        title: titulo,
        date: fecha,
        time: hora,
        durationMinutes: slotMinutes,
        withMeet: false,
        calendarId: cliente.calendar_id,
        description: `Agendado por la asistente de IA por ${channel}.\nContacto: ${contact || 'no informado'}\n${marker}`
      }, { env });
      return { ok: true, fecha, hora, nombre };
    }

    throw new Error(`Herramienta desconocida: ${name}`);
  };
}
