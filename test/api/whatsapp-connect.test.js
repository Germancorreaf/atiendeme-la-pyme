import { describe, it, expect, afterEach, vi } from 'vitest';
import { onRequestPostExchange, onRequestGetConnect, onRequestPostAssignCliente } from '../../src/api/whatsapp-connect.js';
import { createSessionCookie } from '../../src/lib/adminSession.js';
import { inviteToken } from '../../src/lib/clientInvite.js';

const env = {
  ADMIN_SESSION_SECRET: 's', META_APP_ID: 'app', META_APP_SECRET: 'sec', META_LOGIN_CONFIG_ID: 'cfg',
  SUPABASE_URL: 'https://supabase.test', SUPABASE_SERVICE_KEY: 'k',
};
afterEach(() => vi.unstubAllGlobals());

async function exchange(isOnBizApp, infoOk = true, ids = { waba_id: 'W', phone_number_id: 'P' }) {
  const calls = [];
  const upserts = [];
  vi.stubGlobal('fetch', vi.fn(async (url, init = {}) => {
    const u = String(url);
    calls.push(u);
    if (u.includes('/rest/v1/whatsapp_connections')) { upserts.push(JSON.parse(init.body)); return new Response('[]', { status: 201 }); }
    const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { 'Content-Type': 'application/json' } });
    if (u.includes('oauth/access_token')) return json({ access_token: 'tok' });
    if (u.includes('subscribed_apps')) return json({ success: true });
    if (u.includes('/register')) return json({ success: true });
    if (u.includes('debug_token')) return json({ data: { granular_scopes: [{ scope: 'whatsapp_business_management', target_ids: ['W2'] }] } });
    if (u.includes('/W2/phone_numbers')) return json({ data: [{ id: 'P2' }] });
    if (u.includes('fields=')) return infoOk ? json({ display_phone_number: '+56 9 1111 2222', is_on_biz_app: isOnBizApp }) : json({ error: {} }, 400);
    return json([]);
  }));
  const cookie = (await createSessionCookie(env.ADMIN_SESSION_SECRET)).split(';')[0];
  const req = new Request('https://example.com/admin/whatsapp/connect/exchange', {
    method: 'POST', headers: { Cookie: cookie }, body: JSON.stringify({ code: 'c', ...ids }),
  });
  const res = await onRequestPostExchange({ request: req, env });
  return { res, calls, upserts, registered: calls.some((u) => u.includes('/register')) };
}

describe('conectar WhatsApp', () => {
  it('número nuevo: se registra en Cloud API y se guarda su PIN de verificación en dos pasos', async () => {
    const { res, registered, upserts } = await exchange(false);
    expect(res.status).toBe(200);
    expect(registered).toBe(true);
    expect(upserts.at(-1).two_step_pin).toMatch(/^\d{6}$/);
  });
  it('coexistencia con la app WhatsApp Business: NO se registra (lo sacaría del celular) ni guarda PIN', async () => {
    const { res, registered, upserts } = await exchange(true);
    expect(res.status).toBe(200);
    expect(registered).toBe(false);
    expect(upserts.at(-1)).not.toHaveProperty('two_step_pin');
  });
  it('si Meta no entrega los datos del número, falla sin registrar', async () => {
    const { res, registered } = await exchange(undefined, false);
    expect(res.status).toBe(500);
    expect(registered).toBe(false);
  });
  it('sin el evento de Meta (v4): saca la WABA del token y el número de la WABA', async () => {
    const { res, calls } = await exchange(false, true, {});
    expect(res.status).toBe(200);
    expect(calls.some((u) => u.includes('/W2/subscribed_apps'))).toBe(true);
    expect(calls.some((u) => u.includes('/P2/register'))).toBe(true);
  });
  it('la página ofrece la opción de coexistencia', async () => {
    const cookie = (await createSessionCookie(env.ADMIN_SESSION_SECRET)).split(';')[0];
    const res = await onRequestGetConnect({ request: new Request('https://example.com/admin/whatsapp/connect', { headers: { Cookie: cookie } }), env });
    const html = await res.text();
    expect(html).toContain("featureType: 'whatsapp_business_app_onboarding'");
    expect(html).not.toContain("sessionInfoVersion: '3'");
  });
});

describe('assign-cliente (endpoint)', () => {
  it('asigna un cliente y devuelve ok:true', async () => {
    const patches = [];
    vi.stubGlobal('fetch', vi.fn(async (url, init = {}) => {
      patches.push({ url: String(url), body: JSON.parse(init.body) });
      return new Response(null, { status: 204 });
    }));
    const cookie = (await createSessionCookie(env.ADMIN_SESSION_SECRET)).split(';')[0];
    const req = new Request('https://example.com/admin/whatsapp/connections/assign-cliente', {
      method: 'POST',
      headers: { Cookie: cookie, 'Content-Type': 'application/json', Origin: 'https://example.com' },
      body: JSON.stringify({ phone_number_id: 'PH1', cliente_id: 'uuid-1' })
    });
    const res = await onRequestPostAssignCliente({ request: req, env });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(patches[0].url).toContain('phone_number_id=eq.PH1');
    expect(patches[0].body.cliente_id).toBe('uuid-1');
  });

  it('rechaza sin sesión válida (401)', async () => {
    const req = new Request('https://example.com/admin/whatsapp/connections/assign-cliente', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: 'https://example.com' },
      body: JSON.stringify({ phone_number_id: 'PH1', cliente_id: 'uuid-1' })
    });
    const res = await onRequestPostAssignCliente({ request: req, env });
    expect(res.status).toBe(401);
  });

  it('rechaza petición cross-site (403)', async () => {
    const cookie = (await createSessionCookie(env.ADMIN_SESSION_SECRET)).split(';')[0];
    const req = new Request('https://example.com/admin/whatsapp/connections/assign-cliente', {
      method: 'POST',
      headers: { Cookie: cookie, 'Content-Type': 'application/json', 'Sec-Fetch-Site': 'cross-site' },
      body: JSON.stringify({ phone_number_id: 'PH1', cliente_id: 'uuid-1' })
    });
    const res = await onRequestPostAssignCliente({ request: req, env });
    expect(res.status).toBe(403);
  });

  it('falla con 400 si no viene phone_number_id', async () => {
    const cookie = (await createSessionCookie(env.ADMIN_SESSION_SECRET)).split(';')[0];
    const req = new Request('https://example.com/admin/whatsapp/connections/assign-cliente', {
      method: 'POST',
      headers: { Cookie: cookie, 'Content-Type': 'application/json', Origin: 'https://example.com' },
      body: JSON.stringify({ cliente_id: 'uuid-1' })
    });
    const res = await onRequestPostAssignCliente({ request: req, env });
    expect(res.status).toBe(400);
  });
});

describe('invite de cliente en /admin/whatsapp/connect', () => {
  const clienteId = '11111111-1111-1111-1111-111111111111';
  const cliente = { id: clienteId, nombre: 'Mi Negocio Test' };

  function stubFetchForInvite({ upserts = [] } = {}) {
    vi.stubGlobal('fetch', vi.fn(async (url, init = {}) => {
      const u = String(url);
      const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { 'Content-Type': 'application/json' } });
      if (u.includes('/rest/v1/whatsapp_connections')) { upserts.push(JSON.parse(init.body)); return new Response('[]', { status: 201 }); }
      // getCliente via Supabase
      if (u.includes('/rest/v1/clientes')) return json([cliente]);
      if (u.includes('oauth/access_token')) return json({ access_token: 'tok' });
      if (u.includes('subscribed_apps')) return json({ success: true });
      if (u.includes('/register')) return json({ success: true });
      if (u.includes('fields=')) return json({ display_phone_number: '+56 9 8888 7777', is_on_biz_app: false });
      return json([]);
    }));
  }

  it('GET /connect?invite=<token> devuelve 200 y pone cookie de invite', async () => {
    stubFetchForInvite();
    const token = await inviteToken(env, clienteId);
    const req = new Request(`https://example.com/admin/whatsapp/connect?invite=${encodeURIComponent(token)}`, { method: 'GET' });
    const res = await onRequestGetConnect({ request: req, env });
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('Mi Negocio Test');
    expect(res.headers.get('Set-Cookie')).toContain('_wa=');
  });

  it('GET /connect sin sesión ni invite devuelve 401', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url) => {
      if (String(url).includes('/rest/v1/clientes')) return new Response('[]', { status: 200 });
      return new Response('[]', { status: 200 });
    }));
    const req = new Request('https://example.com/admin/whatsapp/connect', { method: 'GET' });
    const res = await onRequestGetConnect({ request: req, env });
    expect(res.status).toBe(401);
  });

  it('POST /exchange con invite guarda cliente_id en la conexión', async () => {
    const upserts = [];
    stubFetchForInvite({ upserts });
    const token = await inviteToken(env, clienteId);
    // Simula llegar vía cookie (ya que el exchange no tiene el query param)
    const cookieName = 'atp_invite_wa';
    const req = new Request('https://example.com/admin/whatsapp/connect/exchange', {
      method: 'POST',
      headers: { Cookie: `${cookieName}=${encodeURIComponent(token)}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'c', waba_id: 'W', phone_number_id: 'P' }),
    });
    const res = await onRequestPostExchange({ request: req, env });
    expect(res.status).toBe(200);
    expect(upserts.at(-1).cliente_id).toBe(clienteId);
  });

  it('POST /exchange con invite en body (cookie bloqueada) guarda cliente_id', async () => {
    const upserts = [];
    stubFetchForInvite({ upserts });
    const token = await inviteToken(env, clienteId);
    const req = new Request('https://example.com/admin/whatsapp/connect/exchange', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'c', waba_id: 'W', phone_number_id: 'P', invite: encodeURIComponent(token) }),
    });
    const res = await onRequestPostExchange({ request: req, env });
    expect(res.status).toBe(200);
    expect(upserts.at(-1).cliente_id).toBe(clienteId);
  });
});
