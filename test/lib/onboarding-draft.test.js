import { describe, it, expect, afterEach, vi } from 'vitest';
import { draftFromOnboarding } from '../../src/lib/onboardingDraft.js';

afterEach(() => vi.unstubAllGlobals());

function stubClaude(text) {
  const bodies = [];
  vi.stubGlobal('fetch', vi.fn(async (url, init) => {
    bodies.push(JSON.parse(init.body));
    return new Response(JSON.stringify({ content: [{ type: 'text', text }], stop_reason: 'end_turn' }), { headers: { 'Content-Type': 'application/json' } });
  }));
  return bodies;
}
const ctx = { env: { ANTHROPIC_API_KEY: 'k' } };

describe('borrador del bot desde el onboarding', () => {
  it('convierte la respuesta de Claude en bot_prompt, horario de agenda y duración', async () => {
    const bodies = stubClaude('Aquí va:\n{"bot_prompt":"NEGOCIO\\nClínica Sonrisa","horario":{"lun":"9:00-13:00, 15:00-19:00","sab":"10:00-14:00","dom":"cerrado"},"slot_minutes":45}');
    const d = await draftFromOnboarding('== TU ASISTENTE ==\n- Horarios: lunes 9 a 13 y 15 a 19', ctx);
    expect(d).toEqual({
      bot_prompt: 'NEGOCIO\nClínica Sonrisa',
      horario: { lun: [['09:00', '13:00'], ['15:00', '19:00']], sab: [['10:00', '14:00']] }, // "cerrado" se descarta
      slot_minutes: 45,
    });
    expect(bodies[0].system).toMatch(/No inventes precios/);
    expect(bodies[0].messages[0].content).toContain('lunes 9 a 13');
  });

  it('sin duración válida queda null', async () => {
    stubClaude('{"bot_prompt":"x","horario":{},"slot_minutes":null}');
    expect((await draftFromOnboarding('x', ctx)).slot_minutes).toBeNull();
  });

  it('si no viene JSON, falla con un error claro', async () => {
    stubClaude('No pude');
    await expect(draftFromOnboarding('x', ctx)).rejects.toThrow(/JSON/);
  });
});
