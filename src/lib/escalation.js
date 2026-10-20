// src/lib/escalation.js
// Detecta cuándo una conversación (chat web, WhatsApp, Instagram, Messenger)
// necesita intervención humana:
// (a) el visitante pide explícitamente hablar con una persona,
// (b) Dominga cae en su respuesta honesta de "no sé" / "no puedo resolver esto"
//     (ver el bloque ---SI NO SABES--- / ---SI PIDEN HABLAR CON UNA PERSONA---
//     del system prompt en dominga-prompt.js), o
// (c) en los canales de mensajería, Dominga promete confirmar una cita "por
//     correo" (ese canal no agenda solo: alguien tiene que hacerlo).
// No reemplaza la respuesta del bot: solo dispara una notificación real al
// dueño (ver sendEscalationNotification en email.js) para que el "te dejo
// anotado tu mensaje" que promete el prompt sea cierto.

const HUMAN_REQUEST_PATTERNS = [
  /hablar con (alguien|una persona|un humano|un asesor|un vendedor|el due[nñ]o|la due[nñ]a)/i,
  /quiero hablar con/i,
  /necesito hablar con/i,
  /me pueden llamar/i,
  /atenci[oó]n humana/i,
  /una persona real/i,
];

const BOT_FALLBACK_PATTERNS = [
  /el equipo te responde/i,
  /te dejo anotado tu mensaje/i,
  // hola@ es el buzón público (sitio, llms.txt, Email Routing); contacto@ se
  // mantiene por respuestas antiguas guardadas en el historial.
  /responden mejor en (hola|contacto)@atiendemelapyme\.cl/i,
];

// Promesa en primera persona ("te confirmo/confirmamos por correo"). No
// confundir con "te llega la confirmación por correo" del chat web, que sí
// agenda solo.
const SCHEDULE_PROMISE_PATTERNS = [
  /te (lo |la )?confirm(o|amos) por (correo|mail|email|e-mail)/i,
];

/**
 * @param {string} userMessage - último mensaje del visitante.
 * @param {string} botReply - respuesta que Dominga generó para ese mensaje.
 * @param {{ messaging?: boolean }} [options] - true en WhatsApp/Instagram/Messenger.
 * @returns {{ escalate: boolean, reason: 'user_requested_human' | 'bot_could_not_resolve' | 'wants_to_schedule' | null }}
 */
export function detectEscalation(userMessage = '', botReply = '', { messaging = false } = {}) {
  if (HUMAN_REQUEST_PATTERNS.some((re) => re.test(userMessage))) {
    return { escalate: true, reason: 'user_requested_human' };
  }

  if (BOT_FALLBACK_PATTERNS.some((re) => re.test(botReply))) {
    return { escalate: true, reason: 'bot_could_not_resolve' };
  }

  if (messaging && SCHEDULE_PROMISE_PATTERNS.some((re) => re.test(botReply))) {
    return { escalate: true, reason: 'wants_to_schedule' };
  }

  return { escalate: false, reason: null };
}
