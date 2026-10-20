/**
 * WhatsApp Cloud API Webhook Handler (Meta directo, sin ManyChat)
 * Verifica el webhook de Meta (GET) y procesa mensajes reales (POST).
 *
 * Requiere estos secrets en el Worker (wrangler secret put ...):
 * - WHATSAPP_VERIFY_TOKEN: string propio, se configura también en el
 *   panel de Meta (Webhooks > Verify Token) al conectar el endpoint.
 * - WHATSAPP_ACCESS_TOKEN: token del usuario del sistema (sin caducidad)
 *   para los números sin fila en whatsapp_connections (el número propio).
 *   El phone_number_id llega en cada webhook.
 *
 * El flujo de respuesta (historial, bot, Claude, guardar, avisar) es común con
 * Instagram/Messenger: ver lib/chatSessions.js.
 */

import { limitRequest } from '../lib/rateLimit.js';
import { getConnectionByPhoneNumberId } from '../lib/whatsappConnections.js';
import { verifyMetaSignature } from '../lib/metaSignature.js';
import { alreadyProcessed } from '../lib/dedup.js';
import { replyToMessage } from '../lib/chatSessions.js';

const GRAPH_API_VERSION = 'v21.0';

// Los IDs de WhatsApp (wa_id) son números de teléfono en formato E.164 sin "+".
function isSafeWhatsappId(id) {
  return typeof id === 'string' && /^[0-9]{7,15}$/.test(id);
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  const mode = url.searchParams.get('hub.mode');
  const verifyToken = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');

  if (mode === 'subscribe' && env.WHATSAPP_VERIFY_TOKEN && verifyToken === env.WHATSAPP_VERIFY_TOKEN) {
    return new Response(challenge);
  }

  return new Response('Forbidden', { status: 403 });
}

export async function onRequestPost(context) {
  const { request, env, ctx } = context;

  // Sin firma válida de Meta (X-Hub-Signature-256) se descarta el POST:
  // si no, cualquiera que conozca la URL podría hacer gastar Claude y
  // mandar WhatsApps desde el número del negocio.
  const rawBody = await request.text();
  if (!(await verifyMetaSignature(request, rawBody, [env.META_APP_SECRET, env.INSTAGRAM_APP_SECRET]))) {
    console.warn('WhatsApp webhook: firma X-Hub-Signature-256 inválida o ausente, se rechaza');
    return new Response('Forbidden', { status: 403 });
  }

  // Meta espera 200 rápido; si no, reintenta la entrega (y el cliente recibe
  // la respuesta dos veces). Claude + Supabase + envío siguen en segundo plano.
  const processing = processEntries(rawBody, context);
  if (ctx && typeof ctx.waitUntil === 'function') {
    ctx.waitUntil(processing);
  } else {
    await processing;
  }
  return new Response('EVENT_RECEIVED', { status: 200 });
}

async function processEntries(rawBody, context) {
  let body;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return;
  }

  for (const entry of body.entry || []) {
    for (const change of entry.changes || []) {
      const value = change.value || {};
      const phoneNumberId = value.metadata?.phone_number_id;
      // El nombre de perfil de WhatsApp viaja junto a los mensajes en
      // value.contacts (no hace falta llamada aparte a la Graph API).
      // WhatsApp no expone foto de perfil vía API, así que sender_avatar_url
      // queda siempre null para este canal.
      const contactName = value.contacts?.[0]?.profile?.name || null;

      for (const message of value.messages || []) {
        try {
          await handleMessage(message, phoneNumberId, contactName, context);
        } catch (err) {
          console.error('WhatsApp webhook message error:', err.message);
        }
      }
    }
  }
}

async function handleMessage(message, phoneNumberId, contactName, context) {
  const { env } = context;
  // Solo procesamos mensajes de texto reales; ignoramos otros tipos
  // (imagen, audio, ubicación, etc.) y notificaciones de estado.
  if (message.type !== 'text' || !message.text?.body) return;

  const from = message.from;
  if (!isSafeWhatsappId(from) || !phoneNumberId) return;
  if (await alreadyProcessed(message.id, env.RATE_LIMIT_KV)) return;

  const rlCheck = await limitRequest(env, `whatsapp:${from}`, {
    kv: { maxRequests: 30, windowSeconds: 60, maxBurstRequests: 5, burstWindowSeconds: 5 }
  });
  if (!rlCheck.allowed) return;

  // Busca la conexión de este número (cliente conectado vía Embedded
  // Signup, ver whatsapp-connect.js); si no hay ninguna, usa el token del
  // número propio (WHATSAPP_ACCESS_TOKEN, usuario del sistema).
  const connection = await getConnectionByPhoneNumberId(phoneNumberId, env);
  const accessToken = connection?.access_token || env.WHATSAPP_ACCESS_TOKEN;
  if (!accessToken) {
    console.error(`WhatsApp: sin token para phone_number_id ${phoneNumberId}, se ignora el mensaje`);
    return;
  }

  await replyToMessage({
    // Namespace por número de negocio: un mismo cliente final puede
    // escribirle a más de un negocio conectado, y no deben mezclarse
    // el historial ni el contexto entre bots distintos.
    sessionId: `whatsapp_${phoneNumberId}_${from}`,
    userMessage: message.text.body,
    connection,
    channel: 'WhatsApp',
    leadContact: from,
    notifyContact: `+${from}`,
    senderName: contactName,
    send: (reply) => sendMessage(from, reply, phoneNumberId, accessToken),
    context
  });
}

async function sendMessage(to, messageText, phoneNumberId, accessToken) {
  if (!phoneNumberId || !accessToken) {
    console.error('WhatsApp send skipped: falta phoneNumberId o accessToken');
    return;
  }

  try {
    const response = await fetch(`https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: messageText }
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('WhatsApp API error:', err);
    }
  } catch (error) {
    console.error('Error sending WhatsApp message:', error.message);
  }
}
