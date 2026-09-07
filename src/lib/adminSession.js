// src/lib/adminSession.js
// Login por sesión para /admin, reemplazando la contraseña única de Basic
// Auth. La sesión es una cookie HttpOnly con un payload firmado (HMAC-SHA256
// sobre ADMIN_SESSION_SECRET) que expira sola — no hay estado de sesión en
// el servidor (ni KV ni DB), solo verificación de la firma y la expiración.

import { timingSafeEqual } from './timingSafe.js';

export const SESSION_COOKIE_NAME = 'atp_admin_session';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 días

function toBase64Url(str) {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(str) {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/');
  const withPadding = padded + '='.repeat((4 - (padded.length % 4)) % 4);
  return atob(withPadding);
}

function bufferToBase64Url(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return toBase64Url(binary);
}

async function hmacSign(secret, data) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return bufferToBase64Url(signature);
}

function parseCookie(cookieHeader, name) {
  const match = (cookieHeader || '').match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match ? match[1] : null;
}

/**
 * Crea el header Set-Cookie para una sesión de admin válida.
 */
export async function createSessionCookie(secret) {
  const payload = JSON.stringify({ exp: Date.now() + SESSION_TTL_MS });
  const payloadB64 = toBase64Url(payload);
  const signature = await hmacSign(secret, payloadB64);
  const token = `${payloadB64}.${signature}`;
  return `${SESSION_COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}`;
}

/**
 * Header Set-Cookie que borra la sesión (logout).
 */
export function clearSessionCookie() {
  return `${SESSION_COOKIE_NAME}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
}

/**
 * Verifica que la request traiga una cookie de sesión válida y no expirada.
 */
export async function checkSessionAuth(request, env) {
  if (!env.ADMIN_SESSION_SECRET) return false;

  const token = parseCookie(request.headers.get('Cookie'), SESSION_COOKIE_NAME);
  if (!token) return false;

  const dotIndex = token.lastIndexOf('.');
  if (dotIndex === -1) return false;

  const payloadB64 = token.slice(0, dotIndex);
  const signature = token.slice(dotIndex + 1);

  const expectedSignature = await hmacSign(env.ADMIN_SESSION_SECRET, payloadB64);
  if (!timingSafeEqual(signature, expectedSignature)) return false;

  try {
    const payload = JSON.parse(fromBase64Url(payloadB64));
    return typeof payload.exp === 'number' && Date.now() < payload.exp;
  } catch {
    return false;
  }
}
