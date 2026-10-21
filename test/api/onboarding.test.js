import { describe, it, expect, afterEach, vi } from 'vitest';
import { SELF, env as workerEnv } from 'cloudflare:test';
import { onRequestGetOnboardingPersonal, onRequestGetOnboardingStatus, onRequestPostOnboardingSend } from '../../src/api/onboarding.js';
import { inviteToken } from '../../src/lib/clientInvite.js';

// Link personal de onboarding: el manual de /onboarding con envío directo,
// conexión de cuentas y revisión del calendario.

const ID = '11111111-2222-4333-8444-555555555555';
const env = {
  ADMIN_SESSION_SECRET: 'test-session-signing-secret',
  SUPABASE_URL: 'https://supabase.test', SUPABASE_SERVICE_KEY: 'k',
  GOOGLE_CLIENT_ID: 'c', GOOGLE_CLIENT_SECRET: 's', GOOGLE_REFRESH_TOKEN: 'r',
  RESEND_API_KEY: 're', DRAFT_NOTIFICATION_EMAIL: 'german@example.com',
  RATE_LIMIT_KV: workerEnv.RATE_LIMIT_KV,
};

function stub({ cliente = { id: ID, nombre: 'Clínica <Sonrisa>', calendar_id: null }, accessRole = 'writer', inList = true } = {}) {
  const calls = { writes: [], emails: [], calendarInserts: 0 };
  vi.stubGlobal('fetch', vi.fn(async (url, init = {}) => {
    const u = String(url);
    const json = (d, status = 200) => new Response(JSON.stringify(d), { status, headers: { 'Content-Type': 'application/json' } });
    if (u.includes('/rest/v1/clientes') && (init.method || 'GET') === 'GET') return json([cliente]);
    if (u.includes('/rest/v1/clientes')) { calls.writes.push(JSON.parse(init.body)); return json([cliente]); }
    if (u.includes('/rest/v1/meta_connections')) return json([{ ig_username: 'clinicasonrisa', page_name: 'Instagram: @clinicasonrisa' }, { ig_username: 'clinicasonrisa', page_name: 'Facebook: Clínica' }]);
    if (u.includes('oauth2.googleapis.com')) return json({ access_token: 'g' });
    if (u.includes('/calendars/primary')) return json({ id: 'sistema@gmail.com' });
    if (u.includes('/users/me/calendarList') && init.method === 'POST') { calls.calendarInserts++; return accessRole ? json({ accessRole }) : json({}, 404); }
    if (u.includes('/users/me/calendarList/')) return inList && accessRole ? json({ accessRole }) : json({}, 404);
    if (u.includes('api.resend.com')) { calls.emails.push(JSON.parse(init.body)); return json({ id: 'e' }); }
    return json({});
  }));
  return calls;
}

const req = async (suffix = '', init) => new Request(`https://example.com/onboarding/${await inviteToken(env, ID)}${suffix}`, init);

afterEach(() => vi.unstubAllGlobals());

describe('onboarding personal', () => {
  it('el manual real tiene el punto donde se inyectan los datos del cliente', async () => {
    const html = await (await SELF.fetch('https://example.com/onboarding')).text();
    expect(html.match(/<\/head>/g)).toHaveLength(1);
    expect(html).toContain('var P = window.__CLIENTE__ || null;');
    expect(html).toContain('data-personal hidden');
    expect(html).not.toContain('__CLIENTE__=');
  });

  it('con un link válido entrega el manual con el nombre del cliente (escapado) y la cuenta de Google', async () => {
    stub();
    const fake = '<html><head></head><body></body></html>';
    const res = await onRequestGetOnboardingPersonal({ request: await req(), env }, fake);
    const html = await res.text();
    expect(res.headers.get('Cache-Control')).toBe('no-store');
    const data = JSON.parse(html.match(/window\.__CLIENTE__=(.*?);<\/script>/)[1].replace(/\\u003c/g, '<'));
    expect(data).toMatchObject({ id: ID, nombre: 'Clínica <Sonrisa>', google: 'sistema@gmail.com' });
    expect(html).not.toContain('<Sonrisa>');

    const bad = await onRequestGetOnboardingPersonal({ request: new Request(`https://example.com/onboarding/${ID}.x`), env }, fake);
    expect(bad.status).toBe(404);
  });

  it('estado: cuentas conectadas y permiso del calendario', async () => {
    stub();
    let d = await (await onRequestGetOnboardingStatus({ request: await req('/estado?cal=clinica@gmail.com'), env })).json();
    expect(d).toEqual({ cuentas: ['@clinicasonrisa'], calendario: 'ok', enviado: null });

    stub({ accessRole: 'reader' });
    d = await (await onRequestGetOnboardingStatus({ request: await req('/estado?cal=clinica@gmail.com'), env })).json();
    expect(d.calendario).toBe('lectura');

    const calls = stub({ accessRole: null, inList: false });
    d = await (await onRequestGetOnboardingStatus({ request: await req('/estado?cal=clinica@gmail.com'), env })).json();
    expect(d.calendario).toBe('pendiente');
    expect(calls.calendarInserts).toBe(1); // intentó agregarlo a la lista

    stub();
    d = await (await onRequestGetOnboardingStatus({ request: await req('/estado'), env })).json();
    expect(d.calendario).toBeNull(); // sin Gmail no hay nada que revisar
  });

  it('enviar guarda las respuestas, toma el Gmail de la agenda y avisa por correo', async () => {
    const calls = stub();
    const res = await onRequestPostOnboardingSend({ request: await req('/enviar', { method: 'POST', body: JSON.stringify({ text: 'RESPUESTAS\n- Nombre: Clínica', answers: { 's4-calendar': ' clinica@gmail.com ' } }) }), env });
    expect(res.status).toBe(200);
    expect(calls.writes[0].onboarding).toMatchObject({ text: 'RESPUESTAS\n- Nombre: Clínica', answers: { 's4-calendar': ' clinica@gmail.com ' } });
    expect(calls.writes[0].calendar_id).toBe('clinica@gmail.com');
    expect(calls.emails[0].to).toBe('german@example.com');
    expect(calls.emails[0].subject).toContain('Clínica <Sonrisa>');
    expect(calls.emails[0].html).not.toContain('<Sonrisa>');
  });

  it('enviar no pisa un calendario ya configurado ni acepta envíos vacíos', async () => {
    const calls = stub({ cliente: { id: ID, nombre: 'Clínica', calendar_id: 'otro@gmail.com' } });
    await onRequestPostOnboardingSend({ request: await req('/enviar', { method: 'POST', body: JSON.stringify({ text: 'x', answers: { 's4-calendar': 'clinica@gmail.com' } }) }), env });
    expect(calls.writes[0]).not.toHaveProperty('calendar_id');
    const empty = await onRequestPostOnboardingSend({ request: await req('/enviar', { method: 'POST', body: JSON.stringify({ text: '  ' }) }), env });
    expect(empty.status).toBe(400);
  });
});

describe('onboarding -> bot del cliente', () => {
  function stubWithClaude({ cliente }) {
    const calls = { writes: [], emails: [] };
    vi.stubGlobal('fetch', vi.fn(async (url, init = {}) => {
      const u = String(url);
      const json = (d, status = 200) => new Response(JSON.stringify(d), { status, headers: { 'Content-Type': 'application/json' } });
      if (u.includes('/rest/v1/clientes') && (init.method || 'GET') === 'GET') return json([cliente]);
      if (u.includes('/rest/v1/clientes')) { calls.writes.push(JSON.parse(init.body)); return json([cliente]); }
      if (u.includes('api.anthropic.com')) return json({ content: [{ type: 'text', text: '{"bot_prompt":"SERVICIOS Y PRECIOS\\nLimpieza: $30.000","horario":{"lun":"09:00-18:00"},"slot_minutes":30}' }], stop_reason: 'end_turn' });
      if (u.includes('api.resend.com')) { calls.emails.push(JSON.parse(init.body)); return json({ id: 'e' }); }
      return json({});
    }));
    return calls;
  }
  const send = async () => onRequestPostOnboardingSend({ request: await req('/enviar', { method: 'POST', body: JSON.stringify({ text: 'RESPUESTAS', answers: {} }) }), env: { ...env, ANTHROPIC_API_KEY: 'a' } });

  it('un cliente nuevo queda con la información del bot y el horario armados desde sus respuestas', async () => {
    const calls = stubWithClaude({ cliente: { id: ID, nombre: 'Clínica', bot_prompt: null, horario: null } });
    expect((await send()).status).toBe(200);
    expect(calls.writes[1]).toEqual({ bot_prompt: 'SERVICIOS Y PRECIOS\nLimpieza: $30.000', horario: { lun: [['09:00', '18:00']] }, slot_minutes: 30 });
    expect(calls.emails[0].html).toContain('borrador');
  });

  it('lo que Germán ya escribió en el panel no se pisa', async () => {
    const calls = stubWithClaude({ cliente: { id: ID, nombre: 'Clínica', bot_prompt: 'Info revisada', horario: { mar: ['10:00', '14:00'] } } });
    await send();
    expect(calls.writes).toHaveLength(1); // solo las respuestas
    expect(calls.emails[0].html).toContain('no se cambió nada');
  });
});
