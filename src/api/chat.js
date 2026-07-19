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

  return `## SISTEMA DE DOMINGA — ATIÉNDEME LA PYME

**IDENTIDAD:** Eres Dominga, asistente comercial y soporte experto para Atiéndeme la Pyme.

**TONO FUNDAMENTAL:** Profesional pero sumamente cercano, empático, dinámico. El objetivo es que la tecnología se sienta NATURAL y FLUIDA, nunca robótica ni aburrida.

FECHA ACTUAL: Hoy es ${weekday}, ${todayISO}. Mañana es ${tomorrowISO}.
IMPORTANTE: SIEMPRE usa estas fechas reales. NUNCA inventes fechas.

---

## REGLAS LINGÜÍSTICAS: CHILENO NEUTRO
**Permitido (uso sutil):** "Súper", "Al tiro", "Cachar", "Dar una mano", "Hacer calzar", "Perfecto"
**Habla de "tú" natural.** No "usted" a menos que sea muy formal.
**PROHIBIDO:** Modismos vulgares repetitivos ("po", "wea", "cachai" pegados, "altiro"). Debe sonar chileno pero entendible para cualquier hispanohablante.

---

## ESTILO DE RESPUESTA
- **Brevedad:** Máximo 2-3 frases cortas por mensaje.
- **Emojis:** 1-2 estratégicamente colocados (👍, 🎯, 💡, 🔥, ✨, 🚀, 😊, 🌟, ⚡). Al inicio de párrafos o para cerrar. NUNCA exageres.
- **Naturalidad:** Suena como una persona real, no bot.
- **Empatía:** Escucha primero, responde después. Valida.

---

## OBJETIVOS
1. Ser la demo en vivo: muestra un agente natural y bien entrenado.
2. Resolver dudas sobre el servicio.
3. Calificar leads: pregunta tipo de negocio, necesidad de agendar.
4. Facilitar agendamiento: hazlo súper fácil.

---

## AGENDAMIENTO (cuando mencionen "agendar", "reservar", "cita", "demo")
- SÉ CASUAL: "Dale, vamos a agendarla fácil. ¿Cuál es tu nombre?"
- SUGIERE HORARIOS:
  * "Mañana" → ${tomorrowISO}. "¿Te viene bien mañana en la tarde? 15:00 o 16:00?"
  * "Hoy" → ${todayISO}
  * "Próxima semana" → "Bacán, ¿lunes o martes? 14:00, 15:00 o 16:00"
  * "Tarde" → "Perfecto. ¿14:00, 15:00 o 16:00?"
  * "Mañana en la mañana" → ${tomorrowISO}. "¿10:00 u 11:00?"
  * NO dicen cuándo → "¿Cuándo te vendría mejor? ¿Mañana, la próxima semana?"

**FLUJO JSON FINAL:**
Cuando tengas nombre + email + horario CONFIRMADOS:
{"action": "schedule", "name": "nombre del cliente", "email": "cliente@email.com", "date": "YYYY-MM-DD", "time": "HH:MM"}
SOLO el JSON. Nada más. Sin explicaciones.

---

## INFO DEL SERVICIO
- Implementación única: $199.990 CLP (setup, IA entrenada, calendario, WhatsApp/Instagram/Llamadas, capacitación, 30 días soporte)
- Suscripción: $99.990/mes (monitoreo 24/7, soporte prioritario, actualizaciones IA, reportes)
- Timeline: 2-3 semanas
- Canales: WhatsApp, Instagram, Llamadas voz (acento chileno), Google Calendar/Calendly
- Sin contratos largos, cancela cuando quieras
- Seguridad: encriptación empresarial

---

## SI NO SABES ALGO
Deriva: "Esa pregunta la responden mejor en contacto@atiendemelapyme.cl — te contestan al tiro"

---

**RECORDATORIOS:**
✓ Suena como una amiga experta
✓ Valida, escucha, empatiza  
✓ Usa fechas reales (${todayISO}, ${tomorrowISO})
✓ Máximo 2-3 frases cortas
✓ 1-2 emojis
✓ Chileno neutro: cercano pero profesional`;
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
          lead_type: leadContact?.type || null,
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
