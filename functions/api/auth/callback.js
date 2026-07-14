export async function onRequestGet(context) {
  try {
    const { searchParams } = new URL(context.request.url);
    const code = searchParams.get("code");

    if (!code) {
      return new Response("No code provided", { status: 400 });
    }

    // 1. Intercambiar el código por tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: code,
        client_id: context.env.GOOGLE_CLIENT_ID,
        client_secret: context.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: context.env.REDIRECT_URI,
        grant_type: "authorization_code"
      })
    });

    const tokens = await tokenResponse.json();
    if (!tokens.access_token) {
      return new Response(JSON.stringify(tokens), { status: 400 });
    }

    // 2. Obtener el email del usuario (para identificarlo)
    const userInfo = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    }).then(r => r.json());

    // 3. Guardar en Supabase (upsert)
    const supabaseResponse = await fetch(`${context.env.SUPABASE_URL}/rest/v1/oauth_tokens`, {
      method: "POST",
      headers: {
        "apikey": context.env.SUPABASE_SERVICE_KEY,
        "Authorization": `Bearer ${context.env.SUPABASE_SERVICE_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates"
      },
      body: JSON.stringify({
        user_email: userInfo.email,
        refresh_token: tokens.refresh_token,
        access_token: tokens.access_token,
        token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString()
      })
    });

    return new Response(`¡Autenticación exitosa para ${userInfo.email}! Los tokens han sido guardados.`);
  } catch (err) {
    return new Response(err.message, { status: 500 });
  }
}
