// src/lib/chatSessions.js
// Flujo común de los canales de mensajería (WhatsApp en api/whatsapp.js,
// Instagram/Messenger en api/meta-webhook.js): historial -> bot (del cliente
// o Dominga) -> Claude -> divulgación de IA -> escalamiento -> guardar ->
// enviar -> avisar. Lo propio de cada canal (firma, duplicados, límites,
// conexión, cómo se envía) queda en su webhook.

import { callClaude } from './anthropic.js';
import { botFor, withAiDisclosure } from './dominga-prompt.js';
import { detectEscalation } from './escalation.js';
import { sendEscalationNotification } from './email.js';

// Mensajes de historial que se le pasan al modelo.
const HISTORY_FOR_MODEL = 10;

function supabaseHeaders(env, extra = {}) {
  return { apikey: env.SUPABASE_SERVICE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`, ...extra };
}

/**
 * Agrega mensajes a una conversación en una sola operación (función
 * append_chat_messages de Supabase, ver supabase/2026-10-20-*.sql): dos
 * mensajes casi simultáneos ya no se pisan. `fields` (lead_contact,
 * sender_name, sender_avatar_url, escalated, escalation_reason) solo se
 * escriben si vienen; escalated nunca vuelve a false.
 * La usan el chat web, los canales de mensajería y el chat en vivo.
 */
export async function appendChatMessages(env, sessionId, messages, fields = {}) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) return;
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/append_chat_messages`, {
    method: 'POST',
    headers: supabaseHeaders(env, { 'Content-Type': 'application/json' }),
    body: JSON.stringify({ p_session_id: sessionId, p_messages: messages, p_fields: fields })
  });
  if (!res.ok) {
    throw new Error(`append_chat_messages [${res.status}]: ${(await res.text()).slice(0, 200)}`);
  }
}

async function loadSession(sessionId, env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) return null;
  const response = await fetch(
    `${env.SUPABASE_URL}/rest/v1/chat_sessions?session_id=eq.${encodeURIComponent(sessionId)}`,
    { headers: supabaseHeaders(env) }
  );
  const rows = await response.json();
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
}

async function getConversationHistory(sessionId, env, channel) {
  try {
    return (await loadSession(sessionId, env))?.messages || [];
  } catch (err) {
    console.error(`Error fetching ${channel} history:`, err.message);
    return [];
  }
}

async function getClaudeReply(userMessage, history, context, systemPrompt, channel) {
  const messages = [
    ...history.map((msg) => ({ role: msg.role, content: msg.content })),
    { role: 'user', content: userMessage }
  ];
  try {
    return await callClaude(messages, systemPrompt, context);
  } catch (err) {
    console.error(`Claude call failed for ${channel}:`, err.message);
    return 'Lo siento, tuve un problema técnico. Intenta de nuevo.';
  }
}

async function saveExchange(sessionId, { userMessage, reply, leadContact, senderName, senderAvatarUrl, escalation }, env) {
  const now = new Date().toISOString();
  try {
    await appendChatMessages(env, sessionId, [
      { role: 'user', content: userMessage, timestamp: now },
      { role: 'assistant', content: reply, timestamp: now }
    ], {
      lead_contact: leadContact,
      ...(senderName ? { sender_name: senderName } : {}),
      ...(senderAvatarUrl ? { sender_avatar_url: senderAvatarUrl } : {}),
      escalated: Boolean(escalation.escalate),
      ...(escalation.reason ? { escalation_reason: escalation.reason } : {})
    });
  } catch (err) {
    console.error('Error saving message to Supabase:', err.message);
  }
}

/**
 * Responde un mensaje entrante de un canal de mensajería.
 * @param {object} opts
 * @param {string} opts.sessionId - conversación (separada por negocio).
 * @param {string} opts.userMessage
 * @param {object|null} opts.connection - fila de la conexión (bot_prompt).
 * @param {'WhatsApp'|'Instagram'|'Messenger'} opts.channel
 * @param {string} opts.leadContact - lo que se guarda como contacto.
 * @param {string} [opts.notifyContact] - contacto que va en el aviso al dueño.
 * @param {string|null} [opts.senderName]
 * @param {() => Promise<{name, avatarUrl}|null>} [opts.loadProfile] - solo en el primer mensaje.
 * @param {(reply: string) => Promise<void>} opts.send
 * @param {object} opts.context - { env, ... } del Worker.
 */
export async function replyToMessage({ sessionId, userMessage, connection, channel, leadContact, notifyContact = null, senderName = null, loadProfile, send, context }) {
  const { env } = context;
  // Historial completo: decide la divulgación de IA. Al modelo solo van los
  // últimos mensajes.
  const fullHistory = await getConversationHistory(sessionId, env, channel);
  const history = fullHistory.slice(-HISTORY_FOR_MODEL);

  // Bot del cliente (bot_prompt de su conexión) o Dominga si no tiene. El
  // primer mensaje también va a Claude: un saludo genérico dejaría sin
  // respuesta lo que la persona preguntó; la divulgación de IA la fuerza
  // withAiDisclosure (historial vacío => siempre se antepone la línea).
  const bot = botFor(connection);
  const reply = withAiDisclosure(
    await getClaudeReply(userMessage, history, context, bot.systemPrompt, channel),
    fullHistory, Date.now(), bot.disclosureLine
  );

  // El perfil (nombre/foto) solo se pide en el primer mensaje de cada
  // conversación: evita una llamada extra a la Graph API por mensaje.
  const profile = history.length === 0 && loadProfile ? await loadProfile() : null;

  const escalation = detectEscalation(userMessage, reply, { messaging: true });
  await saveExchange(sessionId, {
    userMessage, reply, leadContact, escalation,
    senderName: senderName || profile?.name || null,
    senderAvatarUrl: profile?.avatarUrl || null
  }, env);
  await send(reply);

  if (escalation.escalate) {
    await sendEscalationNotification({
      sessionId, reason: escalation.reason, userMessage, botReply: reply,
      leadContact: notifyContact || senderName || profile?.name || null,
      channel: bot.businessName ? `${channel} · ${bot.businessName}` : channel
    }, env);
  }
}
