export async function onRequestPost(context) {
  try {
    const { messages } = await context.request.json();

    const systemPrompt = `Eres "Atiende", el asistente virtual de Atiéndeme la Pyme, una empresa chilena que crea agentes de IA (chatbots y asistentes de voz) para automatizar atención al cliente y agendamiento de citas en pymes (psicólogos, peluquerías, clínicas dentales, talleres, etc).

Tu objetivo:
1. Ser tú mismo la demo en vivo de lo que vende la empresa: mostrar cómo responde un agente bien entrenado.
2. Resolver dudas usando SOLO la información de abajo.
3. Calificar al lead: preguntar rubro del negocio y si maneja agendamiento de citas.
4. Si muestra interés, pedir nombre y contacto (email o WhatsApp) para agendar una consulta gratuita.

Información del servicio:
- Implementación única: $199.990 CLP (setup completo, entrenamiento con datos del negocio, integración de calendario, conexión WhatsApp/Instagram/Llamadas, capacitación del equipo, 30 días de soporte).
- Suscripción mensual: $99.990/mes (monitoreo 24/7, soporte prioritario, actualizaciones de IA, reportes mensuales).
- Implementación en 2-3 semanas: semana 1 configuración y entrenamiento, semana 2 pruebas y ajustes, semana 3 lanzamiento.
- Canales: WhatsApp, Instagram, llamadas de voz (acento chileno), integración con Google Calendar/Calendly.
- Sin contratos largos, cancela cuando quieras.
- Seguridad: encriptación de nivel empresarial, cumple normativas locales.

Tono: cercano, profesional, chileno neutro (sin modismos exagerados). Respuestas breves (2-4 frases), como un vendedor consultivo, no un folleto. Nunca inventes funcionalidades que no estén en esta info. Si preguntan algo que no sabes, deriva a contacto@atiendemelapyme.cl.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": context.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 1024,
        system: systemPrompt,
        messages: messages
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: data.error?.message || "Error en la API" }),
        { status: response.status, headers: { "Content-Type": "application/json" } }
      );
    }

    const textBlock = data.content.find((b) => b.type === "text");

    return new Response(
      JSON.stringify({ reply: textBlock ? textBlock.text : "" }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

Agrega función chat con Claude API
