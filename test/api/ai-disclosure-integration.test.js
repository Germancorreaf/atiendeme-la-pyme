import { describe, it, expect, afterEach, vi } from 'vitest';
import { env as workerEnv } from 'cloudflare:test';
import { onRequestPost } from '../../src/api/meta-webhook.js';
import { AI_DISCLOSURE_LINE } from '../../src/lib/dominga-prompt.js';

const APP_SECRET = 'test-meta-app-secret';
const SB = 'https://supabase.test';
const NOW = Date.now();
const ts = (minAgo) => new Date(NOW - minAgo * 60000).toISOString();

async function sign(body) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(APP_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body));
  return 'sha256=' + [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Simula Supabase + Anthropic + Graph API y devuelve lo que se le envió al cliente.
function stubNetwork({ storedMessages, modelReply }) {
  const sent = [];
  vi.stubGlobal('fetch', vi.fn(async (url, init = {}) => {
    const u = String(url);
    const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
    if (u.includes('/rest/v1/meta_connections')) {
      return json([{ page_id: 'PAGE1', ig_business_account_id: 'IG1', page_access_token: 'tok' }]);
    }
    if (u.includes('/rest/v1/chat_sessions') && (!init.method || init.method === 'GET')) {
      return json([{ session_id: 's', messages: storedMessages }]);
    }
    if (u.includes('/rest/v1/chat_sessions')) return json({});
    if (u.includes('api.anthropic.com')) return json({ content: [{ type: 'text', text: modelReply }] });
    if (u.includes('/messages') && init.method === 'POST') {
      sent.push(JSON.parse(init.body).message.text);
      return json({ message_id: 'm' });
    }
    return json({}); // fetchProfile u otros
  }));
  return sent;
}

async function deliver(object, entryId, senderId, mid) {
  const body = JSON.stringify({ object, entry: [{ id: entryId, messaging: [{ sender: { id: senderId }, message: { mid, text: 'Hola, ¿cómo funciona el servicio?' } }] }] });
  const req = new Request('https://example.com/webhook/meta', { method: 'POST', body, headers: { 'X-Hub-Signature-256': await sign(body) } });
  const waited = [];
  const env = { META_APP_SECRET: APP_SECRET, SUPABASE_URL: SB, SUPABASE_SERVICE_KEY: 'k', ANTHROPIC_API_KEY: 'a', RATE_LIMIT_KV: workerEnv.RATE_LIMIT_KV };
  const res = await onRequestPost({ request: req, env, ctx: { waitUntil: (p) => waited.push(p) } });
  expect(res.status).toBe(200);
  await Promise.all(waited);
}

afterEach(() => vi.unstubAllGlobals());

const legacyHistory = [
  { role: 'user', content: 'Hola', timestamp: ts(30) },
  { role: 'assistant', content: '¡Buenas tardes! Cuéntame, ¿qué necesitas?', timestamp: ts(29) },
];
const modelWithoutDisclosure = 'Buena pregunta. Instalamos un chatbot IA en tu sitio web. El bot responde al tiro.';

describe('divulgación de IA forzada en el flujo real del webhook', () => {
  it('Messenger: conversación existente que nunca se identificó -> la respuesta enviada lleva la línea', async () => {
    const sent = stubNetwork({ storedMessages: legacyHistory, modelReply: modelWithoutDisclosure });
    await deliver('page', 'PAGE1', '1234567890', 'mid.fb.1');
    expect(sent).toHaveLength(1);
    expect(sent[0]).toBe(`${AI_DISCLOSURE_LINE}\n\n${modelWithoutDisclosure}`);
  });

  it('Instagram: igual', async () => {
    const sent = stubNetwork({ storedMessages: legacyHistory, modelReply: modelWithoutDisclosure });
    await deliver('instagram', 'IG1', '9876543210', 'mid.ig.1');
    expect(sent).toHaveLength(1);
    expect(sent[0].startsWith(AI_DISCLOSURE_LINE)).toBe(true);
  });

  it('conversación ya identificada y reciente -> no se repite la línea', async () => {
    const history = [
      { role: 'assistant', content: 'Soy Dominga, asistente de IA de Atiéndeme la Pyme.', timestamp: ts(10) },
      { role: 'user', content: 'Cuánto cuesta', timestamp: ts(9) },
    ];
    const sent = stubNetwork({ storedMessages: history, modelReply: 'Planes desde $149.990.' });
    await deliver('page', 'PAGE1', '1234567891', 'mid.fb.2');
    expect(sent).toEqual(['Planes desde $149.990.']);
  });

  it('conversación nueva -> saludo fijo que ya se identifica como IA', async () => {
    const sent = stubNetwork({ storedMessages: [], modelReply: 'no se usa' });
    await deliver('page', 'PAGE1', '1234567892', 'mid.fb.3');
    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatch(/asistente de IA|tu asistente de IA/i);
  });
});
