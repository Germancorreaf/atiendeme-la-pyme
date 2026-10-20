import { describe, it, expect, afterEach, vi } from 'vitest';
import { callClaude, callClaudeWithTools } from '../../src/lib/anthropic.js';

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

describe('callClaudeWithTools', () => {
  it('ejecuta la herramienta que pide Claude, le devuelve el resultado (con el pensamiento intacto) y entrega el texto final', async () => {
    const responses = [
      { stop_reason: 'tool_use', content: [
        { type: 'thinking', thinking: '', signature: 'sig-1' },
        { type: 'tool_use', id: 'tu_1', name: 'consultar_disponibilidad', input: { fecha: '2026-10-26' } },
      ] },
      { stop_reason: 'end_turn', content: [{ type: 'text', text: 'Tengo 10:00 u 11:00, ¿cuál prefieres?' }] },
    ];
    const bodies = [];
    vi.stubGlobal('fetch', vi.fn(async (url, init) => {
      bodies.push(JSON.parse(init.body));
      return new Response(JSON.stringify(responses.shift()), { headers: { 'Content-Type': 'application/json' } });
    }));
    const calls = [];
    const tools = [{ name: 'consultar_disponibilidad', description: 'd', input_schema: { type: 'object', properties: {} } }];
    const text = await callClaudeWithTools(msgs, 'sistema', ctx, {
      tools,
      runTool: async (name, input) => { calls.push([name, input]); return { horas: ['10:00', '11:00'] }; },
    });
    expect(text).toBe('Tengo 10:00 u 11:00, ¿cuál prefieres?');
    expect(calls).toEqual([['consultar_disponibilidad', { fecha: '2026-10-26' }]]);
    expect(bodies[0].tools).toEqual(tools);
    const second = bodies[1].messages;
    expect(second.at(-2).content[0]).toEqual({ type: 'thinking', thinking: '', signature: 'sig-1' });
    expect(second.at(-1).content[0]).toEqual({ type: 'tool_result', tool_use_id: 'tu_1', content: '{"horas":["10:00","11:00"]}' });
  });

  it('si la herramienta falla, Claude recibe el error (is_error) y puede responder igual', async () => {
    const responses = [
      { stop_reason: 'tool_use', content: [{ type: 'tool_use', id: 'tu_1', name: 'agendar_hora', input: {} }] },
      { stop_reason: 'end_turn', content: [{ type: 'text', text: 'Esa hora se tomó recién, ¿te sirve otra?' }] },
    ];
    const bodies = [];
    vi.stubGlobal('fetch', vi.fn(async (url, init) => {
      bodies.push(JSON.parse(init.body));
      return new Response(JSON.stringify(responses.shift()), { headers: { 'Content-Type': 'application/json' } });
    }));
    const text = await callClaudeWithTools(msgs, 's', ctx, { tools: [], runTool: async () => { throw new Error('Esa hora ya no está disponible'); } });
    expect(text).toMatch(/otra/);
    expect(bodies[1].messages.at(-1).content[0]).toMatchObject({ is_error: true, content: 'Esa hora ya no está disponible' });
  });
});
