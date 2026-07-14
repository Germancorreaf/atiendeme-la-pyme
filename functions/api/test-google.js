


export async function onRequestGet(context) {
  try {
    console.log("Env keys available:", Object.keys(context.env));
    console.log("GOOGLE_PROJECT_ID:", context.env.GOOGLE_PROJECT_ID);
    console.log("GOOGLE_SERVICE_ACCOUNT_EMAIL:", context.env.GOOGLE_SERVICE_ACCOUNT_EMAIL);
    console.log("GOOGLE_WORKLOAD_IDENTITY_PROVIDER:", context.env.GOOGLE_WORKLOAD_IDENTITY_PROVIDER);

    if (!context.env.GOOGLE_PROJECT_ID || !context.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !context.env.GOOGLE_WORKLOAD_IDENTITY_PROVIDER) {
      return new Response(
        JSON.stringify({ error: "Missing Google environment variables", debug: { 
          has_project_id: !!context.env.GOOGLE_PROJECT_ID,
          has_email: !!context.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
          has_provider: !!context.env.GOOGLE_WORKLOAD_IDENTITY_PROVIDER
        }}),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Verificar que las variables existan
    if (!context.env.GOOGLE_PROJECT_ID || !context.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !context.env.GOOGLE_WORKLOAD_IDENTITY_PROVIDER) {
      return new Response(
        JSON.stringify({ error: "Missing Google environment variables" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Obtener el token OIDC de Cloudflare
    const oidcToken = await context.env.WORKLOAD_OIDC_TOKEN;
    if (!oidcToken) {
      return new Response(
        JSON.stringify({ error: "No OIDC token available" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("OIDC token obtenido");

    // Intercambiar token OIDC por credenciales de Google
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
        JSON.stringify({ error: "STS exchange failed", details: stsData }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("Access token obtenido");

    const accessToken = stsData.access_token;

    // Intentar listar calendarios para validar que funciona
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
