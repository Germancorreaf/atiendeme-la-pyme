import { describe, it, expect } from 'vitest';
import { env } from 'cloudflare:test';
import { alreadyProcessed } from '../../src/lib/dedup.js';

describe('alreadyProcessed', () => {
  it('la segunda entrega del mismo mensaje se descarta', async () => {
    expect(await alreadyProcessed('wamid.unit.1', env.RATE_LIMIT_KV)).toBe(false);
    expect(await alreadyProcessed('wamid.unit.1', env.RATE_LIMIT_KV)).toBe(true);
  });

  it('si KV falla (cuota agotada) se procesa igual: mejor un duplicado que un cliente sin respuesta', async () => {
    const brokenKv = { get: async () => { throw new Error('KV put() limit exceeded'); }, put: async () => {} };
    expect(await alreadyProcessed('wamid.unit.2', brokenKv)).toBe(false);
  });
});
