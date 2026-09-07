// src/lib/escalation.js
// Detecta cuándo una conversación del chat web necesita intervención humana:
// (a) el visitante pide explícitamente hablar con una persona, o
// (b) Dominga cae en su respuesta honesta de "no sé" / "no puedo resolver esto"
//     (ver el bloque ---SI NO SABES--- / ---SI PIDEN HABLAR CON UNA PERSONA---
//     del system prompt en dominga-prompt.js).
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
  /responden mejor en contacto@atiendemelapyme\.cl/i,
];

/**
 * @param {string} userMessage - último mensaje del visitante.
 * @param {string} botReply - respuesta que Dominga generó para ese mensaje.
 * @returns {{ escalate: boolean, reason: 'user_requested_human' | 'bot_could_not_resolve' | null }}
 */
export function detectEscalation(userMessage = '', botReply = '') {
  if (HUMAN_REQUEST_PATTERNS.some((re) => re.test(userMessage))) {
    return { escalate: true, reason: 'user_requested_human' };
  }

  if (BOT_FALLBACK_PATTERNS.some((re) => re.test(botReply))) {
    return { escalate: true, reason: 'bot_could_not_resolve' };
  }

  return { escalate: false, reason: null };
}
