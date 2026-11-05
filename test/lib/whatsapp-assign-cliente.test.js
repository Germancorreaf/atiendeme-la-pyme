import { describe, it, expect, afterEach, vi } from 'vitest';
import { assignClienteToWhatsapp } from '../../src/lib/whatsappConnections.js';

afterEach(() => vi.unstubAllGlobals());

describe('assignClienteToWhatsapp', () => {
  it('hace PATCH en Supabase con el cliente_id', async () => {
    const patches = [];
    vi.stubGlobal('fetch', vi.fn(async (url, init = {}) => {
      patches.push({ url: String(url), body: JSON.parse(init.body), method: init.method });
      return new Response(null, { status: 204 });
    }));

    const env = { SUPABASE_URL: 'https://supabase.test', SUPABASE_SERVICE_KEY: 'k' };
    await assignClienteToWhatsapp('PH1', 'uuid-cliente-1', env);

    expect(patches).toHaveLength(1);
    expect(patches[0].url).toContain('phone_number_id=eq.PH1');
    expect(patches[0].method).toBe('PATCH');
    expect(patches[0].body.cliente_id).toBe('uuid-cliente-1');
  });

  it('envía null para limpiar el cliente_id', async () => {
    const patches = [];
    vi.stubGlobal('fetch', vi.fn(async (_url, init = {}) => {
      patches.push(JSON.parse(init.body));
      return new Response(null, { status: 204 });
    }));

    const env = { SUPABASE_URL: 'https://supabase.test', SUPABASE_SERVICE_KEY: 'k' };
    await assignClienteToWhatsapp('PH1', null, env);

    expect(patches[0].cliente_id).toBeNull();
  });

  it('lanza error si Supabase falla', async () => {
    vi.stubGlobal('fetch', vi.fn(async () =>
      new Response('error interno', { status: 500 })
    ));

    const env = { SUPABASE_URL: 'https://supabase.test', SUPABASE_SERVICE_KEY: 'k' };
    await expect(assignClienteToWhatsapp('PH1', 'uuid', env)).rejects.toThrow('No se pudo asignar');
  });

  it('lanza error si falta configuración de Supabase', async () => {
    await expect(assignClienteToWhatsapp('PH1', 'uuid', {})).rejects.toThrow('Supabase no configurado');
  });
});
