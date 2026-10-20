import { describe, it, expect, afterEach, vi } from 'vitest';
import { handleInboundEmail } from '../../src/lib/email-inbound.js';

const env = { ANTHROPIC_API_KEY: 'a', RESEND_API_KEY: 'r', DRAFT_NOTIFICATION_EMAIL: 'german@example.com', RESEND_FROM_EMAIL: 'hola@atiendemelapyme.cl' };

function stub() {
  const modelInputs = [];
  vi.stubGlobal('fetch', vi.fn(async (url, init = {}) => {
    if (String(url).includes('api.anthropic.com')) {
      modelInputs.push(JSON.parse(init.body).messages[0].content);
      return new Response(JSON.stringify({ content: [{ type: 'text', text: 'Borrador' }] }), { headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify({ id: 'e' }), { headers: { 'Content-Type': 'application/json' } });
  }));
  return modelInputs;
}

const mail = (headers, body) => ({ from: 'ana@example.com', raw: `From: Ana <ana@example.com>\r\nTo: hola@atiendemelapyme.cl\r\nSubject: Consulta\r\n${headers}\r\n\r\n${body}` });

afterEach(() => vi.unstubAllGlobals());

describe('correo entrante -> borrador', () => {
  it('un correo enorme se recorta antes de ir a Claude', async () => {
    const inputs = stub();
    await handleInboundEmail(mail('Content-Type: text/plain; charset=utf-8', 'hola '.repeat(20000)), env);
    expect(inputs).toHaveLength(1);
    expect(inputs[0].length).toBeLessThanOrEqual(6000);
  });

  it('un correo solo HTML también genera borrador (antes se descartaba)', async () => {
    const inputs = stub();
    await handleInboundEmail(mail('Content-Type: text/html; charset=utf-8', '<html><style>p{color:red}</style><body><p>¿Tienen hora el lunes?</p></body></html>'), env);
    expect(inputs).toHaveLength(1);
    expect(inputs[0]).toContain('¿Tienen hora el lunes?');
    expect(inputs[0]).not.toContain('<p>');
    expect(inputs[0]).not.toContain('color:red');
  });
});
