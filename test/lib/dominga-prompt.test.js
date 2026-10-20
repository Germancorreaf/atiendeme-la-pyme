import { describe, it, expect } from 'vitest';
import { buildSystemPrompt } from '../../src/lib/dominga-prompt.js';
import { detectEscalation } from '../../src/lib/escalation.js';

// El prompt de Dominga y el resto del sistema dependen de frases exactas:
// escalation.js detecta las de derivación y agendamiento, y el widget del chat
// web agenda con el JSON. Si se reescribe el prompt, estas pruebas avisan.

const web = buildSystemPrompt({ canScheduleViaJSON: true });
const messaging = buildSystemPrompt({ canScheduleViaJSON: false, brief: true });

function quotedPhrases(prompt) {
  return [...prompt.matchAll(/"([^"]*)"/g)].map((m) => m[1]).filter((f) => f.length >= 12);
}

describe('prompt de Dominga', () => {
  it('pide identificarse como asistente de IA (políticas de Meta)', () => {
    for (const p of [web, messaging]) {
      expect(p).toMatch(/asistente de IA/);
      expect(p).toMatch(/en cada mensaje|en todos tus mensajes/i);
    }
  });

  it('las frases de derivación del prompt disparan el aviso al equipo', () => {
    const phrases = quotedPhrases(messaging);
    const human = phrases.find((f) => /te dejo anotado tu mensaje/i.test(f));
    const unknown = phrases.find((f) => /responden mejor en hola@atiendemelapyme\.cl/i.test(f));
    expect(human).toBeDefined();
    expect(unknown).toBeDefined();
    expect(detectEscalation('hola', human).escalate).toBe(true);
    expect(detectEscalation('hola', unknown).escalate).toBe(true);
  });

  it('en mensajería, la frase para agendar dispara el aviso "quiere agendar"', () => {
    const phrase = quotedPhrases(messaging).find((f) => /por correo/i.test(f));
    expect(phrase).toBeDefined();
    expect(detectEscalation('quiero agendar', phrase, { messaging: true }).reason).toBe('wants_to_schedule');
  });

  it('el chat web agenda con el JSON que entiende el widget; mensajería no lo usa', () => {
    expect(web).toContain('{"action": "schedule", "name": "nombre", "email": "email@.com", "date": "YYYY-MM-DD", "time": "HH:MM"}');
    expect(messaging).not.toContain('"action": "schedule"');
  });

  it('trae los precios reales de la landing y no inventa casos de éxito', () => {
    for (const price of ['$149.990', '$49.990', '$249.990', '$99.990', '$449.990', '$179.990', '$199.990']) {
      expect(web).toContain(price);
    }
    expect(web).toMatch(/no inventes/i);
  });

  it('usa las fechas reales de hoy y mañana', () => {
    expect(web).toMatch(/Hoy es \S+, \d{4}-\d{2}-\d{2}/);
  });
});
