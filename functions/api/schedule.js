export async function onRequestPost(context) {
  try {
    const { date, time, email, name, notes } = await context.request.json();

    if (!date || !time || !name) {
      return new Response(
        JSON.stringify({ error: "Faltan campos: date, time, name" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Obtener el token OIDC que Cloudflare genera automáticamente
    const oidcToken = context.env.WORKLOAD_OIDC_TOKEN;
    if (!oidcToken) {
      return new Response(
        JSON.stringify({ error: "No OIDC token available - WIF may not be configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Intercambiar token OIDC por credenciales temporales de Google
    const stsResponse = await fetch("https://sts.googleapis.com/v1/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:token-exchange",
        audience: `//iam.googleapis.com/${context.env.GOOGLE_WORKLOAD_IDENTITY_PROVIDER}`,
        requested_token_type: "urn:ietf:params:oauth:token-type:access_token",
        subject_token: oidcToken,
        subject_token_type: "urn:ietf:params:oauth:token-type:id_token",
        service_account: context.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
      })
    });

    const stsData = await stsResponse.json();
    if (!stsResponse.ok) {
      return new Response(
        JSON.stringify({ error: "STS token exchange failed", details: stsData }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const accessToken = stsData.access_token;

    // Crear evento en Google Calendar
    const calendarId = "primary";
    const startDateTime = new Date(`${date}T${time}`).toISOString();
    const endDateTime = new Date(new Date(startDateTime).getTime() + 60 * 60 * 1000).toISOString();

    const eventResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          summary: `Cita - ${name}`,
          description: notes || "Cita agendada vía Dominga",
          start: { dateTime: startDateTime, timeZone: "America/Santiago" },
          end: { dateTime: endDateTime, timeZone: "America/Santiago" },
          attendees: email ? [{ email: email }] : []
        })
      }
    );

    const eventData = await eventResponse.json();

    if (!eventResponse.ok) {
      return new Response(
        JSON.stringify({ error: "Failed to create calendar event", details: eventData }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        eventId: eventData.id,
        message: `Cita agendada para ${date} a las ${time}`
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
