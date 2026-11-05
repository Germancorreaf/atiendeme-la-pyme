import { describe, it, expect } from 'vitest';
import { returningNote } from '../../src/lib/chatSessions.js';

// Un "Hola" de hoy junto a los "Hola" de días anteriores se leía como alguien
// que saluda sin parar: tras un silencio largo se le avisa al modelo.

const NOW = Date.parse('2026-11-05T20:00:00Z');
const at = (iso) => ({ role: 'assistant', content: 'x', timestamp: iso });

describe('returningNote', () => {
  it('sin historial o conversación en curso: sin nota', () => {
    expect(returningNote([], NOW)).toBeNull();
    expect(returningNote([at('2026-11-05T19:30:00Z')], NOW)).toBeNull();
    expect(returningNote([{ role: 'user', content: 'sin fecha' }], NOW)).toBeNull();
  });

  it('vuelve después de horas: avisa que es una conversación nueva', () => {
    const note = returningNote([at('2026-11-05T16:00:00Z')], NOW);
    expect(note).toContain('4 horas');
    expect(note).toContain('conversación nueva');
  });

  it('vuelve después de días: lo dice en días', () => {
    expect(returningNote([at('2026-10-20T18:00:00Z')], NOW)).toContain('16 días');
  });
});
