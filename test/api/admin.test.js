import { describe, it, expect } from 'vitest';
import { env as workerEnv } from 'cloudflare:test';
import { onRequestGetAdmin, onRequestPostAdminLogin, onRequestPostAdminLogout } from '../../src/api/admin.js';
import { createSessionCookie } from '../../src/lib/adminSession.js';

const baseEnv = {
  ADMIN_DASHBOARD_PASSWORD: 'correct-horse-battery-staple',
  ADMIN_SESSION_SECRET: 'test-session-signing-secret',
  RATE_LIMIT_KV: workerEnv.RATE_LIMIT_KV,
};

// Cada llamada usa una IP distinta: el rate limiter de fuerza bruta del
// login comparte el mismo KV entre tests, así que reusar una sola IP haría
// que un test dispare el límite de ráfaga que otro test necesita medir.
let ipCounter = 0;
function loginRequest(password, { next } = {}) {
  ipCounter += 1;
  const form = new URLSearchParams();
  form.set('password', password);
  if (next) form.set('next', next);
  return new Request('https://example.com/admin/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'CF-Connecting-IP': `203.0.113.${ipCounter}`,
    },
    body: form.toString(),
  });
}

function getAdminRequest(cookiePair) {
  return new Request('https://example.com/admin', {
    headers: cookiePair ? { Cookie: cookiePair } : {},
  });
}

function extractCookiePair(setCookieHeader) {
  return setCookieHeader.split(';')[0];
}

describe('GET /admin', () => {
  it('shows the login page when there is no session cookie', async () => {
    const res = await onRequestGetAdmin({ request: getAdminRequest(), env: baseEnv });
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('Contraseña');
    expect(html).toContain('action="/admin/login"');
  });

  it('serves the dashboard when a valid session cookie is present', async () => {
    const cookieHeader = await createSessionCookie(baseEnv.ADMIN_SESSION_SECRET);
    const res = await onRequestGetAdmin({
      request: getAdminRequest(extractCookiePair(cookieHeader)),
      env: baseEnv,
    });
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('Dashboard');
  });

  it('shows the login page again when the session cookie is invalid', async () => {
    const res = await onRequestGetAdmin({
      request: getAdminRequest(`atp_admin_session=bogus.signature`),
      env: baseEnv,
    });
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('action="/admin/login"');
  });
});

describe('POST /admin/login', () => {
  it('rejects the wrong password and re-shows the login form with an error', async () => {
    const res = await onRequestPostAdminLogin({ request: loginRequest('wrong-password'), env: baseEnv });
    expect(res.status).toBe(401);
    const html = await res.text();
    expect(html).toContain('incorrecta');
    expect(res.headers.get('Set-Cookie')).toBeNull();
  });

  it('sets a session cookie and redirects on the correct password', async () => {
    const res = await onRequestPostAdminLogin({
      request: loginRequest(baseEnv.ADMIN_DASHBOARD_PASSWORD),
      env: baseEnv,
    });
    expect(res.status).toBe(303);
    expect(res.headers.get('Location')).toBe('/admin');
    const setCookie = res.headers.get('Set-Cookie');
    expect(setCookie).toContain('HttpOnly');
    expect(setCookie).toContain('Secure');
  });

  it('redirects to a same-origin "next" path after a correct login', async () => {
    const res = await onRequestPostAdminLogin({
      request: loginRequest(baseEnv.ADMIN_DASHBOARD_PASSWORD, { next: '/admin#conversaciones' }),
      env: baseEnv,
    });
    expect(res.headers.get('Location')).toBe('/admin#conversaciones');
  });

  it('ignores an off-site "next" value and falls back to /admin', async () => {
    const res = await onRequestPostAdminLogin({
      request: loginRequest(baseEnv.ADMIN_DASHBOARD_PASSWORD, { next: 'https://evil.example.com' }),
      env: baseEnv,
    });
    expect(res.headers.get('Location')).toBe('/admin');
  });

  it('fails closed (500) when the server secrets are not configured', async () => {
    const res = await onRequestPostAdminLogin({
      request: loginRequest('anything'),
      env: { RATE_LIMIT_KV: workerEnv.RATE_LIMIT_KV },
    });
    expect(res.status).toBe(500);
  });

  it('a login cookie from onRequestPostAdminLogin is accepted by onRequestGetAdmin', async () => {
    const loginRes = await onRequestPostAdminLogin({
      request: loginRequest(baseEnv.ADMIN_DASHBOARD_PASSWORD),
      env: baseEnv,
    });
    const cookiePair = extractCookiePair(loginRes.headers.get('Set-Cookie'));

    const dashboardRes = await onRequestGetAdmin({ request: getAdminRequest(cookiePair), env: baseEnv });
    expect(dashboardRes.status).toBe(200);
    expect(await dashboardRes.text()).toContain('Dashboard');
  });
});

describe('POST /admin/logout', () => {
  it('clears the session cookie and redirects to /admin', async () => {
    const res = await onRequestPostAdminLogout();
    expect(res.status).toBe(303);
    expect(res.headers.get('Location')).toBe('/admin');
    expect(res.headers.get('Set-Cookie')).toContain('Max-Age=0');
  });

  it('a cleared cookie is no longer accepted by onRequestGetAdmin', async () => {
    const cookieHeader = await createSessionCookie(baseEnv.ADMIN_SESSION_SECRET);
    const validPair = extractCookiePair(cookieHeader);
    expect((await onRequestGetAdmin({ request: getAdminRequest(validPair), env: baseEnv })).status).toBe(200);

    const logoutRes = await onRequestPostAdminLogout();
    const clearedPair = extractCookiePair(logoutRes.headers.get('Set-Cookie'));

    const res = await onRequestGetAdmin({ request: getAdminRequest(clearedPair), env: baseEnv });
    const html = await res.text();
    expect(html).toContain('action="/admin/login"');
  });
});
