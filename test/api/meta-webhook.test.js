import { describe, it, expect } from 'vitest';
import { env as workerEnv } from 'cloudflare:test';
import { onRequestGet, onRequestPost } from '../../src/api/meta-webhook.js';

const APP_SECRET = 'test-meta-app-secret';
const VERIFY_TOKEN = 'test-verify-token';

const baseEnv = {
  META_APP_SECRET: APP_SECRET,
  META_VERIFY_TOKEN: VERIFY_TOKEN,
  RATE_LIMIT_KV: workerEnv.RATE_LIMIT_KV,
};

async function signBody(body) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(APP_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body));
  const hex = [...new Uint8Array(signature)].map((b) => b.toString(16).padStart(2, '0')).join('');
  return `sha256=${hex}`;
}

function verifyRequest(params) {
  const url = new URL('https://example.com/webhook/meta');
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return new Request(url.toString());
}

describe('GET /webhook/meta (verify challenge)', () => {
  it('echoes the challenge when mode=subscribe and the verify token matches', async () => {
    const req = verifyRequest({ 'hub.mode': 'subscribe', 'hub.verify_token': VERIFY_TOKEN, 'hub.challenge': 'abc123' });
    const res = await onRequestGet({ request: req, env: baseEnv });
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('abc123');
  });

  it('rejects when the verify token does not match', async () => {
    const req = verifyRequest({ 'hub.mode': 'subscribe', 'hub.verify_token': 'wrong', 'hub.challenge': 'abc123' });
    const res = await onRequestGet({ request: req, env: baseEnv });
    expect(res.status).toBe(403);
  });

  it('rejects when META_VERIFY_TOKEN is not configured', async () => {
    const req = verifyRequest({ 'hub.mode': 'subscribe', 'hub.verify_token': VERIFY_TOKEN, 'hub.challenge': 'abc123' });
    const res = await onRequestGet({ request: req, env: {} });
    expect(res.status).toBe(403);
  });
});

describe('POST /webhook/meta (signature validation)', () => {
  it('rejects a request with no X-Hub-Signature-256 header', async () => {
    const body = JSON.stringify({ object: 'page', entry: [] });
    const req = new Request('https://example.com/webhook/meta', { method: 'POST', body });
    const res = await onRequestPost({ request: req, env: baseEnv });
    expect(res.status).toBe(403);
  });

  it('rejects a request with a wrong signature', async () => {
    const body = JSON.stringify({ object: 'page', entry: [] });
    const req = new Request('https://example.com/webhook/meta', {
      method: 'POST',
      body,
      headers: { 'X-Hub-Signature-256': 'sha256=' + '0'.repeat(64) },
    });
    const res = await onRequestPost({ request: req, env: baseEnv });
    expect(res.status).toBe(403);
  });

  it('rejects when META_APP_SECRET is not configured', async () => {
    const body = JSON.stringify({ object: 'page', entry: [] });
    const req = new Request('https://example.com/webhook/meta', {
      method: 'POST',
      body,
      headers: { 'X-Hub-Signature-256': 'sha256=' + '0'.repeat(64) },
    });
    const res = await onRequestPost({ request: req, env: {} });
    expect(res.status).toBe(403);
  });

  it('accepts a correctly signed payload and processes it in the background via ctx.waitUntil', async () => {
    const body = JSON.stringify({
      object: 'instagram',
      entry: [
        {
          id: 'ig-business-account-id',
          messaging: [
            {
              sender: { id: '123456789' },
              recipient: { id: 'ig-business-account-id' },
              message: { mid: 'mid.123', text: 'Holaa' },
            },
          ],
        },
      ],
    });
    const signature = await signBody(body);
    const req = new Request('https://example.com/webhook/meta', {
      method: 'POST',
      body,
      headers: { 'X-Hub-Signature-256': signature },
    });

    const waited = [];
    const ctx = { waitUntil: (p) => waited.push(p) };
    const res = await onRequestPost({ request: req, env: baseEnv, ctx });
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('EVENT_RECEIVED');
    // Sin SUPABASE_URL configurado, el lookup de conexión resuelve a null y el
    // procesamiento en segundo plano no debe lanzar una excepción no manejada.
    expect(waited).toHaveLength(1);
    await expect(waited[0]).resolves.toBeUndefined();
  });

  it('ignores echo messages without ever needing a signature bypass', async () => {
    const body = JSON.stringify({
      object: 'page',
      entry: [
        {
          id: 'page-id',
          messaging: [{ sender: { id: '123456789' }, message: { is_echo: true, mid: 'mid.echo', text: 'hola' } }],
        },
      ],
    });
    const signature = await signBody(body);
    const req = new Request('https://example.com/webhook/meta', {
      method: 'POST',
      body,
      headers: { 'X-Hub-Signature-256': signature },
    });
    const res = await onRequestPost({ request: req, env: baseEnv });
    expect(res.status).toBe(200);
  });
});
