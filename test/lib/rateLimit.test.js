import { describe, it, expect, beforeEach } from 'vitest';
import { env } from 'cloudflare:test';
import {
  checkRateLimit,
  checkBurstLimit,
  checkAllLimits,
  resetRateLimit,
} from '../../src/lib/rateLimit.js';

// Each test gets a unique identifier so entries from one test never leak
// into another, even though they share the same real KV namespace instance.
let counter = 0;
function uniqueId(prefix) {
  counter += 1;
  return `${prefix}-${Date.now()}-${counter}`;
}

describe('checkRateLimit', () => {
  it('allows requests under the limit', async () => {
    const id = uniqueId('rl-under');
    const result = await checkRateLimit(id, env.RATE_LIMIT_KV, 3, 60);
    expect(result.allowed).toBe(true);
  });

  it('blocks once the max request count is reached', async () => {
    const id = uniqueId('rl-block');
    await checkRateLimit(id, env.RATE_LIMIT_KV, 2, 60);
    await checkRateLimit(id, env.RATE_LIMIT_KV, 2, 60);
    const third = await checkRateLimit(id, env.RATE_LIMIT_KV, 2, 60);
    expect(third.allowed).toBe(false);
    expect(third.limitExceeded).toBe(true);
    expect(third.retryAfter).toBeGreaterThan(0);
  });

  it('resets once the window has expired', async () => {
    const id = uniqueId('rl-expired');
    const key = `rl:${id}`;
    // Seed an already-expired window directly, instead of waiting out a
    // real window in the test — same effect, no added test latency.
    await env.RATE_LIMIT_KV.put(
      key,
      JSON.stringify({ count: 99, resetAt: Date.now() - 1000, requests: [] }),
      { expirationTtl: 60 }
    );
    const result = await checkRateLimit(id, env.RATE_LIMIT_KV, 2, 60);
    expect(result.allowed).toBe(true);
  });

  it('fails open when no KV namespace is provided', async () => {
    const result = await checkRateLimit(uniqueId('rl-no-kv'), undefined, 1, 60);
    expect(result.allowed).toBe(true);
  });
});

describe('checkBurstLimit', () => {
  it('allows requests under the burst limit', async () => {
    const id = uniqueId('burst-under');
    const result = await checkBurstLimit(id, env.RATE_LIMIT_KV, 3, 5);
    expect(result.allowed).toBe(true);
  });

  it('blocks once the burst limit is reached within the window', async () => {
    const id = uniqueId('burst-block');
    await checkBurstLimit(id, env.RATE_LIMIT_KV, 2, 5);
    await checkBurstLimit(id, env.RATE_LIMIT_KV, 2, 5);
    const third = await checkBurstLimit(id, env.RATE_LIMIT_KV, 2, 5);
    expect(third.allowed).toBe(false);
    expect(third.burstDetected).toBe(true);
  });

  it('ignores requests older than the burst window', async () => {
    const id = uniqueId('burst-old');
    const key = `burst:${id}`;
    await env.RATE_LIMIT_KV.put(
      key,
      JSON.stringify({ requests: [Date.now() - 60_000, Date.now() - 50_000] }),
      { expirationTtl: 60 }
    );
    const result = await checkBurstLimit(id, env.RATE_LIMIT_KV, 2, 5);
    expect(result.allowed).toBe(true);
  });
});

describe('checkAllLimits', () => {
  it('allows a fresh identifier under both limits', async () => {
    const id = uniqueId('all-ok');
    const result = await checkAllLimits(id, env.RATE_LIMIT_KV, {
      maxRequests: 5,
      windowSeconds: 60,
      maxBurstRequests: 5,
      burstWindowSeconds: 5,
    });
    expect(result.allowed).toBe(true);
  });

  it('surfaces the burst limit reason when burst is exceeded first', async () => {
    const id = uniqueId('all-burst');
    const opts = { maxRequests: 100, windowSeconds: 60, maxBurstRequests: 1, burstWindowSeconds: 5 };
    await checkAllLimits(id, env.RATE_LIMIT_KV, opts);
    const second = await checkAllLimits(id, env.RATE_LIMIT_KV, opts);
    expect(second.allowed).toBe(false);
    expect(second.reason).toBe('Burst limit exceeded');
  });
});

describe('resetRateLimit', () => {
  it('clears both the rate and burst keys for an identifier', async () => {
    const id = uniqueId('reset');
    await checkRateLimit(id, env.RATE_LIMIT_KV, 1, 60);
    await checkBurstLimit(id, env.RATE_LIMIT_KV, 1, 5);

    await resetRateLimit(id, env.RATE_LIMIT_KV);

    expect(await env.RATE_LIMIT_KV.get(`rl:${id}`)).toBeNull();
    expect(await env.RATE_LIMIT_KV.get(`burst:${id}`)).toBeNull();
  });
});
