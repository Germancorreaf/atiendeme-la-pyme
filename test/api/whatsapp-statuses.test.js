import { describe, it, expect, afterEach, vi } from 'vitest';
import { env as workerEnv } from 'cloudflare:test';
import { onRequestPost } from '../../src/api/whatsapp.js';
import { computeHmacSha256Hex } from '../../src/lib/metaSignature.js';
import { handleStatus, serviceCounterKey, SERVICE_WARN_AT } from '../../src/lib/whatsappStatus.js';

// Estados de los mensajes del bot: avisos por correo cuando un mensaje falla
// o cuando el número pasa el tramo gratis de mensajes de servicio.

const NOW = new Date('2026-11-17T20:00:00Z');

function stubNetwork() {
  const calls = { emails: [] };
  vi.stubGlobal('fetch', vi.fn(async (url, init = {}) => {
    const u = String(url);
    const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
    if (u.includes('resend.com')) { calls.emails.push(JSON.parse(init.body)); return json({ id: 'email_1' }); }
    if (u.includes('/rest/v1/whatsapp_connections')) return json([{ business_name: 'Panadería Ana', display_phone_number: '+56 9 1111 2222' }]);
    return json({});
  }));
  return calls;
}

const env = () => ({
  RATE_LIMIT_KV: workerEnv.RATE_LIMIT_KV,
  RESEND_API_KEY: 're_test',
  DRAFT_NOTIFICATION_EMAIL: 'german@example.com',
  SUPABASE_URL: 'https://supabase.test',
  SUPABASE_SERVICE_KEY: 'k'
});

const service = (id, billable = false) => ({
  id, status: 'delivered', recipient_id: '56911110000',
  pricing: { billable, pricing_model: 'PMP', type: billable ? 'regular' : 'free_customer_service', category: 'service' }
});
const failed = (id, code, title) => ({ id, status: 'failed', recipient_id: '56911110000', errors: [{ code, title, message: title }] });

afterEach(() => vi.unstubAllGlobals());

describe('mensajes que Meta no pudo entregar', () => {
  it('avisa por correo con el error de Meta y el nombre del cliente, y no repite el aviso', async () => {
    const calls = stubNetwork();
    await handleStatus(failed('wamid.f1', 131042, 'Business eligibility payment issue'), 'PN_FAIL_1', env(), NOW);
    await handleStatus(failed('wamid.f2', 131042, 'Business eligibility payment issue'), 'PN_FAIL_1', env(), NOW);
    expect(calls.emails).toHaveLength(1);
    expect(calls.emails[0].to).toBe('german@example.com');
    expect(calls.emails[0].subject).toContain('Panadería Ana');
    expect(calls.emails[0].subject).toContain('131042');
    expect(calls.emails[0].html).toContain('Business eligibility payment issue');
    // el teléfono de la persona no viaja en el aviso
    expect(calls.emails[0].html).not.toContain('56911110000');
  });

  it('un error distinto en el mismo número sí genera otro aviso', async () => {
    const calls = stubNetwork();
    await handleStatus(failed('wamid.f3', 131042, 'Pago'), 'PN_FAIL_2', env(), NOW);
    await handleStatus(failed('wamid.f4', 131026, 'Mensaje no entregable'), 'PN_FAIL_2', env(), NOW);
    expect(calls.emails).toHaveLength(2);
  });

  it('sin correo configurado no falla ni avisa', async () => {
    const calls = stubNetwork();
    const bare = { ...env(), RESEND_API_KEY: undefined };
    await expect(handleStatus(failed('wamid.f5', 1, 'x'), 'PN_FAIL_3', bare, NOW)).resolves.toBeUndefined();
    expect(calls.emails).toHaveLength(0);
  });
});

describe('mensajes de servicio y tramo gratis', () => {
  it('cuenta cada mensaje una sola vez aunque llegue en varios estados', async () => {
    stubNetwork();
    const e = env();
    await handleStatus(service('wamid.s1'), 'PN_SVC_1', e, NOW);
    await handleStatus(service('wamid.s1'), 'PN_SVC_1', e, NOW);
    await handleStatus(service('wamid.s2'), 'PN_SVC_1', e, NOW);
    expect(await e.RATE_LIMIT_KV.get(serviceCounterKey('PN_SVC_1', NOW))).toBe('2');
  });

  it('solo cuenta la categoría service', async () => {
    stubNetwork();
    const e = env();
    await handleStatus({ id: 'wamid.u1', status: 'delivered', pricing: { billable: true, category: 'utility', type: 'regular' } }, 'PN_SVC_2', e, NOW);
    await handleStatus({ id: 'wamid.p1', status: 'sent' }, 'PN_SVC_2', e, NOW);
    expect(await e.RATE_LIMIT_KV.get(serviceCounterKey('PN_SVC_2', NOW))).toBeNull();
  });

  it('avisa una vez al llegar al 80 % del tramo gratis', async () => {
    const calls = stubNetwork();
    const e = env();
    await e.RATE_LIMIT_KV.put(serviceCounterKey('PN_SVC_3', NOW), String(SERVICE_WARN_AT - 1));
    await handleStatus(service('wamid.w1'), 'PN_SVC_3', e, NOW);
    await handleStatus(service('wamid.w2'), 'PN_SVC_3', e, NOW);
    expect(calls.emails).toHaveLength(1);
    expect(calls.emails[0].subject).toContain(`${SERVICE_WARN_AT} de 1000`);
  });

  it('avisa una vez cuando aparece el primer mensaje cobrado del mes', async () => {
    const calls = stubNetwork();
    const e = env();
    await handleStatus(service('wamid.b1', true), 'PN_SVC_4', e, NOW);
    await handleStatus(service('wamid.b2', true), 'PN_SVC_4', e, NOW);
    expect(calls.emails).toHaveLength(1);
    expect(calls.emails[0].subject).toContain('ya paga');
    expect(calls.emails[0].html).toContain('medio de pago');
  });

  it('el contador se reinicia cada mes (hora de Chile)', () => {
    expect(serviceCounterKey('PN', new Date('2026-11-30T23:00:00Z'))).toBe('wasvc:PN:2026-11');
    // 1-dic 02:00 UTC = 30-nov 23:00 en Chile (verano UTC-3)
    expect(serviceCounterKey('PN', new Date('2026-12-01T02:00:00Z'))).toBe('wasvc:PN:2026-11');
    expect(serviceCounterKey('PN', new Date('2026-12-01T04:00:00Z'))).toBe('wasvc:PN:2026-12');
  });
});

describe('webhook /webhook/whatsapp con statuses', () => {
  it('un status fallido que llega por el webhook dispara el aviso', async () => {
    const calls = stubNetwork();
    const body = JSON.stringify({ entry: [{ changes: [{ field: 'messages', value: {
      metadata: { phone_number_id: 'PN_HOOK_1' }, statuses: [failed('wamid.h1', 131042, 'Pago pendiente')]
    } }] }] });
    const sig = 'sha256=' + await computeHmacSha256Hex('test-app-secret', body);
    const request = new Request('https://example.com/webhook/whatsapp', { method: 'POST', body, headers: { 'Content-Type': 'application/json', 'X-Hub-Signature-256': sig } });
    const waited = [];
    const res = await onRequestPost({ request, env: { ...env(), META_APP_SECRET: 'test-app-secret' }, ctx: { waitUntil: (p) => waited.push(p) } });
    expect(res.status).toBe(200);
    await Promise.all(waited);
    expect(calls.emails).toHaveLength(1);
  });
});
