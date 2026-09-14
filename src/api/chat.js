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
import { checkAllLimits } from '../lib/rateLimit.js';
import { buildSystemPrompt } from '../lib/dominga-prompt.js';
import { detectEscalation } from '../lib/escalation.js';
import { sendEscalationNotification } from '../lib/email.js';

function extractLeadContact(messages) {
  const fullText = messages
    .map((m) => m.content)
    .join(' ');

  const emailMatch = fullText.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
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
 * Agrega los mensajes nuevos al historial guardado en vez de reemplazarlo.
 *
 * Antes se hacía upsert de `messages` con el historial que manda el navegador,
 * que vive solo en memoria: si el visitante recargaba la página y volvía a
 * escribir (el sessionId persiste en localStorage), se borraba la conversación
 * anterior, y también los mensajes del chat en vivo que guarda ChatRoom.
 * `escalated` queda marcado aunque el siguiente intercambio sea normal.
 */
async function saveChatSession(sessionId, newMessages, escalation, context) {
  const { env } = context;
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) {
    console.warn('Supabase not configured, skipping session save');
    return null;
  }
  const headers = {
    'Content-Type': 'application/json',
    'apikey': env.SUPABASE_SERVICE_KEY,
    'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`
  };

  try {
    const existingRes = await fetch(
      `${env.SUPABASE_URL}/rest/v1/chat_sessions?session_id=eq.${encodeURIComponent(sessionId)}&select=messages,lead_contact,escalated,escalation_reason`,
      { headers }
    );
    if (!existingRes.ok) {
      // Sin poder leer lo guardado, escribir borraría el historial existente.
      console.error(`Supabase read failed [${existingRes.status}], session not saved`);
      return null;
    }
    const rows = await existingRes.json();
    const existing = Array.isArray(rows) && rows[0] ? rows[0] : {};
    const messages = [...(Array.isArray(existing.messages) ? existing.messages : []), ...newMessages];
    const leadContact = extractLeadContact(messages);

    const response = await fetch(
      `${env.SUPABASE_URL}/rest/v1/chat_sessions?on_conflict=session_id`,
      {
        method: 'POST',
        headers: { ...headers, 'Prefer': 'resolution=merge-duplicates' },
        body: JSON.stringify({
          session_id: sessionId,
          messages,
          lead_contact: leadContact?.contact || existing.lead_contact || null,
          escalated: Boolean(existing.escalated) || Boolean(escalation?.escalate),
          escalation_reason: escalation?.reason || existing.escalation_reason || null,
          updated_at: new Date().toISOString()
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `Supabase save failed [${response.status}]: ${errorText.substring(0, 200)}`
      );
      return null;
    }

    return { success: true, leadContact };
  } catch (err) {
    console.error('Supabase save error:', err.message);
    return null;
  }
}

function limitHistory(messages, maxMessages = 20) {
  if (messages.length <= maxMessages) {
    return messages;
  }

  console.warn(
    `History truncated: ${messages.length} > ${maxMessages} messages`
  );

  return messages.slice(-maxMessages);
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
    const rlCheck = await checkAllLimits(
      clientIP,
      context.env.RATE_LIMIT_KV,
      {
        maxRequests: 30,
        windowSeconds: 60,
        maxBurstRequests: 5,
        burstWindowSeconds: 5
      }
    );

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
    const reply = await callClaude(limitedMessages, systemPrompt, context, {
      model: 'claude-haiku-4-5-20251001',
      maxTokens: 1024
    });

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
