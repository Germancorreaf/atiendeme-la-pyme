import { describe, it, expect, afterEach, vi } from 'vitest';
import { env as workerEnv } from 'cloudflare:test';
import { onRequestPost } from '../../src/api/whatsapp.js';
import { computeHmacSha256Hex } from '../../src/lib/metaSignature.js';

// Notas de voz, imágenes, documentos…: el bot no los lee, pero la persona no
// puede quedarse sin respuesta y el dueño tiene que ver que escribieron.

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
  const request = new Request('https://example.com/webhook/whatsapp', { method: 'POST', body, headers: { 'Content-Type': 'application/json', 'X-Hub-Signature-256': sig } });
  const env = { META_APP_SECRET: 'test-app-secret', WHATSAPP_ACCESS_TOKEN: 'tok', SUPABASE_URL: 'https://supabase.test', SUPABASE_SERVICE_KEY: 'k', ANTHROPIC_API_KEY: 'a', RATE_LIMIT_KV: workerEnv.RATE_LIMIT_KV };
  const waited = [];
  const res = await onRequestPost({ request, env, ctx: { waitUntil: (p) => waited.push(p) } });
  expect(res.status).toBe(200);
  await Promise.all(waited);
}

const incoming = (message) => ({ field: 'messages', value: {
  metadata: { phone_number_id: 'PNM' }, contacts: [{ profile: { name: 'Ana' } }], messages: [message],
} });
const saved = (calls) => calls.rpc.flatMap((r) => r.p_messages).map((m) => [m.role, m.content]);

afterEach(() => vi.unstubAllGlobals());

describe('mensajes que no son texto', () => {
  it('a una nota de voz le pide que escriba, sin llamar a Claude, y la deja anotada', async () => {
    const calls = stubNetwork();
    await deliver(incoming({ id: 'wamid.m1', type: 'audio', from: '56944440001', audio: { id: 'a1', voice: true } }));
    expect(calls.claude).toBe(0);
    expect(calls.sent).toHaveLength(1);
    expect(calls.sent[0]).toContain('nota de voz');
    expect(calls.sent[0]).toContain('asistente de IA');
    const rows = saved(calls);
    expect(rows[0]).toEqual(['user', '[Mensaje no textual: nota de voz]']);
    expect(rows[1][0]).toBe('assistant');
  });

  it('nombra cada tipo: imagen, documento, ubicación', async () => {
    const calls = stubNetwork();
    await deliver(incoming({ id: 'wamid.m2', type: 'image', from: '56944440002', image: { id: 'i1' } }));
    await deliver(incoming({ id: 'wamid.m3', type: 'document', from: '56944440003', document: { id: 'd1' } }));
    await deliver(incoming({ id: 'wamid.m4', type: 'location', from: '56944440004', location: { latitude: 1, longitude: 2 } }));
    expect(calls.sent.map((t) => t.match(/Recibí tu ([^,]+),/)[1])).toEqual(['imagen', 'documento', 'ubicación']);
  });

  it('varias fotos seguidas: una sola respuesta, pero todas quedan anotadas', async () => {
    const calls = stubNetwork();
    await deliver(incoming({ id: 'wamid.m5', type: 'image', from: '56944440005', image: { id: 'i1' } }));
    await deliver(incoming({ id: 'wamid.m6', type: 'image', from: '56944440005', image: { id: 'i2' } }));
    expect(calls.sent).toHaveLength(1);
    expect(saved(calls).filter(([role]) => role === 'user')).toHaveLength(2);
  });

  it('el mismo webhook entregado dos veces se procesa una vez', async () => {
    const calls = stubNetwork();
    const msg = incoming({ id: 'wamid.m7', type: 'audio', from: '56944440006', audio: { id: 'a1' } });
    await deliver(msg);
    await deliver(msg);
    expect(calls.sent).toHaveLength(1);
    expect(calls.sent[0]).toContain('Recibí tu audio');
  });

  it('stickers y reacciones se ignoran: ni respuesta ni registro', async () => {
    const calls = stubNetwork();
    await deliver(incoming({ id: 'wamid.m8', type: 'sticker', from: '56944440007', sticker: { id: 's1' } }));
    await deliver(incoming({ id: 'wamid.m9', type: 'reaction', from: '56944440007', reaction: { emoji: '👍' } }));
    expect(calls.sent).toEqual([]);
    expect(calls.rpc).toEqual([]);
  });

  it('si el dueño está atendiendo desde su celular, solo se anota', async () => {
    const calls = stubNetwork();
    await deliver({ field: 'smb_message_echoes', value: {
      metadata: { phone_number_id: 'PNM' },
      message_echoes: [{ id: 'wamid.owner.m1', from: '56922053594', to: '56944440008', type: 'text', text: { body: 'Yo le respondo' } }],
    } });
    calls.rpc.length = 0;
    await deliver(incoming({ id: 'wamid.m10', type: 'audio', from: '56944440008', audio: { id: 'a1', voice: true } }));
    expect(calls.sent).toEqual([]);
    expect(saved(calls)).toEqual([['user', '[Mensaje no textual: nota de voz]']]);
  });
});
