export async function onRequestGet(context) {
  try {
    const clientId = context.env.GOOGLE_CLIENT_ID;
    const redirectUri = context.env.REDIRECT_URI;
    const scopes = "https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/userinfo.email";
    
    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", scopes);
    authUrl.searchParams.set("access_type", "offline");
    authUrl.searchParams.set("prompt", "consent");

    return new Response(null, { status: 302, headers: { Location: authUrl.toString() } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
