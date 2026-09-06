import { describe, it, expect } from 'vitest';
import { checkAdminAuth } from '../../src/api/admin.js';

function basicAuthHeader(user, pass) {
  return `Basic ${btoa(`${user}:${pass}`)}`;
}

describe('checkAdminAuth', () => {
  it('accepts the correct password regardless of the username part', () => {
    const req = new Request('https://example.com/admin', {
      headers: { Authorization: basicAuthHeader('anything', 'correct-horse') },
    });
    expect(checkAdminAuth(req, { ADMIN_DASHBOARD_PASSWORD: 'correct-horse' })).toBe(true);
  });

  it('rejects an incorrect password', () => {
    const req = new Request('https://example.com/admin', {
      headers: { Authorization: basicAuthHeader('admin', 'wrong') },
    });
    expect(checkAdminAuth(req, { ADMIN_DASHBOARD_PASSWORD: 'correct-horse' })).toBe(false);
  });

  it('rejects when there is no Authorization header', () => {
    const req = new Request('https://example.com/admin');
    expect(checkAdminAuth(req, { ADMIN_DASHBOARD_PASSWORD: 'correct-horse' })).toBe(false);
  });

  it('rejects a non-Basic Authorization scheme', () => {
    const req = new Request('https://example.com/admin', {
      headers: { Authorization: 'Bearer sometoken' },
    });
    expect(checkAdminAuth(req, { ADMIN_DASHBOARD_PASSWORD: 'correct-horse' })).toBe(false);
  });

  it('rejects when the secret is not configured on env, even with a header present', () => {
    const req = new Request('https://example.com/admin', {
      headers: { Authorization: basicAuthHeader('admin', 'correct-horse') },
    });
    expect(checkAdminAuth(req, {})).toBe(false);
  });

  it('rejects malformed base64 in the Authorization header without throwing', () => {
    const req = new Request('https://example.com/admin', {
      headers: { Authorization: 'Basic not-valid-base64!!!' },
    });
    expect(() => checkAdminAuth(req, { ADMIN_DASHBOARD_PASSWORD: 'x' })).not.toThrow();
    expect(checkAdminAuth(req, { ADMIN_DASHBOARD_PASSWORD: 'x' })).toBe(false);
  });

  // The comparison must be constant-time (no early-exit on the first byte
  // mismatch), so it's worth locking in correctness across every mismatch
  // position, not just "totally wrong password".
  it('rejects a password that differs only in its last character', () => {
    const req = new Request('https://example.com/admin', {
      headers: { Authorization: basicAuthHeader('admin', 'correct-horse-battery-stapleX') },
    });
    expect(checkAdminAuth(req, { ADMIN_DASHBOARD_PASSWORD: 'correct-horse-battery-staple' })).toBe(false);
  });

  it('rejects a password of different length', () => {
    const req = new Request('https://example.com/admin', {
      headers: { Authorization: basicAuthHeader('admin', 'short') },
    });
    expect(checkAdminAuth(req, { ADMIN_DASHBOARD_PASSWORD: 'a-much-longer-password' })).toBe(false);
  });

  it('accepts a password containing multi-byte UTF-8 characters', () => {
    const req = new Request('https://example.com/admin', {
      headers: { Authorization: basicAuthHeader('admin', 'contraseña-ñoño') },
    });
    expect(checkAdminAuth(req, { ADMIN_DASHBOARD_PASSWORD: 'contraseña-ñoño' })).toBe(true);
  });
});
