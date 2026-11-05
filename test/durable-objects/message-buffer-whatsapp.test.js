import { describe, it, expect, afterEach, vi } from 'vitest';
import { env as workerEnv } from 'cloudflare:test';
import { MessageBuffer } from '../../src/durable-objects/MessageBuffer.js';
import { onRequestPost as whatsappPost } from '../../src/api/whatsapp.js';
import { computeHmacSha256Hex } from '../../src/lib/metaSignature.js';
import { markOwnerActive } from '../../src/lib/ownerActive.js';

// WhatsApp igual que Instagram/Messenger: "escribiendo…" de inmediato y una
// sola respuesta a los mensajes seguidos de una persona.

const env = (extra = {}) => ({
  META_APP_SECRET: 's', WHATSAPP_ACCESS_TOKEN: 'tok', SUPABASE_URL: 'https://supabase.test', SUPABASE_SERVICE_KEY: 'k',
  ANTHROPIC_API_KEY: 'a', RATE_LIMIT_KV: workerEnv.RATE_LIMIT_KV, ...extra,
});

function stubNetwork() {
  const out = { claudeInputs: [], sent: [], typing: [], saved: [] };
  vi.stubGlobal('fetch', vi.fn(async (url, init = {}) => {
    const u = String(url);
    const json = (d) => new Response(JSON.stringify(d), { headers: { 'Content-Type': 'application/json' } });
    if (u.includes('/rest/v1/whatsapp_connections')) return json([]);
    if (u.includes('/rpc/append_chat_messages')) { out.saved.push(JSON.parse(init.body)); return json({}); }
    if (u.includes('/rest/v1/chat_sessions')) return json([]);
    if (u.includes('api.anthropic.com')) {
      out.claudeInputs.push(JSON.parse(init.body).messages.at(-1).content);
      return json({ content: [{ type: 'text', text: 'Hola, soy Dominga, asistente de IA. Atendemos de 9 a 18.' }] });
    }
    if (u.endsWith('/messages') && init.method === 'POST') {
      const b = JSON.parse(init.body);
      if (b.typing_indicator) out.typing.push(b); else out.sent.push(b.text.body);
      return json({ messages: [{ id: 'wamid.bot.' + out.sent.length }] });
    }
    return json({});
  }));
  return out;
}

function fakeState() {
  const data = new Map();
  return {
    storage: {
      get: async (k) => data.get(k),
      put: async (k, v) => { data.set(k, v); },
      delete: async (k) => { data.delete(k); },
      setAlarm: async () => {},
    },
  };
}

const waJob = (from, messageId, text) => new Request('https://buffer/', {
  method: 'POST',
  body: JSON.stringify({ channel: 'whatsapp', phoneNumberId: 'PNB', from, contactName: 'Ana', messageId, text }),
});

afterEach(() => vi.unstubAllGlobals());

describe('MessageBuffer con WhatsApp', () => {
  it('el webhook muestra "escribiendo…" y deja el mensaje en el buffer de esa conversación', async () => {
    const out = stubNetwork();
    const received = [];
    const names = [];
    const MESSAGE_BUFFER = {
      idFromName: (name) => { names.push(name); return name; },
      get: () => ({ fetch: async (_url, init) => { received.push(JSON.parse(init.body)); return new Response('ok'); } }),
    };
    const id = `wamid.buf.${Date.now()}`;
    const body = JSON.stringify({ entry: [{ changes: [{ field: 'messages', value: {
      metadata: { phone_number_id: 'PNB' }, contacts: [{ profile: { name: 'Ana' } }],
      messages: [{ id, type: 'text', from: '56955550001', text: { body: 'Hola' } }],
    } }] }] });
    const req = new Request('https://example.com/webhook/whatsapp', { method: 'POST', body, headers: { 'X-Hub-Signature-256': 'sha256=' + await computeHmacSha256Hex('s', body) } });
    const waited = [];
    await whatsappPost({ request: req, env: env({ MESSAGE_BUFFER }), ctx: { waitUntil: (p) => waited.push(p) } });
    await Promise.all(waited);

    expect(out.typing).toEqual([{ messaging_product: 'whatsapp', status: 'read', message_id: id, typing_indicator: { type: 'text' } }]);
    expect(names).toEqual(['whatsapp_PNB_56955550001']);
    expect(received).toEqual([{ channel: 'whatsapp', phoneNumberId: 'PNB', from: '56955550001', contactName: 'Ana', messageId: id, text: 'Hola' }]);
    expect(out.claudeInputs).toHaveLength(0); // responde el buffer, no el webhook
  });

  it('"Hola" + "¿qué horarios tienen?" seguidos -> una sola respuesta a los dos', async () => {
    const out = stubNetwork();
    const buffer = new MessageBuffer(fakeState(), env());
    await buffer.fetch(waJob('56955550002', 'wamid.a', 'Hola'));
    await buffer.fetch(waJob('56955550002', 'wamid.b', '¿qué horarios tienen?'));
    expect(out.claudeInputs).toHaveLength(0);

    await buffer.alarm();
    expect(out.claudeInputs).toEqual(['Hola\n¿qué horarios tienen?']);
    expect(out.sent).toHaveLength(1);
    // Renueva "escribiendo…" sobre el último mensaje mientras Claude piensa.
    expect(out.typing.map((t) => t.message_id)).toEqual(['wamid.b']);
  });

  it('si el dueño respondió desde el celular mientras se esperaba, el bot no contesta pero guarda el mensaje', async () => {
    const out = stubNetwork();
    const buffer = new MessageBuffer(fakeState(), env());
    await buffer.fetch(waJob('56955550003', 'wamid.c', '¿tienen hora mañana?'));
    await markOwnerActive(workerEnv.RATE_LIMIT_KV, 'PNB', '56955550003');

    await buffer.alarm();
    expect(out.claudeInputs).toHaveLength(0);
    expect(out.sent).toHaveLength(0);
    expect(JSON.stringify(out.saved)).toContain('¿tienen hora mañana?');
  });
});
