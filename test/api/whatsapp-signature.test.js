import { describe, it, expect, afterEach, vi } from 'vitest';
import { env as workerEnv } from 'cloudflare:test';
import { onRequestPost } from '../../src/api/whatsapp.js';
import { computeHmacSha256Hex } from '../../src/lib/metaSignature.js';
import { isCrossSiteRequest } from '../../src/lib/adminSession.js';

const body = JSON.stringify({
  entry: [{ changes: [{ value: {
    metadata: { phone_number_id: 'PN1' },
    messages: [{ type: 'text', from: '56911112222', text: { body: 'hola' } }],
  } }] }],
});

function makeEnv() {
  return { META_APP_SECRET: 'secreto-meta', SUPABASE_URL: 'https://supabase.test', SUPABASE_SERVICE_KEY: 'k', ANTHROPIC_API_KEY: 'a', RATE_LIMIT_KV: workerEnv.RATE_LIMIT_KV };
}

afterEach(() => vi.unstubAllGlobals());

describe('POST /webhook/whatsapp — firma de Meta', () => {
  it('sin firma -> 403 y no llama a ninguna API externa', async () => {
    const fetchSpy = vi.fn(async () => new Response('{}'));
    vi.stubGlobal('fetch', fetchSpy);
    const req = new Request('https://example.com/webhook/whatsapp', { method: 'POST', body });
    const res = await onRequestPost({ request: req, env: makeEnv(), ctx: { waitUntil: () => {} } });
    expect(res.status).toBe(403);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('firma incorrecta -> 403', async () => {
    const fetchSpy = vi.fn(async () => new Response('{}'));
    vi.stubGlobal('fetch', fetchSpy);
    const req = new Request('https://example.com/webhook/whatsapp', {
      method: 'POST', body, headers: { 'X-Hub-Signature-256': 'sha256=' + '0'.repeat(64) },
    });
    const res = await onRequestPost({ request: req, env: makeEnv(), ctx: { waitUntil: () => {} } });
    expect(res.status).toBe(403);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('firma firmada con el secret equivocado -> 403', async () => {
    const fetchSpy = vi.fn(async () => new Response('{}'));
    vi.stubGlobal('fetch', fetchSpy);
    const sig = 'sha256=' + await computeHmacSha256Hex('otro-secret', body);
    const req = new Request('https://example.com/webhook/whatsapp', { method: 'POST', body, headers: { 'X-Hub-Signature-256': sig } });
    const res = await onRequestPost({ request: req, env: makeEnv(), ctx: { waitUntil: () => {} } });
    expect(res.status).toBe(403);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe('guardia contra borrado por link ajeno', () => {
  const mk = (site) => new Request('https://example.com/admin/meta/connections/delete?page_id=1', { headers: site ? { 'Sec-Fetch-Site': site } : {} });
  it('bloquea cross-site y same-site', () => {
    expect(isCrossSiteRequest(mk('cross-site'))).toBe(true);
    expect(isCrossSiteRequest(mk('same-site'))).toBe(true);
  });
  it('permite same-origin, navegación directa (none) y navegadores sin el header', () => {
    expect(isCrossSiteRequest(mk('same-origin'))).toBe(false);
    expect(isCrossSiteRequest(mk('none'))).toBe(false);
    expect(isCrossSiteRequest(mk(null))).toBe(false);
  });
});
