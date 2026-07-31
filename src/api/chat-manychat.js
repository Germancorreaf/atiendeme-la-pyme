/**
 * Endpoint dedicado para ManyChat
 * Acepta mensajes en formato simple y responde con Claude
 * NO modifica nada del chatbot web existente
 * 
 * Formatos aceptados (ManyChat puede enviar cualquiera):
 * 1. {"message": "texto", "sessionId": "id"}
 * 2. {"messages": [{"role": "user", "content": "texto"}], "sessionId": "id"}
 * 3. {"text": "texto", "contact_id": "id"}
 */

import { callClaude } from '../lib/anthropic.js';
import { getRandomGreeting, buildSystemPrompt } from '../lib/dominga-prompt.js';
import { checkAllLimits } from '../lib/rateLimit.js';

async function getHistory(sessionId, env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) return [];
  try {
    const response = await fetch(
      `${env.SUPABASE_URL}/rest/v1/chat_sessions?session_id=eq.${sessionId}`,
      {
        headers: {
          'apikey': env.SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
        }
      }
    );
    const data = await response.json();
    if (data.length > 0 && data[0].messages) {
      // Solo últimos 10 mensajes para no sobrecargar
      return data[0].messages.slice(-10).map(m => ({
        role: m.role,
        content: m.content
      }));
    }
    return [];
  } catch {
    return [];
  }
}

async function saveHistory(sessionId, messages, env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) return;
  try {
    await fetch(
      `${env.SUPABASE_URL}/rest/v1/chat_sessions?on_conflict=session_id`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': env.SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify({
          session_id: sessionId,
          messages,
          updated_at: new Date().toISOString()
        })
      }
    );
  } catch (err) {
    console.error('Error saving ManyChat session:', err.message);
  }
}

export async function onRequestPost(context) {
  try {
    const incomingToken = context.request.headers.get('X-Manychat-Token');
    if (!context.env.MANYCHAT_SHARED_SECRET || incomingToken !== context.env.MANYCHAT_SHARED_SECRET) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const clientIP = context.request.headers.get('CF-Connecting-IP') || 'unknown-ip';
    const rlCheck = await checkAllLimits(clientIP, context.env.RATE_LIMIT_KV, {
      maxRequests: 30,
      windowSeconds: 60,
      maxBurstRequests: 5,
      burstWindowSeconds: 5
    });
    if (!rlCheck.allowed) {
      return new Response(JSON.stringify({ error: `${rlCheck.reason}. Retry after ${rlCheck.retryAfter}s` }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await context.request.json();

    // Normalizar el mensaje entrante (ManyChat puede enviar distintos formatos)
    let userMessage = '';
    let sessionId = `manychat_${Date.now()}`;

    if (typeof body.message === 'string' && body.message) {
      // Formato 1: {"message": "texto", "sessionId": "id"}
      userMessage = body.message;
      sessionId = body.sessionId || body.contact_id || sessionId;
    } else if (Array.isArray(body.messages) && body.messages.length > 0) {
      // Formato 2: {"messages": [...], "sessionId": "id"}
      const last = body.messages[body.messages.length - 1];
      userMessage = last.content || last.text || '';
      sessionId = body.sessionId || body.contact_id || sessionId;
    } else if (typeof body.text === 'string' && body.text) {
      // Formato 3: {"text": "texto", "contact_id": "id"}
      userMessage = body.text;
      sessionId = body.contact_id || body.sessionId || sessionId;
    }

    if (!userMessage) {
      return new Response(JSON.stringify({ reply: 'No recibí tu mensaje. ¿Puedes repetirlo? 😊' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Obtener historial de Supabase
    const history = await getHistory(sessionId, context.env);

    // Construir mensajes para Claude
    const messages = [
      ...history,
      { role: 'user', content: userMessage }
    ];

    // Si es el primer mensaje (sin historial previo), devuelve saludo aleatorio
    let reply;
    if (history.length === 0) {
      reply = getRandomGreeting();
    } else {
      // Si no, usa Claude normalmente
      reply = await callClaude(messages, buildSystemPrompt({ canScheduleViaJSON: false, brief: true }), context, {
        model: 'claude-haiku-4-5-20251001',
        maxTokens: 512,
        apiKeyVar: 'ANTHROPIC_API_KEY_MANYCHAT'
      });
    }

    // Guardar historial
    const updatedMessages = [
      ...messages,
      { role: 'assistant', content: reply, timestamp: new Date().toISOString() }
    ];
    await saveHistory(sessionId, updatedMessages, context.env);

    // Respuesta en formato que ManyChat puede usar
    return new Response(JSON.stringify({ claude_response: reply }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (err) {
    console.error('ManyChat endpoint error:', err.message);
    return new Response(JSON.stringify({ claude_response: 'Tuve un problema técnico. ¡Intenta de nuevo! 😊' }), {
      status: 200, // 200 para que ManyChat no falle el flujo
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestGet(context) {
  return new Response(JSON.stringify({ status: 'ok', service: 'chat-manychat' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
