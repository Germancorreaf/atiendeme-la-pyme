// src/lib/ownerActive.js
// Coexistencia de WhatsApp: cuando el dueño responde desde la app WhatsApp
// Business, Meta avisa con el campo `smb_message_echoes`. Mientras él esté
// atendiendo esa conversación, el bot no responde (si no, se pisarían).
//
// Se recuerda en KV por negocio + cliente final. Si KV falla, el bot responde
// igual: es preferible un mensaje de más a dejar a una persona sin respuesta.

// Cuánto tiempo se silencia el bot tras un mensaje del dueño.
export const OWNER_ACTIVE_SECONDS = 12 * 60 * 60;
const BOT_SENT_SECONDS = 600;

const ownerKey = (phoneNumberId, customer) => `owneractive:${phoneNumberId}:${customer}`;

export async function markOwnerActive(kv, phoneNumberId, customer) {
  if (!kv || !phoneNumberId || !customer) return;
  try {
    await kv.put(ownerKey(phoneNumberId, customer), '1', { expirationTtl: OWNER_ACTIVE_SECONDS });
  } catch (err) {
    console.error('ownerActive KV put error:', err.message);
  }
}

export async function isOwnerActive(kv, phoneNumberId, customer) {
  if (!kv || !phoneNumberId || !customer) return false;
  try {
    return Boolean(await kv.get(ownerKey(phoneNumberId, customer)));
  } catch (err) {
    console.error('ownerActive KV get error (el bot responde igual):', err.message);
    return false;
  }
}

// Mensajes que mandó el propio bot por la API: si Meta los devolviera como
// "echo", no deben contar como si el dueño hubiera escrito.
export async function rememberBotMessage(kv, messageId) {
  if (!kv || !messageId) return;
  try {
    await kv.put(`botsent:${messageId}`, '1', { expirationTtl: BOT_SENT_SECONDS });
  } catch (err) {
    console.error('botsent KV put error:', err.message);
  }
}

export async function wasSentByBot(kv, messageId) {
  if (!kv || !messageId) return false;
  try {
    return Boolean(await kv.get(`botsent:${messageId}`));
  } catch {
    return false;
  }
}
