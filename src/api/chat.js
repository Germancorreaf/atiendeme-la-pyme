import {
  validateMessages,
  validateSessionId,
  ValidationError
} from '../lib/validator.js';

import {
  ApiError,
  sendError,
  sendSuccess,
  parseJSON
} from '../lib/errors.js';

import { callClaude } from '../lib/anthropic.js';
import { limitRequest } from '../lib/rateLimit.js';
import { buildSystemPrompt } from '../lib/dominga-prompt.js';
import { detectEscalation } from '../lib/escalation.js';
import { sendEscalationNotification } from '../lib/email.js';
import { appendChatMessages } from '../lib/chatSessions.js';

function extractLeadContact(messages) {
  // Solo lo que escribió el visitante: las respuestas de Dominga citan
  // nuestro correo y nuestro WhatsApp.
  const fullText = messages
    .filter((m) => m.role === 'user')
    .map((m) => m.content)
    .join(' ');

  const emailMatch = fullText.match(/[\w.+-]+@(?!atiendemelapyme\.cl\b)[\w-]+\.[\w.-]+/i);
  if (emailMatch) {
    return {
      contact: emailMatch[0],
      type: 'email'
    };
  }

  const phoneMatch = fullText.match(/(\+?56)?\s?9\s?\d{4}\s?\d{4}/);
  if (phoneMatch) {
    return {
      contact: phoneMatch[0].replace(/\s/g, ''),
      type: 'phone'
    };
  }

  return null;
}

/**
 * Agrega el mensaje nuevo y la respuesta al historial guardado, en una sola
 * operación (appendChatMessages): recargar la página o escribir dos veces
 * seguidas no borra ni pisa la conversación, ni los mensajes del chat en
 * vivo que guarda ChatRoom. `escalated` queda marcado aunque el siguiente
 * intercambio sea normal.
 */
async function saveChatSession(sessionId, newMessages, escalation, context) {
  const { env } = context;
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) {
    console.warn('Supabase not configured, skipping session save');
    return null;
  }

  try {
    // Se lee lo ya guardado solo para encontrar el contacto que el visitante
    // dejó en mensajes anteriores; escribir no depende de esta lectura.
    let previous = [];
    const existingRes = await fetch(
      `${env.SUPABASE_URL}/rest/v1/chat_sessions?session_id=eq.${encodeURIComponent(sessionId)}&select=messages`,
      { headers: { apikey: env.SUPABASE_SERVICE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}` } }
    );
    if (existingRes.ok) {
      const rows = await existingRes.json();
      previous = Array.isArray(rows) && Array.isArray(rows[0]?.messages) ? rows[0].messages : [];
    }
    const leadContact = extractLeadContact([...previous, ...newMessages]);

    await appendChatMessages(env, sessionId, newMessages, {
      ...(leadContact ? { lead_contact: leadContact.contact } : {}),
      escalated: Boolean(escalation?.escalate),
      ...(escalation?.reason ? { escalation_reason: escalation.reason } : {})
    });

    return { success: true, leadContact };
  } catch (err) {
    console.error('Supabase save error:', err.message);
    return null;
  }
}

// El historial lo manda el navegador: sin tope de caracteres, una sola
// llamada podía llevar ~100.000 (20 mensajes x 5.000) a Claude.
const MAX_HISTORY_CHARS = 8000;

/**
 * Últimos mensajes que caben en MAX_HISTORY_CHARS (y como máximo
 * maxMessages). El último mensaje siempre va: el validador limita cada
 * mensaje a 5.000 caracteres.
 */
function limitHistory(messages, maxMessages = 20) {
  const kept = [];
  let total = 0;
  for (const msg of messages.slice(-maxMessages).reverse()) {
    total += msg.content.length;
    if (kept.length > 0 && total > MAX_HISTORY_CHARS) break;
    kept.unshift(msg);
  }
  // La API de Anthropic exige que la conversación empiece con el usuario.
  while (kept.length > 1 && kept[0].role !== 'user') kept.shift();
  return kept;
}

export async function onRequestPost(context) {
  try {
    const body = await parseJSON(context.request);
    const { messages, sessionId } = body;

    let validMessages;
    try {
      validMessages = validateMessages(messages);
    } catch (err) {
      if (err instanceof ValidationError) {
        throw new ApiError(err.message, 400);
      }
      throw err;
    }

    let validSessionId;
    try {
      validSessionId = validateSessionId(sessionId);
    } catch (err) {
      if (err instanceof ValidationError) {
        throw new ApiError(err.message, 400);
      }
      throw err;
    }

    const clientIP = context.request.headers.get('CF-Connecting-IP') || 'unknown-ip';
    const rlCheck = await limitRequest(context.env, `chat:${clientIP}`, {
      kv: { maxRequests: 30, windowSeconds: 60, maxBurstRequests: 5, burstWindowSeconds: 5 }
    });

    if (!rlCheck.allowed) {
      throw new ApiError(
        `${rlCheck.reason}. Retry after ${rlCheck.retryAfter}s`,
        429
      );
    }

    const limitedMessages = limitHistory(validMessages, 20);

    // Nota: el widget del sitio ya muestra un saludo inicial en el navegador
    // (ver <script> del chat widget) SIN pasar por este endpoint ni tocar el
    // historial. Por eso el primer mensaje que llega acá es siempre un
    // mensaje real del usuario, y siempre debe ir a Claude — nunca a un
    // saludo enlatado, o se ignoraría lo que la persona realmente escribió.
    const systemPrompt = buildSystemPrompt({ canScheduleViaJSON: true });
    const reply = await callClaude(limitedMessages, systemPrompt, context);

    const lastUserMessage = [...limitedMessages].reverse().find((m) => m.role === 'user');
    const escalation = detectEscalation(lastUserMessage?.content || '', reply);

    // Solo se agregan al historial guardado el mensaje nuevo y la respuesta.
    const saved = await saveChatSession(
      validSessionId,
      [
        ...(lastUserMessage ? [lastUserMessage] : []),
        { role: 'assistant', content: reply }
      ],
      escalation,
      context
    );
    const leadContact = saved?.leadContact || extractLeadContact([...limitedMessages, { role: 'assistant', content: reply }]);

    if (escalation.escalate) {
      // No usa waitUntil: este handler no recibe un ExecutionContext (ver
      // el fetch() en src/index.js), así que se espera aquí para no perder
      // la notificación si el Worker termina de responder antes de tiempo.
      const notifyResult = await sendEscalationNotification(
        {
          sessionId: validSessionId,
          reason: escalation.reason,
          userMessage: lastUserMessage?.content || '',
          botReply: reply,
          leadContact: leadContact?.contact || null
        },
        context.env
      );
      if (!notifyResult.success) {
        console.error('Escalation notification failed:', notifyResult.error);
      }
    }

    return sendSuccess({
      reply,
      leadDetected: !!leadContact,
      liveHandoffAvailable: escalation.escalate
    });
  } catch (err) {
    const apiErr =
      err instanceof ApiError
        ? err
        : new ApiError(err.message, 500);

    return sendError(apiErr, context.request.url);
  }
}

export async function onRequestGet(context) {
  return sendSuccess({
    status: 'ok',
    service: 'chat',
    timestamp: new Date().toISOString()
  });
}
