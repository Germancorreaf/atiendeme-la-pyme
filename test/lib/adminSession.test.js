import { describe, it, expect, vi } from 'vitest';
import { checkSessionAuth, createSessionCookie, clearSessionCookie, SESSION_COOKIE_NAME } from '../../src/lib/adminSession.js';

function requestWithCookie(cookieHeader) {
  return new Request('https://example.com/admin', {
    headers: cookieHeader ? { Cookie: cookieHeader } : {},
  });
}

describe('createSessionCookie + checkSessionAuth', () => {
  it('accepts a freshly created session cookie', async () => {
    const cookieHeader = await createSessionCookie('super-secret');
    // Set-Cookie is "name=value; HttpOnly; ..." — extract just the "name=value" part
    // the way a browser would send it back in a Cookie request header.
    const cookiePair = cookieHeader.split(';')[0];
    const req = requestWithCookie(cookiePair);
    expect(await checkSessionAuth(req, { ADMIN_SESSION_SECRET: 'super-secret' })).toBe(true);
  });

  it('rejects when there is no cookie at all', async () => {
    const req = requestWithCookie(null);
    expect(await checkSessionAuth(req, { ADMIN_SESSION_SECRET: 'super-secret' })).toBe(false);
  });

  it('rejects when the secret used to verify differs from the one used to sign', async () => {
    const cookieHeader = await createSessionCookie('secret-a');
    const cookiePair = cookieHeader.split(';')[0];
    const req = requestWithCookie(cookiePair);
    expect(await checkSessionAuth(req, { ADMIN_SESSION_SECRET: 'secret-b' })).toBe(false);
  });

  it('rejects a tampered payload even if the signature format still looks valid', async () => {
    const cookieHeader = await createSessionCookie('super-secret');
    const cookiePair = cookieHeader.split(';')[0];
    const [name, token] = cookiePair.split('=');
    const [, signature] = token.split('.');
    const tampered = `${name}=tampered-payload.${signature}`;
    const req = requestWithCookie(tampered);
    expect(await checkSessionAuth(req, { ADMIN_SESSION_SECRET: 'super-secret' })).toBe(false);
  });

  it('rejects a malformed cookie value without a signature separator', async () => {
    const req = requestWithCookie(`${SESSION_COOKIE_NAME}=not-a-valid-token`);
    expect(await checkSessionAuth(req, { ADMIN_SESSION_SECRET: 'super-secret' })).toBe(false);
  });

  it('rejects when ADMIN_SESSION_SECRET is not configured', async () => {
    const cookieHeader = await createSessionCookie('super-secret');
    const cookiePair = cookieHeader.split(';')[0];
    const req = requestWithCookie(cookiePair);
    expect(await checkSessionAuth(req, {})).toBe(false);
  });

  it('rejects an expired session', async () => {
    vi.useFakeTimers();
    try {
      const cookieHeader = await createSessionCookie('super-secret');
      const cookiePair = cookieHeader.split(';')[0];
      vi.advanceTimersByTime(8 * 24 * 60 * 60 * 1000); // 8 días > TTL de 7 días
      const req = requestWithCookie(cookiePair);
      expect(await checkSessionAuth(req, { ADMIN_SESSION_SECRET: 'super-secret' })).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it('sets HttpOnly, Secure and SameSite=Lax on the session cookie', async () => {
    const cookieHeader = await createSessionCookie('super-secret');
    expect(cookieHeader).toContain('HttpOnly');
    expect(cookieHeader).toContain('Secure');
    expect(cookieHeader).toContain('SameSite=Lax');
  });
});

describe('clearSessionCookie', () => {
  it('produces a cookie header that expires immediately', () => {
    const header = clearSessionCookie();
    expect(header).toContain(`${SESSION_COOKIE_NAME}=;`);
    expect(header).toContain('Max-Age=0');
  });
});
