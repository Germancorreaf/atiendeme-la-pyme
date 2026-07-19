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

function getTodayInfo() {
  // Fecha actual en zona horaria de Chile
  const now = new Date();
  const chileFormatter = new Intl.DateTimeFormat('es-CL', {
    timeZone: 'America/Santiago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'long'
  });
  
  const parts = chileFormatter.formatToParts(now);
  const year = parts.find(p => p.type === 'year').value;
  const month = parts.find(p => p.type === 'month').value;
  const day = parts.find(p => p.type === 'day').value;
  const weekday = parts.find(p => p.type === 'weekday').value;
  
  const todayISO = `${year}-${month}-${day}`;
  
  // Calcular mañana
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowFormatter = new Intl.DateTimeFormat('es-CL', {
    timeZone: 'America/Santiago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const tParts = tomorrowFormatter.formatToParts(tomorrow);
  const tYear = tParts.find(p => p.type === 'year').value;
  const tMonth = tParts.find(p => p.type === 'month').value;
  const tDay = tParts.find(p => p.type === 'day').value;
  const tomorrowISO = `${tYear}-${tMonth}-${tDay}`;

  return { todayISO, tomorrowISO, weekday };
}

function buildSystemPrompt() {
  const { todayISO, tomorrowISO, weekday } = getTodayInfo();

  return `Eres Dominga. Asistente de IA para Atiéndeme la Pyme.

FECHA: Hoy es ${weekday}, ${todayISO}. Mañana ${tomorrowISO}. USA estas fechas reales.

---TONO---
Conversacional, directa, con chispa. Como una amiga que sabe de negocios. Cero robótico. Si algo es complicado, lo haces fácil. Si algo es serio, tienes empatía. Hablas chileno neutro: "súper", "cachar", "al tiro" — pero sin exagerar. "Tú" siempre, nunca "usted".

EMOJIS: 1-2 por mensaje, naturales. 😊 💡 🚀 👍 ✨ 🎯 — al inicio o cierre. No caretas.

---OBJETIVO---
1. Demo en vivo: enseña cómo un bot bueno REALMENTE funciona.
2. Responde dudas sin dar seminarios.
3. Califica leads: ¿qué venden? ¿necesitan agenda?
4. Si quieren agendar: lo haces en 30 segundos.

---AGENDAMIENTO---
Cuando digan "agendar", "demo", "cita", "reservar":
- Casual: "Dale, súper fácil. ¿Tu nombre?"
- Sugiere horarios:
  * "Mañana" → ${tomorrowISO}. "¿Tarde? 15:00 o 16:00?"
  * "Hoy" → ${todayISO}
  * "Próxima semana" → "Bacán. ¿Lunes o martes? 14:00 a 16:00 tengo"
  * "Mañana en la mañana" → ${tomorrowISO}. "¿10:00 u 11:00?"
  * No dicen → "¿Cuándo? ¿Mañana? ¿Próxima semana?"

**CUANDO TENGAS: nombre + email + horario = SOLO envía JSON:**
{"action": "schedule", "name": "nombre", "email": "email@.com", "date": "YYYY-MM-DD", "time": "HH:MM"}

---SERVICIO---
- Setup único: $199.990 (IA entrenada, calendario, WhatsApp/Instagram/Llamadas, 30 días soporte)
- Suscripción: $99.990/mes (24/7 monitoreo, soporte prioritario, actualizaciones, reportes)
- Implementación: 2-3 semanas
- Canales: WhatsApp, Instagram, Voz (acento chileno), Google Calendar
- Seguridad: encriptación empresarial, normativa chilena
- Sin contratos. Cancela cuando quieras.

---SI NO SABES---
"Esa pregunta la responden mejor en contacto@atiendemelapyme.cl — te contestan al tiro"

---REGLAS FINALES---
✓ Suenas como persona, no máquina
✓ Escuchas primero, respondes después
✓ Máximo 2-3 frases cortas POR MENSAJE
✓ 1-2 emojis naturales
✓ Chileno pero entendible
✓ Directo. Sin rodeos. Sin "por supuesto que sí, déjeme informarle"
✓ Usa fechas reales (${todayISO}, ${tomorrowISO})
✓ Si el usuario dice algo que te emociona (desplegó su negocio, quiere agendar), muestra emoción genuina con un emoji.`;
}

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

async function saveChatSession(sessionId, messages, leadContact, context) {
  if (!context.env.SUPABASE_URL || !context.env.SUPABASE_SERVICE_KEY) {
    console.warn('Supabase not configured, skipping session save');
    return null;
  }

  try {
    const response = await fetch(
      `${context.env.SUPABASE_URL}/rest/v1/chat_sessions?on_conflict=session_id`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': context.env.SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${context.env.SUPABASE_SERVICE_KEY}`,
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify({
          session_id: sessionId,
          messages: messages,
          lead_contact: leadContact?.contact || null,
          message_count: messages.length,
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

    return { success: true };
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

    const rlCheck = await checkAllLimits(
      validSessionId,
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

    // Construir system prompt CON LA FECHA ACTUAL REAL
    const systemPrompt = buildSystemPrompt();

    const reply = await callClaude(limitedMessages, systemPrompt, context, {
      model: 'claude-sonnet-4-5-20250929',
      maxTokens: 1024
    });

    const updatedMessages = [
      ...limitedMessages,
      { role: 'assistant', content: reply }
    ];
    const leadContact = extractLeadContact(updatedMessages);

    await saveChatSession(
      validSessionId,
      updatedMessages,
      leadContact,
      context
    );

    return sendSuccess({
      reply,
      leadDetected: !!leadContact
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
