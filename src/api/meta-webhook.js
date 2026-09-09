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

import { callClaude } from '../lib/anthropic.js';
import { getRandomGreeting, buildSystemPrompt } from '../lib/dominga-prompt.js';
import { checkAllLimits } from '../lib/rateLimit.js';
import { timingSafeEqual } from '../lib/timingSafe.js';
import { getConnectionByPageId, getConnectionByIgId } from '../lib/metaConnections.js';

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

async function verifySignature(request, rawBody, env) {
  const signatureHeader = request.headers.get('X-Hub-Signature-256') || '';
  if (!env.META_APP_SECRET || !signatureHeader.startsWith('sha256=')) return false;

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(env.META_APP_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody));
  const expectedHex = [...new Uint8Array(signatureBuffer)].map((b) => b.toString(16).padStart(2, '0')).join('');

  return timingSafeEqual(signatureHeader.slice('sha256='.length), expectedHex);
}

async function alreadyProcessed(messageId, env) {
  if (!messageId || !env.RATE_LIMIT_KV) return false;
  const key = `metamsg:${messageId}`;
  const existing = await env.RATE_LIMIT_KV.get(key);
  if (existing) return true;
  await env.RATE_LIMIT_KV.put(key, '1', { expirationTtl: 300 });
  return false;
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
  if (await alreadyProcessed(event.message.mid, env)) return;

  const senderId = event.sender?.id;
  if (!isSafeMetaId(senderId)) return;

  const connection = isInstagram
    ? await getConnectionByIgId(entryId, env)
    : await getConnectionByPageId(entryId, env);
  if (!connection) {
    console.error(`Meta webhook: sin conexión guardada para entry ${entryId} (instagram=${isInstagram})`);
    return;
  }

  const channel = isInstagram ? 'instagram' : 'messenger';
  const sessionId = `${channel}_${senderId}`;

  const rlCheck = await checkAllLimits(sessionId, env.RATE_LIMIT_KV, {
    maxRequests: 30,
    windowSeconds: 60,
    maxBurstRequests: 5,
    burstWindowSeconds: 5
  });
  if (!rlCheck.allowed) return;

  const userMessage = event.message.text;
  const history = await getConversationHistory(sessionId, env);
  const reply = history.length === 0
    ? getRandomGreeting()
    : await getClaudeReply(userMessage, history, context);

  await saveMessage(sessionId, senderId, userMessage, reply, env);
  await sendMessage(connection.page_id, connection.page_access_token, senderId, reply);
}

async function getConversationHistory(sessionId, env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) return [];
  try {
    const response = await fetch(
      `${env.SUPABASE_URL}/rest/v1/chat_sessions?session_id=eq.${encodeURIComponent(sessionId)}`,
      { headers: { apikey: env.SUPABASE_SERVICE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}` } }
    );
    const data = await response.json();
    return data.length > 0 ? (data[0].messages || []).slice(-10) : [];
  } catch (err) {
    console.error('Error fetching Meta history:', err.message);
    return [];
  }
}

async function getClaudeReply(userMessage, history, context) {
  const messages = [
    ...history.map((msg) => ({ role: msg.role, content: msg.content })),
    { role: 'user', content: userMessage }
  ];

  try {
    // canScheduleViaJSON: false porque este canal reenvía la respuesta de
    // Claude directo como texto vía Send API. brief: true porque
    // Instagram/Messenger piden mensajes cortos, igual que WhatsApp.
    const systemPrompt = buildSystemPrompt({ canScheduleViaJSON: false, brief: true });
    return await callClaude(messages, systemPrompt, context, {
      model: 'claude-haiku-4-5-20251001',
      maxTokens: 512
    });
  } catch (err) {
    console.error('Claude call failed for Meta channel:', err.message);
    return 'Lo siento, tuve un problema técnico. Intenta de nuevo.';
  }
}

async function saveMessage(sessionId, senderId, userMessage, botResponse, env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) return;

  try {
    const encodedId = encodeURIComponent(sessionId);
    const getResponse = await fetch(
      `${env.SUPABASE_URL}/rest/v1/chat_sessions?session_id=eq.${encodedId}`,
      { headers: { apikey: env.SUPABASE_SERVICE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}` } }
    );

    const existing = await getResponse.json();
    const messages = [
      ...(existing.length > 0 ? existing[0].messages || [] : []),
      { role: 'user', content: userMessage, timestamp: new Date().toISOString() },
      { role: 'assistant', content: botResponse, timestamp: new Date().toISOString() }
    ];

    const method = existing.length > 0 ? 'PATCH' : 'POST';
    const url = existing.length > 0
      ? `${env.SUPABASE_URL}/rest/v1/chat_sessions?session_id=eq.${encodedId}`
      : `${env.SUPABASE_URL}/rest/v1/chat_sessions`;

    await fetch(url, {
      method,
      headers: {
        apikey: env.SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        session_id: sessionId,
        messages,
        lead_contact: senderId,
        updated_at: new Date().toISOString()
      })
    });
  } catch (error) {
    console.error('Error saving Meta message to Supabase:', error.message);
  }
}

async function sendMessage(pageId, pageAccessToken, recipientId, messageText) {
  try {
    const response = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${pageId}/messages?access_token=${encodeURIComponent(pageAccessToken)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: { id: recipientId },
          messaging_type: 'RESPONSE',
          message: { text: messageText }
        })
      }
    );
    if (!response.ok) {
      const err = await response.text();
      console.error('Meta Send API error:', err);
    }
  } catch (error) {
    console.error('Error sending Meta message:', error.message);
  }
}
