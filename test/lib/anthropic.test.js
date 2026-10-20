import { describe, it, expect, afterEach, vi } from 'vitest';
import { callClaude } from '../../src/lib/anthropic.js';

afterEach(() => vi.unstubAllGlobals());

function stub(response) {
  const bodies = [];
  vi.stubGlobal('fetch', vi.fn(async (url, init) => {
    bodies.push(JSON.parse(init.body));
    return new Response(JSON.stringify(response), { headers: { 'Content-Type': 'application/json' } });
  }));
  return bodies;
}

const ctx = { env: { ANTHROPIC_API_KEY: 'k' } };
const msgs = [{ role: 'user', content: 'hola' }];

describe('callClaude', () => {
  it('usa Claude Haiku 5.5, el modelo más económico, con esfuerzo bajo y sin parámetros de muestreo', async () => {
    const bodies = stub({ content: [{ type: 'text', text: 'ok' }], stop_reason: 'end_turn' });
    await callClaude(msgs, 'sistema', ctx);
    expect(bodies[0].model).toBe('claude-haiku-5-5');
    expect(bodies[0].output_config).toEqual({ effort: 'low' });
    expect(bodies[0]).not.toHaveProperty('temperature');
    expect(bodies[0]).not.toHaveProperty('top_p');
  });

  it('la respuesta puede traer bloques de pensamiento antes del texto: se toma el bloque de texto', async () => {
    stub({ content: [{ type: 'thinking', thinking: '', signature: 's' }, { type: 'text', text: 'Hola 👋' }], stop_reason: 'end_turn' });
    expect(await callClaude(msgs, 'sistema', ctx)).toBe('Hola 👋');
  });

  it('si el modelo declina (refusal) falla con el motivo, para el registro', async () => {
    stub({ content: [], stop_reason: 'refusal', stop_details: { type: 'refusal', category: 'general_harms' } });
    await expect(callClaude(msgs, 'sistema', ctx)).rejects.toThrow(/refusal/);
  });
});
