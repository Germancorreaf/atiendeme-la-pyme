import { describe, it, expect } from 'vitest';
import { env } from 'cloudflare:test';

function waitForMessage(ws) {
  return new Promise((resolve) => {
    ws.addEventListener('message', (evt) => resolve(JSON.parse(evt.data)), { once: true });
  });
}

// Habla directo con el stub del Durable Object (mismo mecanismo que usa
// routeToChatRoom en src/index.js), sin pasar por las rutas /ws/... — esas
// rutas (auth del lado admin, validación de sessionId) ya se prueban aparte.
function connect(sessionId, role) {
  const id = env.CHAT_ROOM.idFromName(sessionId);
  const stub = env.CHAT_ROOM.get(id);
  const url = `https://example.com/?role=${role}&sessionId=${encodeURIComponent(sessionId)}`;
  return stub.fetch(new Request(url, { headers: { Upgrade: 'websocket' } }));
}

describe('ChatRoom', () => {
  it('rejects a request without the websocket upgrade header', async () => {
    const id = env.CHAT_ROOM.idFromName('no-upgrade-test');
    const stub = env.CHAT_ROOM.get(id);
    const res = await stub.fetch(new Request('https://example.com/?role=visitor&sessionId=no-upgrade-test'));
    expect(res.status).toBe(426);
  });

  it('rejects an invalid role', async () => {
    const id = env.CHAT_ROOM.idFromName('bad-role-test');
    const stub = env.CHAT_ROOM.get(id);
    const res = await stub.fetch(
      new Request('https://example.com/?role=hacker&sessionId=bad-role-test', {
        headers: { Upgrade: 'websocket' },
      })
    );
    expect(res.status).toBe(400);
  });

  it('notifies the visitor when an admin joins, and relays messages both ways', async () => {
    const sessionId = `test-room-${Date.now()}`;

    const visitorRes = await connect(sessionId, 'visitor');
    expect(visitorRes.status).toBe(101);
    const visitorWs = visitorRes.webSocket;
    visitorWs.accept();

    const joinedPromise = waitForMessage(visitorWs);

    const adminRes = await connect(sessionId, 'admin');
    expect(adminRes.status).toBe(101);
    const adminWs = adminRes.webSocket;
    adminWs.accept();

    expect(await joinedPromise).toEqual({ type: 'human_joined' });

    // admin -> visitante
    const visitorGetsHuman = waitForMessage(visitorWs);
    adminWs.send(JSON.stringify({ type: 'admin_message', text: 'Hola, soy Germán' }));
    expect(await visitorGetsHuman).toEqual({ type: 'human_message', text: 'Hola, soy Germán' });

    // visitante -> admin
    const adminGetsVisitor = waitForMessage(adminWs);
    visitorWs.send(JSON.stringify({ type: 'visitor_message', text: 'Hola, gracias por responder' }));
    expect(await adminGetsVisitor).toEqual({ type: 'visitor_message', text: 'Hola, gracias por responder' });

    // el admin se va -> el visitante se entera
    const leftPromise = waitForMessage(visitorWs);
    adminWs.close();
    expect(await leftPromise).toEqual({ type: 'human_left' });
  });

  it('ignores malformed JSON messages without crashing the room', async () => {
    const sessionId = `test-room-malformed-${Date.now()}`;
    const visitorRes = await connect(sessionId, 'visitor');
    const visitorWs = visitorRes.webSocket;
    visitorWs.accept();

    expect(() => visitorWs.send('not json at all')).not.toThrow();

    // La sala sigue funcionando normalmente después del mensaje inválido.
    const adminRes = await connect(sessionId, 'admin');
    const adminWs = adminRes.webSocket;
    adminWs.accept();

    const adminGetsVisitor = waitForMessage(adminWs);
    visitorWs.send(JSON.stringify({ type: 'visitor_message', text: 'sigo aquí' }));
    expect(await adminGetsVisitor).toEqual({ type: 'visitor_message', text: 'sigo aquí' });
  });

  it('does not relay a visitor_message sent by a socket with the visitor role to itself as admin', async () => {
    // Un visitante no debería poder hacerse pasar por admin enviando
    // type:'admin_message' desde su propio socket (solo el rol adjunto al
    // socket importa, no el "type" que declare el mensaje).
    const sessionId = `test-room-spoof-${Date.now()}`;
    const visitorRes = await connect(sessionId, 'visitor');
    const visitorWs = visitorRes.webSocket;
    visitorWs.accept();

    const adminRes = await connect(sessionId, 'admin');
    const adminWs = adminRes.webSocket;
    adminWs.accept();

    let adminReceived = null;
    adminWs.addEventListener('message', (evt) => { adminReceived = JSON.parse(evt.data); });

    visitorWs.send(JSON.stringify({ type: 'admin_message', text: 'finjo ser el admin' }));
    await new Promise((r) => setTimeout(r, 50));

    expect(adminReceived).toBeNull();
  });
});
