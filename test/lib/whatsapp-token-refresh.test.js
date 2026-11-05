import { describe, it, expect, afterEach, vi } from 'vitest';
import { refreshWhatsappTokens } from '../../src/lib/whatsappConnections.js';

afterEach(() => vi.unstubAllGlobals());

describe('renovación de tokens de WhatsApp (cron diario)', () => {
  it('renueva todos los tokens y guarda los nuevos en Supabase', async () => {
    const patches = [];
    vi.stubGlobal('fetch', vi.fn(async (url, init = {}) => {
      const u = String(url);
      const json = (d, status = 200) => new Response(JSON.stringify(d), { status, headers: { 'Content-Type': 'application/json' } });
      // listado de conexiones
      if (u.includes('/rest/v1/whatsapp_connections?select=')) {
        return json([
          { phone_number_id: 'PH1', access_token: 'viejo-wa' },
          { phone_number_id: 'PH2', access_token: 'reciente-wa' },
        ]);
      }
      // intercambio de token
      if (u.includes('/oauth/access_token') && init?.method !== 'PATCH') {
        const token = new URL(u).searchParams.get('fb_exchange_token');
        // simula token muy reciente que Meta rechaza
        if (token === 'reciente-wa') return json({ error: { message: 'cooldown period' } }, 400);
        return json({ access_token: 'nuevo-wa', expires_in: 5184000 });
      }
      if (init?.method === 'PATCH') {
        patches.push({ u, body: JSON.parse(init.body) });
        return json(null);
      }
      return json({});
    }));

    const env = {
      SUPABASE_URL: 'https://supabase.test',
      SUPABASE_SERVICE_KEY: 'k',
      META_APP_ID: 'APP_ID',
      META_APP_SECRET: 'APP_SECRET',
    };
    const result = await refreshWhatsappTokens(env);
    // PH2 se ignora por cooldown (no falla, solo se salta)
    expect(result).toEqual({ refreshed: 1, failed: 0 });
    expect(patches).toHaveLength(1);
    expect(patches[0].u).toContain('phone_number_id=eq.PH1');
    expect(patches[0].body.access_token).toBe('nuevo-wa');
  });

  it('no hace nada si falta configuración', async () => {
    const spy = vi.fn();
    vi.stubGlobal('fetch', spy);
    const result = await refreshWhatsappTokens({});
    expect(result).toEqual({ refreshed: 0, failed: 0 });
    expect(spy).not.toHaveBeenCalled();
  });

  it('cuenta como failed si Supabase rechaza el PATCH', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url, init = {}) => {
      const u = String(url);
      const json = (d, status = 200) => new Response(JSON.stringify(d), { status, headers: { 'Content-Type': 'application/json' } });
      if (u.includes('/rest/v1/whatsapp_connections?select=')) return json([{ phone_number_id: 'PH3', access_token: 'tok' }]);
      if (u.includes('/oauth/access_token')) return json({ access_token: 'nuevo' });
      if (init?.method === 'PATCH') return json({ message: 'error' }, 500);
      return json({});
    }));
    const env = { SUPABASE_URL: 'https://supabase.test', SUPABASE_SERVICE_KEY: 'k', META_APP_ID: 'A', META_APP_SECRET: 'S' };
    expect(await refreshWhatsappTokens(env)).toEqual({ refreshed: 0, failed: 1 });
  });
});
