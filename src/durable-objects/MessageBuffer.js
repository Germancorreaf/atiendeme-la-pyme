// src/durable-objects/MessageBuffer.js
// Junta los mensajes seguidos de una persona antes de responder. En Instagram
// y Messenger la gente escribe "Hola" y al rato "¿tienes hora mañana?": sin
// esto el bot contestaba cada mensaje por separado. Cada mensaje nuevo
// reinicia la espera; cuando la persona deja de escribir por DEBOUNCE_MS, se
// responde una vez a todo junto. Hay un objeto por conversación (sessionId),
// así que dos mensajes de la misma persona nunca se procesan en paralelo.
// La alarma, a diferencia de waitUntil, no tiene el tope de 30 s: hay tiempo
// para pensar y usar la agenda.

import { respondToMeta } from '../api/meta-webhook.js';

export const DEBOUNCE_MS = 5000;

export class MessageBuffer {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }

  // POST con { job } (ver handleEvent en meta-webhook.js).
  async fetch(request) {
    const job = await request.json();
    const pending = (await this.state.storage.get('pending')) || [];
    pending.push(job);
    await this.state.storage.put('pending', pending);
    await this.state.storage.setAlarm(Date.now() + DEBOUNCE_MS);
    return new Response('ok');
  }

  async alarm() {
    const pending = (await this.state.storage.get('pending')) || [];
    await this.state.storage.delete('pending');
    if (!pending.length) return;
    try {
      await respondToMeta(this.env, pending.at(-1), pending.map((job) => job.text).join('\n'));
    } catch (err) {
      // Sin relanzar: un reintento de la alarma respondería dos veces.
      console.error('MessageBuffer: error al responder:', err.message);
    }
  }
}
