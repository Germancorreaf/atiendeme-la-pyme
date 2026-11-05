import { describe, it, expect, afterEach, vi } from 'vitest';
import { env as workerEnv } from 'cloudflare:test';
import { onRequestPost } from '../../src/api/whatsapp.js';
import { computeHmacSha256Hex } from '../../src/lib/metaSignature.js';

// Coexistencia: si el dueño responde desde la app WhatsApp Business
// (smb_message_echoes), Dominga se calla en esa conversación.

function stubNetwork() {
  const calls = { sent: [], claude: 0, rpc: [] };
  vi.stubGlobal('fetch', vi.fn(async (url, init = {}) => {
    const u = String(url);
    const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
    if (u.includes('/rest/v1/whatsapp_connections')) return json([]);
    if (u.includes('/rpc/append_chat_messages')) { calls.rpc.push(JSON.parse(init.body)); return json({}); }
    if (u.includes('/rest/v1/chat_sessions')) return json([]);
    if (u.includes('api.anthropic.com')) { calls.claude++; return json({ content: [{ type: 'text', text: 'Respuesta del bot' }] }); }
    if (u.includes('/messages') && init.method === 'POST' && !init.body.includes('typing_indicator')) {
      calls.sent.push(JSON.parse(init.body).text.body);
      return json({ messages: [{ id: 'wamid.bot.' + calls.sent.length }] });
    }
    return json({});
  }));
  return calls;
}

async function deliver(change) {
  const body = JSON.stringify({ entry: [{ changes: [change] }] });
  const sig = 'sha256=' + await computeHmacSha256Hex('test-app-secret', body);
  const req = new Request('https://example.com/webhook/whatsapp', { method: 'POST', body, headers: { 'Content-Type': 'application/json', 'X-Hub-Signature-256': sig } });
  const env = { META_APP_SECRET: 'test-app-secret', WHATSAPP_ACCESS_TOKEN: 'tok', SUPABASE_URL: 'https://supabase.test', SUPABASE_SERVICE_KEY: 'k', ANTHROPIC_API_KEY: 'a', RATE_LIMIT_KV: workerEnv.RATE_LIMIT_KV };
  const waited = [];
  const res = await onRequestPost({ request: req, env, ctx: { waitUntil: (p) => waited.push(p) } });
  expect(res.status).toBe(200);
  await Promise.all(waited);
}

const incoming = (from, id) => ({ field: 'messages', value: {
  metadata: { phone_number_id: 'PNE' }, contacts: [{ profile: { name: 'Ana' } }],
  messages: [{ id, type: 'text', from, text: { body: 'Hola, ¿tienen hora?' } }],
} });
const echo = (to, id) => ({ field: 'smb_message_echoes', value: {
  metadata: { phone_number_id: 'PNE' },
  message_echoes: [{ id, from: '56922053594', to, type: 'text', text: { body: 'Hola Ana, yo te respondo' } }],
} });

afterEach(() => vi.unstubAllGlobals());

describe('Dominga se calla cuando el dueño responde desde la app', () => {
  it('sin mensaje del dueño el bot responde normal', async () => {
    const calls = stubNetwork();
    await deliver(incoming('56933330001', 'wamid.in.1'));
    expect(calls.claude).toBe(1);
    expect(calls.sent).toHaveLength(1);
  });

  it('tras un echo del dueño, el bot no responde ni llama a Claude, pero guarda el mensaje', async () => {
    const calls = stubNetwork();
    await deliver(echo('56933330002', 'wamid.owner.1'));
    await deliver(incoming('56933330002', 'wamid.in.2'));
    expect(calls.claude).toBe(0);
    expect(calls.sent).toEqual([]);
    const saved = calls.rpc.flatMap((r) => r.p_messages);
    expect(saved.map((m) => [m.role, m.content])).toEqual([
      ['assistant', 'Hola Ana, yo te respondo'],
      ['user', 'Hola, ¿tienen hora?'],
    ]);
  });

  it('el silencio es solo de esa conversación: otra persona sí recibe respuesta', async () => {
    const calls = stubNetwork();
    await deliver(echo('56933330003', 'wamid.owner.2'));
    await deliver(incoming('56933330004', 'wamid.in.3'));
    expect(calls.claude).toBe(1);
    expect(calls.sent).toHaveLength(1);
  });

  it('un echo de un mensaje que mandó el propio bot no lo silencia', async () => {
    const calls = stubNetwork();
    await deliver(incoming('56933330005', 'wamid.in.4'));
    expect(calls.sent).toHaveLength(1);
    await deliver(echo('56933330005', 'wamid.bot.1'));
    await deliver(incoming('56933330005', 'wamid.in.5'));
    expect(calls.sent).toHaveLength(2);
  });
});
