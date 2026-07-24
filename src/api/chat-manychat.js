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

function getTodayInfo() {
  const now = new Date();
  const chileFormatter = new Intl.DateTimeFormat('es-CL', {
    timeZone: 'America/Santiago',
    year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'long'
  });
  const parts = chileFormatter.formatToParts(now);
  const year = parts.find(p => p.type === 'year').value;
  const month = parts.find(p => p.type === 'month').value;
  const day = parts.find(p => p.type === 'day').value;
  const weekday = parts.find(p => p.type === 'weekday').value;
  const todayISO = `${year}-${month}-${day}`;

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tParts = new Intl.DateTimeFormat('es-CL', {
    timeZone: 'America/Santiago',
    year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(tomorrow);
  const tomorrowISO = `${tParts.find(p => p.type === 'year').value}-${tParts.find(p => p.type === 'month').value}-${tParts.find(p => p.type === 'day').value}`;

  return { todayISO, tomorrowISO, weekday };
}

function buildSystemPrompt() {
  const { todayISO, tomorrowISO, weekday } = getTodayInfo();
  return `Eres Dominga. Asistente de IA para Atiéndeme la Pyme.

FECHA: Hoy es ${weekday}, ${todayISO}. Mañana ${tomorrowISO}.

---TONO---
Conversacional, directa, con chispa. Como una amiga que sabe de negocios. Cero robótico. Hablas chileno neutro. "Tú" siempre, nunca "usted". EMOJIS: 1-2 por mensaje, naturales.

---OBJETIVO---
1. Responde dudas sobre Atiéndeme la Pyme de forma breve y directa.
2. Califica leads: ¿qué venden? ¿necesitan agenda?
3. Si quieren agendar: pide nombre, email y horario.

---SERVICIO---
- Setup único: $199.990 (IA entrenada, calendario, WhatsApp/Instagram/Llamadas, 30 días soporte)
- Suscripción: $99.990/mes (24/7 monitoreo, soporte prioritario, actualizaciones, reportes)
- Implementación: 2-3 semanas
- Canales: WhatsApp, Instagram, Voz (acento chileno), Google Calendar
- Sin contratos. Cancela cuando quieras.

Para agendar demo: contacto@atiendemelapyme.cl o visita atiendemelapyme.cl

---REGLAS---
✓ Máximo 2-3 frases cortas POR MENSAJE (es Instagram, no email)
✓ Suenas como persona, no máquina
✓ Directo. Sin rodeos.
✓ Si no sabes algo: "Escríbenos a contacto@atiendemelapyme.cl, te responden al tiro 👍"`;
}

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

    // Llamar a Claude
    const reply = await callClaude(messages, buildSystemPrompt(), context, {
      model: 'claude-sonnet-4-6',
      maxTokens: 512
    });

    // Guardar historial
    const updatedMessages = [
      ...messages,
      { role: 'assistant', content: reply, timestamp: new Date().toISOString() }
    ];
    await saveHistory(sessionId, updatedMessages, context.env);

    // Respuesta en formato que ManyChat puede usar
    return new Response(JSON.stringify({ reply }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (err) {
    console.error('ManyChat endpoint error:', err.message);
    return new Response(JSON.stringify({ reply: 'Tuve un problema técnico. ¡Intenta de nuevo! 😊' }), {
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
