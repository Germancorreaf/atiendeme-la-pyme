/**
 * WhatsApp Cloud API Webhook Handler (Meta directo, sin ManyChat)
 * Verifica el webhook de Meta (GET) y procesa mensajes reales (POST).
 *
 * Requiere estos secrets en el Worker (wrangler secret put ...):
 * - WHATSAPP_VERIFY_TOKEN: string propio, se configura también en el
 *   panel de Meta (Webhooks > Verify Token) al conectar el endpoint.
 * - WHATSAPP_ACCESS_TOKEN: token del system user / access token permanente
 *   generado en Meta Business Suite para la app de WhatsApp.
 * - WHATSAPP_PHONE_NUMBER_ID: ID del número de teléfono en Meta (no es el
 *   número en sí), visible en WhatsApp > Configuración de la API.
 */

import { callClaude } from '../lib/anthropic.js';
import { getRandomGreeting, buildSystemPrompt } from '../lib/dominga-prompt.js';
import { checkAllLimits } from '../lib/rateLimit.js';
import { getConnectionByPhoneNumberId } from '../lib/whatsappConnections.js';

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
  const { request, env } = context;

  try {
    const body = await request.json();
    const entries = body.entry || [];

    for (const entry of entries) {
      const changes = entry.changes || [];

      for (const change of changes) {
        const value = change.value || {};
        const messages = value.messages || [];
        const phoneNumberId = value.metadata?.phone_number_id;

        for (const message of messages) {
          // Solo procesamos mensajes de texto reales; ignoramos otros tipos
          // (imagen, audio, ubicación, etc.) y notificaciones de estado.
          if (message.type !== 'text' || !message.text?.body) continue;

          const from = message.from;
          if (!isSafeWhatsappId(from)) continue;
          if (!phoneNumberId) continue;

          const rlCheck = await checkAllLimits(`whatsapp:${from}`, env.RATE_LIMIT_KV, {
            maxRequests: 30,
            windowSeconds: 60,
            maxBurstRequests: 5,
            burstWindowSeconds: 5
          });
          if (!rlCheck.allowed) continue;

          // Busca la conexión de este número (cliente conectado vía
          // Embedded Signup, ver whatsapp-connect.js); si no hay ninguna,
          // cae al número de prueba fijo por variables de entorno
          // (WHATSAPP_ACCESS_TOKEN), para no romper ese número original.
          const connection = await getConnectionByPhoneNumberId(phoneNumberId, env);
          const accessToken = connection?.access_token || env.WHATSAPP_ACCESS_TOKEN;
          if (!accessToken) {
            console.error(`WhatsApp: sin token para phone_number_id ${phoneNumberId}, se ignora el mensaje`);
            continue;
          }

          // Namespace por número de negocio: un mismo cliente final puede
          // escribirle a más de un negocio conectado, y no deben mezclarse
          // el historial ni el contexto entre bots distintos.
          const sessionId = `whatsapp_${phoneNumberId}_${from}`;
          const userMessage = message.text.body;

          const history = await getConversationHistory(sessionId, env);
          const reply = history.length === 0
            ? getRandomGreeting()
            : await getClaudeReply(userMessage, history, context);

          await saveMessage(sessionId, from, userMessage, reply, env);
          await sendMessage(from, reply, phoneNumberId, accessToken);
        }
      }
    }

    // Meta espera 200 rápido; si no, reintenta la entrega del webhook.
    return new Response('EVENT_RECEIVED', { status: 200 });
  } catch (error) {
    console.error('WhatsApp webhook error:', error.message);
    // 200 igual: evita que Meta reintente un payload que ya falló una vez.
    return new Response('EVENT_RECEIVED', { status: 200 });
  }
}

async function getConversationHistory(sessionId, env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) return [];

  try {
    const response = await fetch(
      `${env.SUPABASE_URL}/rest/v1/chat_sessions?session_id=eq.${encodeURIComponent(sessionId)}`,
      {
        headers: {
          apikey: env.SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`
        }
      }
    );
    const data = await response.json();
    return data.length > 0 ? (data[0].messages || []).slice(-10) : [];
  } catch (err) {
    console.error('Error fetching WhatsApp history:', err.message);
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
    // Claude directo como texto a WhatsApp. brief: true porque WhatsApp
    // pide mensajes cortos, igual que Instagram.
    const systemPrompt = buildSystemPrompt({ canScheduleViaJSON: false, brief: true });
    return await callClaude(messages, systemPrompt, context, {
      model: 'claude-haiku-4-5-20251001',
      maxTokens: 512
    });
  } catch (err) {
    console.error('Claude call failed for WhatsApp:', err.message);
    return 'Lo siento, tuve un problema técnico. Intenta de nuevo.';
  }
}

async function saveMessage(sessionId, from, userMessage, botResponse, env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) return;

  try {
    const encodedId = encodeURIComponent(sessionId);
    const getResponse = await fetch(
      `${env.SUPABASE_URL}/rest/v1/chat_sessions?session_id=eq.${encodedId}`,
      {
        headers: {
          apikey: env.SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`
        }
      }
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
        lead_contact: from,
        updated_at: new Date().toISOString()
      })
    });
  } catch (error) {
    console.error('Error saving WhatsApp message to Supabase:', error.message);
  }
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
