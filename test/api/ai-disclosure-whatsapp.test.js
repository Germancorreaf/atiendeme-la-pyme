import { describe, it, expect, afterEach, vi } from 'vitest';
import { env as workerEnv } from 'cloudflare:test';
import { onRequestPost } from '../../src/api/whatsapp.js';
import { AI_DISCLOSURE_LINE } from '../../src/lib/dominga-prompt.js';

const NOW = Date.now();
const ts = (minAgo) => new Date(NOW - minAgo * 60000).toISOString();

function stubNetwork({ storedMessages, modelReply }) {
  const sent = [];
  vi.stubGlobal('fetch', vi.fn(async (url, init = {}) => {
    const u = String(url);
    const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
    if (u.includes('/rest/v1/whatsapp_connections')) return json([{ phone_number_id: 'PN1', access_token: 'tok' }]);
    if (u.includes('/rest/v1/chat_sessions') && (!init.method || init.method === 'GET')) return json([{ session_id: 's', messages: storedMessages }]);
    if (u.includes('/rest/v1/chat_sessions')) return json({});
    if (u.includes('api.anthropic.com')) return json({ content: [{ type: 'text', text: modelReply }] });
    if (u.includes('/messages') && init.method === 'POST') {
      sent.push(JSON.parse(init.body).text.body);
      return json({ messages: [{ id: 'w' }] });
    }
    return json({});
  }));
  return sent;
}

async function deliver(from) {
  const body = JSON.stringify({
    entry: [{ changes: [{ value: {
      metadata: { phone_number_id: 'PN1' },
      contacts: [{ profile: { name: 'Cliente' } }],
      messages: [{ type: 'text', from, text: { body: 'Hola, ¿cómo funciona el servicio?' } }],
    } }] }],
  });
  const req = new Request('https://example.com/webhook/whatsapp', { method: 'POST', body, headers: { 'Content-Type': 'application/json' } });
  const env = { SUPABASE_URL: 'https://supabase.test', SUPABASE_SERVICE_KEY: 'k', ANTHROPIC_API_KEY: 'a', RATE_LIMIT_KV: workerEnv.RATE_LIMIT_KV };
  const res = await onRequestPost({ request: req, env, ctx: { waitUntil: () => {} } });
  expect(res.status).toBe(200);
}

afterEach(() => vi.unstubAllGlobals());

describe('divulgación de IA forzada en WhatsApp', () => {
  it('conversación existente que nunca se identificó -> la respuesta lleva la línea', async () => {
    const modelReply = 'Buena pregunta. Instalamos un chatbot IA en tu sitio web.';
    const sent = stubNetwork({
      storedMessages: [
        { role: 'user', content: 'Hola', timestamp: ts(30) },
        { role: 'assistant', content: 'Estimado/a, un gusto saludarte.', timestamp: ts(29) },
      ],
      modelReply,
    });
    await deliver('56911112221');
    expect(sent).toEqual([`${AI_DISCLOSURE_LINE}\n\n${modelReply}`]);
  });

  it('conversación ya identificada y reciente -> no se repite', async () => {
    const sent = stubNetwork({
      storedMessages: [{ role: 'assistant', content: 'Soy Dominga, asistente de IA de Atiéndeme la Pyme.', timestamp: ts(5) }],
      modelReply: 'Planes desde $149.990.',
    });
    await deliver('56911112222');
    expect(sent).toEqual(['Planes desde $149.990.']);
  });

  it('conversación nueva -> saludo fijo con IA', async () => {
    const sent = stubNetwork({ storedMessages: [], modelReply: 'no se usa' });
    await deliver('56911112223');
    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatch(/asistente de IA/i);
  });
});
