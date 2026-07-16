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

// Función para calcular fechas
function calculateDate(dayReference) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let targetDate = new Date(today);
  
  const ref = dayReference.toLowerCase();
  
  if (ref.includes('hoy') || ref.includes('today')) {
    // Hoy
  } else if (ref.includes('mañana') || ref.includes('tomorrow') || ref.includes('manana')) {
    targetDate.setDate(targetDate.getDate() + 1);
  } else if (ref.includes('pasado mañana') || ref.includes('day after tomorrow')) {
    targetDate.setDate(targetDate.getDate() + 2);
  } else if (ref.includes('próxima semana') || ref.includes('next week')) {
    targetDate.setDate(targetDate.getDate() + 7);
  } else if (ref.includes('lunes') || ref.includes('monday')) {
    const day = targetDate.getDay();
    let daysToAdd = 1 - day;
    if (daysToAdd <= 0) daysToAdd += 7;
    targetDate.setDate(targetDate.getDate() + daysToAdd);
  } else if (ref.includes('martes') || ref.includes('tuesday')) {
    const day = targetDate.getDay();
    let daysToAdd = 2 - day;
    if (daysToAdd <= 0) daysToAdd += 7;
    targetDate.setDate(targetDate.getDate() + daysToAdd);
  }
  
  return targetDate.toISOString().split('T')[0];
}

const SYSTEM_PROMPT = `Eres Dominga, la asistente virtual de Atiéndeme la Pyme, una empresa chilena que crea agentes de IA (chatbots y asistentes de voz) para automatizar atención al cliente y agendamiento de citas en pymes.

Tu personalidad: casual, amigable, conversacional (como hablar con una amiga). Acento chileno neutro. Nunca formal ni robótico.

Tu objetivo:
1. Ser la demo en vivo: muestra cómo responde un agente bien entrenado y natural.
2. Resuelve dudas sobre el servicio.
3. Califica leads: pregunta qué tipo de negocio tienen y si necesitan agendar citas.
4. Si quieren agendar: hazlo súper fácil.

AGENDAMIENTO (cuando mencione "quiero agendar", "reservar", "agendar cita", "quiero una cita", "agenda una cita", etc):
- SÉ CASUAL: "Dale, vamos a agendarla fácil. ¿Cuál es tu nombre?" 
- SUGIERE HORARIOS según lo que dicen:
  * Si dicen "mañana" → Sugiere: "¿Te viene bien mañana en la tarde? Te propongo las 15:00 o 16:00"
  * Si dicen "próxima semana" → Sugiere: "Bacán, ¿qué tal el lunes o martes? Tengo 14:00, 15:00 o 16:00"
  * Si dicen "tarde" → Sugiere: "Perfecto, tarde está bien. ¿14:00, 15:00 o 16:00?"
  * Si dicen "mañana en la mañana" → Sugiere: "Oye, ¿10:00 u 11:00 te viene?"
  * Si NO dicen cuándo → Pregunta casual: "¿Cuándo te vendría mejor? ¿Mañana, la próxima semana?"

FLUJO NATURAL:
1. El usuario ya proporcionó nombre, email y horario
2. Confirma: "Dale German, te agendo para mañana a las 10:00 en cbartschm@gmail.com. Listo!"
3. Devuelve JSON puro (SIN NADA MÁS, SIN EXPLICACIONES)

JSON FINAL (SOLO cuando todo está confirmado - DEVUELVE SOLO ESTO, NADA MÁS):
{"action": "schedule", "name": "nombre del cliente", "email": "cliente@email.com", "date": "YYYY-MM-DD", "time": "HH:MM"}

IMPORTANTE: 
- La fecha debe ser en formato YYYY-MM-DD (ejemplo: 2026-07-17 para mañana si hoy es 2026-07-16)
- Si dicen "mañana", la fecha es HOY + 1 día
- Cuando devuelvas JSON de agendamiento, SOLO devuelve el JSON. Nada de "¡Listo!" o explicaciones. Solo el JSON puro.

Información del servicio:
- Implementación única: $199.990 CLP (setup, entrenamiento, integración calendario, WhatsApp/Instagram/Llamadas, capacitación, 30 días soporte)
- Suscripción: $99.990/mes (monitoreo 24/7, soporte prioritario, actualizaciones IA, reportes)
- Implementación: 2-3 semanas
- Canales: WhatsApp, Instagram, llamadas voz (acento chileno), Google Calendar/Calendly
- Sin contratos largos, cancela cuando quieras
- Seguridad: encriptación empresarial

Tono: amigable, casual, conversacional. 2-3 frases cortas. Nunca formal. Suena como una persona real. Si no sabes algo, deriva a contacto@atiendemelapyme.cl.`;

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

    const reply = await callClaude(limitedMessages, SYSTEM_PROMPT, context, {
      model: 'claude-sonnet-4-5-20250929',
      maxTokens: 1024
    });

    // Si la respuesta contiene JSON de agendamiento, corregir la fecha
    let processedReply = reply;
    try {
      const jsonMatch = reply.match(/\{[\s\S]*"action"\s*:\s*"schedule"[\s\S]*\}/);
      if (jsonMatch) {
        const scheduleData = JSON.parse(jsonMatch[0]);
        
        // Recalcular fecha si dice "mañana"
        if (scheduleData.date === 'mañana' || scheduleData.date === 'tomorrow') {
          const today = new Date();
          today.setDate(today.getDate() + 1);
          scheduleData.date = today.toISOString().split('T')[0];
        }
        
        // Recalcular si contiene referencias de días
        if (scheduleData.date && !scheduleData.date.match(/\d{4}-\d{2}-\d{2}/)) {
          scheduleData.date = calculateDate(scheduleData.date);
        }
        
        processedReply = JSON.stringify(scheduleData);
      }
    } catch (parseErr) {
      // Si no es JSON válido, usar la respuesta original
    }

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
      reply: processedReply,
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
