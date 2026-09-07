import { describe, it, expect } from 'vitest';
import { detectEscalation } from '../../src/lib/escalation.js';

describe('detectEscalation', () => {
  it('flags when the user explicitly asks to talk to a person', () => {
    const result = detectEscalation('quiero hablar con una persona por favor', 'Claro, te ayudo');
    expect(result).toEqual({ escalate: true, reason: 'user_requested_human' });
  });

  it('flags variations of asking for a human', () => {
    expect(detectEscalation('necesito hablar con el dueño', '').escalate).toBe(true);
    expect(detectEscalation('me pueden llamar?', '').escalate).toBe(true);
    expect(detectEscalation('quiero atención humana porfa', '').escalate).toBe(true);
  });

  it('flags when the bot falls back to its honest "no puedo resolver esto" line', () => {
    const result = detectEscalation(
      '¿tienen integración con SAP?',
      'Esa pregunta la responden mejor en contacto@atiendemelapyme.cl — te contestan al tiro'
    );
    expect(result).toEqual({ escalate: true, reason: 'bot_could_not_resolve' });
  });

  it('flags when the bot uses the "team will respond" fallback for human requests', () => {
    const result = detectEscalation(
      'quiero hablar con alguien',
      'El equipo te responde a la brevedad, te dejo anotado tu mensaje 😊'
    );
    expect(result.escalate).toBe(true);
  });

  it('does not flag a normal, resolved exchange', () => {
    const result = detectEscalation(
      '¿cuánto cuesta el plan básico?',
      'El plan básico es $149.990 de implementación + $49.990/mes 😊'
    );
    expect(result).toEqual({ escalate: false, reason: null });
  });

  it('does not false-positive on unrelated uses of "persona" or "humano"', () => {
    const result = detectEscalation(
      'somos una empresa con trato muy humano, buscamos algo parecido',
      'Suena bien, contame más de tu negocio'
    );
    expect(result.escalate).toBe(false);
  });

  it('handles missing/empty inputs without throwing', () => {
    expect(() => detectEscalation()).not.toThrow();
    expect(detectEscalation().escalate).toBe(false);
  });
});
