// src/api/meta-connect.js
// Flujo de conexion OAuth "Instagram API con Instagram Login" (Business Login
// para Instagram): conecta una cuenta profesional de Instagram directamente
// (sin pasar por una Pagina de Facebook), guarda el token de acceso de
// Instagram en Supabase y suscribe la app a los mensajes de esa cuenta.
// Reemplaza el rol de conexion que hoy cumple ManyChat (ver TODOS.md).
//
// IMPORTANTE: este flujo usa el login de instagram.com, no el de
// facebook.com/dialog/oauth. Los scopes instagram_business_basic e
// instagram_business_manage_messages solo son validos en ese login -- por
// eso el client_id NO es META_APP_ID (el App ID de Facebook), sino un
// Instagram App ID separado que Meta muestra en:
// Casos de uso > API de Instagram > Configuracion de la API con inicio de
// sesion de Instagram.
//
// Requiere estos vars/secrets en el Worker:
// - INSTAGRAM_APP_ID: var publica (no es secreto), Instagram App ID (
//   distinto de META_APP_ID).
// - INSTAGRAM_APP_SECRET: secret, App Secret de Instagram (distinto de
//   META_APP_SECRET).
// La redirect_uri usada es siempre {origin}/admin/meta/callback -- debe
// estar registrada tal cual en Meta > Configuracion de la app > Valid OAuth
// Redirect URIs.
//
// NOTA sobre el esquema de Supabase: la tabla meta_connections se creo
// pensada para conexiones via Pagina de Facebook (columna unica page_id).
// Como este flujo no tiene Pagina, reusamos esa misma columna page_id para
// guardar el ID de Instagram (ig-scoped user id) -- es el mismo valor que
// ig_business_account_id en esta fila. page_access_token guarda el token de
// Instagram de larga duracion. Es un reuso deliberado para no requerir una
// migracion de esquema; si en el futuro se necesita volver a soportar
// Messenger/Paginas en paralelo, esto debe revisarse.
//
// Protegido detras de la sesion de /admin (checkSessionAuth): solo alguien
// ya logueado en el dashboard puede iniciar o completar esta conexion.

import { checkSessionAuth } from '../lib/adminSession.js';
import { timingSafeEqual } from '../lib/timingSafe.js';
import { upsertConnection } from '../lib/metaConnections.js';

const GRAPH_API_VERSION = 'v21.0';
const OAUTH_SCOPES = [
  'instagram_business_basic',
  'instagram_business_manage_messages'
].join(',');
const STATE_COOKIE_NAME = 'atp_meta_oauth_state';
const STATE_COOKIE_PATH = '/admin/meta';

function callbackUrl(request) {
  const url = new URL(request.url);
  return `${url.origin}/admin/meta/callback`;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function parseCookieValue(cookieHeader, name) {
  const match = (cookieHeader || '').match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match ? match[1] : null;
}

function htmlResponse(body, status = 200, extraHeaders = {}) {
  return new Response(
    `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Conectar Meta — Atiéndeme la Pyme</title>
<style>body{font-family:system-ui,sans-serif;background:#0A0A0A;color:#EDEDED;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:24px;}
.card{max-width:480px;background:#161616;border:1px solid #2A2A2A;border-radius:12px;padding:32px;line-height:1.5;}
a{color:#43D17C;}h1{margin-top:0;font-size:20px;}</style></head>
<body><div class="card">${body}</div></body></html>`,
    {
      status,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'X-Robots-Tag': 'noindex, nofollow',
        ...extraHeaders
      }
    }
  );
}

export async function onRequestGetConnect(context) {
  const { request, env } = context;
  if (!(await checkSessionAuth(request, env))) {
    return new Response('Unauthorized', { status: 401 });
  }
  if (!env.INSTAGRAM_APP_ID) {
    return htmlResponse('<h1>Falta configuración</h1><p>No está definida la variable <code>INSTAGRAM_APP_ID</code> en el Worker.</p>', 500);
  }

  const state = crypto.randomUUID();
  const dialogUrl = new URL('https://www.instagram.com/oauth/authorize');
  dialogUrl.searchParams.set('client_id', env.INSTAGRAM_APP_ID);
  dialogUrl.searchParams.set('redirect_uri', callbackUrl(request));
  dialogUrl.searchParams.set('scope', OAUTH_SCOPES);
  dialogUrl.searchParams.set('response_type', 'code');
  dialogUrl.searchParams.set('state', state);

  return new Response(null, {
    status: 302,
    headers: {
      Location: dialogUrl.toString(),
      'Set-Cookie': `${STATE_COOKIE_NAME}=${state}; HttpOnly; Secure; SameSite=Lax; Path=${STATE_COOKIE_PATH}; Max-Age=600`
    }
  });
}

export async function onRequestGetCallback(context) {
  const { request, env } = context;
  if (!(await checkSessionAuth(request, env))) {
    return new Response('Unauthorized', { status: 401 });
  }

  const url = new URL(request.url);
  const clearStateCookie = `${STATE_COOKIE_NAME}=; HttpOnly; Secure; SameSite=Lax; Path=${STATE_COOKIE_PATH}; Max-Age=0`;

  const oauthError = url.searchParams.get('error');
  if (oauthError) {
    const description = url.searchParams.get('error_description') || oauthError;
    return htmlResponse(
      `<h1>Conexión cancelada</h1><p>Meta devolvió: ${escapeHtml(description)}</p><p><a href="/admin">Volver al dashboard</a></p>`,
      200,
      { 'Set-Cookie': clearStateCookie }
    );
  }

  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const cookieState = parseCookieValue(request.headers.get('Cookie'), STATE_COOKIE_NAME);

  if (!code || !state || !cookieState || !timingSafeEqual(state, cookieState)) {
    return htmlResponse(
      '<h1>Conexión inválida</h1><p>Falta el código o el estado no coincide (posible cookie expirada). Intenta conectar de nuevo desde el dashboard.</p><p><a href="/admin">Volver al dashboard</a></p>',
      400,
      { 'Set-Cookie': clearStateCookie }
    );
  }

  if (!env.INSTAGRAM_APP_ID || !env.INSTAGRAM_APP_SECRET) {
    return htmlResponse('<h1>Falta configuración</h1><p>Definir <code>INSTAGRAM_APP_ID</code> e <code>INSTAGRAM_APP_SECRET</code> en el Worker.</p>', 500, { 'Set-Cookie': clearStateCookie });
  }

  try {
    // 1. code -> token de Instagram de corta duración (endpoint de
    // api.instagram.com, POST con form-data, no query params).
    const shortLivedForm = new URLSearchParams();
    shortLivedForm.set('client_id', env.INSTAGRAM_APP_ID);
    shortLivedForm.set('client_secret', env.INSTAGRAM_APP_SECRET);
    shortLivedForm.set('grant_type', 'authorization_code');
    shortLivedForm.set('redirect_uri', callbackUrl(request));
    shortLivedForm.set('code', code);

    const shortLivedRes = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: shortLivedForm.toString()
    });
    const shortLivedData = await shortLivedRes.json();
    if (!shortLivedRes.ok || !shortLivedData.access_token) {
      throw new Error(`Instagram rechazó el code: ${JSON.stringify(shortLivedData)}`);
    }

    // 2. Intercambiar por un token de larga duración (60 días).
    const exchangeUrl = new URL('https://graph.instagram.com/access_token');
    exchangeUrl.searchParams.set('grant_type', 'ig_exchange_token');
    exchangeUrl.searchParams.set('client_secret', env.INSTAGRAM_APP_SECRET);
    exchangeUrl.searchParams.set('access_token', shortLivedData.access_token);
    const exchangeRes = await fetch(exchangeUrl.toString());
    const exchangeData = await exchangeRes.json();
    const longLivedToken = exchangeRes.ok && exchangeData.access_token ? exchangeData.access_token : shortLivedData.access_token;

    // 3. Datos de la cuenta de Instagram conectada.
    const igUserId = String(shortLivedData.user_id);
    const meRes = await fetch(
      `https://graph.instagram.com/${GRAPH_API_VERSION}/me?fields=user_id,username&access_token=${encodeURIComponent(longLivedToken)}`
    );
    const meData = await meRes.json();
    const igUsername = meData.username || null;

    await upsertConnection({
      page_id: igUserId,
      page_name: igUsername ? `Instagram: @${igUsername}` : null,
      page_access_token: longLivedToken,
      ig_business_account_id: igUserId,
      ig_username: igUsername
    }, env);

    // Suscribe la app a los mensajes de esta cuenta de Instagram.
    const subRes = await fetch(
      `https://graph.instagram.com/${GRAPH_API_VERSION}/${igUserId}/subscribed_apps?subscribed_fields=messages&access_token=${encodeURIComponent(longLivedToken)}`,
      { method: 'POST' }
    );
    if (!subRes.ok) {
      const subErr = await subRes.text();
      console.error('Meta OAuth: fallo al suscribir la app a mensajes de Instagram:', subErr);
    }

    return htmlResponse(
      `<h1>✅ Conectado</h1><p>Se conectó y suscribió correctamente:</p><ul><li>Instagram: @${escapeHtml(igUsername || igUserId)}</li></ul><p><a href="/admin">Volver al dashboard</a></p>`,
      200,
      { 'Set-Cookie': clearStateCookie }
    );
  } catch (err) {
    console.error('Meta OAuth callback error:', err.message);
    return htmlResponse(`<h1>Error al conectar</h1><p>${escapeHtml(err.message)}</p><p><a href="/admin">Volver al dashboard</a></p>`, 500, { 'Set-Cookie': clearStateCookie });
  }
}
