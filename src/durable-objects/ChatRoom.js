// src/durable-objects/ChatRoom.js
// Sala de chat en tiempo real, una instancia por sessionId (ver
// env.CHAT_ROOM.idFromName(sessionId) en src/index.js). Relaya mensajes
// entre el visitante (widget público) y el admin (dashboard) por WebSocket,
// usando la API de hibernación de Durable Objects para no cobrar tiempo de
// CPU mientras la conexión está inactiva.
//
// Mientras nadie del equipo se conecta, el visitante sigue hablando con
// Dominga por el endpoint REST /api/chat de siempre — este objeto no
// interviene para nada en ese flujo. Solo entra en juego después de un
// escalamiento (ver src/lib/escalation.js), cuando el widget abre una
// conexión y el equipo puede "tomar" la conversación en vivo.

export class ChatRoom {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request) {
    const url = new URL(request.url);
    const role = url.searchParams.get('role');
    const sessionId = url.searchParams.get('sessionId') || '';

    if (role !== 'visitor' && role !== 'admin') {
      return new Response('rol inválido', { status: 400 });
    }

    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('se esperaba un websocket', { status: 426 });
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    this.state.acceptWebSocket(server, [role]);
    server.serializeAttachment({ role, sessionId });

    if (role === 'admin') {
      this.broadcastToRole('visitor', { type: 'human_joined' });
    }

    return new Response(null, { status: 101, webSocket: client });
  }

  broadcastToRole(role, data) {
    const sockets = this.state.getWebSockets(role);
    const payload = JSON.stringify(data);
    for (const ws of sockets) {
      try {
        ws.send(payload);
      } catch (err) {
        console.error('[ChatRoom] broadcast error:', err.message);
      }
    }
  }

  async webSocketMessage(ws, message) {
    let attachment;
    try {
      attachment = ws.deserializeAttachment() || {};
    } catch {
      attachment = {};
    }

    let data;
    try {
      data = JSON.parse(message);
    } catch {
      return;
    }

    if (attachment.role === 'admin' && data.type === 'admin_message' && typeof data.text === 'string') {
      this.broadcastToRole('visitor', { type: 'human_message', text: data.text });
      await this.persistMessage(attachment.sessionId, 'assistant', data.text);
    }

    if (attachment.role === 'visitor' && data.type === 'visitor_message' && typeof data.text === 'string') {
      this.broadcastToRole('admin', { type: 'visitor_message', text: data.text });
      await this.persistMessage(attachment.sessionId, 'user', data.text);
    }
  }

  async webSocketClose(ws) {
    let attachment;
    try {
      attachment = ws.deserializeAttachment() || {};
    } catch {
      attachment = {};
    }

    if (attachment.role === 'admin') {
      // Solo avisar "se fue" si ya no queda ningún admin conectado (podría
      // haber más de una pestaña/persona viendo la misma conversación).
      const remainingAdmins = this.state.getWebSockets('admin').filter((s) => s !== ws);
      if (remainingAdmins.length === 0) {
        this.broadcastToRole('visitor', { type: 'human_left' });
      }
    }
  }

  async webSocketError(ws, error) {
    console.error('[ChatRoom] websocket error:', error?.message || error);
    await this.webSocketClose(ws);
  }

  /**
   * Agrega el mensaje al historial persistido en Supabase, para que quede
   * en la misma columna `messages` que ya usa el resto del chat y se vea en
   * el admin con el resto de la conversación.
   */
  async persistMessage(sessionId, role, content) {
    if (!sessionId || !this.env.SUPABASE_URL || !this.env.SUPABASE_SERVICE_KEY) return;

    try {
      const getRes = await fetch(
        `${this.env.SUPABASE_URL}/rest/v1/chat_sessions?session_id=eq.${encodeURIComponent(sessionId)}&select=messages`,
        {
          headers: {
            apikey: this.env.SUPABASE_SERVICE_KEY,
            Authorization: `Bearer ${this.env.SUPABASE_SERVICE_KEY}`
          }
        }
      );
      if (!getRes.ok) return;
      const rows = await getRes.json();
      const current = Array.isArray(rows) && Array.isArray(rows[0]?.messages) ? rows[0].messages : [];
      const updated = [...current, { role, content }];

      await fetch(
        `${this.env.SUPABASE_URL}/rest/v1/chat_sessions?session_id=eq.${encodeURIComponent(sessionId)}`,
        {
          method: 'PATCH',
          headers: {
            apikey: this.env.SUPABASE_SERVICE_KEY,
            Authorization: `Bearer ${this.env.SUPABASE_SERVICE_KEY}`,
            'Content-Type': 'application/json',
            Prefer: 'return=minimal'
          },
          body: JSON.stringify({ messages: updated, updated_at: new Date().toISOString() })
        }
      );
    } catch (err) {
      console.error('[ChatRoom] persist error:', err.message);
    }
  }
}
