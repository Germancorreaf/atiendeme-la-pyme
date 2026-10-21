import { describe, it, expect, afterEach, vi } from 'vitest';
import { refreshInstagramTokens } from '../../src/lib/metaConnections.js';

afterEach(() => vi.unstubAllGlobals());

describe('renovación de tokens de Instagram (cron diario)', () => {
  it('renueva solo las conexiones con token de Instagram y guarda el nuevo', async () => {
    const patches = [];
    const refreshCalls = [];
    vi.stubGlobal('fetch', vi.fn(async (url, init = {}) => {
      const u = String(url);
      const json = (d, status = 200) => new Response(JSON.stringify(d), { status, headers: { 'Content-Type': 'application/json' } });
      if (u.includes('/rest/v1/meta_connections?select=')) return json([
        { page_id: 'IG1', ig_business_account_id: 'IG1', page_access_token: 'viejo-ig' },
        { page_id: 'PAGE1', ig_business_account_id: 'IG1', page_access_token: 'token-fb' },
        { page_id: 'IG2', ig_business_account_id: 'IG2', page_access_token: 'reciente' },
      ]);
      if (u.includes('refresh_access_token')) {
        const token = new URL(u).searchParams.get('access_token');
        refreshCalls.push(token);
        return token === 'reciente' ? json({ error: { message: 'too new' } }, 400) : json({ access_token: 'nuevo-ig', expires_in: 5184000 });
      }
      if (init.method === 'PATCH') { patches.push({ u, body: JSON.parse(init.body) }); return json(null); }
      return json({});
    }));
    const env = { SUPABASE_URL: 'https://supabase.test', SUPABASE_SERVICE_KEY: 'k' };
    expect(await refreshInstagramTokens(env)).toEqual({ refreshed: 1, failed: 1 });
    expect(refreshCalls).toEqual(['viejo-ig', 'reciente']); // el token de Facebook no se toca
    expect(patches).toHaveLength(1);
    expect(patches[0].u).toContain('page_id=eq.IG1');
    expect(patches[0].body.page_access_token).toBe('nuevo-ig');
  });
});
