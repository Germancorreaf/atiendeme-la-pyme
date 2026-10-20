import { describe, it, expect, afterEach, vi } from 'vitest';
import { env as workerEnv } from 'cloudflare:test';
import { onRequestPost } from '../../src/api/whatsapp.js';
import { computeHmacSha256Hex } from '../../src/lib/metaSignature.js';
import { AI_DISCLOSURE_LINE } from '../../src/lib/dominga-prompt.js';

afterEach(() => vi.unstubAllGlobals());

describe('primer mensaje por WhatsApp', () => {
  it('se le pasa a Claude (no un saludo genérico) y lleva la divulgación de IA', async () => {
    const sent = [];
    const modelInputs = [];
    vi.stubGlobal('fetch', vi.fn(async (url, init = {}) => {
      const u = String(url);
      const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { 'Content-Type': 'application/json' } });
      if (u.includes('/rest/v1/whatsapp_connections')) return json([{ phone_number_id: 'PN1', access_token: 'tok' }]);
      if (u.includes('/rest/v1/chat_sessions') && (!init.method || init.method === 'GET')) return json([]);
      if (u.includes('/rest/v1/chat_sessions')) return json({});
      if (u.includes('api.anthropic.com')) {
        modelInputs.push(JSON.parse(init.body).messages);
        return json({ content: [{ type: 'text', text: 'Sí, mañana a las 10:00 hay hora.' }] });
      }
      if (u.includes('/messages') && init.method === 'POST') { sent.push(JSON.parse(init.body).text.body); return json({ messages: [{ id: 'w' }] }); }
      return json({});
    }));
    const body = JSON.stringify({ entry: [{ changes: [{ value: {
      metadata: { phone_number_id: 'PN1' },
      messages: [{ type: 'text', from: '56911113333', text: { body: '¿Tienen hora mañana a las 10?' } }],
    } }] }] });
    const sig = 'sha256=' + await computeHmacSha256Hex('s', body);
    const req = new Request('https://example.com/webhook/whatsapp', { method: 'POST', body, headers: { 'X-Hub-Signature-256': sig } });
    const env = { META_APP_SECRET: 's', SUPABASE_URL: 'https://supabase.test', SUPABASE_SERVICE_KEY: 'k', ANTHROPIC_API_KEY: 'a', RATE_LIMIT_KV: workerEnv.RATE_LIMIT_KV };
    const waited = [];
    const res = await onRequestPost({ request: req, env, ctx: { waitUntil: (p) => waited.push(p) } });
    expect(res.status).toBe(200);
    await Promise.all(waited);
    expect(modelInputs.length).toBe(1);
    expect(JSON.stringify(modelInputs[0])).toContain('¿Tienen hora mañana a las 10?');
    expect(sent).toEqual([`${AI_DISCLOSURE_LINE}\n\nSí, mañana a las 10:00 hay hora.`]);
  });
});
