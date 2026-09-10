// src/api/whatsapp-connect.js
// Flujo de "Embedded Signup" de WhatsApp Business Platform: permite que
// múltiples negocios conecten su propia WhatsApp Business Account (WABA) al
// bot, igual que ya se hace con Instagram/Facebook (ver meta-connect.js).
// A diferencia de esos flujos, este usa el SDK de JavaScript de Meta
// (FB.login) desde el navegador en vez de un redirect de servidor -- así lo
// exige Meta específicamente para Embedded Signup de WhatsApp.
//
// Requiere:
// - META_APP_ID / META_APP_SECRET: la misma app de Meta que ya se usa para
//   Facebook/Instagram.
// - WHATSAPP_EMBEDDED_SIGNUP_CONFIG_ID (var, no secreto): ID de una
//   configuración de "Inicio de sesión con Facebook para empresas" cuyo
//   tipo de activo incluya WhatsApp Business Account, con permisos
//   whatsapp_business_management y whatsapp_business_messaging. Si no está
//   definida, se reusa META_LOGIN_CONFIG_ID (esa config ya incluye esos
//   permisos, ver el comentario en wrangler.toml) -- solo funciona si su
//   tipo de activo también permite compartir una WhatsApp Business Account.
//
// Requiere la tabla whatsapp_connections en Supabase (ver
// lib/whatsappConnections.js, que trae el SQL para crearla).
//
// Protegido detrás de la sesión de /admin: solo alguien ya logueado en el
// dashboard puede iniciar o completar esta conexión.

import { checkSessionAuth } from '../lib/adminSession.js';
import {
  upsertWhatsappConnection,
  deleteWhatsappConnection,
  getConnectionByPhoneNumberId
} from '../lib/whatsappConnections.js';

const GRAPH_API_VERSION = 'v21.0';

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function htmlResponse(body, status = 200) {
  return new Response(
    `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Conectar WhatsApp — Atiéndeme la Pyme</title>
<style>body{font-family:system-ui,sans-serif;background:#0A0A0A;color:#EDEDED;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:24px;}
.card{max-width:480px;background:#161616;border:1px solid #2A2A2A;border-radius:12px;padding:32px;line-height:1.5;}
a{color:#43D17C;}h1{margin-top:0;font-size:20px;}
button{background:#25D366;color:#08341c;font-weight:700;border:none;border-radius:8px;padding:12px 20px;font-size:14px;cursor:pointer;}
button:hover{background:#1ebe5b;}
button:disabled{opacity:.6;cursor:default;}
.status{margin-top:16px;font-size:13px;color:#8A8A82;}</style></head>
<body><div class="card">${body}</div></body></html>`,
    { status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'X-Robots-Tag': 'noindex, nofollow' } }
  );
}

export async function onRequestGetConnect(context) {
  const { request, env } = context;
  if (!(await checkSessionAuth(request, env))) {
    return new Response('Unauthorized', { status: 401 });
  }
  const configId = env.WHATSAPP_EMBEDDED_SIGNUP_CONFIG_ID || env.META_LOGIN_CONFIG_ID;
  if (!env.META_APP_ID || !configId) {
    return htmlResponse('<h1>Falta configuración</h1><p>Definir <code>META_APP_ID</code> y <code>WHATSAPP_EMBEDDED_SIGNUP_CONFIG_ID</code> (o <code>META_LOGIN_CONFIG_ID</code>) en el Worker.</p><p><a href="/admin">Volver al dashboard</a></p>', 500);
  }

  return htmlResponse(`
<h1>Conectar WhatsApp</h1>
<p>Se abrirá una ventana de Meta para elegir o crear la WhatsApp Business Account que quieres conectar.</p>
<button id="waBtn" onclick="launchSignup()">Continuar con WhatsApp Business</button>
<div class="status" id="waStatus"></div>
<p style="margin-top:24px;"><a href="/admin">Cancelar y volver al dashboard</a></p>
<script src="https://connect.facebook.net/es_LA/sdk.js"></script>
<script>
window.fbAsyncInit = function() {
  FB.init({ appId: '${env.META_APP_ID}', autoLogAppEvents: true, xfbml: false, version: '${GRAPH_API_VERSION}' });
};
let waSessionData = null;
window.addEventListener('message', (event) => {
  if (!event.origin.endsWith('facebook.com')) return;
  try {
    const data = JSON.parse(event.data);
    if (data.type === 'WA_EMBEDDED_SIGNUP') {
      if (data.event === 'FINISH') {
        waSessionData = data.data || {};
      } else if (data.event === 'CANCEL') {
        setStatus('Cancelaste la conexión en el paso: ' + (data.data && data.data.current_step || 'desconocido'));
      } else if (data.event === 'ERROR') {
        setStatus('Meta reportó un error: ' + (data.data && data.data.error_message || 'desconocido'));
      }
    }
  } catch (e) { /* mensajes de otro origen que no son JSON, se ignoran */ }
});
function setStatus(text) { document.getElementById('waStatus').textContent = text; }
</script>

<script>
function launchSignup() {
  const btn = document.getElementById('waBtn');
  btn.disabled = true;
  setStatus('Abriendo ventana de Meta...');
  FB.login((response) => {
    if (!response.authResponse || !response.authResponse.code) {
      setStatus('No se completó el inicio de sesión.');
      btn.disabled = false;
      return;
    }
    const code = response.authResponse.code;
    // El evento 'message' (WA_EMBEDDED_SIGNUP) suele llegar antes que este
    // callback, pero por si acaso esperamos un instante a que waSessionData
    // se llene antes de enviar el code al backend.
    setTimeout(() => finishConnection(code), 400);
  }, {
    config_id: '${configId}',
    response_type: 'code',
    override_default_response_type: true,
    extras: { featureType: '', sessionInfoVersion: '3' }
  });
}
async function finishConnection(code) {
  setStatus('Conectando...');
  try {
    const res = await fetch('/admin/whatsapp/connect/exchange', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        waba_id: waSessionData && waSessionData.waba_id,
        phone_number_id: waSessionData && waSessionData.phone_number_id
      })
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Error desconocido');
    setStatus('✅ Conectado: ' + (data.displayPhoneNumber || data.phoneNumberId));
    setTimeout(() => { window.location.href = '/admin'; }, 1200);
  } catch (err) {
    setStatus('Error: ' + err.message);
    document.getElementById('waBtn').disabled = false;
  }
}
</script>`);
}


export async function onRequestPostExchange(context) {
  const { request, env } = context;
  if (!(await checkSessionAuth(request, env))) {
    return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }
  const configId = env.WHATSAPP_EMBEDDED_SIGNUP_CONFIG_ID || env.META_LOGIN_CONFIG_ID;
  if (!env.META_APP_ID || !env.META_APP_SECRET || !configId) {
    return new Response(JSON.stringify({ success: false, error: 'Falta configuración del Worker' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ success: false, error: 'Body inválido' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const { code, waba_id: wabaId, phone_number_id: phoneNumberId } = body;
  if (!code || !wabaId || !phoneNumberId) {
    return new Response(JSON.stringify({ success: false, error: 'Faltan code, waba_id o phone_number_id (¿se cerró la ventana antes de terminar?)' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    // 1. code -> token de corta duración (flujo de Embedded Signup vía SDK
    // de JS, sin redirect_uri -- a diferencia del flujo de Página de
    // Facebook, que sí es un redirect de servidor).
    const shortLivedUrl = new URL(`https://graph.facebook.com/${GRAPH_API_VERSION}/oauth/access_token`);
    shortLivedUrl.searchParams.set('client_id', env.META_APP_ID);
    shortLivedUrl.searchParams.set('client_secret', env.META_APP_SECRET);
    shortLivedUrl.searchParams.set('code', code);
    const shortLivedRes = await fetch(shortLivedUrl.toString());
    const shortLivedData = await shortLivedRes.json();
    if (!shortLivedRes.ok || !shortLivedData.access_token) {
      throw new Error(`Meta rechazó el code: ${JSON.stringify(shortLivedData)}`);
    }

    // 2. Intercambiar por un token de larga duración (60 días).
    const exchangeUrl = new URL(`https://graph.facebook.com/${GRAPH_API_VERSION}/oauth/access_token`);
    exchangeUrl.searchParams.set('grant_type', 'fb_exchange_token');
    exchangeUrl.searchParams.set('client_id', env.META_APP_ID);
    exchangeUrl.searchParams.set('client_secret', env.META_APP_SECRET);
    exchangeUrl.searchParams.set('fb_exchange_token', shortLivedData.access_token);
    const exchangeRes = await fetch(exchangeUrl.toString());
    const exchangeData = await exchangeRes.json();
    const longLivedToken = exchangeRes.ok && exchangeData.access_token ? exchangeData.access_token : shortLivedData.access_token;

    // 3. Suscribir la app a esta WABA (para recibir mensajes por webhook).
    const subRes = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${wabaId}/subscribed_apps?access_token=${encodeURIComponent(longLivedToken)}`,
      { method: 'POST' }
    );
    if (!subRes.ok) {
      console.error('WhatsApp connect: fallo al suscribir la app a la WABA:', await subRes.text());
    }

    // 4. Registrar el número en Cloud API (obligatorio para poder enviar
    // mensajes). El PIN es de verificación en dos pasos de WhatsApp, no una
    // credencial que Germán deba recordar -- se genera al azar acá porque
    // solo se usa internamente, vía API, nunca se ingresa a mano.
    const pin = String(Math.floor(100000 + Math.random() * 900000));
    const registerRes = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/register?access_token=${encodeURIComponent(longLivedToken)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messaging_product: 'whatsapp', pin })
      }
    );
    if (!registerRes.ok) {
      const registerErr = await registerRes.text();
      console.error('WhatsApp connect: fallo al registrar el número:', registerErr);
      throw new Error('No se pudo registrar el número en WhatsApp Cloud API. Puede que ya esté registrado en otra plataforma (ver Meta Business Manager).');
    }

    // 5. Datos del número para mostrar en el dashboard.
    const infoRes = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}?fields=display_phone_number,verified_name&access_token=${encodeURIComponent(longLivedToken)}`
    );
    const infoData = await infoRes.json();
    const displayPhoneNumber = infoData.display_phone_number || null;
    const businessName = infoData.verified_name || null;

    await upsertWhatsappConnection({
      phone_number_id: phoneNumberId,
      waba_id: wabaId,
      display_phone_number: displayPhoneNumber,
      business_name: businessName,
      access_token: longLivedToken
    }, env);

    return new Response(
      JSON.stringify({ success: true, phoneNumberId, displayPhoneNumber, businessName }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('WhatsApp connect exchange error:', err.message);
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

export async function onRequestGetDeleteConnection(context) {
  const { request, env } = context;
  if (!(await checkSessionAuth(request, env))) {
    return new Response('Unauthorized', { status: 401 });
  }
  const url = new URL(request.url);
  const phoneNumberId = url.searchParams.get('phone_number_id');
  if (!phoneNumberId) {
    return htmlResponse('<h1>Falta phone_number_id</h1><p><a href="/admin">Volver al dashboard</a></p>', 400);
  }
  try {
    const connection = await getConnectionByPhoneNumberId(phoneNumberId, env);
    if (connection?.access_token && connection?.waba_id) {
      const unsubRes = await fetch(
        `https://graph.facebook.com/${GRAPH_API_VERSION}/${connection.waba_id}/subscribed_apps?access_token=${encodeURIComponent(connection.access_token)}`,
        { method: 'DELETE' }
      );
      if (!unsubRes.ok) {
        console.error('WhatsApp desconectar: fallo al des-suscribir de Meta (se borra igual la fila local):', await unsubRes.text());
      }
    }
    await deleteWhatsappConnection(phoneNumberId, env);
    return htmlResponse(`<h1>✅ Eliminada</h1><p>Se eliminó la conexión de WhatsApp (${escapeHtml(phoneNumberId)}).</p><p><a href="/admin">Volver al dashboard</a></p>`);
  } catch (err) {
    console.error('WhatsApp desconectar error:', err.message);
    return htmlResponse(`<h1>Error al desconectar</h1><p>${escapeHtml(err.message)}</p><p><a href="/admin">Volver al dashboard</a></p>`, 500);
  }
}
