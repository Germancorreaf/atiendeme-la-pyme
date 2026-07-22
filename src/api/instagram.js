/**
 * Instagram/Facebook Webhook Handler
 * Recibe mensajes y los procesa con Claude
 * 
 * MODO DEMO: Procesa message_edit como mensajes normales para grabar video
 * (Eliminar después de grabar video demostrativo)
 */

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    console.log('PAYLOAD RECIBIDO:', JSON.stringify(body));

    // Procesar mensajes de Instagram/Facebook
    const entries = body.entry || [];

    for (const entry of entries) {
      const messaging_events = entry.messaging || [];

      for (const event of messaging_events) {
        // Procesar mensajes nuevos (no ecos del bot)
        if (event.message && !event.message.is_echo) {
          const sender_id = event.sender.id;
          const message_text = event.message.text;

          // Obtener historial de Supabase
          const history = await getConversationHistory(sender_id, env);

          // Llamar a Claude (reutilizar tu lógica actual)
          const claude_response = await callClaudeWithHistory(message_text, history, env);

          // Guardar en Supabase
          await saveMessage(sender_id, message_text, claude_response, env);

          // Enviar respuesta a Instagram/Facebook
          await sendInstagramMessage(sender_id, claude_response, env);
        }
        // TEMPORAL: Procesar message_edit como mensaje para demostración (solo para grabación de video)
        else if (event.message_edit) {
          const sender_id = event.sender.id;
          // Usar un mensaje de prueba genérico para demostración
          const message_text = '¡Hola! Me gustaría saber más sobre vuestros servicios.';

          console.log('DEMO MODE: Procesando message_edit como mensaje nuevo para grabación de video');

          // Obtener historial de Supabase
          const history = await getConversationHistory(sender_id, env);

          // Llamar a Claude
          const claude_response = await callClaudeWithHistory(message_text, history, env);

          // Guardar en Supabase
          await saveMessage(sender_id, message_text, claude_response, env);

          // Enviar respuesta a Instagram/Facebook
          await sendInstagramMessage(sender_id, claude_response, env);
        }
      }
    }

    return new Response('ok', { status: 200 });
  } catch (error) {
    console.error('Instagram webhook error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // Verificar webhook (Meta requiere esto)
  const verify_token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');

  if (verify_token === env.FACEBOOK_VERIFY_TOKEN) {
    return new Response(challenge);
  }

  return new Response('Forbidden', { status: 403 });
}

/**
 * Obtener historial de conversación desde Supabase
 */
async function getConversationHistory(sender_id, env) {
  const supabase_url = env.SUPABASE_URL;
  const supabase_key = env.SUPABASE_SERVICE_KEY;

  try {
    const response = await fetch(
      `${supabase_url}/rest/v1/chat_sessions?session_id=eq.${sender_id}`,
      {
        method: 'GET',
        headers: {
          'apikey': supabase_key,
          'Authorization': `Bearer ${supabase_key}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();
    if (data.length > 0) {
      return data[0].messages || [];
    }
    return [];
  } catch (error) {
    console.error('Error getting history from Supabase:', error);
    return [];
  }
}

/**
 * Llamar a Claude API con historial de conversación
 */
async function callClaudeWithHistory(user_message, history, env) {
  const anthropic_key = env.ANTHROPIC_API_KEY;

  // Construir array de mensajes con historial
  const messages = [
    ...history.map(msg => ({
      role: msg.role,
      content: msg.content,
    })),
    {
      role: 'user',
      content: user_message,
    },
  ];

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropic_key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-6',
        max_tokens: 1024,
        system: `Eres un asistente de IA para "Atiéndeme la Pyme", una empresa que ofrece agentes de IA para automatizar atención al cliente.

Tu rol es:
1. Responder consultas sobre nuestros servicios
2. Calificar leads
3. Agendar citas/demos
4. Ser amable y profesional
5. Responder en español (Chile)

Información sobre nuestros servicios:
- Chatbots en WhatsApp, Instagram, Facebook
- Asistentes de voz que atienden llamadas
- Integración con Google Calendar/Calendly
- Implementación en 2-3 semanas
- Precio implementación: $199.990
- Suscripción mensual: $99.990/mes
- Disponible 24/7

Si el cliente muestra interés en agendar demo, sugiere que escriba a contacto@atiendemelapyme.cl o agende directo en el sitio.`,
        messages: messages,
      }),
    });

    const data = await response.json();
    if (data.content && data.content.length > 0) {
      return data.content[0].text;
    }
    return 'Lo siento, tuve un error procesando tu solicitud.';
  } catch (error) {
    console.error('Error calling Claude:', error);
    return 'Error de conexión. Por favor intenta de nuevo.';
  }
}

/**
 * Guardar mensaje y respuesta en Supabase
 */
async function saveMessage(sender_id, user_message, bot_response, env) {
  const supabase_url = env.SUPABASE_URL;
  const supabase_key = env.SUPABASE_SERVICE_KEY;

  try {
    // Obtener sesión existente
    const get_response = await fetch(
      `${supabase_url}/rest/v1/chat_sessions?session_id=eq.${sender_id}`,
      {
        method: 'GET',
        headers: {
          'apikey': supabase_key,
          'Authorization': `Bearer ${supabase_key}`,
        },
      }
    );

    const existing = await get_response.json();
    let messages = [];

    if (existing.length > 0) {
      messages = existing[0].messages || [];
    }

    // Agregar nuevos mensajes
    messages.push({
      role: 'user',
      content: user_message,
      timestamp: new Date().toISOString(),
    });
    messages.push({
      role: 'assistant',
      content: bot_response,
      timestamp: new Date().toISOString(),
    });

    // Actualizar o crear
    if (existing.length > 0) {
      // Actualizar sesión existente
      await fetch(
        `${supabase_url}/rest/v1/chat_sessions?session_id=eq.${sender_id}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': supabase_key,
            'Authorization': `Bearer ${supabase_key}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: messages,
            lead_contact: sender_id,
            updated_at: new Date().toISOString(),
          }),
        }
      );
    } else {
      // Crear nueva sesión
      await fetch(`${supabase_url}/rest/v1/chat_sessions`, {
        method: 'POST',
        headers: {
          'apikey': supabase_key,
          'Authorization': `Bearer ${supabase_key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sender_id,
          messages: messages,
          lead_contact: sender_id,
        }),
      });
    }
  } catch (error) {
    console.error('Error saving message to Supabase:', error);
  }
}

/**
 * Enviar mensaje a Instagram/Facebook
 */
async function sendInstagramMessage(recipient_id, message_text, env) {
  const page_token = env.FACEBOOK_PAGE_TOKEN;

  try {
    await fetch('https://graph.instagram.com/v18.0/me/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipient: { id: recipient_id },
        message: { text: message_text },
        access_token: page_token,
      }),
    });
  } catch (error) {
    console.error('Error sending Instagram message:', error);
  }
}
