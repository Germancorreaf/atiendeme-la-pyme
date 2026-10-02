import { describe, it, expect, afterEach, vi } from 'vitest';
import { env as workerEnv } from 'cloudflare:test';
import { onRequestPost } from '../../src/api/meta-webhook.js';
import { pickInstagramConnection, usesInstagramToken } from '../../src/lib/metaConnections.js';

const APP_SECRET = 'test-meta-app-secret';
const IG_ID = '17841400000000001';
const PAGE_ID = '1107997039074755';

// Las dos filas que existen en producción para el mismo Instagram.
const igLoginRow = { page_id: IG_ID, ig_business_account_id: IG_ID, page_access_token: 'IG_TOKEN' };
const facebookRow = { page_id: PAGE_ID, ig_business_account_id: IG_ID, page_access_token: 'FB_PAGE_TOKEN' };

async function sign(body) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(APP_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body));
  return 'sha256=' + [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function stubNetwork(igRows) {
  const sends = [];
  vi.stubGlobal('fetch', vi.fn(async (url, init = {}) => {
    const u = String(url);
    const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
    if (u.includes('/rest/v1/meta_connections?ig_business_account_id')) return json(igRows);
    if (u.includes('/rest/v1/chat_sessions') && (!init.method || init.method === 'GET')) {
      return json([{ session_id: 's', messages: [{ role: 'assistant', content: 'Soy Dominga, asistente de IA de Atiéndeme la Pyme.', timestamp: new Date().toISOString() }] }]);
    }
    if (u.includes('/rest/v1/chat_sessions')) return json({});
    if (u.includes('api.anthropic.com')) return json({ content: [{ type: 'text', text: 'Planes desde $149.990.' }] });
    if (u.includes('/messages') && init.method === 'POST') {
      sends.push(u);
      return json({ message_id: 'm' });
    }
    return json({});
  }));
  return sends;
}

async function deliverInstagram(mid) {
  const body = JSON.stringify({ object: 'instagram', entry: [{ id: IG_ID, messaging: [{ sender: { id: '9876543210' }, message: { mid, text: 'Hola' } }] }] });
  const req = new Request('https://example.com/webhook/meta', { method: 'POST', body, headers: { 'X-Hub-Signature-256': await sign(body) } });
  const waited = [];
  const env = { META_APP_SECRET: APP_SECRET, SUPABASE_URL: 'https://supabase.test', SUPABASE_SERVICE_KEY: 'k', ANTHROPIC_API_KEY: 'a', RATE_LIMIT_KV: workerEnv.RATE_LIMIT_KV };
  const res = await onRequestPost({ request: req, env, ctx: { waitUntil: (p) => waited.push(p) } });
  expect(res.status).toBe(200);
  await Promise.all(waited);
}

afterEach(() => vi.unstubAllGlobals());

describe('pickInstagramConnection / usesInstagramToken', () => {
  it('prefiere la fila con token de Instagram aunque la de Facebook venga primero', () => {
    expect(pickInstagramConnection([facebookRow, igLoginRow], IG_ID)).toBe(igLoginRow);
    expect(pickInstagramConnection([igLoginRow, facebookRow], IG_ID)).toBe(igLoginRow);
  });
  it('si solo existe la de Facebook, la usa', () => {
    expect(pickInstagramConnection([facebookRow], IG_ID)).toBe(facebookRow);
  });
  it('tolera vacío o inválido', () => {
    expect(pickInstagramConnection([], IG_ID)).toBeNull();
    expect(pickInstagramConnection(undefined, IG_ID)).toBeNull();
  });
  it('distingue el tipo de token', () => {
    expect(usesInstagramToken(igLoginRow)).toBe(true);
    expect(usesInstagramToken(facebookRow)).toBe(false);
    expect(usesInstagramToken(null)).toBe(false);
    expect(usesInstagramToken({ page_id: PAGE_ID, ig_business_account_id: null })).toBe(false);
  });
});

describe('Instagram: la respuesta usa el host que corresponde al token', () => {
  it('con las dos filas (Facebook primero) responde por graph.instagram.com con el token de Instagram', async () => {
    const sends = stubNetwork([facebookRow, igLoginRow]);
    await deliverInstagram('mid.ig.a');
    expect(sends).toHaveLength(1);
    expect(sends[0]).toContain(`graph.instagram.com/`);
    expect(sends[0]).toContain(`/${IG_ID}/messages`);
    expect(sends[0]).toContain('access_token=IG_TOKEN');
  });

  it('si solo existe la conexión de Facebook, responde por graph.facebook.com con el token de la Página', async () => {
    const sends = stubNetwork([facebookRow]);
    await deliverInstagram('mid.ig.b');
    expect(sends).toHaveLength(1);
    expect(sends[0]).toContain('graph.facebook.com/');
    expect(sends[0]).toContain(`/${PAGE_ID}/messages`);
    expect(sends[0]).toContain('access_token=FB_PAGE_TOKEN');
  });
});
