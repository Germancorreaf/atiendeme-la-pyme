export async function onRequestGet(context) {
  try {
    // 1. Validar que las variables existen
    if (!context.env.GOOGLE_PROJECT_ID || !context.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !context.env.GOOGLE_WORKLOAD_IDENTITY_PROVIDER) {
      return new Response(
        JSON.stringify({ error: "Missing Google environment variables" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 2. Obtener el token OIDC de Cloudflare
    const oidcToken = await context.env.WORKLOAD_OIDC_TOKEN;
    if (!oidcToken) {
      return new Response(
        JSON.stringify({ error: "No OIDC token available" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // 3. Intercambiar token OIDC por credenciales de Google
    // AQUÍ SE AGREGA EL 'scope' QUE FALTABA
    const stsResponse = await fetch("https://sts.googleapis.com/v1/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:token-exchange",
        audience: `//iam.googleapis.com/${context.env.GOOGLE_WORKLOAD_IDENTITY_PROVIDER}`,
        requested_token_type: "urn:ietf:params:oauth:token-type:access_token",
        subject_token: oidcToken,
        subject_token_type: "urn:ietf:params:oauth:token-type:id_token",
        service_account: context.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        scope: "https://www.googleapis.com/auth/calendar.readonly" 
      })
    });

    const stsData = await stsResponse.json();
    
    if (!stsResponse.ok) {
      return new Response(
        JSON.stringify({ error: "STS exchange failed", details: stsData }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const accessToken = stsData.access_token;

    // 4. Intentar listar calendarios
    const calendarResponse = await fetch("https://www.googleapis.com/calendar/v3/users/me/calendarList", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`
      }
    });

    const calendarData = await calendarResponse.json();

    if (!calendarResponse.ok) {
      return new Response(
        JSON.stringify({ error: "Calendar API call failed", details: calendarData }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "✅ WIF + Google Calendar API funcionando",
        calendars: calendarData.items ? calendarData.items.map(c => ({ id: c.id, summary: c.summary })) : []
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message, stack: err.stack }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
