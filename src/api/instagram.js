/**
 * Instagram Webhook Handler
 * Verifica el webhook de Meta (GET) y procesa mensajes reales (POST)
 * 
 * NOTA: Actualmente el bot de Instagram opera vía ManyChat.
 * Este archivo mantiene el webhook activo para verificación de Meta
 * y está listo para reactivarse si se obtiene aprobación de Tech Provider.
 */

import { callClaude } from '../lib/anthropic.js';
import { buildSystemPrompt } from '../lib/dominga-prompt.js';

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const entries = body.entry || [];

    for (const entry of entries) {
      const messagingEvents = entry.messaging || [];

      for (const event of messagingEvents) {
        // Solo procesar mensajes nuevos reales (no ecos del bot)
        if (event.message && !event.message.is_echo && event.message.text) {
          const senderId = event.sender.id;
          const messageText = event.message.text;

          const history = await getConversationHistory(senderId, env);
          const claudeResponse = await getClaudeReply(messageText, history, context);
          await saveMessage(senderId, messageText, claudeResponse, env);
          await sendMessage(senderId, claudeResponse, env);
        }
      }
    }

    return new Response('ok', { status: 200 });
  } catch (error) {
    console.error('Instagram webhook error:', error.message);
    return new Response('error', { status: 500 });
  }
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  const verifyToken = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');

  if (verifyToken === env.FACEBOOK_VERIFY_TOKEN) {
    return new Response(challenge);
  }

  return new Response('Forbidden', { status: 403 });
}

async function getConversationHistory(senderId, env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) return [];

  try {
    const response = await fetch(
      `${env.SUPABASE_URL}/rest/v1/chat_sessions?session_id=eq.${encodeURIComponent(senderId)}`,
      {
        headers: {
          'apikey': env.SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`
        }
      }
    );
    const data = await response.json();
    return data.length > 0 ? (data[0].messages || []) : [];
  } catch (err) {
    console.error('Error fetching Instagram history:', err.message);
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
    // Claude directo como texto a Instagram (no hay frontend que parsee el
    // JSON de agendamiento). brief: true porque Instagram pide mensajes cortos.
    const systemPrompt = buildSystemPrompt({ canScheduleViaJSON: false, brief: true });
    return await callClaude(messages, systemPrompt, context, {
      model: 'claude-haiku-4-5-20251001',
      maxTokens: 512
    });
  } catch (err) {
    console.error('Claude call failed for Instagram:', err.message);
    return 'Lo siento, tuve un problema técnico. Intenta de nuevo.';
  }
}

async function saveMessage(senderId, userMessage, botResponse, env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) return;

  try {
    const encodedId = encodeURIComponent(senderId);
    const getResponse = await fetch(
      `${env.SUPABASE_URL}/rest/v1/chat_sessions?session_id=eq.${encodedId}`,
      {
        headers: {
          'apikey': env.SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`
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
        'apikey': env.SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        session_id: senderId,
        messages,
        lead_contact: senderId,
        updated_at: new Date().toISOString()
      })
    });
  } catch (error) {
    console.error('Error saving to Supabase:', error.message);
  }
}

async function sendMessage(recipientId, messageText, env) {
  try {
    const response = await fetch('https://graph.instagram.com/v21.0/me/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text: messageText },
        access_token: env.FACEBOOK_PAGE_TOKEN
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Instagram API error:', err);
    }
  } catch (error) {
    console.error('Error sending message:', error.message);
  }
}
