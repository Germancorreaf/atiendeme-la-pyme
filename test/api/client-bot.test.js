import { describe, it, expect, afterEach, vi } from 'vitest';
import { env as workerEnv } from 'cloudflare:test';
import { onRequestPost as whatsappPost } from '../../src/api/whatsapp.js';
import { onRequestPost as metaPost } from '../../src/api/meta-webhook.js';
import { computeHmacSha256Hex } from '../../src/lib/metaSignature.js';
import { AI_DISCLOSURE_LINE } from '../../src/lib/dominga-prompt.js';

// Bot de cada cliente: si la conexión tiene bot_prompt, Claude responde como el
// asistente de IA de ESE negocio, con su información; si no, sigue siendo
// Dominga de Atiéndeme la Pyme (cuentas propias).

const SECRET = 's';
const CLINICA = 'Clínica Sonrisa. Limpieza dental: $30.000. Atendemos de lunes a viernes de 9 a 18 h.';
let n = 0;

function stubNetwork({ connection, modelReply = 'La limpieza cuesta $30.000 😊' }) {
  const systemPrompts = [];
  const sent = [];
  const emails = [];
  vi.stubGlobal('fetch', vi.fn(async (url, init = {}) => {
    const u = String(url);
    const json = (d) => new Response(JSON.stringify(d), { headers: { 'Content-Type': 'application/json' } });
    if (u.includes('/rest/v1/whatsapp_connections') || u.includes('/rest/v1/meta_connections')) return json(connection ? [connection] : []);
    if (u.includes('/rest/v1/chat_sessions') && (!init.method || init.method === 'GET')) return json([]);
    if (u.includes('api.anthropic.com')) { systemPrompts.push(JSON.parse(init.body).system); return json({ content: [{ type: 'text', text: modelReply }] }); }
    if (u.includes('api.resend.com')) { emails.push(JSON.parse(init.body)); return json({ id: 'e' }); }
    if (new URL(u).pathname.endsWith('/messages') && init.method === 'POST') {
      const b = JSON.parse(init.body);
      sent.push(b.text?.body ?? b.message?.text);
      return json({});
    }
    return json({});
  }));
  return { systemPrompts, sent, emails };
}

const env = () => ({
  META_APP_SECRET: SECRET, SUPABASE_URL: 'https://supabase.test', SUPABASE_SERVICE_KEY: 'k', ANTHROPIC_API_KEY: 'a',
  WHATSAPP_ACCESS_TOKEN: 't', RESEND_API_KEY: 'r', DRAFT_NOTIFICATION_EMAIL: 'german@example.com',
  GOOGLE_CLIENT_ID: 'gc', GOOGLE_CLIENT_SECRET: 'gs', GOOGLE_REFRESH_TOKEN: 'gr',
  RATE_LIMIT_KV: workerEnv.RATE_LIMIT_KV,
});

async function deliverWhatsapp(text = '¿Cuánto cuesta una limpieza?') {
  n += 1;
  const body = JSON.stringify({ entry: [{ changes: [{ value: {
    metadata: { phone_number_id: 'PN_CLINICA' },
    messages: [{ id: `wamid.client.${n}`, type: 'text', from: `5698888${String(n).padStart(4, '0')}`, text: { body: text } }],
  } }] }] });
  const req = new Request('https://example.com/webhook/whatsapp', { method: 'POST', body, headers: { 'X-Hub-Signature-256': 'sha256=' + await computeHmacSha256Hex(SECRET, body) } });
  const waited = [];
  await whatsappPost({ request: req, env: env(), ctx: { waitUntil: (p) => waited.push(p) } });
  await Promise.all(waited);
}

async function deliverMessenger(text = '¿Cuánto cuesta una limpieza?') {
  n += 1;
  const body = JSON.stringify({ object: 'page', entry: [{ id: 'PAGE_CLINICA', messaging: [{ sender: { id: `77777${n}` }, message: { mid: `mid.client.${n}`, text } }] }] });
  const req = new Request('https://example.com/webhook/meta', { method: 'POST', body, headers: { 'X-Hub-Signature-256': 'sha256=' + await computeHmacSha256Hex(SECRET, body) } });
  const waited = [];
  await metaPost({ request: req, env: env(), ctx: { waitUntil: (p) => waited.push(p) } });
  await Promise.all(waited);
}

afterEach(() => vi.unstubAllGlobals());

describe.each([
  ['WhatsApp', deliverWhatsapp, { phone_number_id: 'PN_CLINICA', access_token: 'tok', business_name: 'Clínica Sonrisa', bot_prompt: CLINICA }],
  ['Messenger', deliverMessenger, { page_id: 'PAGE_CLINICA', page_access_token: 'tok', page_name: 'Clínica Sonrisa', bot_prompt: CLINICA }],
])('bot de un cliente en %s', (channel, deliver, connection) => {
  it('Claude recibe la información del cliente, no la de Atiéndeme la Pyme', async () => {
    const { systemPrompts } = stubNetwork({ connection });
    await deliver();
    expect(systemPrompts).toHaveLength(1);
    expect(systemPrompts[0]).toContain('Limpieza dental: $30.000');
    expect(systemPrompts[0]).toContain('Clínica Sonrisa');
    expect(systemPrompts[0]).not.toContain('Atiéndeme la Pyme');
    expect(systemPrompts[0]).not.toContain('$149.990');
    expect(systemPrompts[0]).toMatch(/texto plano/i);
  });

  it('se identifica como la IA del negocio del cliente', async () => {
    const { sent } = stubNetwork({ connection });
    await deliver();
    expect(sent).toHaveLength(1);
    expect(sent[0].startsWith('Soy la asistente de IA de Clínica Sonrisa.')).toBe(true);
    expect(sent[0]).not.toContain('Atiéndeme la Pyme');
  });

  it('el aviso de escalamiento dice de qué cliente es', async () => {
    const { emails } = stubNetwork({ connection, modelReply: 'Te dejo anotado tu mensaje y el equipo te responde a la brevedad.' });
    await deliver('quiero hablar con una persona');
    expect(emails).toHaveLength(1);
    expect(emails[0].subject).toContain('Clínica Sonrisa');
  });
});

describe('cuentas propias (sin bot_prompt)', () => {
  it('WhatsApp sin conexión guardada sigue siendo Dominga de Atiéndeme la Pyme', async () => {
    const { systemPrompts, sent } = stubNetwork({ connection: null, modelReply: 'Hola 👋' });
    await deliverWhatsapp('hola');
    expect(systemPrompts[0]).toContain('Atiéndeme la Pyme');
    expect(sent[0].startsWith(AI_DISCLOSURE_LINE)).toBe(true);
  });

  it('una conexión con bot_prompt vacío sigue siendo Dominga', async () => {
    const { systemPrompts } = stubNetwork({ connection: { page_id: 'PAGE_CLINICA', page_access_token: 'tok', bot_prompt: '   ' } });
    await deliverMessenger('hola');
    expect(systemPrompts[0]).toContain('Atiéndeme la Pyme');
  });
});

describe('cliente con agenda conectada (tabla clientes)', () => {
  const CLIENTE = {
    id: 'c1', nombre: 'Clínica Sonrisa', bot_prompt: CLINICA,
    calendar_id: 'clinica@example.com', slot_minutes: 60, horario: { lun: [['09:00', '13:00']] },
  };

  function stubWithCalendar({ cliente = CLIENTE, modelResponses }) {
    const anthropicBodies = [];
    const googleCalls = [];
    const sent = [];
    vi.stubGlobal('fetch', vi.fn(async (url, init = {}) => {
      const u = String(url);
      const json = (d) => new Response(JSON.stringify(d), { headers: { 'Content-Type': 'application/json' } });
      if (u.includes('/rest/v1/whatsapp_connections')) return json([{ phone_number_id: 'PN_CLINICA', access_token: 'tok', business_name: 'Nombre en Meta', cliente_id: 'c1' }]);
      if (u.includes('/rest/v1/clientes')) return json(cliente ? [cliente] : []);
      if (u.includes('/rest/v1/chat_sessions')) return json([]);
      if (u.includes('/rest/v1/rpc/')) return json(null);
      if (u.includes('api.anthropic.com')) { anthropicBodies.push(JSON.parse(init.body)); return json(modelResponses.shift()); }
      if (u.includes('oauth2.googleapis.com')) return json({ access_token: 'g' });
      if (u.includes('googleapis.com/calendar')) { googleCalls.push(u); return json({ items: [] }); }
      if (new URL(u).pathname.endsWith('/messages') && init.method === 'POST') { sent.push(JSON.parse(init.body).text.body); return json({}); }
      return json({});
    }));
    return { anthropicBodies, googleCalls, sent };
  }

  it('Claude recibe las herramientas, consulta el calendario del cliente y responde con horas reales', async () => {
    const { anthropicBodies, googleCalls, sent } = stubWithCalendar({ modelResponses: [
      { stop_reason: 'tool_use', content: [{ type: 'tool_use', id: 'tu1', name: 'consultar_disponibilidad', input: { fecha: '2027-03-01' } }] },
      { stop_reason: 'end_turn', content: [{ type: 'text', text: 'El lunes tengo 09:00, 10:00 u 11:00, ¿cuál prefieres?' }] },
    ] });
    await deliverWhatsapp('¿Tienen hora el lunes 1 de marzo?');

    expect(anthropicBodies[0].tools.map((t) => t.name)).toEqual(['consultar_disponibilidad', 'agendar_hora']);
    expect(anthropicBodies[0].system).toContain('Clínica Sonrisa');
    expect(anthropicBodies[0].system).toContain('consultar_disponibilidad');
    expect(anthropicBodies[0].system).not.toContain('Te lo confirmamos por correo');
    expect(googleCalls[0]).toContain('/calendars/clinica%40example.com/events');
    expect(JSON.parse(anthropicBodies[1].messages.at(-1).content[0].content).horas_libres)
      .toEqual(['09:00', '10:00', '11:00', '12:00']);
    expect(sent[0]).toContain('09:00, 10:00 u 11:00');
  });

  it('si ofrece horas sin mirar la agenda, se le devuelve a Claude para que consulte', async () => {
    const { anthropicBodies, googleCalls, sent } = stubWithCalendar({ modelResponses: [
      { stop_reason: 'end_turn', content: [{ type: 'text', text: 'Mañana tengo 10:00, 13:00 y 16:00.' }] },
      { stop_reason: 'tool_use', content: [{ type: 'tool_use', id: 'tu1', name: 'consultar_disponibilidad', input: { fecha: '2027-03-01' } }] },
      { stop_reason: 'end_turn', content: [{ type: 'text', text: 'El lunes tengo 09:00 o 10:00.' }] },
    ] });
    await deliverWhatsapp('¿tienes hora el lunes?');

    expect(anthropicBodies).toHaveLength(3);
    expect(anthropicBodies[1].messages.at(-1).content).toMatch(/consultar_disponibilidad/);
    expect(googleCalls).toHaveLength(1);
    expect(sent).toHaveLength(1);
    expect(sent[0]).toContain('09:00 o 10:00');
    expect(sent[0]).not.toContain('16:00');
  });

  it('una respuesta sin horas no se devuelve a Claude', async () => {
    const { anthropicBodies } = stubWithCalendar({ modelResponses: [
      { stop_reason: 'end_turn', content: [{ type: 'text', text: '¿Para qué día te gustaría?' }] },
    ] });
    await deliverWhatsapp('quiero una hora');
    expect(anthropicBodies).toHaveLength(1);
  });

  it('cliente sin agenda conectada: sin herramientas, el equipo confirma por correo', async () => {
    const { anthropicBodies } = stubWithCalendar({
      cliente: { ...CLIENTE, calendar_id: null },
      modelResponses: [{ stop_reason: 'end_turn', content: [{ type: 'text', text: 'Te lo confirmamos por correo a la brevedad.' }] }],
    });
    await deliverWhatsapp('quiero una hora');
    expect(anthropicBodies[0]).not.toHaveProperty('tools');
    expect(anthropicBodies[0].system).toContain('Te lo confirmamos por correo');
  });
});
