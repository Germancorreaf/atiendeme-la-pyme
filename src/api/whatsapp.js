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
import { appendChatMessages, joinReply, replyToMessage } from '../lib/chatSessions.js';
import { isOwnerActive, markOwnerActive, rememberBotMessage, wasSentByBot } from '../lib/ownerActive.js';

import { GRAPH_API_VERSION } from '../lib/graphApi.js';

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

      // Coexistencia: el dueño escribió desde la app WhatsApp Business.
      if (change.field === 'smb_message_echoes') {
        for (const echo of value.message_echoes || []) {
          try {
            await handleOwnerEcho(echo, phoneNumberId, context);
          } catch (err) {
            console.error('WhatsApp echo error:', err.message);
          }
        }
        continue;
      }

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

async function handleOwnerEcho(echo, phoneNumberId, { env }) {
  const customer = echo.to;
  if (!isSafeWhatsappId(customer) || !phoneNumberId) return;
  if (await wasSentByBot(env.RATE_LIMIT_KV, echo.id)) return;
  await markOwnerActive(env.RATE_LIMIT_KV, phoneNumberId, customer);
  // Queda en la conversación para que se vea en el panel.
  if (echo.type === 'text' && echo.text?.body) {
    await appendChatMessages(env, `whatsapp_${phoneNumberId}_${customer}`, [
      { role: 'assistant', content: echo.text.body, timestamp: new Date().toISOString(), sent_by: 'owner' }
    ]);
  }
}

async function handleMessage(message, phoneNumberId, contactName, context) {
  const { env } = context;
  // Solo procesamos mensajes de texto reales; ignoramos otros tipos
  // (imagen, audio, ubicación, etc.) y notificaciones de estado.
  // Un botón de respuesta rápida llega como interactive.button_reply: se trata
  // como si la persona hubiera escrito el texto del botón.
  const userText = message.type === 'text'
    ? message.text?.body
    : message.type === 'interactive' ? message.interactive?.button_reply?.title : null;
  if (!userText) return;

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
  // Si el dueño está respondiendo desde su celular, el bot no se mete.
  if (await isOwnerActive(env.RATE_LIMIT_KV, phoneNumberId, from)) {
    // El mensaje igual queda guardado para que el dueño lo vea en el panel.
    await appendChatMessages(env, `whatsapp_${phoneNumberId}_${from}`, [
      { role: 'user', content: userText, timestamp: new Date().toISOString() }
    ], { lead_contact: from, ...(contactName ? { sender_name: contactName } : {}) });
    return;
  }

  const connection = await getConnectionByPhoneNumberId(phoneNumberId, env);
  const accessToken = connection?.access_token || env.WHATSAPP_ACCESS_TOKEN;
  if (!accessToken) {
    console.error(`WhatsApp: sin token para phone_number_id ${phoneNumberId}, se ignora el mensaje`);
    return;
  }

  // "Visto" y "escribiendo…" de inmediato, mientras se espera a que termine de escribir.
  await sendTypingIndicator(message.id, phoneNumberId, accessToken);

  const job = { channel: 'whatsapp', phoneNumberId, from, contactName, messageId: message.id, text: userText };
  if (env.MESSAGE_BUFFER) {
    // Junta los mensajes seguidos antes de responder (durable-objects/MessageBuffer.js),
    // igual que en Instagram/Messenger.
    const buffer = env.MESSAGE_BUFFER.get(env.MESSAGE_BUFFER.idFromName(`whatsapp_${phoneNumberId}_${from}`));
    await buffer.fetch('https://buffer/', { method: 'POST', body: JSON.stringify(job) });
  } else {
    await respondToWhatsapp(env, job, userText, context);
  }
}

/**
 * Responde a una persona por WhatsApp. `text` puede juntar varios mensajes
 * seguidos (MessageBuffer). Lo llama el buffer o, sin él, handleMessage.
 */
export async function respondToWhatsapp(env, { phoneNumberId, from, contactName, messageId }, text, context = { env }) {
  const sessionId = `whatsapp_${phoneNumberId}_${from}`;
  // El dueño pudo responder desde el celular mientras se esperaba.
  if (await isOwnerActive(env.RATE_LIMIT_KV, phoneNumberId, from)) {
    await appendChatMessages(env, sessionId, [
      { role: 'user', content: text, timestamp: new Date().toISOString() }
    ], { lead_contact: from, ...(contactName ? { sender_name: contactName } : {}) });
    return;
  }

  const connection = await getConnectionByPhoneNumberId(phoneNumberId, env);
  const accessToken = connection?.access_token || env.WHATSAPP_ACCESS_TOKEN;
  if (!accessToken) {
    console.error(`WhatsApp: sin token para phone_number_id ${phoneNumberId}, se ignora el mensaje`);
    return;
  }
  // "Escribiendo…" dura hasta 25 s: se renueva mientras Claude piensa.
  if (messageId) await sendTypingIndicator(messageId, phoneNumberId, accessToken);

  await replyToMessage({
    // Namespace por número de negocio: un mismo cliente final puede
    // escribirle a más de un negocio conectado, y no deben mezclarse
    // el historial ni el contexto entre bots distintos.
    sessionId,
    userMessage: text,
    connection,
    channel: 'WhatsApp',
    leadContact: from,
    notifyContact: `+${from}`,
    senderName: contactName,
    // Por defecto un solo mensaje con "Opciones: …" como texto (lo que ve el App Review).
    // Con WHATSAPP_RICH_REPLIES=1: un mensaje por globo y botones de respuesta rápida.
    send: (parts) => env.WHATSAPP_RICH_REPLIES === '1'
      ? sendRich(from, parts, phoneNumberId, accessToken, env.RATE_LIMIT_KV)
      : sendMessage(from, joinReply(parts), phoneNumberId, accessToken, env.RATE_LIMIT_KV),
    context
  });
}

// Marca el mensaje como leído y muestra "escribiendo…" (se apaga solo al
// responder o a los 25 s). Si falla no importa: la respuesta se envía igual.
export async function sendTypingIndicator(messageId, phoneNumberId, accessToken) {
  if (!messageId) return;
  try {
    const res = await fetch(`https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ messaging_product: 'whatsapp', status: 'read', message_id: messageId, typing_indicator: { type: 'text' } })
    });
    if (!res.ok) console.error('WhatsApp typing indicator:', (await res.text()).slice(0, 200));
  } catch (err) {
    console.error('WhatsApp typing indicator:', err.message);
  }
}

// Botones de respuesta rápida de WhatsApp: máx. 3, título de hasta 20 caracteres
// (splitReply ya respeta ambos límites), cuerpo de hasta 1024.
export function buildInteractivePayload(to, bodyText, options) {
  return {
    messaging_product: 'whatsapp',
    to,
    type: 'interactive',
    interactive: {
      type: 'button',
      body: { text: bodyText.slice(0, 1024) },
      action: {
        buttons: options.map((title, i) => ({ type: 'reply', reply: { id: `opt_${i + 1}`, title } }))
      }
    }
  };
}

// Un mensaje por globo; las opciones van como botones en el último.
async function sendRich(to, { bubbles, options }, phoneNumberId, accessToken, kv) {
  for (let i = 0; i < bubbles.length; i++) {
    const last = i === bubbles.length - 1;
    const payload = last && options.length
      ? buildInteractivePayload(to, bubbles[i], options)
      : { messaging_product: 'whatsapp', to, type: 'text', text: { body: bubbles[i] } };
    if (!(await postToWhatsapp(payload, phoneNumberId, accessToken, kv))) return;
  }
}

async function sendMessage(to, messageText, phoneNumberId, accessToken, kv) {
  await postToWhatsapp(
    { messaging_product: 'whatsapp', to, type: 'text', text: { body: messageText } },
    phoneNumberId, accessToken, kv
  );
}

async function postToWhatsapp(payload, phoneNumberId, accessToken, kv) {
  if (!phoneNumberId || !accessToken) {
    console.error('WhatsApp send skipped: falta phoneNumberId o accessToken');
    return false;
  }

  try {
    const response = await fetch(`https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('WhatsApp API error:', err);
      return false;
    }
    const data = await response.json().catch(() => null);
    await rememberBotMessage(kv, data?.messages?.[0]?.id);
    return true;
  } catch (error) {
    console.error('Error sending WhatsApp message:', error.message);
    return false;
  }
}
