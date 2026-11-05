// src/durable-objects/MessageBuffer.js
// Junta los mensajes seguidos de una persona antes de responder. En Instagram,
// Messenger y WhatsApp la gente escribe "Hola" y al rato "¿tienes hora mañana?": sin
// esto el bot contestaba cada mensaje por separado. Cada mensaje nuevo
// reinicia la espera; cuando la persona deja de escribir por DEBOUNCE_MS, se
// responde una vez a todo junto. Hay un objeto por conversación (sessionId),
// así que dos mensajes de la misma persona nunca se procesan en paralelo.
// La alarma, a diferencia de waitUntil, no tiene el tope de 30 s: hay tiempo
// para pensar y usar la agenda.

import { respondToMeta } from '../api/meta-webhook.js';
import { respondToWhatsapp } from '../api/whatsapp.js';

export const DEBOUNCE_MS = 5000;
// Un saludo solo ("Hola", "buenas tardes") casi siempre viene seguido de la
// consulta: se espera más para responder a los dos juntos.
export const GREETING_DEBOUNCE_MS = 15000;
const GREETING_ONLY = /^\s*(hola+|holi|buen[oa]s?( d[ií]as| tardes| noches)?|alo|al[oó]|hey|qu[eé] tal)[\s!.,¿?👋😊🙂]*$/i;

export class MessageBuffer {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }

  // POST con { job } (ver handleEvent en meta-webhook.js y handleMessage en
  // whatsapp.js; los de WhatsApp traen channel: 'whatsapp').
  async fetch(request) {
    const job = await request.json();
    const pending = (await this.state.storage.get('pending')) || [];
    pending.push(job);
    await this.state.storage.put('pending', pending);
    await this.state.storage.setAlarm(Date.now() + (GREETING_ONLY.test(job.text) ? GREETING_DEBOUNCE_MS : DEBOUNCE_MS));
    return new Response('ok');
  }

  async alarm() {
    const pending = (await this.state.storage.get('pending')) || [];
    await this.state.storage.delete('pending');
    if (!pending.length) return;
    try {
      const last = pending.at(-1);
      const text = pending.map((job) => job.text).join('\n');
      if (last.channel === 'whatsapp') await respondToWhatsapp(this.env, last, text);
      else await respondToMeta(this.env, last, text);
    } catch (err) {
      // Sin relanzar: un reintento de la alarma respondería dos veces.
      console.error('MessageBuffer: error al responder:', err.message);
    }
  }
}
