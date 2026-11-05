import { describe, it, expect, afterEach, vi } from 'vitest';
import {
  getConnectionByPhoneNumberId, listWhatsappConnections,
  deleteWhatsappConnection, upsertWhatsappConnection,
} from '../../src/lib/whatsappConnections.js';

const env = { SUPABASE_URL: 'https://supabase.test', SUPABASE_SERVICE_KEY: 'svc' };
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
let calls;
function stub(handler) {
  calls = [];
  vi.stubGlobal('fetch', vi.fn(async (url, init = {}) => { calls.push({ url: String(url), init }); return handler(String(url), init); }));
}
afterEach(() => vi.unstubAllGlobals());

describe('getConnectionByPhoneNumberId', () => {
  it('devuelve la fila y consulta por phone_number_id codificado, con la service key', async () => {
    stub(() => json([{ phone_number_id: 'PN 1', access_token: 't' }]));
    const row = await getConnectionByPhoneNumberId('PN 1', env);
    expect(row).toEqual({ phone_number_id: 'PN 1', access_token: 't' });
    expect(calls[0].url).toContain('phone_number_id=eq.PN%201');
    expect(calls[0].init.headers.apikey).toBe('svc');
  });

  it('sin filas, con error HTTP, con red caída o sin Supabase -> null', async () => {
    stub(() => json([]));
    expect(await getConnectionByPhoneNumberId('x', env)).toBeNull();
    stub(() => json({ message: 'boom' }, 500));
    expect(await getConnectionByPhoneNumberId('x', env)).toBeNull();
    stub(() => { throw new Error('red'); });
    expect(await getConnectionByPhoneNumberId('x', env)).toBeNull();
    stub(() => json([{}]));
    expect(await getConnectionByPhoneNumberId('x', {})).toBeNull();
    expect(calls).toHaveLength(0);
  });
});

describe('listWhatsappConnections', () => {
  it('no pide el access_token (el panel nunca lo necesita)', async () => {
    stub(() => json([{ phone_number_id: 'a' }]));
    expect(await listWhatsappConnections(env)).toEqual([{ phone_number_id: 'a' }]);
    expect(calls[0].url).toContain('select=');
    expect(calls[0].url).not.toContain('access_token');
  });

  it('ante error devuelve lista vacía', async () => {
    stub(() => json({}, 500));
    expect(await listWhatsappConnections(env)).toEqual([]);
    stub(() => json({ no: 'array' }));
    expect(await listWhatsappConnections(env)).toEqual([]);
    expect(await listWhatsappConnections({})).toEqual([]);
  });
});

describe('upsertWhatsappConnection', () => {
  it('hace upsert por phone_number_id y sella updated_at', async () => {
    stub(() => json({}, 201));
    await upsertWhatsappConnection({ phone_number_id: 'PN1', waba_id: 'W', access_token: 't' }, env);
    const { url, init } = calls[0];
    expect(url).toContain('on_conflict=phone_number_id');
    expect(init.method).toBe('POST');
    expect(init.headers.Prefer).toBe('resolution=merge-duplicates');
    const body = JSON.parse(init.body);
    expect(body).toMatchObject({ phone_number_id: 'PN1', waba_id: 'W', access_token: 't' });
    expect(Number.isNaN(Date.parse(body.updated_at))).toBe(false);
  });

  it('si Supabase falla o falta configuración, lanza error', async () => {
    stub(() => new Response('nope', { status: 400 }));
    await expect(upsertWhatsappConnection({}, env)).rejects.toThrow(/No se pudo guardar/);
    await expect(upsertWhatsappConnection({}, {})).rejects.toThrow(/Supabase no configurado/);
  });
});

describe('deleteWhatsappConnection', () => {
  it('borra solo esa fila', async () => {
    stub(() => new Response(null, { status: 204 }));
    await deleteWhatsappConnection('PN1', env);
    expect(calls[0].init.method).toBe('DELETE');
    expect(calls[0].url).toContain('phone_number_id=eq.PN1');
  });

  it('si Supabase falla o falta configuración, lanza error', async () => {
    stub(() => new Response('nope', { status: 500 }));
    await expect(deleteWhatsappConnection('PN1', env)).rejects.toThrow(/No se pudo eliminar/);
    await expect(deleteWhatsappConnection('PN1', {})).rejects.toThrow(/Supabase no configurado/);
  });
});
