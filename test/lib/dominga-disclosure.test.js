import { describe, it, expect } from 'vitest';
import {
  AI_DISCLOSURE_LINE,
  AI_DISCLOSURE_REPEAT_AFTER_MS,
  getRandomGreeting,
  hasAiDisclosure,
  needsAiDisclosure,
  withAiDisclosure
} from '../../src/lib/dominga-prompt.js';

const NOW = Date.parse('2026-10-01T15:00:00Z');
const msg = (role, content, minutesAgo = 1) => ({
  role,
  content,
  timestamp: new Date(NOW - minutesAgo * 60 * 1000).toISOString()
});

describe('hasAiDisclosure', () => {
  it('reconoce auto-identificaciones inequívocas', () => {
    expect(hasAiDisclosure('¡Hola! 👋 Soy Dominga, asistente de IA de Atiéndeme la Pyme.')).toBe(true);
    expect(hasAiDisclosure('Soy Dominga, la asistente de IA de Atiéndeme la Pyme')).toBe(true);
    expect(hasAiDisclosure('Soy una IA, pero te ayudo igual')).toBe(true);
    expect(hasAiDisclosure('soy un asistente virtual de inteligencia artificial')).toBe(true);
  });

  it('NO cuenta frases que hablan del producto (la respuesta real que falló en producción)', () => {
    const real =
      'Buena pregunta. Te lo cuento rápido: instalamos un chatbot IA en tu sitio web. El bot responde al tiro.';
    expect(hasAiDisclosure(real)).toBe(false);
    expect(hasAiDisclosure('Instalamos asistentes de IA para tu negocio')).toBe(false);
    expect(hasAiDisclosure('')).toBe(false);
    expect(hasAiDisclosure(undefined)).toBe(false);
  });

  it('todos los saludos iniciales fijos ya se identifican como IA', () => {
    for (let i = 0; i < 200; i++) {
      expect(hasAiDisclosure(getRandomGreeting())).toBe(true);
    }
  });
});

describe('needsAiDisclosure', () => {
  it('sí cuando ninguna respuesta previa se identificó (conversación existente, como la de producción)', () => {
    const history = [msg('user', 'Hola'), msg('assistant', '¡Buenas tardes! Cuéntame, ¿qué necesitas?')];
    expect(needsAiDisclosure(history, NOW)).toBe(true);
  });

  it('no cuando ya se identificó recientemente', () => {
    const history = [msg('user', 'Hola'), msg('assistant', 'Soy Dominga, asistente de IA de Atiéndeme la Pyme.')];
    expect(needsAiDisclosure(history, NOW)).toBe(false);
  });

  it('sí tras una pausa larga aunque ya se hubiera identificado', () => {
    const old = (AI_DISCLOSURE_REPEAT_AFTER_MS / 60000) + 30;
    const history = [msg('assistant', 'Soy Dominga, asistente de IA de Atiéndeme la Pyme.', old + 1), msg('user', 'Hola', old)];
    expect(needsAiDisclosure(history, NOW)).toBe(true);
  });

  it('tolera historial vacío o inválido', () => {
    expect(needsAiDisclosure([], NOW)).toBe(true);
    expect(needsAiDisclosure(undefined, NOW)).toBe(true);
    expect(needsAiDisclosure([null, {}], NOW)).toBe(true);
  });
});

describe('withAiDisclosure', () => {
  it('antepone la línea fija cuando corresponde', () => {
    const history = [msg('user', 'Hola'), msg('assistant', '¡Buenas tardes!')];
    const out = withAiDisclosure('Buena pregunta. El bot responde al tiro.', history, NOW);
    expect(out).toBe(`${AI_DISCLOSURE_LINE}\n\nBuena pregunta. El bot responde al tiro.`);
  });

  it('no duplica si la respuesta del modelo ya se identifica', () => {
    const reply = 'Soy Dominga, asistente de IA de Atiéndeme la Pyme. ¿Qué necesitas?';
    expect(withAiDisclosure(reply, [msg('assistant', 'Hola')], NOW)).toBe(reply);
  });

  it('no repite la línea en cada mensaje de una conversación ya identificada', () => {
    const history = [
      msg('assistant', 'Soy Dominga, asistente de IA de Atiéndeme la Pyme.', 10),
      msg('user', 'Cuánto cuesta', 5)
    ];
    expect(withAiDisclosure('Planes desde $149.990.', history, NOW)).toBe('Planes desde $149.990.');
  });

  it('también cubre la respuesta de error', () => {
    const out = withAiDisclosure('Lo siento, tuve un problema técnico. Intenta de nuevo.', [msg('assistant', 'Hola')], NOW);
    expect(out.startsWith(AI_DISCLOSURE_LINE)).toBe(true);
  });
});
