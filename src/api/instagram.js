/**
 * Instagram Webhook Handler
 * Verifica el webhook de Meta (GET) y procesa mensajes reales (POST)
 * 
 * NOTA: Actualmente el bot de Instagram opera vía ManyChat.
 * Este archivo mantiene el webhook activo para verificación de Meta
 * y está listo para reactivarse si se obtiene aprobación de Tech Provider.
 */

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const entries = body.entry || [];

    for (const entry of entries) {
      const messaging_events = entry.messaging || [];

      for (const event of messaging_events) {
        // Solo procesar mensajes nuevos reales (no ecos del bot)
        if (event.message && !event.message.is_echo && event.message.text) {
          const sender_id = event.sender.id;
          const message_text = event.message.text;

          const history = await getConversationHistory(sender_id, env);
          const claude_response = await callClaude(message_text, history, env);
          await saveMessage(sender_id, message_text, claude_response, env);
          await sendMessage(sender_id, claude_response, env);
        }
      }
    }

    return new Response('ok', { status: 200 });
  } catch (error) {
    console.error('Instagram webhook error:', error.message);
    return new Response('error', { status: 500 });
  }
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  const verify_token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');

  if (verify_token === env.FACEBOOK_VERIFY_TOKEN) {
    return new Response(challenge);
  }

  return new Response('Forbidden', { status: 403 });
}

async function getConversationHistory(sender_id, env) {
  try {
    const response = await fetch(
      `${env.SUPABASE_URL}/rest/v1/chat_sessions?session_id=eq.${sender_id}`,
      {
        headers: {
          'apikey': env.SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
        },
      }
    );
    const data = await response.json();
    return data.length > 0 ? (data[0].messages || []) : [];
  } catch {
    return [];
  }
}

async function callClaude(user_message, history, env) {
  const messages = [
    ...history.map(msg => ({ role: msg.role, content: msg.content })),
    { role: 'user', content: user_message },
  ];

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: `Eres Dominga, asistente virtual de "Atiéndeme la Pyme". Responde en español chileno, amable y directo. Máximo 2-3 frases por respuesta.

Servicios: chatbots para WhatsApp/Instagram/Facebook, asistentes de voz, integración con Google Calendar.
Precios: implementación $199.990 (pago único), suscripción $99.990/mes.
Implementación: 2-3 semanas, sin conocimientos técnicos.
Para demos: contacto@atiendemelapyme.cl`,
        messages,
      }),
    });

    const data = await response.json();
    return data.content?.[0]?.text || 'Lo siento, tuve un problema técnico. Intenta de nuevo.';
  } catch {
    return 'Error de conexión. Por favor intenta de nuevo.';
  }
}

async function saveMessage(sender_id, user_message, bot_response, env) {
  try {
    const get_response = await fetch(
      `${env.SUPABASE_URL}/rest/v1/chat_sessions?session_id=eq.${sender_id}`,
      { headers: { 'apikey': env.SUPABASE_SERVICE_KEY, 'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}` } }
    );

    const existing = await get_response.json();
    const messages = [
      ...(existing.length > 0 ? existing[0].messages || [] : []),
      { role: 'user', content: user_message, timestamp: new Date().toISOString() },
      { role: 'assistant', content: bot_response, timestamp: new Date().toISOString() },
    ];

    const method = existing.length > 0 ? 'PATCH' : 'POST';
    const url = existing.length > 0
      ? `${env.SUPABASE_URL}/rest/v1/chat_sessions?session_id=eq.${sender_id}`
      : `${env.SUPABASE_URL}/rest/v1/chat_sessions`;

    await fetch(url, {
      method,
      headers: {
        'apikey': env.SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ session_id: sender_id, messages, lead_contact: sender_id, updated_at: new Date().toISOString() }),
    });
  } catch (error) {
    console.error('Error saving to Supabase:', error.message);
  }
}

async function sendMessage(recipient_id, message_text, env) {
  try {
    const response = await fetch('https://graph.instagram.com/v21.0/me/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient: { id: recipient_id },
        message: { text: message_text },
        access_token: env.FACEBOOK_PAGE_TOKEN,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Instagram API error:', err);
    }
  } catch (error) {
    console.error('Error sending message:', error.message);
  }
}
