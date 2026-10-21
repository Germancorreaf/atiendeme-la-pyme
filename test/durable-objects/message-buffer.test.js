import { describe, it, expect, afterEach, vi } from 'vitest';
import { env as workerEnv } from 'cloudflare:test';
import { MessageBuffer, DEBOUNCE_MS } from '../../src/durable-objects/MessageBuffer.js';
import { onRequestPost as metaPost } from '../../src/api/meta-webhook.js';
import { computeHmacSha256Hex } from '../../src/lib/metaSignature.js';

// Mensajes seguidos de una persona -> una sola respuesta a todo junto, con
// "visto" y "escribiendo…" mientras tanto.

const connection = { page_id: 'PAGE_BUF', page_access_token: 'tok', page_name: 'Clínica Sonrisa', bot_prompt: 'Clínica Sonrisa. Limpieza: $30.000.' };
const env = () => ({
  META_APP_SECRET: 's', SUPABASE_URL: 'https://supabase.test', SUPABASE_SERVICE_KEY: 'k', ANTHROPIC_API_KEY: 'a',
  RATE_LIMIT_KV: workerEnv.RATE_LIMIT_KV,
});

function stubNetwork() {
  const claudeInputs = [];
  const sent = [];
  const actions = [];
  vi.stubGlobal('fetch', vi.fn(async (url, init = {}) => {
    const u = String(url);
    const json = (d) => new Response(JSON.stringify(d), { headers: { 'Content-Type': 'application/json' } });
    if (u.includes('/rest/v1/meta_connections')) return json([connection]);
    if (u.includes('/rest/v1/chat_sessions')) return json([]);
    if (u.includes('api.anthropic.com')) {
      claudeInputs.push(JSON.parse(init.body).messages.at(-1).content);
      return json({ content: [{ type: 'text', text: 'Hola, soy la asistente de IA de Clínica Sonrisa. Mañana tengo 10:00 o 11:00.' }] });
    }
    if (new URL(u).pathname.endsWith('/messages') && init.method === 'POST') {
      const b = JSON.parse(init.body);
      if (b.sender_action) actions.push(b.sender_action); else sent.push(b.message.text);
      return json({});
    }
    return json({});
  }));
  return { claudeInputs, sent, actions };
}

function fakeState() {
  const data = new Map();
  let alarm = null;
  return {
    storage: {
      get: async (k) => data.get(k),
      put: async (k, v) => { data.set(k, v); },
      delete: async (k) => { data.delete(k); },
      setAlarm: async (t) => { alarm = t; },
    },
    alarmAt: () => alarm,
  };
}

const job = (text) => new Request('https://buffer/', { method: 'POST', body: JSON.stringify({ isInstagram: false, entryId: 'PAGE_BUF', senderId: '5550001', text }) });

afterEach(() => vi.unstubAllGlobals());

describe('MessageBuffer', () => {
  it('"Hola" + "¿tienes hora mañana?" seguidos -> una sola respuesta a los dos', async () => {
    const { claudeInputs, sent } = stubNetwork();
    const state = fakeState();
    const buffer = new MessageBuffer(state, env());
    const before = Date.now();
    await buffer.fetch(job('Hola'));
    await buffer.fetch(job('¿tienes hora mañana?'));
    expect(state.alarmAt()).toBeGreaterThanOrEqual(before + DEBOUNCE_MS);
    expect(claudeInputs).toHaveLength(0); // todavía espera

    await buffer.alarm();
    expect(claudeInputs).toEqual(['Hola\n¿tienes hora mañana?']);
    expect(sent).toHaveLength(1);

    await buffer.alarm(); // nada pendiente: no responde de nuevo
    expect(sent).toHaveLength(1);
  });

  it('el webhook marca visto, muestra "escribiendo…" y deja el mensaje en el buffer de esa conversación', async () => {
    const { actions, claudeInputs } = stubNetwork();
    const received = [];
    const names = [];
    const MESSAGE_BUFFER = {
      idFromName: (name) => { names.push(name); return name; },
      get: () => ({ fetch: async (_url, init) => { received.push(JSON.parse(init.body)); return new Response('ok'); } }),
    };
    const body = JSON.stringify({ object: 'page', entry: [{ id: 'PAGE_BUF', messaging: [{ sender: { id: '5550002' }, message: { mid: `mid.buf.${Date.now()}`, text: 'Hola' } }] }] });
    const req = new Request('https://example.com/webhook/meta', { method: 'POST', body, headers: { 'X-Hub-Signature-256': 'sha256=' + await computeHmacSha256Hex('s', body) } });
    const waited = [];
    await metaPost({ request: req, env: { ...env(), MESSAGE_BUFFER }, ctx: { waitUntil: (p) => waited.push(p) } });
    await Promise.all(waited);

    expect(actions).toEqual(['mark_seen', 'typing_on']);
    expect(names).toEqual(['messenger_PAGE_BUF_5550002']);
    expect(received).toEqual([{ isInstagram: false, entryId: 'PAGE_BUF', senderId: '5550002', text: 'Hola' }]);
    expect(claudeInputs).toHaveLength(0); // responde el buffer, no el webhook
  });
});
