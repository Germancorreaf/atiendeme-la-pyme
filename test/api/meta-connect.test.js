import { describe, it, expect } from 'vitest';
import { onRequestGetConnect, onRequestGetCallback, onRequestGetConnectFacebook } from '../../src/api/meta-connect.js';
import { createSessionCookie } from '../../src/lib/adminSession.js';

const baseEnv = {
  ADMIN_SESSION_SECRET: 'test-session-signing-secret',
  META_APP_ID: 'test-app-id',
  META_APP_SECRET: 'test-app-secret',
  META_LOGIN_CONFIG_ID: 'test-login-config-id',
  INSTAGRAM_APP_ID: 'test-instagram-app-id',
  INSTAGRAM_APP_SECRET: 'test-instagram-app-secret',
};

async function sessionCookiePair() {
  const cookieHeader = await createSessionCookie(baseEnv.ADMIN_SESSION_SECRET);
  return cookieHeader.split(';')[0];
}

describe('GET /admin/meta/connect', () => {
  it('rejects a request without a valid admin session', async () => {
    const req = new Request('https://example.com/admin/meta/connect');
    const res = await onRequestGetConnect({ request: req, env: baseEnv });
    expect(res.status).toBe(401);
  });

  // Desde el commit 6168459 este endpoint usa "Instagram API con Instagram
  // Login" (instagram.com + INSTAGRAM_APP_ID), no el diálogo de Facebook.
  it('redirects to the Instagram Login dialog with a state cookie when logged in', async () => {
    const cookiePair = await sessionCookiePair();
    const req = new Request('https://example.com/admin/meta/connect', { headers: { Cookie: cookiePair } });
    const res = await onRequestGetConnect({ request: req, env: baseEnv });
    expect(res.status).toBe(302);
    const location = res.headers.get('Location');
    expect(location).toContain('instagram.com/oauth/authorize');
    expect(location).toContain(`client_id=${baseEnv.INSTAGRAM_APP_ID}`);
    expect(location).toContain('redirect_uri=https%3A%2F%2Fexample.com%2Fadmin%2Fmeta%2Fcallback');
    expect(res.headers.get('Set-Cookie')).toContain('atp_meta_oauth_state=');
  });

  it('fails closed when INSTAGRAM_APP_ID is not configured', async () => {
    const cookiePair = await sessionCookiePair();
    const req = new Request('https://example.com/admin/meta/connect', { headers: { Cookie: cookiePair } });
    const res = await onRequestGetConnect({ request: req, env: { ADMIN_SESSION_SECRET: baseEnv.ADMIN_SESSION_SECRET } });
    expect(res.status).toBe(500);
  });
});

describe('GET /admin/meta/connect-facebook', () => {
  it('rejects a request without a valid admin session', async () => {
    const req = new Request('https://example.com/admin/meta/connect-facebook');
    const res = await onRequestGetConnectFacebook({ request: req, env: baseEnv });
    expect(res.status).toBe(401);
  });

  it('redirects to the Facebook Login for Business dialog with its own state cookie', async () => {
    const cookiePair = await sessionCookiePair();
    const req = new Request('https://example.com/admin/meta/connect-facebook', { headers: { Cookie: cookiePair } });
    const res = await onRequestGetConnectFacebook({ request: req, env: baseEnv });
    expect(res.status).toBe(302);
    const location = res.headers.get('Location');
    expect(location).toContain('facebook.com');
    expect(location).toContain(`client_id=${baseEnv.META_APP_ID}`);
    expect(location).toContain(`config_id=${baseEnv.META_LOGIN_CONFIG_ID}`);
    expect(location).toContain('redirect_uri=https%3A%2F%2Fexample.com%2Fadmin%2Fmeta%2Fcallback-facebook');
    expect(res.headers.get('Set-Cookie')).toContain('atp_meta_oauth_state_fb=');
  });

  it('fails closed when META_LOGIN_CONFIG_ID is not configured', async () => {
    const cookiePair = await sessionCookiePair();
    const req = new Request('https://example.com/admin/meta/connect-facebook', { headers: { Cookie: cookiePair } });
    const { META_LOGIN_CONFIG_ID, ...envWithoutConfig } = baseEnv;
    const res = await onRequestGetConnectFacebook({ request: req, env: envWithoutConfig });
    expect(res.status).toBe(500);
  });
});

describe('GET /admin/meta/callback', () => {
  it('rejects a request without a valid admin session', async () => {
    const req = new Request('https://example.com/admin/meta/callback?code=abc&state=xyz');
    const res = await onRequestGetCallback({ request: req, env: baseEnv });
    expect(res.status).toBe(401);
  });

  it('rejects when the state param does not match the state cookie (CSRF)', async () => {
    const cookiePair = await sessionCookiePair();
    const req = new Request('https://example.com/admin/meta/callback?code=abc&state=attacker-supplied', {
      headers: { Cookie: `${cookiePair}; atp_meta_oauth_state=real-state` },
    });
    const res = await onRequestGetCallback({ request: req, env: baseEnv });
    expect(res.status).toBe(400);
  });

  it('rejects when there is no state cookie at all', async () => {
    const cookiePair = await sessionCookiePair();
    const req = new Request('https://example.com/admin/meta/callback?code=abc&state=xyz', {
      headers: { Cookie: cookiePair },
    });
    const res = await onRequestGetCallback({ request: req, env: baseEnv });
    expect(res.status).toBe(400);
  });

  it('shows a friendly page when Meta reports the user cancelled the OAuth dialog', async () => {
    const cookiePair = await sessionCookiePair();
    const req = new Request('https://example.com/admin/meta/callback?error=access_denied&error_description=User+denied', {
      headers: { Cookie: cookiePair },
    });
    const res = await onRequestGetCallback({ request: req, env: baseEnv });
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('Conexión cancelada');
  });
});
