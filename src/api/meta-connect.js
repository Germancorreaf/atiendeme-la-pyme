// src/api/meta-connect.js
// Flujo de conexión OAuth "Facebook Login for Business": conecta una Página de
// Facebook (y su cuenta profesional de Instagram, si tiene una vinculada) a la
// app de Meta "Atiéndeme la Pyme", guardando el Page Access Token en Supabase
// y suscribiendo la app a los eventos de mensajería de esa Página.
// Reemplaza el rol de conexión que hoy cumple ManyChat (ver TODOS.md).
//
// Requiere estos vars/secrets en el Worker:
// - META_APP_ID: var pública (no es secreto), ID de la app en Meta.
// - META_APP_SECRET: secret, App Secret de la app en Meta.
// La redirect_uri usada es siempre {origin}/admin/meta/callback — debe estar
// registrada tal cual en Meta > Configuración de la app > Facebook Login for
// Business > Valid OAuth Redirect URIs.
//
// Protegido detrás de la sesión de /admin (checkSessionAuth): solo alguien ya
// logueado en el dashboard puede iniciar o completar esta conexión.

import { checkSessionAuth } from '../lib/adminSession.js';
import { timingSafeEqual } from '../lib/timingSafe.js';
import { upsertConnection } from '../lib/metaConnections.js';

const GRAPH_API_VERSION = 'v21.0';
const OAUTH_SCOPES = [
  'instagram_basic',
  'instagram_manage_messages',
  'pages_show_list',
  'pages_manage_metadata',
  'pages_messaging',
  'business_management'
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
  if (!env.META_APP_ID) {
    return htmlResponse('<h1>Falta configuración</h1><p>No está definida la variable <code>META_APP_ID</code> en el Worker.</p>', 500);
  }

  const state = crypto.randomUUID();
  const dialogUrl = new URL(`https://www.facebook.com/${GRAPH_API_VERSION}/dialog/oauth`);
  dialogUrl.searchParams.set('client_id', env.META_APP_ID);
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

  if (!env.META_APP_ID || !env.META_APP_SECRET) {
    return htmlResponse('<h1>Falta configuración</h1><p>Definir <code>META_APP_ID</code> y <code>META_APP_SECRET</code> en el Worker.</p>', 500, { 'Set-Cookie': clearStateCookie });
  }

  try {
    // 1. code -> user access token de corta duración
    const tokenUrl = new URL(`https://graph.facebook.com/${GRAPH_API_VERSION}/oauth/access_token`);
    tokenUrl.searchParams.set('client_id', env.META_APP_ID);
    tokenUrl.searchParams.set('client_secret', env.META_APP_SECRET);
    tokenUrl.searchParams.set('redirect_uri', callbackUrl(request));
    tokenUrl.searchParams.set('code', code);
    const tokenRes = await fetch(tokenUrl.toString());
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      throw new Error(`Meta rechazó el code: ${JSON.stringify(tokenData)}`);
    }

    // 2. Intercambiar por un user token de larga duración, para que los Page
    // Access Tokens derivados no expiren mientras el usuario no revoque el acceso.
    const exchangeUrl = new URL(`https://graph.facebook.com/${GRAPH_API_VERSION}/oauth/access_token`);
    exchangeUrl.searchParams.set('grant_type', 'fb_exchange_token');
    exchangeUrl.searchParams.set('client_id', env.META_APP_ID);
    exchangeUrl.searchParams.set('client_secret', env.META_APP_SECRET);
    exchangeUrl.searchParams.set('fb_exchange_token', tokenData.access_token);
    const exchangeRes = await fetch(exchangeUrl.toString());
    const exchangeData = await exchangeRes.json();
    const longLivedUserToken = exchangeRes.ok && exchangeData.access_token ? exchangeData.access_token : tokenData.access_token;

    // 3. Páginas administradas por este usuario, con su Page Access Token
    const pagesRes = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/me/accounts?access_token=${encodeURIComponent(longLivedUserToken)}`
    );
    const pagesData = await pagesRes.json();
    const pages = Array.isArray(pagesData.data) ? pagesData.data : [];
    if (pages.length === 0) {
      return htmlResponse(
        '<h1>Sin páginas</h1><p>Esa cuenta no administra ninguna Página de Facebook. Conecta con la cuenta dueña de la Página de @atiendemelapyme.</p><p><a href="/admin">Volver al dashboard</a></p>',
        200,
        { 'Set-Cookie': clearStateCookie }
      );
    }

    const connected = [];
    for (const page of pages) {
      let igAccount = null;
      try {
        const igRes = await fetch(
          `https://graph.facebook.com/${GRAPH_API_VERSION}/${page.id}?fields=instagram_business_account{id,username}&access_token=${encodeURIComponent(page.access_token)}`
        );
        const igData = await igRes.json();
        igAccount = igData.instagram_business_account || null;
      } catch {
        // Sin cuenta de Instagram vinculada; seguimos solo con Messenger.
      }

      await upsertConnection({
        page_id: page.id,
        page_name: page.name || null,
        page_access_token: page.access_token,
        ig_business_account_id: igAccount?.id || null,
        ig_username: igAccount?.username || null
      }, env);

      // Suscribe la app a los eventos de mensajería de esta Página (Messenger
      // y, si tiene Instagram vinculado, también sus DMs).
      await fetch(
        `https://graph.facebook.com/${GRAPH_API_VERSION}/${page.id}/subscribed_apps?subscribed_fields=messages,messaging_postbacks&access_token=${encodeURIComponent(page.access_token)}`,
        { method: 'POST' }
      );

      connected.push({ name: page.name, igUsername: igAccount?.username });
    }

    const list = connected
      .map((c) => `<li>${escapeHtml(c.name)}${c.igUsername ? ` — Instagram: @${escapeHtml(c.igUsername)}` : ' (sin Instagram vinculado)'}</li>`)
      .join('');
    return htmlResponse(
      `<h1>✅ Conectado</h1><p>Se conectó y suscribió correctamente:</p><ul>${list}</ul><p><a href="/admin">Volver al dashboard</a></p>`,
      200,
      { 'Set-Cookie': clearStateCookie }
    );
  } catch (err) {
    console.error('Meta OAuth callback error:', err.message);
    return htmlResponse(`<h1>Error al conectar</h1><p>${escapeHtml(err.message)}</p><p><a href="/admin">Volver al dashboard</a></p>`, 500, { 'Set-Cookie': clearStateCookie });
  }
}
