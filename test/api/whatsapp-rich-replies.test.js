import { describe, it, expect, afterEach, vi } from 'vitest';
import { env as workerEnv } from 'cloudflare:test';
import { onRequestPost, buildInteractivePayload } from '../../src/api/whatsapp.js';
import { computeHmacSha256Hex } from '../../src/lib/metaSignature.js';

// WHATSAPP_RICH_REPLIES=1: un mensaje por globo y botones de respuesta rápida.
// Apagado (por defecto) sigue siendo un solo mensaje con "Opciones: …" en texto.

const MODEL_REPLY = 'Primer globo\n\nSegundo globo\n\nOPCIONES: Lunes | Martes';

function stubNetwork(modelReply = MODEL_REPLY) {
  const out = { payloads: [], claudeInput: [] };
  vi.stubGlobal('fetch', vi.fn(async (url, init = {}) => {
    const u = String(url);
    const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
    if (u.includes('/rest/v1/whatsapp_connections')) return json([]);
    if (u.includes('/rpc/append_chat_messages')) return json({});
    if (u.includes('/rest/v1/chat_sessions')) return json([{ session_id: 's', messages: [
      { role: 'assistant', content: 'Soy Dominga, asistente de IA de Atiéndeme la Pyme.', timestamp: new Date().toISOString() }
    ] }]);
    if (u.includes('api.anthropic.com')) {
      out.claudeInput.push(JSON.parse(init.body).messages.at(-1).content);
      return json({ content: [{ type: 'text', text: modelReply }] });
    }
    if (u.includes('/messages') && init.method === 'POST' && !init.body.includes('typing_indicator')) {
      out.payloads.push(JSON.parse(init.body));
      return json({ messages: [{ id: 'wamid.b' + out.payloads.length }] });
    }
    return json({});
  }));
  return out;
}

async function deliver(message, extraEnv = {}) {
  const body = JSON.stringify({ entry: [{ changes: [{ field: 'messages', value: {
    metadata: { phone_number_id: 'PNR' }, contacts: [{ profile: { name: 'Ana' } }], messages: [message],
  } }] }] });
  const sig = 'sha256=' + await computeHmacSha256Hex('test-app-secret', body);
  const req = new Request('https://example.com/webhook/whatsapp', { method: 'POST', body, headers: { 'Content-Type': 'application/json', 'X-Hub-Signature-256': sig } });
  const env = { META_APP_SECRET: 'test-app-secret', WHATSAPP_ACCESS_TOKEN: 'tok', SUPABASE_URL: 'https://supabase.test', SUPABASE_SERVICE_KEY: 'k', ANTHROPIC_API_KEY: 'a', RATE_LIMIT_KV: workerEnv.RATE_LIMIT_KV, ...extraEnv };
  const waited = [];
  const res = await onRequestPost({ request: req, env, ctx: { waitUntil: (p) => waited.push(p) } });
  expect(res.status).toBe(200);
  await Promise.all(waited);
}

const text = (id, from, body = 'Quiero una hora') => ({ id, type: 'text', from, text: { body } });
afterEach(() => vi.unstubAllGlobals());

describe('WhatsApp: globos y botones (WHATSAPP_RICH_REPLIES)', () => {
  it('apagado: un solo mensaje de texto con "Opciones: …"', async () => {
    const out = stubNetwork();
    await deliver(text('wamid.r.1', '56944440001'));
    expect(out.payloads).toHaveLength(1);
    expect(out.payloads[0].type).toBe('text');
    expect(out.payloads[0].text.body).toBe('Primer globo\n\nSegundo globo\n\nOpciones: Lunes · Martes');
  });

  it('encendido: un mensaje por globo y las opciones como botones en el último', async () => {
    const out = stubNetwork();
    await deliver(text('wamid.r.2', '56944440002'), { WHATSAPP_RICH_REPLIES: '1' });
    expect(out.payloads).toHaveLength(2);
    expect(out.payloads[0]).toMatchObject({ type: 'text', text: { body: 'Primer globo' } });
    expect(out.payloads[1].type).toBe('interactive');
    expect(out.payloads[1].interactive.body.text).toBe('Segundo globo');
    expect(out.payloads[1].interactive.action.buttons).toEqual([
      { type: 'reply', reply: { id: 'opt_1', title: 'Lunes' } },
      { type: 'reply', reply: { id: 'opt_2', title: 'Martes' } },
    ]);
  });

  it('encendido y sin opciones: solo mensajes de texto', async () => {
    const out = stubNetwork('Uno\n\nDos');
    await deliver(text('wamid.r.3', '56944440003'), { WHATSAPP_RICH_REPLIES: '1' });
    expect(out.payloads.map((p) => p.type)).toEqual(['text', 'text']);
  });

  it('lo que toca la persona (button_reply) se responde como si lo hubiera escrito', async () => {
    const out = stubNetwork('Anotado');
    await deliver({ id: 'wamid.r.4', type: 'interactive', from: '56944440004', interactive: { type: 'button_reply', button_reply: { id: 'opt_1', title: 'Lunes' } } });
    expect(out.claudeInput).toEqual(['Lunes']);
    expect(out.payloads).toHaveLength(1);
  });

  it('otros tipos (imagen, audio) se siguen ignorando', async () => {
    const out = stubNetwork();
    await deliver({ id: 'wamid.r.5', type: 'image', from: '56944440005', image: { id: 'x' } });
    expect(out.payloads).toEqual([]);
    expect(out.claudeInput).toEqual([]);
  });
});

describe('buildInteractivePayload', () => {
  it('respeta el límite de 1024 caracteres del cuerpo', () => {
    const p = buildInteractivePayload('5691', 'x'.repeat(2000), ['A']);
    expect(p.interactive.body.text).toHaveLength(1024);
    expect(p.to).toBe('5691');
  });
});
