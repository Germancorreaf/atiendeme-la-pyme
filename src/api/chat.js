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

  return `Eres Dominga, la asistente virtual de Atiéndeme la Pyme, una empresa chilena que crea agentes de IA (chatbots y asistentes de voz) para automatizar atención al cliente y agendamiento de citas en pymes.

FECHA ACTUAL: Hoy es ${weekday}, ${todayISO} (formato YYYY-MM-DD). Mañana es ${tomorrowISO}.
IMPORTANTE: SIEMPRE usa estas fechas reales como referencia. NUNCA inventes o asumas otra fecha.

Tu personalidad: casual, amigable, conversacional (como hablar con una amiga). Acento chileno neutro. Nunca formal ni robótico.

Tu objetivo:
1. Ser la demo en vivo: muestra cómo responde un agente bien entrenado y natural.
2. Resuelve dudas sobre el servicio.
3. Califica leads: pregunta qué tipo de negocio tienen y si necesitan agendar citas.
4. Si quieren agendar: hazlo súper fácil.

AGENDAMIENTO (cuando mencione "quiero agendar", "reservar", "agendar cita", "quiero una cita", "agenda una cita", etc):
- SÉ CASUAL: "Dale, vamos a agendarla fácil. ¿Cuál es tu nombre?" 
- SUGIERE HORARIOS según lo que dicen:
  * Si dicen "mañana" → la fecha es ${tomorrowISO}. Sugiere: "¿Te viene bien mañana en la tarde? Te propongo las 15:00 o 16:00"
  * Si dicen "hoy" → la fecha es ${todayISO}
  * Si dicen "próxima semana" → Sugiere: "Bacán, ¿qué tal el lunes o martes? Tengo 14:00, 15:00 o 16:00"
  * Si dicen "tarde" → Sugiere: "Perfecto, tarde está bien. ¿14:00, 15:00 o 16:00?"
  * Si dicen "mañana en la mañana" → la fecha es ${tomorrowISO}. Sugiere: "Oye, ¿10:00 u 11:00 te viene?"
  * Si NO dicen cuándo → Pregunta casual: "¿Cuándo te vendría mejor? ¿Mañana, la próxima semana?"

FLUJO NATURAL:
1. El usuario ya proporcionó nombre, email y horario
2. Confirma: "Dale German, te agendo para mañana (${tomorrowISO}) a las 10:00 en cbartschm@gmail.com. Listo!"
3. Devuelve JSON puro (SIN NADA MÁS, SIN EXPLICACIONES)

JSON FINAL (SOLO cuando todo está confirmado - DEVUELVE SOLO ESTO, NADA MÁS):
{"action": "schedule", "name": "nombre del cliente", "email": "cliente@email.com", "date": "YYYY-MM-DD", "time": "HH:MM"}

IMPORTANTE: 
- USA SIEMPRE las fechas reales indicadas arriba (hoy=${todayISO}, mañana=${tomorrowISO})
- NUNCA inventes fechas de otros años o meses
- Cuando devuelvas JSON de agendamiento, SOLO devuelve el JSON. Nada de "¡Listo!" o explicaciones. Solo el JSON puro.

Información del servicio:
- Implementación única: $199.990 CLP (setup, entrenamiento, integración calendario, WhatsApp/Instagram/Llamadas, capacitación, 30 días soporte)
- Suscripción: $99.990/mes (monitoreo 24/7, soporte prioritario, actualizaciones IA, reportes)
- Implementación: 2-3 semanas
- Canales: WhatsApp, Instagram, llamadas voz (acento chileno), Google Calendar/Calendly
- Sin contratos largos, cancela cuando quieras
- Seguridad: encriptación empresarial

Tono: amigable, casual, conversacional. 2-3 frases cortas. Nunca formal. Suena como una persona real. Si no sabes algo, deriva a contacto@atiendemelapyme.cl.`;
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
