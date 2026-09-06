import { describe, it, expect } from 'vitest';
import { ApiError, sendError, sendSuccess, parseJSON, fetchWithTimeout } from '../../src/lib/errors.js';

describe('sendError', () => {
  it('uses the error status and message', async () => {
    const res = sendError(new ApiError('algo salió mal', 418));
    expect(res.status).toBe(418);
    const body = await res.json();
    expect(body).toEqual({ error: 'algo salió mal', status: 418 });
  });

  it('defaults to 500 when the error has no status', async () => {
    const res = sendError(new Error('boom'));
    expect(res.status).toBe(500);
  });

  it('redacts Bearer tokens from the client-facing message', async () => {
    const res = sendError(new ApiError('failed: Authorization Bearer sk-abc123XYZ', 500));
    const body = await res.json();
    expect(body.error).not.toContain('sk-abc123XYZ');
    expect(body.error).toContain('[REDACTED_TOKEN]');
  });

  it('redacts api keys from the client-facing message', async () => {
    const res = sendError(new ApiError('bad request: api_key=super-secret-value', 500));
    const body = await res.json();
    expect(body.error).not.toContain('super-secret-value');
    expect(body.error).toContain('[REDACTED_KEY]');
  });

  it('redacts email addresses from the client-facing message', async () => {
    const res = sendError(new ApiError('duplicate for cliente@empresa.cl', 500));
    const body = await res.json();
    expect(body.error).not.toContain('cliente@empresa.cl');
    expect(body.error).toContain('[REDACTED_EMAIL]');
  });

  it('sets the X-Error-Status header', () => {
    const res = sendError(new ApiError('nope', 403));
    expect(res.headers.get('X-Error-Status')).toBe('403');
  });
});

describe('sendSuccess', () => {
  it('defaults to status 200 with the given JSON body', async () => {
    const res = sendSuccess({ ok: true });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it('accepts a custom status', () => {
    const res = sendSuccess({ created: true }, 201);
    expect(res.status).toBe(201);
  });

  it('marks the response as non-cacheable', () => {
    const res = sendSuccess({});
    expect(res.headers.get('Cache-Control')).toContain('no-store');
  });
});

describe('parseJSON', () => {
  it('parses a valid JSON request body', async () => {
    const req = new Request('https://example.com', {
      method: 'POST',
      body: JSON.stringify({ a: 1 }),
    });
    await expect(parseJSON(req)).resolves.toEqual({ a: 1 });
  });

  it('throws a 400 ApiError on invalid JSON', async () => {
    const req = new Request('https://example.com', {
      method: 'POST',
      body: '{not valid json',
    });
    await expect(parseJSON(req)).rejects.toMatchObject({
      name: 'ApiError',
      status: 400,
    });
  });
});

describe('fetchWithTimeout', () => {
  it('returns the response when it completes before the timeout', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => new Response('ok', { status: 200 });
    try {
      const res = await fetchWithTimeout('https://example.com', {}, 5000);
      expect(res).toBeInstanceOf(Response);
      expect(res.status).toBe(200);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('raises a 504 ApiError when the request is aborted for timing out', async () => {
    // A hanging upstream that actually honors the AbortSignal, same as real
    // fetch would — a plain never-resolving Promise would ignore abort()
    // entirely and just hang the test instead of exercising the timeout path.
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (url, opts) =>
      new Promise((resolve, reject) => {
        opts?.signal?.addEventListener('abort', () => {
          const err = new Error('The operation was aborted.');
          err.name = 'AbortError';
          reject(err);
        });
      });
    try {
      await expect(fetchWithTimeout('https://example.com', {}, 20)).rejects.toMatchObject({
        name: 'ApiError',
        status: 504,
      });
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
