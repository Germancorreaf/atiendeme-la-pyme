export async function onRequestGet(context) {
  try {
    const provider = context.env.GOOGLE_WORKLOAD_IDENTITY_PROVIDER;
    const projectMatch = provider.match(/projects\/(\d+)/);
    const projectId = projectMatch ? projectMatch[1] : null;

    if (!projectId || !context.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !provider) {
      return new Response(
        JSON.stringify({ error: "Missing required environment variables" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const oidcToken = context.env.WORKLOAD_OIDC_TOKEN;
    if (!oidcToken) {
      return new Response(
        JSON.stringify({ error: "No OIDC token available" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const stsResponse = await fetch("https://sts.googleapis.com/v1/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:token-exchange",
        audience: `//iam.googleapis.com/${provider}`,
        requested_token_type: "urn:ietf:params:oauth:token-type:access_token",
        subject_token: oidcToken,
        subject_token_type: "urn:ietf:params:oauth:token-type:id_token",
        scope: "https://www.googleapis.com/auth/calendar"
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
    const calendarResponse = await fetch("https://www.googleapis.com/calendar/v3/users/me/calendarList", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
