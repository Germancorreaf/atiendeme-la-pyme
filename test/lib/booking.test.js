import { describe, it, expect, afterEach, vi } from 'vitest';
import { env as workerEnv } from 'cloudflare:test';
import { bookingRunner, hasBooking } from '../../src/lib/booking.js';

// Calendario falso: ocupado el lunes 2027-03-01 de 10:00 a 11:00 (Chile, -03:00).
function stubGoogle({ busyItems = [], insertStatus = 200 } = {}) {
  const inserted = [];
  vi.stubGlobal('fetch', vi.fn(async (url, init = {}) => {
    const u = String(url);
    const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { 'Content-Type': 'application/json' } });
    if (u.includes('oauth2.googleapis.com/token')) return json({ access_token: 'g' });
    if (u.includes('/events') && (init.method || 'GET') === 'GET') return json({ items: busyItems });
    if (u.includes('/events') && init.method === 'POST') {
      inserted.push({ url: u, body: JSON.parse(init.body) });
      return json({ id: 'ev1', htmlLink: 'https://calendar' }, insertStatus);
    }
    return json({});
  }));
  return inserted;
}

const cliente = {
  nombre: 'Clínica Sonrisa',
  calendar_id: 'clinica@example.com',
  slot_minutes: 60,
  horario: { lun: [['09:00', '13:00']] },
};
const env = { GOOGLE_CLIENT_ID: 'c', GOOGLE_CLIENT_SECRET: 's', GOOGLE_REFRESH_TOKEN: 'r', RATE_LIMIT_KV: workerEnv.RATE_LIMIT_KV };
const busy10 = [{ start: { dateTime: '2027-03-01T10:00:00-03:00' }, end: { dateTime: '2027-03-01T11:00:00-03:00' } }];
let n = 0;
const who = () => ({ sessionId: `whatsapp_PN_${++n}`, contact: '+56911112222', channel: 'WhatsApp' });

afterEach(() => vi.unstubAllGlobals());

describe('agenda automática del bot de un cliente', () => {
  it('hasBooking: hace falta calendario y horario', () => {
    expect(hasBooking(cliente)).toBe(true);
    expect(hasBooking({ ...cliente, calendar_id: null })).toBe(false);
    expect(hasBooking({ ...cliente, horario: null })).toBe(false);
    expect(hasBooking(null)).toBe(false);
  });

  it('consultar_disponibilidad devuelve solo las horas libres del calendario del cliente', async () => {
    stubGoogle({ busyItems: busy10 });
    const run = bookingRunner(cliente, env, who());
    const res = await run('consultar_disponibilidad', { fecha: '2027-03-01' });
    expect(res.horas_libres).toEqual(['09:00', '11:00', '12:00']);
  });

  it('agendar_hora crea el evento en el calendario del cliente, sin Meet ni invitados', async () => {
    const inserted = stubGoogle({ busyItems: busy10 });
    const run = bookingRunner(cliente, env, who());
    const res = await run('agendar_hora', { fecha: '2027-03-01', hora: '11:00', nombre: 'Ana', motivo: 'Limpieza' });
    expect(res).toEqual({ ok: true, fecha: '2027-03-01', dia: 'lunes', hora: '11:00', nombre: 'Ana' });
    expect(inserted).toHaveLength(1);
    expect(inserted[0].url).toContain('/calendars/clinica%40example.com/events');
    expect(inserted[0].url).not.toContain('conferenceDataVersion');
    expect(inserted[0].body.summary).toBe('Limpieza — Ana');
    expect(inserted[0].body.start).toEqual({ dateTime: '2027-03-01T11:00:00', timeZone: 'America/Santiago' });
    expect(inserted[0].body.end.dateTime).toBe('2027-03-01T12:00:00');
    expect(inserted[0].body).not.toHaveProperty('attendees');
    expect(inserted[0].body.description).toContain('+56911112222');
  });

  it('no agenda una hora ocupada ni inventada: avisa a Claude con las horas libres', async () => {
    const inserted = stubGoogle({ busyItems: busy10 });
    const run = bookingRunner(cliente, env, who());
    await expect(run('agendar_hora', { fecha: '2027-03-01', hora: '10:00', nombre: 'Ana' })).rejects.toThrow(/no está disponible.*09:00, 11:00, 12:00/);
    await expect(run('agendar_hora', { fecha: '2027-03-01', hora: '10:30', nombre: 'Ana' })).rejects.toThrow(/no está disponible/);
    expect(inserted).toHaveLength(0);
  });

  it('reconoce las horas que esta conversación ya reservó (no las da por perdidas)', async () => {
    const w = who();
    const mine = [{ start: { dateTime: '2027-03-01T11:00:00-03:00' }, end: { dateTime: '2027-03-01T12:00:00-03:00' }, description: `Contacto: x\nConversación: ${w.sessionId}` }];
    const inserted = stubGoogle({ busyItems: [...busy10, ...mine] });
    const run = bookingRunner(cliente, env, w);
    expect(await run('consultar_disponibilidad', { fecha: '2027-03-01' })).toEqual({ fecha: '2027-03-01', dia: 'lunes', horas_libres: ['09:00', '12:00'], reservas_de_esta_persona: ['11:00'] });
    expect(await run('agendar_hora', { fecha: '2027-03-01', hora: '11:00', nombre: 'Ana' })).toMatchObject({ ok: true, ya_estaba_reservada: true });
    expect(inserted).toHaveLength(0);
    // La reserva de otra persona no cuenta como suya.
    expect(await bookingRunner(cliente, env, who())('consultar_disponibilidad', { fecha: '2027-03-01' })).not.toHaveProperty('reservas_de_esta_persona');
  });

  it('el evento lleva la marca de la conversación', async () => {
    const w = who();
    const inserted = stubGoogle();
    await bookingRunner(cliente, env, w)('agendar_hora', { fecha: '2027-03-01', hora: '09:00', nombre: 'Ana' });
    expect(inserted[0].body.description).toContain(`Conversación: ${w.sessionId}`);
  });

  it('máximo 3 reservas por persona al día', async () => {
    stubGoogle();
    const run = bookingRunner(cliente, env, who());
    for (const hora of ['09:00', '10:00', '11:00']) {
      await run('agendar_hora', { fecha: '2027-03-01', hora, nombre: 'Ana' });
    }
    await expect(run('agendar_hora', { fecha: '2027-03-01', hora: '12:00', nombre: 'Ana' })).rejects.toThrow(/varias horas hoy/);
  });

  it('rechaza fechas, horas y nombres inválidos', async () => {
    stubGoogle();
    const run = bookingRunner(cliente, env, who());
    await expect(run('consultar_disponibilidad', { fecha: 'mañana' })).rejects.toThrow(/Fecha inválida/);
    await expect(run('agendar_hora', { fecha: '2027-03-01', hora: '9', nombre: 'Ana' })).rejects.toThrow(/Hora inválida/);
    await expect(run('agendar_hora', { fecha: '2027-03-01', hora: '09:00', nombre: '  ' })).rejects.toThrow(/Falta el nombre/);
  });
});
