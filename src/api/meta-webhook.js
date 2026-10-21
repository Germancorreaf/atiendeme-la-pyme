// src/api/meta-webhook.js
// Webhook nativo de Meta para Instagram + Messenger (reemplaza a ManyChat como
// receptor/emisor de mensajes). Verifica el webhook (GET) y procesa mensajes
// reales (POST) usando las Páginas conectadas en meta_connections (ver
// meta-connect.js para el flujo que las crea).
//
// Requiere estos secrets en el Worker:
// - META_VERIFY_TOKEN: string propio, se configura también en el panel de
//   Meta (Webhooks > Verify Token) al conectar este endpoint.
// - META_APP_SECRET: App Secret de la app, para validar la firma
//   X-Hub-Signature-256 de cada request entrante.

import { limitRequest } from '../lib/rateLimit.js';
import { verifyMetaSignature } from '../lib/metaSignature.js';
import { getConnectionByPageId, getConnectionByIgId, usesInstagramToken } from '../lib/metaConnections.js';
import { alreadyProcessed } from '../lib/dedup.js';
import { replyToMessage } from '../lib/chatSessions.js';

const GRAPH_API_VERSION = 'v21.0';

// Los PSID/IGSID de Meta son numéricos. Validamos formato antes de usarlos en
// cualquier query de Supabase o en el sessionId.
function isSafeMetaId(id) {
  return typeof id === 'string' && /^[0-9]{5,32}$/.test(id);
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  const mode = url.searchParams.get('hub.mode');
  const verifyToken = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');

  if (mode === 'subscribe' && env.META_VERIFY_TOKEN && verifyToken === env.META_VERIFY_TOKEN) {
    return new Response(challenge);
  }
  return new Response('Forbidden', { status: 403 });
}

// El flujo "Instagram API con Instagram Login" (ver meta-connect.js) firma
// los webhooks con INSTAGRAM_APP_SECRET (secret de la Instagram App ID
// 2244834902982613), NO con META_APP_SECRET (secret de la Facebook App ID)
// -- son dos apps/secrets distintos dentro del mismo panel de Meta. Probamos
// ambos para no romper si en el futuro llegan también webhooks de
// Página/Messenger firmados con META_APP_SECRET.
async function verifySignature(request, rawBody, env) {
  return verifyMetaSignature(request, rawBody, [env.INSTAGRAM_APP_SECRET, env.META_APP_SECRET]);
}

export async function onRequestPost(context) {
  const { request, env, ctx } = context;
  const rawBody = await request.text();

  if (!(await verifySignature(request, rawBody, env))) {
    return new Response('Forbidden', { status: 403 });
  }

  // Meta espera 200 rápido, si no reintenta la entrega. El procesamiento real
  // (Claude + Graph API) sigue corriendo en segundo plano.
  const processing = processEvents(rawBody, context);
  if (ctx && typeof ctx.waitUntil === 'function') {
    ctx.waitUntil(processing);
  } else {
    await processing;
  }
  return new Response('EVENT_RECEIVED', { status: 200 });
}

async function processEvents(rawBody, context) {
  let body;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return;
  }

  const isInstagram = body.object === 'instagram';
  const entries = body.entry || [];

  for (const entry of entries) {
    const events = entry.messaging || [];
    for (const event of events) {
      try {
        await handleEvent(event, entry.id, isInstagram, context);
      } catch (err) {
        console.error('Meta webhook event error:', err.message);
      }
    }
  }
}

async function handleEvent(event, entryId, isInstagram, context) {
  const { env } = context;
  if (!event.message || event.message.is_echo || !event.message.text) return;
  if (await alreadyProcessed(event.message.mid, env.RATE_LIMIT_KV)) return;

  const senderId = event.sender?.id;
  if (!isSafeMetaId(senderId)) return;

  const connection = await connectionFor(isInstagram, entryId, env);
  if (!connection) {
    console.error(`Meta webhook: sin conexión guardada para entry ${entryId} (instagram=${isInstagram})`);
    return;
  }

  // Separado por negocio (Página / cuenta de Instagram), igual que WhatsApp:
  // una persona que le escribe a dos clientes no debe mezclar historiales.
  const sessionId = sessionIdFor(isInstagram, entryId, senderId);

  const rlCheck = await limitRequest(env, sessionId, {
    kv: { maxRequests: 30, windowSeconds: 60, maxBurstRequests: 5, burstWindowSeconds: 5 }
  });
  if (!rlCheck.allowed) return;

  // "Visto" y "escribiendo…" de inmediato, mientras se espera a que termine de escribir.
  const host = instagramHostFor(isInstagram, connection);
  await sendSenderAction(host, connection, senderId, 'mark_seen');
  await sendSenderAction(host, connection, senderId, 'typing_on');

  const job = { isInstagram, entryId, senderId, text: event.message.text };
  if (env.MESSAGE_BUFFER) {
    // Junta los mensajes seguidos antes de responder (durable-objects/MessageBuffer.js).
    const buffer = env.MESSAGE_BUFFER.get(env.MESSAGE_BUFFER.idFromName(sessionId));
    await buffer.fetch('https://buffer/', { method: 'POST', body: JSON.stringify(job) });
  } else {
    await respondToMeta(env, job, job.text, connection);
  }
}

function connectionFor(isInstagram, entryId, env) {
  return isInstagram ? getConnectionByIgId(entryId, env) : getConnectionByPageId(entryId, env);
}

function sessionIdFor(isInstagram, entryId, senderId) {
  return `${isInstagram ? 'instagram' : 'messenger'}_${entryId}_${senderId}`;
}

// El host de la Graph API depende del TIPO DE TOKEN guardado, no solo del canal:
// una conexión hecha vía Página de Facebook usa token de Facebook aunque el
// mensaje venga de Instagram.
function instagramHostFor(isInstagram, connection) {
  return isInstagram && usesInstagramToken(connection);
}

/**
 * Responde a una persona de Instagram/Messenger. `text` puede juntar varios
 * mensajes seguidos (MessageBuffer). Lo llama el buffer o, sin él, handleEvent.
 */
export async function respondToMeta(env, { isInstagram, entryId, senderId }, text, connection = null) {
  connection = connection || await connectionFor(isInstagram, entryId, env);
  if (!connection) return;
  const instagramHost = instagramHostFor(isInstagram, connection);
  await sendSenderAction(instagramHost, connection, senderId, 'typing_on');

  await replyToMessage({
    sessionId: sessionIdFor(isInstagram, entryId, senderId),
    userMessage: text,
    connection,
    channel: isInstagram ? 'Instagram' : 'Messenger',
    leadContact: senderId,
    // Perfil (nombre/username + foto): saveExchange no pisa uno ya guardado
    // si esta llamada se omite o falla.
    loadProfile: () => fetchProfile(isInstagram, senderId, connection.page_access_token, instagramHost),
    send: async ({ bubbles, options }) => {
      for (const [i, bubble] of bubbles.entries()) {
        const last = i === bubbles.length - 1;
        await sendMessage(instagramHost, connection.page_id, connection.page_access_token, senderId, bubble, last ? options : []);
        // Entre globos, un momento de "escribiendo…" para que se lea como una conversación.
        if (!last) {
          await sendSenderAction(instagramHost, connection, senderId, 'typing_on');
          await sleep(Math.min(2500, 600 + bubbles[i + 1].length * 15));
        }
      }
    },
    context: { env }
  });
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function messagesUrl(isInstagram, pageId, accessToken) {
  const host = isInstagram ? 'graph.instagram.com' : 'graph.facebook.com';
  return `https://${host}/${GRAPH_API_VERSION}/${pageId}/messages?access_token=${encodeURIComponent(accessToken)}`;
}

// "Visto" o "escribiendo…". Si falla no importa: el mensaje se envía igual.
async function sendSenderAction(isInstagram, connection, recipientId, action) {
  try {
    const res = await fetch(messagesUrl(isInstagram, connection.page_id, connection.page_access_token), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipient: { id: recipientId }, sender_action: action })
    });
    if (!res.ok) console.error(`Meta sender_action ${action}:`, (await res.text()).slice(0, 200));
  } catch (err) {
    console.error(`Meta sender_action ${action}:`, err.message);
  }
}

// Perfil público del remitente (nombre/username + foto), vía la misma Graph
// API que ya usamos para enviar el mensaje. Instagram devuelve "username"
// (lo que se muestra como @usuario en el resto de la app); Messenger solo
// tiene "name". Si falla (token vencido, ID de prueba, etc.) no debe romper
// el envío del mensaje -- por eso siempre se atrapa el error acá.
async function fetchProfile(isInstagram, senderId, accessToken, useInstagramHost = isInstagram) {
  const host = useInstagramHost ? 'graph.instagram.com' : 'graph.facebook.com';
  const fields = isInstagram ? 'name,username,profile_pic' : 'name,profile_pic';
  try {
    const res = await fetch(
      `https://${host}/${GRAPH_API_VERSION}/${senderId}?fields=${fields}&access_token=${encodeURIComponent(accessToken)}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    const name = (isInstagram ? data.username : null) || data.name || null;
    if (!name && !data.profile_pic) return null;
    return { name, avatarUrl: data.profile_pic || null };
  } catch (err) {
    console.error('Meta profile fetch error:', err.message);
    return null;
  }
}

async function sendMessage(isInstagram, recipientOrPageId, accessToken, recipientId, messageText, options = []) {
  const url = messagesUrl(isInstagram, recipientOrPageId, accessToken);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: {
          text: messageText,
          // Botones de respuesta rápida: al tocarlos llega su texto como un mensaje normal.
          ...(options.length && { quick_replies: options.map((o) => ({ content_type: 'text', title: o, payload: o })) })
        }
      })
    });
    if (!response.ok) {
      const err = await response.text();
      console.error('Meta Send API error:', err);
    }
  } catch (error) {
    console.error('Error sending Meta message:', error.message);
  }
}
