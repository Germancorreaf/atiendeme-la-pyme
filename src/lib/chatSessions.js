// src/lib/chatSessions.js
// Flujo común de los canales de mensajería (WhatsApp en api/whatsapp.js,
// Instagram/Messenger en api/meta-webhook.js): historial -> bot (del cliente
// o Dominga) -> Claude -> divulgación de IA -> escalamiento -> guardar ->
// enviar -> avisar. Lo propio de cada canal (firma, duplicados, límites,
// conexión, cómo se envía) queda en su webhook.

import { callClaude, callClaudeWithTools } from './anthropic.js';
import { botFor, withAiDisclosure } from './dominga-prompt.js';
import { detectEscalation } from './escalation.js';
import { sendEscalationNotification } from './email.js';
import { getCliente } from './clients.js';
import { BOOKING_CHECK, BOOKING_TOOLS, bookingRunner, hasBooking } from './booking.js';

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

async function getClaudeReply(userMessage, history, context, systemPrompt, channel, runTool = null) {
  const messages = [
    ...history.map((msg) => ({ role: msg.role, content: msg.content })),
    { role: 'user', content: userMessage }
  ];
  try {
    if (runTool) {
      return await callClaudeWithTools(messages, systemPrompt, context, { tools: BOOKING_TOOLS, runTool, mustCheck: BOOKING_CHECK, effort: 'medium' });
    }
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

// Las respuestas por chat van en varios globos (separados por una línea en
// blanco) y pueden terminar con "OPCIONES: a | b | c", que Instagram y
// Messenger muestran como botones de respuesta rápida (máx. 20 caracteres).
const MAX_BUBBLES = 4;
const MAX_OPTIONS = 3;
const MAX_OPTION_CHARS = 20;

export function splitReply(reply) {
  let options = [];
  const text = String(reply).split('\n').filter((line) => {
    const m = line.match(/^\s*OPCIONES:\s*(.+)$/i);
    if (m) options = m[1].split('|').map((o) => o.trim()).filter(Boolean).slice(0, MAX_OPTIONS);
    return !m;
  }).join('\n');
  let bubbles = text.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  if (bubbles.length > MAX_BUBBLES) {
    bubbles = [...bubbles.slice(0, MAX_BUBBLES - 1), bubbles.slice(MAX_BUBBLES - 1).join('\n\n')];
  }
  // Una opción demasiado larga para un botón va como texto.
  if (options.some((o) => o.length > MAX_OPTION_CHARS)) {
    bubbles.push(`Opciones: ${options.join(' · ')}`);
    options = [];
  }
  if (!bubbles.length) bubbles = [options.length ? '¿Cuál prefieres?' : String(reply).trim()];
  return { bubbles, options };
}

/** Une globos y opciones en un solo mensaje (canales sin botones). */
export function joinReply({ bubbles, options }) {
  return [...bubbles, ...(options.length ? [`Opciones: ${options.join(' · ')}`] : [])].join('\n\n');
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
 * @param {(parts: {bubbles: string[], options: string[]}) => Promise<void>} opts.send - ver splitReply.
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
  // Cliente de la conexión (bot_prompt, nombre y agenda). Si tiene agenda
  // conectada, el bot consulta y reserva en su Google Calendar.
  const cliente = connection?.cliente_id ? await getCliente(env, connection.cliente_id) : null;
  const booking = hasBooking(cliente);
  const bot = botFor(connection, cliente, { booking });
  const runTool = booking ? bookingRunner(cliente, env, { sessionId, contact: notifyContact || leadContact, channel }) : null;
  const reply = withAiDisclosure(
    await getClaudeReply(userMessage, history, context, bot.systemPrompt, channel, runTool),
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
  await send(splitReply(reply));

  if (escalation.escalate) {
    await sendEscalationNotification({
      sessionId, reason: escalation.reason, userMessage, botReply: reply,
      leadContact: notifyContact || senderName || profile?.name || null,
      channel: bot.businessName ? `${channel} · ${bot.businessName}` : channel
    }, env);
  }
}
