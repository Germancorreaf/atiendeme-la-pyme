import { describe, it, expect, afterEach, vi } from 'vitest';
import { onRequestGetInvite, onRequestGetConnect, onRequestGetCallback, onRequestPostConnectFacebookConfirm } from '../../src/api/meta-connect.js';
import { onRequestPostClienteSave, onRequestPostClienteDraft } from '../../src/api/admin.js';
import { inviteToken, verifyInvite } from '../../src/lib/clientInvite.js';
import { parseHorario, formatHorario } from '../../src/lib/clients.js';
import { createSessionCookie } from '../../src/lib/adminSession.js';

// Alta de clientes: Germán crea el cliente en el panel y le manda un link
// para que el cliente conecte su Instagram/Facebook sin pasar su clave.

const ID = '11111111-2222-4333-8444-555555555555';
const env = {
  ADMIN_SESSION_SECRET: 'test-session-signing-secret',
  SUPABASE_URL: 'https://supabase.test', SUPABASE_SERVICE_KEY: 'k',
  INSTAGRAM_APP_ID: 'ig-app', INSTAGRAM_APP_SECRET: 'ig-secret',
  META_APP_ID: 'fb-app', META_LOGIN_CONFIG_ID: 'cfg',
};

function stubSupabase({ clientes = [{ id: ID, nombre: 'Clínica Sonrisa' }] } = {}) {
  const writes = [];
  vi.stubGlobal('fetch', vi.fn(async (url, init = {}) => {
    const u = String(url);
    const json = (d, status = 200) => new Response(JSON.stringify(d), { status, headers: { 'Content-Type': 'application/json' } });
    if (u.includes('/rest/v1/clientes') && (init.method || 'GET') === 'GET') {
      const id = new URL(u).searchParams.get('id')?.replace('eq.', '');
      return json(clientes.filter((c) => c.id === id));
    }
    if (u.includes('/rest/v1/')) { writes.push({ u, method: init.method, body: JSON.parse(init.body || 'null') }); return json([{ id: ID }]); }
    if (u.includes('api.instagram.com/oauth/access_token')) return json({ access_token: 'short', user_id: 1 });
    if (u.includes('graph.instagram.com/access_token')) return json({ access_token: 'long' });
    if (u.includes('graph.instagram.com') && u.includes('/me?')) return json({ user_id: '17840000000000001', username: 'clinicasonrisa' });
    return json({ success: true });
  }));
  return writes;
}

afterEach(() => vi.unstubAllGlobals());

describe('link de invitación del cliente', () => {
  it('solo vale el token firmado de un cliente que existe', async () => {
    stubSupabase();
    const token = await inviteToken(env, ID);
    expect((await verifyInvite(env, token)).cliente.nombre).toBe('Clínica Sonrisa');
    expect(await verifyInvite(env, token.slice(0, -1) + (token.endsWith('0') ? '1' : '0'))).toBeNull();
    expect(await verifyInvite(env, `${ID}.inventado`)).toBeNull();
    const otro = '99999999-2222-4333-8444-555555555555';
    expect(await verifyInvite(env, await inviteToken(env, otro))).toBeNull(); // firmado, pero el cliente no existe
  });

  it('la página del link muestra el negocio y los botones de conexión', async () => {
    stubSupabase();
    const token = await inviteToken(env, ID);
    const res = await onRequestGetInvite({ request: new Request(`https://example.com/conectar/${token}`), env });
    const html = await res.text();
    expect(res.status).toBe(200);
    expect(html).toContain('Clínica Sonrisa');
    expect(html).toContain(`/admin/meta/connect?invite=${encodeURIComponent(token)}`);
    expect(html).toContain(`/admin/meta/connect-facebook?invite=${encodeURIComponent(token)}`);

    const bad = await onRequestGetInvite({ request: new Request(`https://example.com/conectar/${ID}.x`), env });
    expect(bad.status).toBe(404);
  });

  it('con el link (sin sesión del panel) inicia el login de Instagram y recuerda al cliente', async () => {
    stubSupabase();
    const token = await inviteToken(env, ID);
    const res = await onRequestGetConnect({ request: new Request(`https://example.com/admin/meta/connect?invite=${encodeURIComponent(token)}`), env });
    expect(res.status).toBe(302);
    expect(res.headers.get('Location')).toContain('redirect_uri=https%3A%2F%2Fexample.com%2Fadmin%2Fmeta%2Fcallback');
    const cookies = res.headers.getSetCookie();
    expect(cookies.some((c) => c.startsWith('atp_meta_oauth_state='))).toBe(true);
    expect(cookies.some((c) => c.startsWith('atp_invite=') && c.includes('Path=/admin/meta'))).toBe(true);

    const forged = await onRequestGetConnect({ request: new Request(`https://example.com/admin/meta/connect?invite=${ID}.falso`), env });
    expect(forged.status).toBe(401);
  });

  it('la cuenta conectada con el link queda asignada a ese cliente', async () => {
    const writes = stubSupabase();
    const token = await inviteToken(env, ID);
    const req = new Request('https://example.com/admin/meta/callback?code=c&state=s', {
      headers: { Cookie: `atp_meta_oauth_state=s; atp_invite=${encodeURIComponent(token)}` }
    });
    const res = await onRequestGetCallback({ request: req, env });
    const html = await res.text();
    expect(res.status).toBe(200);
    expect(html).toContain('quedó conectado');
    expect(html).not.toContain('dashboard');
    const upsert = writes.find((w) => w.u.includes('meta_connections'));
    expect(upsert.body).toMatchObject({ page_id: '17840000000000001', cliente_id: ID });
  });

  it('la confirmación de Página de Facebook sin sesión ni link se rechaza', async () => {
    stubSupabase();
    const res = await onRequestPostConnectFacebookConfirm({ request: new Request('https://example.com/admin/meta/connect-facebook/confirm', { method: 'POST', body: new FormData() }), env });
    expect(res.status).toBe(401);
  });
});

describe('clientes en el panel', () => {
  it('el horario se escribe por día y queda en el formato de la agenda', () => {
    const h = parseHorario({ lun: '9:00-13:00, 15:00-19:00', sab: '10:00 a 14:00', mar: '' });
    expect(h).toEqual({ lun: [['09:00', '13:00'], ['15:00', '19:00']], sab: [['10:00', '14:00']] });
    expect(formatHorario(h, 'lun')).toBe('09:00-13:00, 15:00-19:00');
    expect(formatHorario({ mar: ['09:00', '18:00'] }, 'mar')).toBe('09:00-18:00');
    expect(() => parseHorario({ vie: '18:00-09:00' })).toThrow(/Viernes/);
    expect(() => parseHorario({ vie: 'todo el día' })).toThrow(/no es un horario válido/);
  });

  async function save(fields, { session = true } = {}) {
    const body = new FormData();
    for (const [k, v] of Object.entries(fields)) body.set(k, v);
    const headers = session ? { Cookie: (await createSessionCookie(env.ADMIN_SESSION_SECRET)).split(';')[0] } : {};
    return onRequestPostClienteSave({ request: new Request('https://example.com/admin/clientes/save', { method: 'POST', body, headers }), env });
  }

  it('crea un cliente con su horario', async () => {
    const writes = stubSupabase();
    const res = await save({ nombre: 'Barbería Norte', bot_prompt: 'Corte: $10.000', calendar_id: 'barberia@gmail.com', slot_minutes: '30', h_lun: '10:00-19:00' });
    expect(res.status).toBe(303);
    expect(writes[0].method).toBe('POST');
    expect(writes[0].body).toEqual({ nombre: 'Barbería Norte', bot_prompt: 'Corte: $10.000', calendar_id: 'barberia@gmail.com', slot_minutes: 30, horario: { lun: [['10:00', '19:00']] } });
  });

  it('edita un cliente existente y avisa si el horario está mal', async () => {
    const writes = stubSupabase();
    expect((await save({ id: ID, nombre: 'Clínica Sonrisa', h_mar: '09:00-18:00' })).status).toBe(303);
    expect(writes[0]).toMatchObject({ method: 'PATCH', u: expect.stringContaining(`id=eq.${ID}`) });
    const bad = await save({ id: ID, nombre: 'Clínica Sonrisa', h_mar: '18-9' });
    expect(bad.status).toBe(400);
    expect(await bad.text()).toContain('Martes');
  });

  it('sin sesión del panel no se puede guardar', async () => {
    stubSupabase();
    expect((await save({ nombre: 'X' }, { session: false })).status).toBe(401);
  });
});

describe('rellenar un cliente desde el panel con sus respuestas', () => {
  const draftReq = async ({ session = true } = {}) => new Request(`https://example.com/admin/clientes/borrador?id=${ID}`, {
    method: 'POST', headers: session ? { Cookie: (await createSessionCookie(env.ADMIN_SESSION_SECRET)).split(';')[0] } : {}
  });

  it('devuelve el borrador con el horario listo para el formulario, sin guardar nada', async () => {
    const writes = stubSupabase({ clientes: [{ id: ID, nombre: 'Clínica', onboarding: { text: 'RESPUESTAS' } }] });
    const real = globalThis.fetch;
    vi.stubGlobal('fetch', vi.fn(async (url, init) => String(url).includes('api.anthropic.com')
      ? new Response(JSON.stringify({ content: [{ type: 'text', text: '{"bot_prompt":"NEGOCIO","horario":{"lun":"9:00-13:00, 15:00-19:00"},"slot_minutes":null}' }], stop_reason: 'end_turn' }))
      : real(url, init)));
    const res = await onRequestPostClienteDraft({ request: await draftReq(), env: { ...env, ANTHROPIC_API_KEY: 'a' } });
    const d = await res.json();
    expect(d.bot_prompt).toBe('NEGOCIO');
    expect(d.horario).toMatchObject({ lun: '09:00-13:00, 15:00-19:00', mar: '' });
    expect(writes).toHaveLength(0);
  });

  it('sin respuestas o sin sesión, no hay borrador', async () => {
    stubSupabase();
    expect((await onRequestPostClienteDraft({ request: await draftReq(), env })).status).toBe(404);
    expect((await onRequestPostClienteDraft({ request: await draftReq({ session: false }), env })).status).toBe(401);
  });
});
