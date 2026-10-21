// src/lib/clientInvite.js
// Link que Germán le manda a un cliente para que él mismo conecte su
// Instagram o su Página de Facebook (atiendemelapyme.cl/conectar/<token>),
// sin pasarle su clave a nadie. El token es el id del cliente firmado con
// ADMIN_SESSION_SECRET: no se puede inventar ni cambiar de cliente. Deja de
// servir si se borra el cliente (o si se rota el secret).

import { computeHmacSha256Hex } from './metaSignature.js';
import { timingSafeEqual } from './timingSafe.js';
import { getCliente } from './clients.js';

export const INVITE_COOKIE_NAME = 'atp_invite';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function signature(env, clienteId) {
  return (await computeHmacSha256Hex(env.ADMIN_SESSION_SECRET, `invite:${clienteId}`)).slice(0, 32);
}

export async function inviteToken(env, clienteId) {
  return `${clienteId}.${await signature(env, clienteId)}`;
}

/** @returns {Promise<{ token: string, cliente: object } | null>} */
export async function verifyInvite(env, token) {
  if (!env.ADMIN_SESSION_SECRET || typeof token !== 'string') return null;
  const [id, sig] = token.split('.');
  if (!UUID_RE.test(id || '') || !sig) return null;
  if (!timingSafeEqual(sig, await signature(env, id))) return null;
  const cliente = await getCliente(env, id);
  return cliente ? { token, cliente } : null;
}
