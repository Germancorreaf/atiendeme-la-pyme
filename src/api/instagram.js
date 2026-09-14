/**
 * Webhook legado de Instagram (/webhook/instagram).
 *
 * Los mensajes de Instagram y Messenger los procesa ahora el webhook nativo
 * src/api/meta-webhook.js (/webhook/meta). Este endpoint solo conserva la
 * verificación GET por si la suscripción antigua sigue registrada en el
 * panel de Meta, y rechaza cualquier POST.
 */

export async function onRequestPost() {
  return new Response('Disabled', { status: 403 });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  const verifyToken = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');

  if (verifyToken === env.FACEBOOK_VERIFY_TOKEN) {
    return new Response(challenge);
  }

  return new Response('Forbidden', { status: 403 });
}
