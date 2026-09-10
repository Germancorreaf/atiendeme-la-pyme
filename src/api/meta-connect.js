// src/api/meta-connect.js
// Flujo de conexion OAuth "Instagram API con Instagram Login" (Business Login
// para Instagram): conecta una cuenta profesional de Instagram directamente
// (sin pasar por una Pagina de Facebook), guarda el token de acceso de
// Instagram en Supabase y suscribe la app a los mensajes de esa cuenta.
// Reemplaza el rol de conexion que antes cumplia ManyChat (ver TODOS.md).
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
import { upsertConnection, deleteConnectionByPageId, getConnectionByPageId } from '../lib/metaConnections.js';

const GRAPH_API_VERSION = 'v21.0';
const OAUTH_SCOPES = [
  'instagram_business_basic',
  'instagram_business_manage_messages'
].join(',');
const STATE_COOKIE_NAME = 'atp_meta_oauth_state';
const STATE_COOKIE_PATH = '/admin/meta';

// Flujo separado: "Facebook Login for Business" para conectar una Página de
// Facebook (Messenger). Usa facebook.com/dialog/oauth (no instagram.com),
// client_id = META_APP_ID, y un config_id (Casos de uso > Inicio de sesión
// con Facebook para empresas > Configuraciones) en vez de scopes sueltos --
// así es como Meta requiere este login desde 2023+. Cookie de estado y
// redirect_uri propios para no pisar el flujo de Instagram de arriba.
const FACEBOOK_STATE_COOKIE_NAME = 'atp_meta_oauth_state_fb';

function callbackUrl(request) {
  const url = new URL(request.url);
  return `${url.origin}/admin/meta/callback`;
}

function callbackUrlFacebook(request) {
  const url = new URL(request.url);
  return `${url.origin}/admin/meta/callback-facebook`;
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
    //
    // OJO: el "user_id" que devuelve api.instagram.com/oauth/access_token
    // (shortLivedData.user_id) NO es el mismo ID que Meta usa como
    // entry.id en los webhooks de mensajería ni el que se muestra en el
    // panel de Meta como "Identificador de la app de Instagram" de la
    // cuenta -- son dos espacios de ID distintos. El que sí coincide con
    // los webhooks es el "user_id" que devuelve graph.instagram.com/me.
    // Detectado en septiembre 2026 tras encontrar conexiones guardadas con
    // el ID equivocado (las respuestas nunca llegaban porque
    // getConnectionByIgId buscaba por el entry.id real del webhook).
    const meRes = await fetch(
      `https://graph.instagram.com/${GRAPH_API_VERSION}/me?fields=user_id,username&access_token=${encodeURIComponent(longLivedToken)}`
    );
    const meData = await meRes.json();
    const igUserId = String(meData.user_id || shortLivedData.user_id);
    const igUsername = meData.username || null;

    await upsertConnection({
      page_id: igUserId,
      page_name: igUsername ? `Instagram: @${igUsername}` : null,
      page_access_token: longLivedToken,
      ig_business_account_id: igUserId,
      ig_username: igUsername
    }, env);

    // Suscribe la app a los mensajes y comentarios de esta cuenta de Instagram.
    const subRes = await fetch(
      `https://graph.instagram.com/${GRAPH_API_VERSION}/${igUserId}/subscribed_apps?subscribed_fields=messages,comments&access_token=${encodeURIComponent(longLivedToken)}`,
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

export async function onRequestGetDeleteConnection(context) {
  const { request, env } = context;
  if (!(await checkSessionAuth(request, env))) {
    return new Response('Unauthorized', { status: 401 });
  }
  const url = new URL(request.url);
  const pageId = url.searchParams.get('page_id');
  if (!pageId) {
    return htmlResponse('<h1>Falta page_id</h1><p><a href="/admin">Volver al dashboard</a></p>', 400);
  }
  try {
    // Des-suscribir en Meta primero, antes de borrar la fila local -- si no,
    // Meta sigue mandando webhooks a esta cuenta indefinidamente (la
    // conexión ya no existe localmente, así que handleEvent los descarta en
    // silencio, pero la suscripción queda huérfana del lado de Meta).
    const connection = await getConnectionByPageId(pageId, env);
    if (connection?.page_access_token) {
      const isInstagramConnection = !!connection.ig_business_account_id;
      const unsubUrl = isInstagramConnection
        ? `https://graph.instagram.com/${GRAPH_API_VERSION}/${pageId}/subscribed_apps?access_token=${encodeURIComponent(connection.page_access_token)}`
        : `https://graph.facebook.com/${GRAPH_API_VERSION}/${pageId}/subscribed_apps?access_token=${encodeURIComponent(connection.page_access_token)}`;
      const unsubRes = await fetch(unsubUrl, { method: 'DELETE' });
      if (!unsubRes.ok) {
        console.error('Meta desconectar: fallo al des-suscribir de Meta (se borra igual la fila local):', await unsubRes.text());
      }
    }
    await deleteConnectionByPageId(pageId, env);
    return htmlResponse(`<h1>✅ Eliminada</h1><p>Se eliminó la conexión con page_id ${escapeHtml(pageId)}.</p><p><a href="/admin">Volver al dashboard</a></p>`);
  } catch (err) {
    return htmlResponse(`<h1>Error</h1><p>${escapeHtml(err.message)}</p><p><a href="/admin">Volver al dashboard</a></p>`, 500);
  }
}

// --- Facebook Login for Business (Página de Facebook / Messenger) ---

export async function onRequestGetConnectFacebook(context) {
  const { request, env } = context;
  if (!(await checkSessionAuth(request, env))) {
    return new Response('Unauthorized', { status: 401 });
  }
  if (!env.META_APP_ID || !env.META_LOGIN_CONFIG_ID) {
    return htmlResponse('<h1>Falta configuración</h1><p>No están definidas <code>META_APP_ID</code> o <code>META_LOGIN_CONFIG_ID</code> en el Worker.</p>', 500);
  }

  const state = crypto.randomUUID();
  const dialogUrl = new URL(`https://www.facebook.com/${GRAPH_API_VERSION}/dialog/oauth`);
  dialogUrl.searchParams.set('client_id', env.META_APP_ID);
  dialogUrl.searchParams.set('redirect_uri', callbackUrlFacebook(request));
  dialogUrl.searchParams.set('config_id', env.META_LOGIN_CONFIG_ID);
  dialogUrl.searchParams.set('response_type', 'code');
  dialogUrl.searchParams.set('state', state);

  return new Response(null, {
    status: 302,
    headers: {
      Location: dialogUrl.toString(),
      'Set-Cookie': `${FACEBOOK_STATE_COOKIE_NAME}=${state}; HttpOnly; Secure; SameSite=Lax; Path=${STATE_COOKIE_PATH}; Max-Age=600`
    }
  });
}

export async function onRequestGetCallbackFacebook(context) {
  const { request, env } = context;
  if (!(await checkSessionAuth(request, env))) {
    return new Response('Unauthorized', { status: 401 });
  }

  const url = new URL(request.url);
  const clearStateCookie = `${FACEBOOK_STATE_COOKIE_NAME}=; HttpOnly; Secure; SameSite=Lax; Path=${STATE_COOKIE_PATH}; Max-Age=0`;

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
  const cookieState = parseCookieValue(request.headers.get('Cookie'), FACEBOOK_STATE_COOKIE_NAME);

  if (!code || !state || !cookieState || !timingSafeEqual(state, cookieState)) {
    return htmlResponse(
      '<h1>Conexión inválida</h1><p>Falta el código o el estado no coincide (posible cookie expirada). Intenta conectar de nuevo desde el dashboard.</p><p><a href="/admin">Volver al dashboard</a></p>',
      400,
      { 'Set-Cookie': clearStateCookie }
    );
  }

  if (!env.META_APP_ID || !env.META_APP_SECRET) {
    console.error('metaCallbackFacebook: falta config -- META_APP_ID presente?', !!env.META_APP_ID, 'META_APP_SECRET presente?', !!env.META_APP_SECRET);
    return htmlResponse('<h1>Falta configuración</h1><p>Definir <code>META_APP_ID</code> y <code>META_APP_SECRET</code> en el Worker.</p>', 500, { 'Set-Cookie': clearStateCookie });
  }

  try {
    // 1. code -> token de usuario de corta duración.
    const shortLivedUrl = new URL(`https://graph.facebook.com/${GRAPH_API_VERSION}/oauth/access_token`);
    shortLivedUrl.searchParams.set('client_id', env.META_APP_ID);
    shortLivedUrl.searchParams.set('client_secret', env.META_APP_SECRET);
    shortLivedUrl.searchParams.set('redirect_uri', callbackUrlFacebook(request));
    shortLivedUrl.searchParams.set('code', code);
    const shortLivedRes = await fetch(shortLivedUrl.toString());
    const shortLivedData = await shortLivedRes.json();
    if (!shortLivedRes.ok || !shortLivedData.access_token) {
      throw new Error(`Facebook rechazó el code: ${JSON.stringify(shortLivedData)}`);
    }

    // 2. Intercambiar por un token de usuario de larga duración (~60 días).
    // Los Page Access Tokens derivados de un token de usuario de larga
    // duración no expiran.
    const exchangeUrl = new URL(`https://graph.facebook.com/${GRAPH_API_VERSION}/oauth/access_token`);
    exchangeUrl.searchParams.set('grant_type', 'fb_exchange_token');
    exchangeUrl.searchParams.set('client_id', env.META_APP_ID);
    exchangeUrl.searchParams.set('client_secret', env.META_APP_SECRET);
    exchangeUrl.searchParams.set('fb_exchange_token', shortLivedData.access_token);
    const exchangeRes = await fetch(exchangeUrl.toString());
    const exchangeData = await exchangeRes.json();
    const longLivedUserToken = exchangeRes.ok && exchangeData.access_token ? exchangeData.access_token : shortLivedData.access_token;

    // 3. Business Portfolios a los que esta persona tiene acceso (requiere
    // el permiso business_management, incluido en la config de "Facebook
    // Login for Business" pero que hasta ahora ningún llamado ejercitaba
    // -- Meta necesita ver una llamada real usando el permiso, no solo que
    // esté otorgado). Es solo informativo: no cambia de dónde salen las
    // Páginas a conectar (eso sigue siendo /me/accounts, más abajo).
    let businessName = null;
    try {
      const businessesUrl = new URL(`https://graph.facebook.com/${GRAPH_API_VERSION}/me/businesses`);
      businessesUrl.searchParams.set('fields', 'id,name');
      businessesUrl.searchParams.set('access_token', longLivedUserToken);
      const businessesRes = await fetch(businessesUrl.toString());
      const businessesData = await businessesRes.json();
      if (businessesRes.ok && Array.isArray(businessesData.data) && businessesData.data.length > 0) {
        businessName = businessesData.data[0].name;
      }
    } catch (err) {
      console.error('Meta OAuth: fallo al consultar /me/businesses (business_management):', err.message);
    }

    // 4. Páginas que administra esta persona, con su Page Access Token.
    const accountsUrl = new URL(`https://graph.facebook.com/${GRAPH_API_VERSION}/me/accounts`);
    accountsUrl.searchParams.set('fields', 'id,name,access_token');
    accountsUrl.searchParams.set('access_token', longLivedUserToken);
    const accountsRes = await fetch(accountsUrl.toString());
    const accountsData = await accountsRes.json();
    if (!accountsRes.ok || !Array.isArray(accountsData.data)) {
      throw new Error(`No se pudo obtener la lista de páginas: ${JSON.stringify(accountsData)}`);
    }
    if (accountsData.data.length === 0) {
      throw new Error('Esta cuenta no administra ninguna Página de Facebook (o no se concedió acceso a ninguna durante el login).');
    }

    // page.access_token puede faltar si el rol de Germán en esa Página no
    // alcanza (o si Meta no lo devolvió por algún otro motivo). Guardar la
    // conexión igual con un token vacío reproduce el mismo bug de "Cannot
    // parse access token" que ya tuvimos con el secret de Cloudflare --
    // mejor sacarla de la lista y avisar, que ofrecer algo que no va a
    // funcionar.
    const selectable = accountsData.data.filter((page) => !!page.access_token);
    const skipped = accountsData.data.filter((page) => !page.access_token).map((page) => page.name);

    if (selectable.length === 0) {
      throw new Error('Ninguna Página trajo permisos suficientes para conectarse (no llegó access_token para ninguna). Revisá los permisos otorgados durante el login.');
    }

    // No conectamos todo automáticamente: la cuenta de Facebook puede
    // administrar Páginas de otros negocios además de la propia, y como el
    // producto es multi-cliente eso significaría suscribir el bot a cuentas
    // que no corresponden sin preguntar. En vez de eso, guardamos la lista
    // (con sus tokens) en KV bajo un token de selección de un solo uso y
    // mostramos un checklist para que Germán elija cuáles conectar.
    const selectionToken = crypto.randomUUID();
    if (env.RATE_LIMIT_KV) {
      await env.RATE_LIMIT_KV.put(
        `metaselect:${selectionToken}`,
        JSON.stringify(selectable.map((p) => ({ id: p.id, name: p.name, access_token: p.access_token }))),
        { expirationTtl: 600 }
      );
    } else {
      throw new Error('Falta el binding RATE_LIMIT_KV en el Worker (se usa para guardar la selección de Páginas de forma temporal).');
    }

    const checklistHtml = selectable.map((page, i) => `
        <label style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid #2A2A2A;">
          <input type="checkbox" name="page_id" value="${escapeHtml(page.id)}" id="page-${i}" checked style="width:16px;height:16px;">
          <span>${escapeHtml(page.name)}</span>
        </label>`).join('');

    return htmlResponse(
      `<h1>Elegí qué Página conectar</h1>
      ${businessName ? `<p style="color:#8A8A8A;font-size:13px;">Business Portfolio: ${escapeHtml(businessName)}</p>` : ''}
      <p>Tu cuenta de Facebook administra ${selectable.length === 1 ? 'esta Página' : 'estas Páginas'}. Elegí cuál conectar al bot (podés desmarcar las que no correspondan):</p>
      <form method="POST" action="/admin/meta/connect-facebook/confirm">
        <input type="hidden" name="selection_token" value="${escapeHtml(selectionToken)}">
        ${checklistHtml}
        <button type="submit" style="margin-top:20px;width:100%;background:#E8A33D;color:#0A0A0A;font-weight:700;border:none;border-radius:8px;padding:12px;font-size:14px;cursor:pointer;">Conectar seleccionadas</button>
      </form>
      ${skipped.length ? `<p style="color:#E8A33D;margin-top:16px;">Sin permisos suficientes, no aparecen en la lista: ${escapeHtml(skipped.join(', '))}</p>` : ''}
      <p style="margin-top:16px;"><a href="/admin">Cancelar y volver al dashboard</a></p>`,
      200,
      { 'Set-Cookie': clearStateCookie }
    );
  } catch (err) {
    console.error('Meta OAuth callback (Facebook) error:', err.message);
    return htmlResponse(`<h1>Error al conectar</h1><p>${escapeHtml(err.message)}</p><p><a href="/admin">Volver al dashboard</a></p>`, 500, { 'Set-Cookie': clearStateCookie });
  }
}

export async function onRequestPostConnectFacebookConfirm(context) {
  const { request, env } = context;
  if (!(await checkSessionAuth(request, env))) {
    return new Response('Unauthorized', { status: 401 });
  }
  if (!env.RATE_LIMIT_KV) {
    return htmlResponse('<h1>Falta configuración</h1><p>No está definido el binding <code>RATE_LIMIT_KV</code> en el Worker.</p>', 500);
  }

  const form = await request.formData();
  const selectionToken = form.get('selection_token');
  const selectedIds = new Set(form.getAll('page_id').map(String));

  if (!selectionToken) {
    return htmlResponse('<h1>Selección inválida</h1><p>Falta el token de selección. Intenta conectar de nuevo desde el dashboard.</p><p><a href="/admin/meta/connect-facebook">Volver a intentar</a></p>', 400);
  }

  const kvKey = `metaselect:${selectionToken}`;
  const storedRaw = await env.RATE_LIMIT_KV.get(kvKey);
  if (!storedRaw) {
    return htmlResponse('<h1>Selección expirada</h1><p>Pasaron más de 10 minutos o ya se usó esta selección. Conectá de nuevo desde el dashboard.</p><p><a href="/admin/meta/connect-facebook">Volver a intentar</a></p>', 400);
  }
  // Un solo uso: se borra apenas se lee, se haya podido conectar algo o no.
  await env.RATE_LIMIT_KV.delete(kvKey);

  let pages;
  try {
    pages = JSON.parse(storedRaw);
  } catch {
    return htmlResponse('<h1>Error</h1><p>La selección guardada quedó corrupta. Conectá de nuevo desde el dashboard.</p><p><a href="/admin/meta/connect-facebook">Volver a intentar</a></p>', 500);
  }

  const toConnect = pages.filter((p) => selectedIds.has(String(p.id)));
  if (toConnect.length === 0) {
    return htmlResponse('<h1>No se seleccionó ninguna Página</h1><p>No se conectó nada. Si querés conectar alguna, empezá de nuevo.</p><p><a href="/admin/meta/connect-facebook">Volver a intentar</a></p><p><a href="/admin">Volver al dashboard</a></p>');
  }

  const connected = [];
  try {
    for (const page of toConnect) {
      await upsertConnection({
        page_id: page.id,
        page_name: `Facebook: ${page.name}`,
        page_access_token: page.access_token,
        ig_business_account_id: null,
        ig_username: null
      }, env);

      const subRes = await fetch(
        `https://graph.facebook.com/${GRAPH_API_VERSION}/${page.id}/subscribed_apps?subscribed_fields=messages,messaging_postbacks&access_token=${encodeURIComponent(page.access_token)}`,
        { method: 'POST' }
      );
      if (!subRes.ok) {
        const subErr = await subRes.text();
        console.error(`Meta OAuth: fallo al suscribir la app a mensajes de la página ${page.id}:`, subErr);
      }
      connected.push(page.name);
    }

    return htmlResponse(
      `<h1>✅ Conectado</h1><p>Se conectaron y suscribieron correctamente:</p><ul>${connected.map((n) => `<li>Facebook: ${escapeHtml(n)}</li>`).join('')}</ul><p><a href="/admin">Volver al dashboard</a></p>`
    );
  } catch (err) {
    console.error('Meta OAuth confirm (Facebook) error:', err.message);
    return htmlResponse(`<h1>Error al conectar</h1><p>${escapeHtml(err.message)}</p><p><a href="/admin">Volver al dashboard</a></p>`, 500);
  }
}
