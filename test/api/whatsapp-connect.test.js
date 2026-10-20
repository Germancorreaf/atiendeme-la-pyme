import { describe, it, expect, afterEach, vi } from 'vitest';
import { onRequestPostExchange, onRequestGetConnect } from '../../src/api/whatsapp-connect.js';
import { createSessionCookie } from '../../src/lib/adminSession.js';

const env = {
  ADMIN_SESSION_SECRET: 's', META_APP_ID: 'app', META_APP_SECRET: 'sec', META_LOGIN_CONFIG_ID: 'cfg',
  SUPABASE_URL: 'https://supabase.test', SUPABASE_SERVICE_KEY: 'k',
};
afterEach(() => vi.unstubAllGlobals());

async function exchange(isOnBizApp, infoOk = true) {
  const calls = [];
  vi.stubGlobal('fetch', vi.fn(async (url, init = {}) => {
    const u = String(url);
    calls.push(u);
    const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { 'Content-Type': 'application/json' } });
    if (u.includes('oauth/access_token')) return json({ access_token: 'tok' });
    if (u.includes('subscribed_apps')) return json({ success: true });
    if (u.includes('/register')) return json({ success: true });
    if (u.includes('fields=')) return infoOk ? json({ display_phone_number: '+56 9 1111 2222', is_on_biz_app: isOnBizApp }) : json({ error: {} }, 400);
    return json([]);
  }));
  const cookie = (await createSessionCookie(env.ADMIN_SESSION_SECRET)).split(';')[0];
  const req = new Request('https://example.com/admin/whatsapp/connect/exchange', {
    method: 'POST', headers: { Cookie: cookie }, body: JSON.stringify({ code: 'c', waba_id: 'W', phone_number_id: 'P' }),
  });
  const res = await onRequestPostExchange({ request: req, env });
  return { res, registered: calls.some((u) => u.includes('/register')) };
}

describe('conectar WhatsApp', () => {
  it('número nuevo: se registra en Cloud API', async () => {
    const { res, registered } = await exchange(false);
    expect(res.status).toBe(200);
    expect(registered).toBe(true);
  });
  it('coexistencia con la app WhatsApp Business: NO se registra (lo sacaría del celular)', async () => {
    const { res, registered } = await exchange(true);
    expect(res.status).toBe(200);
    expect(registered).toBe(false);
  });
  it('si Meta no entrega los datos del número, falla sin registrar', async () => {
    const { res, registered } = await exchange(undefined, false);
    expect(res.status).toBe(500);
    expect(registered).toBe(false);
  });
  it('la página ofrece la opción de coexistencia', async () => {
    const cookie = (await createSessionCookie(env.ADMIN_SESSION_SECRET)).split(';')[0];
    const res = await onRequestGetConnect({ request: new Request('https://example.com/admin/whatsapp/connect', { headers: { Cookie: cookie } }), env });
    const html = await res.text();
    expect(html).toContain("featureType: 'whatsapp_business_app_onboarding'");
    expect(html).not.toContain("sessionInfoVersion: '3'");
  });
});
