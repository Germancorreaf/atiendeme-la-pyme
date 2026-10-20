import { describe, it, expect, afterEach, vi } from 'vitest';
import { env as workerEnv } from 'cloudflare:test';
import { onRequestPost as whatsappPost } from '../../src/api/whatsapp.js';
import { onRequestPost as metaPost } from '../../src/api/meta-webhook.js';
import { computeHmacSha256Hex } from '../../src/lib/metaSignature.js';

// En WhatsApp/Instagram/Messenger, cuando alguien pide una persona, Dominga no
// sabe responder o promete confirmar una cita "por correo", el dueño tiene que
// enterarse (igual que en el chat web): correo + conversación marcada.

const SECRET = 's';
let n = 0;

function stubNetwork(modelReply) {
  const saved = [];
  const emails = [];
  vi.stubGlobal('fetch', vi.fn(async (url, init = {}) => {
    const u = String(url);
    const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { 'Content-Type': 'application/json' } });
    if (u.includes('/rest/v1/whatsapp_connections')) return json([{ phone_number_id: 'PN1', access_token: 'tok' }]);
    if (u.includes('/rest/v1/meta_connections')) return json([{ page_id: 'PAGE1', page_access_token: 'tok' }]);
    if (u.includes('/rest/v1/rpc/append_chat_messages')) {
      const b = JSON.parse(init.body);
      saved.push({ session_id: b.p_session_id, messages: b.p_messages, ...b.p_fields });
      return json(null);
    }
    if (u.includes('/rest/v1/chat_sessions') && (!init.method || init.method === 'GET')) return json([]);
    if (u.includes('api.anthropic.com')) return json({ content: [{ type: 'text', text: modelReply }] });
    if (u.includes('api.resend.com')) { emails.push(JSON.parse(init.body)); return json({ id: 'e' }); }
    return json({});
  }));
  return { saved, emails };
}

const env = () => ({
  META_APP_SECRET: SECRET, SUPABASE_URL: 'https://supabase.test', SUPABASE_SERVICE_KEY: 'k', ANTHROPIC_API_KEY: 'a',
  RESEND_API_KEY: 'r', DRAFT_NOTIFICATION_EMAIL: 'german@example.com', RATE_LIMIT_KV: workerEnv.RATE_LIMIT_KV,
});

async function sendWhatsapp(text) {
  n += 1;
  const body = JSON.stringify({ entry: [{ changes: [{ value: {
    metadata: { phone_number_id: 'PN1' },
    messages: [{ id: `wamid.${n}`, type: 'text', from: `5691111${String(n).padStart(4, '0')}`, text: { body: text } }],
  } }] }] });
  const req = new Request('https://example.com/webhook/whatsapp', { method: 'POST', body, headers: { 'X-Hub-Signature-256': 'sha256=' + await computeHmacSha256Hex(SECRET, body) } });
  const waited = [];
  await whatsappPost({ request: req, env: env(), ctx: { waitUntil: (p) => waited.push(p) } });
  await Promise.all(waited);
}

async function sendMessenger(text) {
  n += 1;
  const body = JSON.stringify({ object: 'page', entry: [{ id: 'PAGE1', messaging: [{ sender: { id: `12345${n}` }, message: { mid: `mid.esc.${n}`, text } }] }] });
  const req = new Request('https://example.com/webhook/meta', { method: 'POST', body, headers: { 'X-Hub-Signature-256': 'sha256=' + await computeHmacSha256Hex(SECRET, body) } });
  const waited = [];
  await metaPost({ request: req, env: env(), ctx: { waitUntil: (p) => waited.push(p) } });
  await Promise.all(waited);
}

afterEach(() => vi.unstubAllGlobals());

describe.each([
  ['WhatsApp', sendWhatsapp],
  ['Messenger', sendMessenger],
])('escalamiento en %s', (channel, send) => {
  it('pide hablar con una persona -> correo al dueño y conversación marcada', async () => {
    const { saved, emails } = stubNetwork('Le aviso al equipo y te escriben pronto.');
    await send('quiero hablar con una persona');
    expect(emails).toHaveLength(1);
    expect(emails[0].to).toBe('german@example.com');
    expect(emails[0].subject).toContain(channel);
    expect(saved.at(-1).escalated).toBe(true);
    expect(saved.at(-1).escalation_reason).toBe('user_requested_human');
  });

  it('Dominga promete confirmar la cita por correo -> el dueño se entera', async () => {
    const { saved, emails } = stubNetwork('¡Listo, Ana! Te confirmo por correo el jueves a las 10:00.');
    await send('quiero agendar el jueves a las 10, ana@gmail.com');
    expect(emails).toHaveLength(1);
    expect(saved.at(-1).escalation_reason).toBe('wants_to_schedule');
  });

  it('mensaje normal -> sin correo', async () => {
    const { saved, emails } = stubNetwork('El plan básico parte en $149.990.');
    await send('¿cuánto cuesta?');
    expect(emails).toHaveLength(0);
    expect(saved.at(-1).escalated).toBe(false);
  });
});

describe('webhook de WhatsApp: entregas repetidas y respuesta rápida', () => {
  it('el mismo mensaje entregado dos veces por Meta se responde una sola vez', async () => {
    const sent = [];
    vi.stubGlobal('fetch', vi.fn(async (url, init = {}) => {
      const u = String(url);
      const json = (d) => new Response(JSON.stringify(d), { headers: { 'Content-Type': 'application/json' } });
      if (u.includes('/rest/v1/chat_sessions') && (!init.method || init.method === 'GET')) return json([]);
      if (u.includes('api.anthropic.com')) return json({ content: [{ type: 'text', text: 'Hola 👋' }] });
      if (u.includes('graph.facebook.com') && u.endsWith('/messages')) { sent.push(1); return json({}); }
      return json([]);
    }));
    const body = JSON.stringify({ entry: [{ changes: [{ value: {
      metadata: { phone_number_id: 'PN1' },
      messages: [{ id: 'wamid.DUP', type: 'text', from: '56922220000', text: { body: 'hola' } }],
    } }] }] });
    for (let i = 0; i < 2; i++) {
      const req = new Request('https://example.com/webhook/whatsapp', { method: 'POST', body, headers: { 'X-Hub-Signature-256': 'sha256=' + await computeHmacSha256Hex(SECRET, body) } });
      const waited = [];
      await whatsappPost({ request: req, env: { ...env(), WHATSAPP_ACCESS_TOKEN: 't' }, ctx: { waitUntil: (p) => waited.push(p) } });
      await Promise.all(waited);
    }
    expect(sent).toHaveLength(1);
  });

  it('responde 200 a Meta sin esperar a Claude (el trabajo sigue en segundo plano)', async () => {
    let releaseClaude;
    vi.stubGlobal('fetch', vi.fn(async (url) => {
      if (String(url).includes('api.anthropic.com')) await new Promise((r) => { releaseClaude = r; });
      return new Response('[]', { headers: { 'Content-Type': 'application/json' } });
    }));
    const body = JSON.stringify({ entry: [{ changes: [{ value: {
      metadata: { phone_number_id: 'PN1' },
      messages: [{ id: 'wamid.SLOW', type: 'text', from: '56922220001', text: { body: 'hola' } }],
    } }] }] });
    const req = new Request('https://example.com/webhook/whatsapp', { method: 'POST', body, headers: { 'X-Hub-Signature-256': 'sha256=' + await computeHmacSha256Hex(SECRET, body) } });
    const waited = [];
    const res = await whatsappPost({ request: req, env: { ...env(), WHATSAPP_ACCESS_TOKEN: 't' }, ctx: { waitUntil: (p) => waited.push(p) } });
    expect(res.status).toBe(200);
    expect(waited).toHaveLength(1);
    // Recién ahora el proceso en segundo plano llega a Claude: se libera.
    await vi.waitFor(() => expect(releaseClaude).toBeTypeOf('function'));
    releaseClaude();
    await Promise.all(waited);
  });
});

describe('Instagram/Messenger: historial separado por negocio', () => {
  it('la misma persona escribiéndole a dos Páginas conectadas queda en dos conversaciones distintas', async () => {
    const { saved } = stubNetwork('Hola 👋');
    for (const [page, mid] of [['PAGE_A', 'mid.sep.a'], ['PAGE_B', 'mid.sep.b']]) {
      const body = JSON.stringify({ object: 'page', entry: [{ id: page, messaging: [{ sender: { id: '5550001' }, message: { mid, text: 'hola' } }] }] });
      const req = new Request('https://example.com/webhook/meta', { method: 'POST', body, headers: { 'X-Hub-Signature-256': 'sha256=' + await computeHmacSha256Hex(SECRET, body) } });
      const waited = [];
      await metaPost({ request: req, env: env(), ctx: { waitUntil: (p) => waited.push(p) } });
      await Promise.all(waited);
    }
    const ids = saved.map((b) => b.session_id);
    expect(ids).toEqual(['messenger_PAGE_A_5550001', 'messenger_PAGE_B_5550001']);
  });
});
