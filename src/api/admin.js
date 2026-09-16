// src/api/admin.js
// Dashboard interno: metricas + conversaciones + agenda. Protegido con login
// por sesion (cookie firmada, ver src/lib/adminSession.js) -- antes era Basic
// Auth con una sola contrasena compartida.
// Requiere los secrets ADMIN_DASHBOARD_PASSWORD y ADMIN_SESSION_SECRET.

import { checkAllLimits } from '../lib/rateLimit.js';
import { timingSafeEqual } from '../lib/timingSafe.js';
import { checkSessionAuth, createSessionCookie, clearSessionCookie } from '../lib/adminSession.js';
import { listConnections } from '../lib/metaConnections.js';
import { listWhatsappConnections } from '../lib/whatsappConnections.js';

function escHtml(x) {
    return String(x ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function connectionsCardHtml(connections) {
    const rows = (connections || []).map(c => {
        const label = c.ig_username
            ? '@' + escHtml(c.ig_username)
            : (c.page_name ? escHtml(c.page_name) : 'Cuenta conectada');
        const sub = c.page_name && c.ig_username ? escHtml(c.page_name) : '';
        return `<div class="conn-row">
          <div><span class="conn-dot"></span>${label}${sub ? ' <span class="conn-sub">(' + sub + ')</span>' : ''}</div>
          <a href="/admin/meta/connections/delete?page_id=${encodeURIComponent(c.page_id)}" onclick="return confirm('¿Desconectar esta cuenta?');">Desconectar</a>
        </div>`;
    }).join('');
    return `<div class="card">
            <h2>Conexión con Meta</h2>
            ${rows || '<p class="empty">Todavía no hay cuentas conectadas.</p>'}
            <div class="stack" style="gap:8px;margin-top:${rows ? '14px' : '10px'};">
              <a class="connect-btn" href="/admin/meta/connect">→ Conectar Instagram</a>
              <a class="connect-btn" href="/admin/meta/connect-facebook">→ Conectar Página de Facebook</a>
            </div>
          </div>`;
}

function whatsappConnectionsCardHtml(connections) {
    const rows = (connections || []).map(c => {
        const label = c.business_name ? escHtml(c.business_name) : 'Cuenta de WhatsApp';
        const sub = c.display_phone_number ? escHtml(c.display_phone_number) : '';
        return `<div class="conn-row">
          <div><span class="conn-dot"></span>${label}${sub ? ' <span class="conn-sub">(' + sub + ')</span>' : ''}</div>
          <a href="/admin/whatsapp/connections/delete?phone_number_id=${encodeURIComponent(c.phone_number_id)}" onclick="return confirm('¿Desconectar este número?');">Desconectar</a>
        </div>`;
    }).join('');
    return `<div class="card">
            <h2>Conexión con WhatsApp</h2>
            ${rows || '<p class="empty">Todavía no hay números conectados.</p>'}
            <div class="stack" style="gap:8px;margin-top:${rows ? '14px' : '10px'};">
              <a class="connect-btn" href="/admin/whatsapp/connect">→ Conectar WhatsApp</a>
            </div>
          </div>`;
}


function tooManyAttemptsResponse(retryAfter) {
    return new Response('Demasiados intentos. Intenta de nuevo en unos minutos.', {
        status: 429,
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Retry-After': String(retryAfter || 300)
        }
    });
}

async function checkAdminBruteForce(request, env) {
    const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown-ip';
    // Login endpoint: mas estricto que el chat publico. 10 intentos / 5 min,
    // con rafaga de 3 en 5s, por IP.
    return checkAllLimits(clientIP, env.RATE_LIMIT_KV, {
        maxRequests: 10,
        windowSeconds: 300,
        maxBurstRequests: 3,
        burstWindowSeconds: 5
    });
}

const LOGIN_STYLES = `
:root{--bg:#0A0A0A;--panel:#141414;--line:#262626;--text:#EDEDE8;--muted:#8A8A82;--accent:#E8A33D;--accent-ink:#0A0A0A;--err:#E85D3D;}
*{box-sizing:border-box;margin:0;padding:0;}
body{background:var(--bg);color:var(--text);font-family:'JetBrains Mono',ui-monospace,monospace;font-size:14px;line-height:1.55;min-height:100vh;display:flex;align-items:center;justify-content:center;}
.card{width:100%;max-width:340px;padding:32px;background:var(--panel);border:1px solid var(--line);border-radius:12px;}
.brand{font-weight:700;font-size:14px;margin-bottom:24px;letter-spacing:.02em;}
.brand span{color:var(--accent);}
label{display:block;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:8px;}
input{width:100%;background:#1A1A1A;border:1px solid var(--line);border-radius:8px;color:var(--text);font:inherit;padding:12px;margin-bottom:16px;}
input:focus{outline:none;border-color:var(--accent);}
button{width:100%;background:var(--accent);color:var(--accent-ink);font:inherit;font-weight:700;padding:12px;border:none;border-radius:8px;cursor:pointer;}
button:hover{opacity:.9;}
.error{color:var(--err);font-size:12.5px;margin:-8px 0 16px;}
`;

// Solo rutas relativas del mismo sitio: "//evil.com" o "/\\evil.com" también
// empiezan con "/" pero el navegador los trata como otro dominio.
function safeNextPath(next) {
    return typeof next === 'string' && /^\/(?![/\\])/.test(next) ? next : '/admin';
}

// Las páginas del panel no deben poder embeberse en un iframe ajeno
// (clickjacking sobre "Desconectar", login, etc.).
const ADMIN_SECURITY_HEADERS = {
    'X-Robots-Tag': 'noindex, nofollow',
    'Cache-Control': 'no-store',
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Content-Security-Policy': "frame-ancestors 'none'"
};

function loginPageHtml(options) {
    const error = options && options.error;
    const next = safeNextPath(options && options.next);
    return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Acceso \u2014 Ati\u00e9ndeme la Pyme</title>
<meta name="robots" content="noindex, nofollow">
<style>${LOGIN_STYLES}</style>
</head>
<body>
  <div class="card">
    <div class="brand">Ati\u00e9ndeme<span>_</span>la Pyme</div>
    <form method="POST" action="/admin/login">
      <input type="hidden" name="next" value="${next.replace(/"/g, '&quot;')}">
      <label for="password">Contrase\u00f1a</label>
      <input type="password" id="password" name="password" autofocus required>
      ${error ? '<div class="error">Contrase\u00f1a incorrecta.</div>' : ''}
      <button type="submit">Entrar</button>
    </form>
  </div>
</body>
</html>`;
}

function loginPageResponse(options) {
    return new Response(loginPageHtml(options), {
        status: (options && options.error) ? 401 : 200,
        headers: {
            'Content-Type': 'text/html; charset=utf-8',
            ...ADMIN_SECURITY_HEADERS
        }
    });
}

async function onRequestPostAdminLogin(context) {
    const { request, env } = context;

    const rlCheck = await checkAdminBruteForce(request, env);
    if (!rlCheck.allowed) {
        return tooManyAttemptsResponse(rlCheck.retryAfter);
    }

    if (!env.ADMIN_DASHBOARD_PASSWORD || !env.ADMIN_SESSION_SECRET) {
        return new Response('Panel admin no configurado', { status: 500 });
    }

    const form = await request.formData();
    const password = String(form.get('password') || '');
    const next = String(form.get('next') || '/admin');

    if (!timingSafeEqual(password, env.ADMIN_DASHBOARD_PASSWORD)) {
        return loginPageResponse({ error: true, next });
    }

    const cookie = await createSessionCookie(env.ADMIN_SESSION_SECRET);
    return new Response(null, {
        status: 303,
        headers: {
            'Location': safeNextPath(next),
            'Set-Cookie': cookie
        }
    });
}

function onRequestPostAdminLogout() {
    return new Response(null, {
        status: 303,
        headers: {
            'Location': '/admin',
            'Set-Cookie': clearSessionCookie()
        }
    });
}

// Tope de filas que se incrustan en el HTML del dashboard: sin esto, con volumen
// real la página cargaría la tabla completa en cada visita.
const ADMIN_ROW_LIMIT = 500;

async function fetchTable(env, path) {
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) return { rows: [], total: 0 };
    try {
        const res = await fetch(`${env.SUPABASE_URL}/rest/v1/${path}&limit=${ADMIN_ROW_LIMIT}`, {
            headers: {
                apikey: env.SUPABASE_SERVICE_KEY,
                Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
                Prefer: 'count=exact'
            }
        });
        if (!res.ok) return { rows: [], total: 0 };
        const rows = await res.json();
        // Content-Range: "0-499/1234" -> total real de filas en la tabla.
        const total = Number((res.headers.get('Content-Range') || '').split('/')[1]);
        return { rows, total: Number.isFinite(total) ? total : rows.length };
    } catch (err) {
        console.error('Admin fetch error:', path, err.message);
        return { rows: [], total: 0 };
    }
}

function fetchChatSessions(env) {
    return fetchTable(env, 'chat_sessions?select=*&order=updated_at.desc');
}

async function fetchAppointments(env) {
    // Las más recientes primero para que el tope no deje fuera las próximas;
    // el dashboard las usa en orden cronológico.
    const result = await fetchTable(env, 'scheduled_appointments?select=*&order=appointment_date.desc,appointment_time.desc');
    return { ...result, rows: result.rows.reverse() };
}

// Serializa datos para inyectar en <script> de forma segura
function safeJson(data) {
    return JSON.stringify(data)
        .replace(/</g, '\\u003c')
        .replace(/\u2028/g, '\\u2028')
        .replace(/\u2029/g, '\\u2029');
}

// ---------------------------------------------------------------------------
// Dashboard. Estructura pensada como plantilla para el panel de cada cliente:
//   Inicio        -> lo que requiere acción, últimos 7 días, canales conectados
//   Conversaciones, Agenda
//   Sistema       -> solo para la administración de Atiéndeme la Pyme
//                    (PageSpeed, accesos internos). Para el panel de un
//                    cliente se quita esta vista completa.
// Las tarjetas de conexión con Meta/WhatsApp (connectionsCardHtml y
// whatsappConnectionsCardHtml) no se tocan: el flujo está en App Review.
// ---------------------------------------------------------------------------

const ICONS = {
    home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9.5 21v-6h5v6"/>',
    chat: '<path d="M4 5h16v11H9l-5 4z"/><path d="M8 9.5h8M8 12.5h5"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15.5"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/>',
    system: '<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><rect x="14" y="4.5" width="4" height="5"/><rect x="6" y="14.5" width="4" height="5"/>',
    refresh: '<path d="M20 12a8 8 0 1 1-2.34-5.66"/><path d="M20 4v5h-5"/>',
    logout: '<path d="M14 4h6v16h-6"/><path d="M10 8l-4 4 4 4M6 12h10"/>',
    external: '<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v6H4V6h6"/>'
};

function icon(name, size = 18) {
    return `<svg class="ico" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="square" aria-hidden="true">${ICONS[name]}</svg>`;
}

const ADMIN_STYLES = `
:root{
  --bg:#0A0A0A;--surface:#111111;--surface-2:#171717;--hover:#1C1C1C;
  --line:#242424;--line-strong:#363636;
  --text:#EDEDE8;--muted:#A3A39B;--faint:#75756E;
  --accent:#E8A33D;--ink:#0A0A0A;--ok:#43D17C;--alert:#FF5F57;
  --display:'Space Grotesk','Arial Black',sans-serif;
  --mono:'JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,monospace;
}
*{box-sizing:border-box;margin:0;padding:0;}
html{scrollbar-color:var(--line-strong) var(--bg);}
body{background:var(--bg);color:var(--text);font-family:var(--mono);font-size:13px;line-height:1.55;-webkit-font-smoothing:antialiased;}
::selection{background:var(--accent);color:var(--ink);}
a{color:var(--accent);text-decoration:none;text-underline-offset:3px;}
a:hover{text-decoration:underline;}
button{font:inherit;color:inherit;}
:focus-visible{outline:2px solid var(--accent);outline-offset:2px;}
.num-tab{font-variant-numeric:tabular-nums;}

/* ---- estructura ---- */
.layout{display:grid;grid-template-columns:232px minmax(0,1fr);min-height:100vh;max-width:1360px;margin:0 auto;border-left:1px solid var(--line);border-right:1px solid var(--line);}
.side{border-right:1px solid var(--line);padding:24px 16px 20px;display:flex;flex-direction:column;position:sticky;top:0;height:100vh;}
.brand{display:flex;align-items:center;gap:10px;font-family:var(--display);font-weight:700;font-size:15px;letter-spacing:-.01em;margin:0 8px 28px;}
.brand-mark{display:inline-flex;align-items:flex-end;gap:3px;font-size:20px;line-height:1;}
.brand-mark i{display:inline-block;width:6px;height:15px;background:var(--accent);margin-bottom:2px;}
.nav{display:flex;flex-direction:column;gap:2px;}
.nav-btn{display:flex;align-items:center;gap:12px;width:100%;text-align:left;background:none;border:0;border-left:2px solid transparent;color:var(--muted);padding:10px 12px;cursor:pointer;transition:background .15s,color .15s,border-color .15s;}
.nav-btn:hover{background:var(--surface);color:var(--text);}
.nav-btn[aria-current="page"]{color:var(--text);background:var(--surface);border-left-color:var(--accent);}
.nav-btn[aria-current="page"] .ico{color:var(--accent);}
.nav-count{margin-left:auto;min-width:22px;padding:1px 6px;text-align:center;font-size:11px;background:var(--alert);color:var(--ink);font-weight:700;}
.side-foot{margin-top:auto;display:flex;flex-direction:column;gap:14px;padding:0 4px;}
.status{display:flex;align-items:center;gap:8px;color:var(--muted);font-size:11.5px;}
.dot{width:7px;height:7px;border-radius:50%;background:var(--ok);flex-shrink:0;}
.logout{display:flex;align-items:center;gap:10px;background:none;border:1px solid var(--line);color:var(--muted);padding:9px 12px;cursor:pointer;width:100%;}
.logout:hover{border-color:var(--line-strong);color:var(--text);}

.main{padding:32px 36px 64px;min-width:0;}
.page-head{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:32px;}
h1{font-family:var(--display);font-size:30px;line-height:1.1;letter-spacing:-.02em;font-weight:700;}
.page-sub{color:var(--muted);margin-top:6px;}
.btn{display:inline-flex;align-items:center;gap:8px;background:var(--surface);border:1px solid var(--line-strong);color:var(--text);padding:9px 14px;cursor:pointer;white-space:nowrap;transition:border-color .15s,color .15s,background .15s;}
.btn:hover{border-color:var(--accent);color:var(--accent);text-decoration:none;}
.btn:disabled{opacity:.5;cursor:default;border-color:var(--line-strong);color:var(--muted);}
.btn-primary{background:var(--accent);border-color:var(--accent);color:var(--ink);font-weight:700;}
.btn-primary:hover{color:var(--ink);background:#F0B052;border-color:#F0B052;}
.btn-sm{padding:6px 10px;font-size:12px;}

.section{margin-top:44px;}
.section:first-of-type{margin-top:0;}
.section-head{display:flex;align-items:baseline;justify-content:space-between;gap:12px;margin-bottom:14px;flex-wrap:wrap;}
h2{font-family:var(--display);font-size:19px;letter-spacing:-.01em;font-weight:700;}
.section-note{color:var(--muted);font-size:12px;}

.view{display:none;}
.view.active{display:block;}

/* ---- requiere tu atención ---- */
.attention{display:grid;grid-template-columns:1.25fr 1fr 1fr;border:1px solid var(--line);background:var(--surface);}
.lane{min-width:0;border-right:1px solid var(--line);display:flex;flex-direction:column;}
.lane:last-child{border-right:0;}
.lane-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:14px 16px;border-bottom:1px solid var(--line);}
.lane-title{font-weight:700;font-size:13px;}
.lane-count{font-family:var(--display);font-size:20px;font-weight:700;line-height:1;}
.lane-count.hot{color:var(--alert);}
.lane-count.zero{color:var(--faint);}
.item{padding:13px 16px;border-bottom:1px solid var(--line);min-width:0;}
.item:last-child{border-bottom:0;}
.item-top{display:flex;align-items:baseline;gap:8px;min-width:0;}
.item-title{font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0;}
.item-time{margin-left:auto;color:var(--muted);font-size:11.5px;white-space:nowrap;}
.item-meta{color:var(--muted);font-size:12px;margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.item-quote{color:var(--text);font-size:12.5px;margin-top:8px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
.item-actions{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;}
.appt-time{font-family:var(--display);font-size:18px;font-weight:700;color:var(--accent);min-width:58px;}
.appt-day{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);padding:10px 16px 0;}
.lane-empty{padding:18px 16px;color:var(--muted);font-size:12.5px;line-height:1.6;}
.lane-empty strong{display:block;color:var(--text);font-weight:700;margin-bottom:2px;}
.lane-more{margin-top:auto;padding:11px 16px;border-top:1px solid var(--line);}
.link-btn{background:none;border:0;color:var(--accent);cursor:pointer;padding:0;text-underline-offset:3px;}
.link-btn:hover{text-decoration:underline;}

.tag{display:inline-block;font-size:10.5px;line-height:1.5;padding:0 6px;border:1px solid var(--line-strong);color:var(--muted);white-space:nowrap;}
.tag.alert{border-color:var(--alert);color:var(--alert);}
.tag.ok{border-color:var(--ok);color:var(--ok);}
.tag.accent{border-color:var(--accent);color:var(--accent);}

/* ---- últimos 7 días ---- */
.metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));border:1px solid var(--line);background:var(--surface);}
.metric{padding:18px 18px 16px;border-right:1px solid var(--line);min-width:0;}
.metric:last-child{border-right:0;}
.metric-label{color:var(--muted);font-size:12px;}
.metric-value{font-family:var(--display);font-size:34px;font-weight:700;line-height:1.1;margin-top:6px;letter-spacing:-.02em;}
.metric.key .metric-value{color:var(--accent);}
.metric-foot{color:var(--muted);font-size:11.5px;margin-top:4px;}
.metric-foot .up{color:var(--ok);}
.metric-foot .down{color:var(--alert);}
.chart-wrap{border:1px solid var(--line);border-top:0;background:var(--surface);padding:18px 18px 14px;}
.chart-legend{display:flex;gap:18px;flex-wrap:wrap;color:var(--muted);font-size:11.5px;margin-bottom:14px;}
.chart-legend span{display:inline-flex;align-items:center;gap:7px;}
.swatch{width:10px;height:10px;display:inline-block;}
.swatch.after{background:var(--accent);}
.swatch.office{background:var(--line-strong);}
.chart{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:10px;height:150px;}
.bar-col{display:flex;flex-direction:column;align-items:center;height:100%;gap:6px;min-width:0;}
.bar-track{flex:1;min-height:0;width:100%;display:flex;align-items:flex-end;justify-content:center;}
.bar-val{font-size:11px;color:var(--text);}
.bar{width:100%;max-width:44px;display:flex;flex-direction:column-reverse;min-height:2px;background:var(--surface-2);}
.bar i{display:block;width:100%;}
.bar i.office{background:var(--line-strong);}
.bar i.after{background:var(--accent);}
.bar-lbl{font-size:11px;color:var(--muted);text-transform:capitalize;}
.bar-lbl.today{color:var(--text);font-weight:700;}
.chart-note{color:var(--muted);font-size:12px;margin-top:14px;padding-top:12px;border-top:1px solid var(--line);}
.chart-note strong{color:var(--text);}

/* ---- canales (tarjetas existentes de conexión) ---- */
.channels{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;align-items:start;}
.card{background:var(--surface);border:1px solid var(--line);padding:18px;min-width:0;overflow-wrap:anywhere;}
.card h2{font-family:var(--display);font-size:16px;margin-bottom:12px;}
.stack{display:flex;flex-direction:column;gap:14px;min-width:0;}
.empty{color:var(--muted);padding:6px 0;}
.connect-btn{display:block;background:var(--accent);color:var(--ink);font-weight:700;text-align:center;padding:10px 14px;border:1px solid var(--accent);}
.connect-btn:hover{background:#F0B052;text-decoration:none;}
.conn-row{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--line);font-size:13px;}
.conn-row:last-of-type{border-bottom:none;}
.conn-row a{font-size:12px;color:var(--muted);white-space:nowrap;flex-shrink:0;}
.conn-row a:hover{color:var(--alert);}
.conn-dot{display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--ok);margin-right:8px;}
.conn-sub{color:var(--muted);font-size:11.5px;}

/* ---- conversaciones ---- */
.toolbar{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:14px;}
.search{flex:1 1 260px;min-width:0;background:var(--surface);border:1px solid var(--line-strong);color:var(--text);font:inherit;padding:10px 12px;}
.search::placeholder{color:var(--faint);}
.search:focus{outline:none;border-color:var(--accent);}
.filters{display:flex;gap:6px;flex-wrap:wrap;}
.chip{background:var(--surface);border:1px solid var(--line-strong);color:var(--muted);padding:7px 11px;cursor:pointer;font-size:12px;white-space:nowrap;}
.chip:hover{color:var(--text);}
.chip[aria-pressed="true"]{background:var(--text);border-color:var(--text);color:var(--ink);font-weight:700;}
.chip .n{opacity:.7;margin-left:4px;}
.list{border:1px solid var(--line);background:var(--surface);}
.convo{border-bottom:1px solid var(--line);}
.convo:last-child{border-bottom:0;}
.convo summary{list-style:none;cursor:pointer;padding:14px 16px;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:4px 16px;}
.convo summary::-webkit-details-marker{display:none;}
.convo summary:hover{background:var(--hover);}
.convo[open] summary{background:var(--surface-2);}
.convo-line{display:flex;align-items:center;gap:8px;min-width:0;flex-wrap:wrap;}
.convo-title{font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100%;}
.convo-title.anon{color:var(--muted);font-weight:400;}
.convo-time{color:var(--muted);font-size:11.5px;text-align:right;white-space:nowrap;}
.convo-preview{grid-column:1 / -1;color:var(--muted);font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.thread{border-top:1px solid var(--line);padding:16px;max-height:460px;overflow-y:auto;display:flex;flex-direction:column;gap:10px;background:var(--bg);}
.thread-actions{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:4px;}
.msg{max-width:78%;padding:9px 12px;border:1px solid var(--line);}
.msg.user{align-self:flex-start;background:var(--surface-2);}
.msg.bot{align-self:flex-end;background:#1B1509;border-color:#3A2B10;}
.msg .role{display:block;font-size:10.5px;color:var(--muted);margin-bottom:3px;}
.msg.bot .role{color:var(--accent);}
.msg p{white-space:pre-wrap;font-size:12.5px;}
.list-empty{padding:28px 16px;color:var(--muted);text-align:center;}

/* ---- agenda ---- */
.day{border:1px solid var(--line);background:var(--surface);margin-bottom:14px;}
.day-head{display:flex;align-items:baseline;gap:10px;padding:12px 16px;border-bottom:1px solid var(--line);}
.day-head h3{font-family:var(--display);font-size:15px;}
.day-head .date{color:var(--muted);font-size:12px;}
.appt{display:grid;grid-template-columns:64px minmax(0,1fr) auto;gap:4px 14px;align-items:center;padding:12px 16px;border-bottom:1px solid var(--line);}
.appt:last-child{border-bottom:0;}
.appt.past{opacity:.5;}
.item.past{opacity:.5;}
.appt .who{min-width:0;}
.appt .name{font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.appt .mail{color:var(--muted);font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.appt .side-info{display:flex;gap:8px;align-items:center;justify-content:flex-end;flex-wrap:wrap;}

/* ---- sistema ---- */
.system-note{color:var(--muted);font-size:12px;border:1px dashed var(--line-strong);padding:10px 14px;margin-bottom:24px;}
.psi-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin-top:16px;}
.psi-scores{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;margin:6px 0 12px;}
.psi-score{text-align:center;}
.psi-score b{display:block;font-family:var(--display);font-size:28px;}
.psi-score span{font-size:10.5px;color:var(--muted);}
.vitals{display:flex;flex-wrap:wrap;gap:6px;}
.links-list{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));border:1px solid var(--line);background:var(--surface);}
.links-list a{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:13px 16px;border-right:1px solid var(--line);border-bottom:1px solid var(--line);color:var(--text);}
.links-list a:hover{background:var(--hover);color:var(--accent);text-decoration:none;}

/* ---- chat en vivo ---- */
.live-chat-panel{position:fixed;bottom:24px;right:24px;z-index:50;width:360px;max-width:calc(100vw - 32px);height:480px;max-height:72vh;background:var(--surface);border:1px solid var(--accent);box-shadow:0 12px 32px rgba(0,0,0,.5);display:none;flex-direction:column;}
.live-chat-panel.open{display:flex;}
.live-chat-header{display:flex;align-items:center;gap:8px;padding:12px 14px;border-bottom:1px solid var(--line);}
.live-chat-dot{width:7px;height:7px;border-radius:50%;background:var(--ok);flex-shrink:0;animation:blink 1.2s steps(1) infinite;}
@keyframes blink{50%{opacity:0;}}
.live-chat-title{font-weight:700;font-size:12px;}
.live-chat-session{color:var(--muted);font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;}
.live-chat-close{background:none;border:0;color:var(--muted);font-size:16px;cursor:pointer;padding:2px 6px;}
.live-chat-close:hover{color:var(--text);}
.live-chat-messages{flex:1;overflow-y:auto;padding:12px 14px;display:flex;flex-direction:column;gap:8px;}
.live-msg{max-width:88%;padding:8px 11px;font-size:12.5px;line-height:1.5;white-space:pre-wrap;}
.live-msg.visitor{align-self:flex-start;background:var(--surface-2);border:1px solid var(--line);}
.live-msg.admin{align-self:flex-end;background:var(--accent);color:var(--ink);}
.live-msg.sys{align-self:center;color:var(--muted);font-size:10.5px;}
.live-chat-input-row{display:flex;gap:6px;padding:10px;border-top:1px solid var(--line);}
.live-chat-input{flex:1;min-width:0;background:var(--bg);border:1px solid var(--line-strong);color:var(--text);font:inherit;font-size:12.5px;padding:9px 10px;}
.live-chat-input:focus{outline:none;border-color:var(--accent);}
.live-chat-send{background:var(--accent);color:var(--ink);border:0;font-weight:700;font-size:12px;padding:0 14px;cursor:pointer;}
.live-btn{display:inline-flex;align-items:center;gap:7px;background:none;border:1px solid var(--ok);color:var(--ok);padding:6px 10px;font-size:12px;cursor:pointer;}
.live-btn:hover{background:var(--ok);color:var(--ink);}

/* ---- barra superior y navegación mobile ---- */
.topbar{display:none;}
.tabbar{display:none;}

@media (max-width:1100px){
  .attention{grid-template-columns:1fr 1fr;}
  .lane:first-child{grid-column:1 / -1;border-right:0;border-bottom:1px solid var(--line);}
  .metrics{grid-template-columns:repeat(2,minmax(0,1fr));}
  .metric:nth-child(2){border-right:0;}
  .metric:nth-child(-n+2){border-bottom:1px solid var(--line);}
}
@media (max-width:860px){
  .layout{grid-template-columns:1fr;border:0;}
  .side{display:none;}
  .topbar{display:flex;align-items:center;justify-content:space-between;gap:12px;position:sticky;top:0;z-index:40;background:var(--bg);border-bottom:1px solid var(--line);padding:12px 16px;}
  .topbar .brand{margin:0;}
  .main{padding:22px 16px calc(96px + env(safe-area-inset-bottom));}
  h1{font-size:24px;}
  .page-head{margin-bottom:24px;}
  .page-head .btn{display:none;}
  .section{margin-top:36px;}
  .attention{grid-template-columns:1fr;}
  .lane{border-right:0;border-bottom:1px solid var(--line);}
  .lane:last-child{border-bottom:0;}
  .channels,.psi-grid{grid-template-columns:1fr;}
  .metric-value{font-size:28px;}
  .chart{gap:6px;height:128px;}
  .tabbar{display:grid;grid-template-columns:repeat(4,1fr);position:fixed;left:0;right:0;bottom:0;z-index:45;background:var(--surface);border-top:1px solid var(--line-strong);padding-bottom:env(safe-area-inset-bottom);}
  .tabbar .nav-btn{flex-direction:column;gap:3px;align-items:center;justify-content:center;border-left:0;border-top:2px solid transparent;padding:9px 4px 8px;font-size:10.5px;position:relative;}
  .tabbar .nav-btn[aria-current="page"]{border-top-color:var(--accent);background:none;}
  .tabbar .nav-count{position:absolute;top:5px;left:calc(50% + 6px);min-width:18px;padding:0 4px;font-size:10px;margin:0;}
  .appt{grid-template-columns:56px minmax(0,1fr);}
  .appt .side-info{grid-column:2;justify-content:flex-start;}
  .convo summary{grid-template-columns:minmax(0,1fr);}
  .convo-time{text-align:left;}
  .msg{max-width:92%;}
  .live-chat-panel{left:8px;right:8px;width:auto;max-width:none;bottom:calc(68px + env(safe-area-inset-bottom));height:70vh;}
}
`;

const ADMIN_SCRIPT = `
const $=(s,r=document)=>r.querySelector(s);const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=(x)=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const TZ='America/Santiago';
const DAY_MS=86400000;
const data=window.__DATA__||{};
const sessions=(data.sessions||[]).slice().sort((a,b)=>String(b.updated_at||'').localeCompare(String(a.updated_at||'')));
const appts=(data.appointments||[]).slice().sort((a,b)=>(a.appointment_date+(a.appointment_time||'')).localeCompare(b.appointment_date+(b.appointment_time||'')));
const totals=data.totals||{};

// ---------- fechas en America/Santiago ----------
const ymd=(d)=>new Date(d).toLocaleDateString('en-CA',{timeZone:TZ});
const today=ymd(Date.now());
const tomorrow=ymd(Date.now()+DAY_MS);
const hhmm=(t)=>String(t||'').slice(0,5);
// Comparación de reloj de pared en America/Santiago (no la del navegador):
// compara strings 'YYYY-MM-DDTHH:MM', evita los líos de zona horaria de Date.
const nowStamp=today+'T'+new Intl.DateTimeFormat('en-GB',{timeZone:TZ,hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date());
const isPastAppt=(a)=>(a.appointment_date+'T'+hhmm(a.appointment_time))<nowStamp;
function longDate(dateStr,opts){try{return new Date(dateStr+'T12:00:00').toLocaleDateString('es-CL',Object.assign({timeZone:TZ},opts));}catch(e){return dateStr;}}
function dayLabel(dateStr){
  if(dateStr===today)return 'Hoy';
  if(dateStr===tomorrow)return 'Mañana';
  const l=longDate(dateStr,{weekday:'long',day:'numeric',month:'long'}).replace(',','');
  return l.charAt(0).toUpperCase()+l.slice(1);
}
function ago(iso){
  if(!iso)return '';
  const t=new Date(iso).getTime();if(isNaN(t))return '';
  const min=Math.round((Date.now()-t)/60000);
  if(min<1)return 'recién';
  if(min<60)return 'hace '+min+' min';
  const h=Math.round(min/60);
  if(h<24&&ymd(t)===today)return 'hace '+h+' h';
  const time=new Date(t).toLocaleTimeString('es-CL',{hour:'2-digit',minute:'2-digit',timeZone:TZ});
  if(ymd(t)===ymd(Date.now()-DAY_MS))return 'ayer '+time;
  return new Date(t).toLocaleDateString('es-CL',{day:'numeric',month:'short',timeZone:TZ})+' '+time;
}
// Fuera de horario: lunes a viernes 9:00-19:00 (America/Santiago) es horario hábil.
function isAfterHours(iso){
  if(!iso)return false;
  try{
    const parts=new Intl.DateTimeFormat('en-US',{timeZone:TZ,hour:'numeric',hour12:false,weekday:'short'}).formatToParts(new Date(iso));
    const hour=Number(parts.find(p=>p.type==='hour').value)%24;
    const wd=parts.find(p=>p.type==='weekday').value;
    return wd==='Sat'||wd==='Sun'||hour<9||hour>=19;
  }catch(e){return false;}
}

// ---------- canal y contacto ----------
function channelOf(s){
  const id=String(s.session_id||'');
  if(id.indexOf('whatsapp_')===0)return 'WhatsApp';
  if(id.indexOf('instagram_')===0)return 'Instagram';
  if(id.indexOf('messenger_')===0)return 'Messenger';
  return 'Sitio web';
}
const isWebSession=(s)=>channelOf(s)==='Sitio web';
function contactOf(s){
  const c=String(s.lead_contact||'');
  const ch=channelOf(s);
  if(!c)return null;
  if(c.indexOf('@')>0)return {label:c,href:'mailto:'+c,action:'Escribir correo'};
  const digits=c.replace(/[^0-9]/g,'');
  if(ch==='WhatsApp'||c.charAt(0)==='+'||(digits.length>=9&&digits.length<=12&&ch==='Sitio web')){
    const wa=digits.length===9?'56'+digits:digits;
    return {label:ch==='WhatsApp'?'+'+wa:c,href:'https://wa.me/'+wa,action:'Abrir WhatsApp'};
  }
  // Instagram/Messenger: el id no es un contacto; se responde desde la app.
  return {label:ch==='Instagram'?'Usuario de Instagram':'Usuario de Messenger',href:null,action:null};
}
function titleOf(s){const c=contactOf(s);return c?c.label:'Visitante anónimo';}
const lastUserMsg=(s)=>{const m=(Array.isArray(s.messages)?s.messages:[]).filter(x=>x.role==='user');return m.length?m[m.length-1].content:'';};
const lastMsg=(s)=>{const m=Array.isArray(s.messages)?s.messages:[];return m.length?m[m.length-1].content:'';};
const REASONS={user_requested_human:'Pidió hablar con una persona',bot_could_not_resolve:'Dominga no supo responder'};

// ---------- navegación ----------
const VIEWS=['inicio','conversaciones','agenda','sistema'];
function show(view){
  if(view==='rendimiento')view='sistema';
  if(VIEWS.indexOf(view)<0)view='inicio';
  $$('.view').forEach(v=>v.classList.toggle('active',v.dataset.view===view));
  $$('.nav-btn[data-view]').forEach(b=>{if(b.dataset.view===view)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
  history.replaceState(null,'','#'+view);
  window.scrollTo(0,0);
}
$$('.nav-btn[data-view]').forEach(b=>b.addEventListener('click',()=>show(b.dataset.view)));
$$('[data-refresh]').forEach(b=>b.addEventListener('click',()=>location.reload()));

// ---------- ventanas de tiempo ----------
const since7=Date.now()-7*DAY_MS, since14=Date.now()-14*DAY_MS;
const inWindow=(iso,from,to)=>{const t=new Date(iso||0).getTime();return t>=from&&t<(to||Infinity);};
const recent=sessions.filter(s=>inWindow(s.updated_at,since7));
const previous=sessions.filter(s=>inWindow(s.updated_at,since14,since7));
const escalatedRecent=recent.filter(s=>s.escalated);

// ---------- encabezado ----------
(function(){
  $('#today-label').textContent=longDate(today,{weekday:'long',day:'numeric',month:'long'}).replace(',','');
  const last=sessions[0];
  $('#last-activity').textContent=last?'Última conversación '+ago(last.updated_at):'Todavía no hay conversaciones';
  const n=escalatedRecent.length;
  $$('[data-escalated-count]').forEach(el=>{el.textContent=n;el.hidden=!n;});
})();

// ---------- requiere tu atención ----------
function laneCount(el,n,hot){el.textContent=n;el.classList.toggle('hot',!!(hot&&n));el.classList.toggle('zero',!n);}
(function(){
  // 1) esperan a una persona
  const mount=$('#lane-escalated');
  laneCount($('#count-escalated'),escalatedRecent.length,true);
  if(!escalatedRecent.length){
    mount.innerHTML='<div class="lane-empty"><strong>Nadie espera a una persona.</strong>Cuando alguien pida hablar contigo o Dominga no sepa responder, aparece aquí.</div>';
  }else{
    mount.innerHTML=escalatedRecent.slice(0,3).map(s=>{
      const quote=lastUserMsg(s);
      return '<div class="item">'
        +'<div class="item-top"><span class="item-title">'+esc(titleOf(s))+'</span><span class="item-time">'+esc(ago(s.updated_at))+'</span></div>'
        +'<div class="item-meta">'+esc(channelOf(s))+' · '+esc(REASONS[s.escalation_reason]||'Necesita revisión')+'</div>'
        +(quote?'<div class="item-quote">“'+esc(quote)+'”</div>':'')
        +'<div class="item-actions">'
        +(isWebSession(s)?'<button class="live-btn" data-session="'+esc(s.session_id)+'"><span class="dot"></span>Tomar en vivo</button>':'')
        +'<button class="btn btn-sm" data-open-convo="'+esc(s.session_id)+'">Ver conversación</button>'
        +'</div></div>';
    }).join('')
    +(escalatedRecent.length>3?'<div class="lane-more"><button class="link-btn" data-goto-filter="escaladas">Ver las '+escalatedRecent.length+' escaladas →</button></div>':'');
  }

  // 2) citas de hoy y mañana
  const apptMount=$('#lane-appts');
  const soon=appts.filter(a=>a.appointment_date===today||a.appointment_date===tomorrow);
  laneCount($('#count-appts'),soon.length,false);
  if(!soon.length){
    const next=appts.find(a=>a.appointment_date>tomorrow);
    apptMount.innerHTML='<div class="lane-empty"><strong>Sin citas hoy ni mañana.</strong>'
      +(next?'La próxima es el '+esc(dayLabel(next.appointment_date))+' a las '+esc(hhmm(next.appointment_time))+' con '+esc(next.client_name)+'.':'Las citas que agenda Dominga aparecen aquí.')+'</div>';
  }else{
    let html='';let lastDay='';
    soon.forEach(a=>{
      if(a.appointment_date!==lastDay){html+='<div class="appt-day">'+esc(dayLabel(a.appointment_date))+'</div>';lastDay=a.appointment_date;}
      const meet=/^https:[/][/]meet[.]google[.]com[/]/.test(a.calendar_link||'');
      html+='<div class="item'+(isPastAppt(a)?' past':'')+'"><div class="item-top"><span class="appt-time num-tab">'+esc(hhmm(a.appointment_time))+'</span><span class="item-title">'+esc(a.client_name)+'</span></div>'
        +'<div class="item-meta">'+esc(a.client_email)+'</div>'
        +(a.calendar_link?'<div class="item-actions"><a class="btn btn-sm" href="'+esc(a.calendar_link)+'" target="_blank" rel="noopener">'+(meet?'Unirse a Meet':'Ver en Calendar')+'</a></div>':'')
        +'</div>';
    });
    apptMount.innerHTML=html;
  }

  // 3) contactos nuevos (últimos 7 días)
  const leadMount=$('#lane-leads');
  const leads=recent.filter(s=>{const c=contactOf(s);return c&&c.href;});
  laneCount($('#count-leads'),leads.length,false);
  if(!leads.length){
    leadMount.innerHTML='<div class="lane-empty"><strong>Sin contactos nuevos esta semana.</strong>Cuando alguien deje su correo o teléfono en el chat, lo ves aquí para seguirlo.</div>';
  }else{
    leadMount.innerHTML=leads.slice(0,3).map(s=>{
      const c=contactOf(s);
      return '<div class="item"><div class="item-top"><span class="item-title">'+esc(c.label)+'</span><span class="item-time">'+esc(ago(s.updated_at))+'</span></div>'
        +'<div class="item-meta">'+esc(channelOf(s))+' · '+esc(lastUserMsg(s)||lastMsg(s))+'</div>'
        +'<div class="item-actions"><a class="btn btn-sm" href="'+esc(c.href)+'" target="_blank" rel="noopener">'+esc(c.action)+'</a>'
        +'<button class="btn btn-sm" data-open-convo="'+esc(s.session_id)+'">Ver conversación</button></div></div>';
    }).join('')
    +(leads.length>3?'<div class="lane-more"><button class="link-btn" data-goto-filter="contacto">Ver los '+leads.length+' contactos →</button></div>':'');
  }
})();

// ---------- últimos 7 días ----------
(function(){
  const after=recent.filter(s=>isAfterHours(s.updated_at));
  const contacts=recent.filter(s=>{const c=contactOf(s);return c&&c.href;});
  const booked=appts.filter(a=>inWindow(a.created_at||(a.appointment_date+'T12:00:00'),since7));
  const delta=(now,before)=>{
    if(!before)return now?'sin datos de la semana anterior':'igual que la semana anterior';
    const d=now-before;
    if(!d)return 'igual que la semana anterior';
    return '<span class="'+(d>0?'up':'down')+'">'+(d>0?'+':'')+d+'</span> vs. semana anterior';
  };
  const pct=recent.length?Math.round(after.length/recent.length*100):0;
  $('#m-convos').textContent=recent.length;
  $('#m-convos-foot').innerHTML=delta(recent.length,previous.length);
  $('#m-after').textContent=after.length;
  $('#m-after-foot').textContent=recent.length?pct+'% del total, de noche o fin de semana':'de noche o fin de semana';
  $('#m-contacts').textContent=contacts.length;
  $('#m-contacts-foot').textContent='dejaron correo o teléfono';
  $('#m-booked').textContent=booked.length;
  $('#m-booked-foot').textContent='agendadas por Dominga';

  const days=[];
  for(let i=6;i>=0;i--)days.push(ymd(Date.now()-i*DAY_MS));
  const rows=days.map(d=>{
    const list=recent.filter(s=>ymd(s.updated_at)===d);
    const a=list.filter(s=>isAfterHours(s.updated_at)).length;
    return {d,total:list.length,after:a,office:list.length-a};
  });
  const max=Math.max(1,...rows.map(r=>r.total));
  $('#chart').innerHTML=rows.map(r=>{
    const h=Math.round(r.total/max*100);
    const afterPct=r.total?Math.round(r.after/r.total*100):0;
    const label=r.d===today?'hoy':longDate(r.d,{weekday:'short'}).replace('.','');
    return '<div class="bar-col" title="'+esc(longDate(r.d,{weekday:'long',day:'numeric',month:'short'}))+': '+r.total+' conversaciones, '+r.after+' fuera de horario">'
      +'<span class="bar-val num-tab">'+(r.total||'')+'</span>'
      +'<div class="bar-track"><div class="bar" style="height:'+Math.max(h,2)+'%">'
      +(r.after?'<i class="after" style="height:'+afterPct+'%"></i>':'')
      +(r.office?'<i class="office" style="height:'+(100-afterPct)+'%"></i>':'')
      +'</div></div><span class="bar-lbl'+(r.d===today?' today':'')+'">'+esc(label)+'</span></div>';
  }).join('');
  const resolved=recent.length?Math.round((recent.length-escalatedRecent.length)/recent.length*100):null;
  $('#chart-note').innerHTML=resolved===null
    ?'Todavía no hay conversaciones en los últimos 7 días.'
    :'Dominga resolvió sola <strong>'+resolved+'%</strong> de las conversaciones de la semana, sin necesitar a una persona.';
})();

// ---------- abrir una conversación desde otra vista ----------
function openConversation(sessionId){
  setFilter('todas');
  $('#convo-search').value='';
  renderConvos();
  show('conversaciones');
  const el=$$('.convo').find(d=>d.dataset.session===sessionId);
  if(el){el.open=true;el.scrollIntoView({block:'start'});el.querySelector('summary').focus();}
}
document.addEventListener('click',(e)=>{
  const open=e.target.closest('[data-open-convo]');
  if(open){openConversation(open.dataset.openConvo);return;}
  const goto=e.target.closest('[data-goto-filter]');
  if(goto){setFilter(goto.dataset.gotoFilter);renderConvos();show('conversaciones');}
});
`;

const ADMIN_SCRIPT_2 = `
// ---------- conversaciones ----------
const FILTERS={
  todas:()=>true,
  escaladas:(s)=>!!s.escalated,
  contacto:(s)=>{const c=contactOf(s);return !!(c&&c.href);},
  fuera:(s)=>isAfterHours(s.updated_at)
};
let convoFilter='todas';
function setFilter(name){
  convoFilter=FILTERS[name]?name:'todas';
  $$('#convo-filters .chip').forEach(c=>c.setAttribute('aria-pressed',String(c.dataset.filter===convoFilter)));
}
$$('#convo-filters .chip').forEach(c=>{
  const n=sessions.filter(FILTERS[c.dataset.filter]).length;
  c.querySelector('.n').textContent=n;
  c.addEventListener('click',()=>{setFilter(c.dataset.filter);renderConvos();});
});
function renderConvos(){
  const mount=$('#convo-list');
  const q=$('#convo-search').value.toLowerCase().trim();
  const list=sessions.filter(FILTERS[convoFilter]).filter(s=>{
    if(!q)return true;
    if((s.lead_contact||'').toLowerCase().indexOf(q)>=0)return true;
    return (Array.isArray(s.messages)?s.messages:[]).some(m=>String(m.content||'').toLowerCase().indexOf(q)>=0);
  });
  if(!list.length){
    mount.innerHTML='<div class="list-empty">'+(q||convoFilter!=='todas'?'No hay conversaciones con ese filtro.':'Todavía no hay conversaciones. Cuando alguien le escriba a Dominga, aparece aquí.')+'</div>';
    return;
  }
  mount.innerHTML=list.map(s=>{
    const msgs=Array.isArray(s.messages)?s.messages:[];
    const c=contactOf(s);
    const thread=msgs.map(m=>'<div class="msg '+(m.role==='user'?'user':'bot')+'"><span class="role">'+(m.role==='user'?'Cliente':'Dominga o equipo')+'</span><p>'+esc(m.content)+'</p></div>').join('');
    return '<details class="convo" data-session="'+esc(s.session_id||'')+'">'
      +'<summary>'
      +'<div class="convo-line"><span class="convo-title'+(c?'':' anon')+'">'+esc(titleOf(s))+'</span>'
      +'<span class="tag">'+esc(channelOf(s))+'</span>'
      +(s.escalated?'<span class="tag alert" title="'+esc(REASONS[s.escalation_reason]||'')+'">escalada</span>':'')
      +(c&&c.href?'<span class="tag ok">contacto</span>':'')
      +(isAfterHours(s.updated_at)?'<span class="tag accent">fuera de horario</span>':'')
      +'</div>'
      +'<span class="convo-time">'+esc(ago(s.updated_at))+' · '+msgs.length+' msjs</span>'
      +'<span class="convo-preview">'+esc(String(lastMsg(s)).slice(0,180))+'</span>'
      +'</summary>'
      +'<div class="thread">'
      +((s.escalated&&isWebSession(s))||(c&&c.href)?'<div class="thread-actions">'
        +(s.escalated&&isWebSession(s)?'<button class="live-btn" data-session="'+esc(s.session_id)+'"><span class="dot"></span>Tomar en vivo</button>':'')
        +(c&&c.href?'<a class="btn btn-sm" href="'+esc(c.href)+'" target="_blank" rel="noopener">'+esc(c.action)+'</a>':'')
        +'</div>':'')
      +thread+'</div></details>';
  }).join('');
}
$('#convo-total').textContent=(totals.sessions>sessions.length?totals.sessions+' en total · se muestran las últimas '+sessions.length:sessions.length+' en total');
$('#convo-search').addEventListener('input',renderConvos);
setFilter('todas');
renderConvos();

// ---------- agenda ----------
let agendaMode='proximas';
function renderAgenda(){
  const mount=$('#agenda-list');
  const source=agendaMode==='proximas'?appts.filter(a=>a.appointment_date>=today):appts.slice().reverse();
  if(!source.length){
    mount.innerHTML='<div class="list">'+'<div class="list-empty">'+(agendaMode==='proximas'?'No hay citas próximas. Cuando Dominga agende una, aparece aquí.':'Todavía no hay citas agendadas.')+'</div></div>';
    return;
  }
  const byDate=[];const idx={};
  source.forEach(a=>{if(!(a.appointment_date in idx)){idx[a.appointment_date]=byDate.length;byDate.push({date:a.appointment_date,items:[]});}byDate[idx[a.appointment_date]].items.push(a);});
  mount.innerHTML=byDate.map(g=>{
    const rows=g.items.map(a=>{
      const meet=/^https:[/][/]meet[.]google[.]com[/]/.test(a.calendar_link||'');
      return '<div class="appt'+(isPastAppt(a)?' past':'')+'">'
        +'<span class="appt-time num-tab">'+esc(hhmm(a.appointment_time))+'</span>'
        +'<div class="who"><div class="name">'+esc(a.client_name)+'</div><div class="mail">'+esc(a.client_email)+'</div></div>'
        +'<div class="side-info">'
        +(a.reminder_sent?'<span class="tag ok">recordatorio enviado</span>':(g.date>=today?'<span class="tag">recordatorio pendiente</span>':''))
        +(a.calendar_link?'<a class="btn btn-sm" href="'+esc(a.calendar_link)+'" target="_blank" rel="noopener">'+(meet?'Unirse a Meet':'Ver en Calendar')+'</a>':'')
        +'</div></div>';
    }).join('');
    const label=dayLabel(g.date);
    const isRel=label==='Hoy'||label==='Mañana';
    return '<div class="day"><div class="day-head"><h3>'+esc(label)+'</h3>'+(isRel?'<span class="date">'+esc(longDate(g.date,{weekday:'long',day:'numeric',month:'long'}).replace(',',''))+'</span>':'')+'</div>'+rows+'</div>';
  }).join('');
}
$$('#agenda-filters .chip').forEach(c=>c.addEventListener('click',()=>{
  agendaMode=c.dataset.mode;
  $$('#agenda-filters .chip').forEach(x=>x.setAttribute('aria-pressed',String(x===c)));
  renderAgenda();
}));
$('#agenda-total').textContent=(totals.appointments||appts.length)+' citas en total';
renderAgenda();

// ---------- sistema: pagespeed ----------
function scoreColor(n){if(n==null)return'var(--muted)';if(n>=90)return'var(--ok)';if(n>=50)return'var(--accent)';return'var(--alert)';}
function psiCol(label,d){
  if(!d)return'';
  if(d.error)return '<div class="card"><h2>'+esc(label)+'</h2><p class="empty">'+esc(d.error)+'</p></div>';
  const rows=[['Rendimiento',d.performance],['Accesibilidad',d.accessibility],['Buenas prácticas',d.bestPractices],['SEO',d.seo]];
  const scores=rows.map(r=>'<div class="psi-score"><b class="num-tab" style="color:'+scoreColor(r[1])+'">'+(r[1]??'–')+'</b><span>'+r[0]+'</span></div>').join('');
  const vitals=[['LCP',d.lcp],['CLS',d.cls],['TBT',d.tbt],['FCP',d.fcp],['Speed Index',d.speedIndex]].filter(v=>v[1]).map(v=>'<span class="tag">'+v[0]+': '+esc(v[1])+'</span>').join('');
  return '<div class="card"><h2>'+esc(label)+'</h2><div class="psi-scores">'+scores+'</div><div class="vitals">'+vitals+'</div></div>';
}
$('#psi-run').addEventListener('click',async()=>{
  const btn=$('#psi-run');const status=$('#psi-status');const out=$('#psi-results');
  btn.disabled=true;status.textContent='Corriendo Lighthouse en celular y computador…';
  out.innerHTML='<p class="empty">Analizando… puede tardar hasta 30 segundos.</p>';
  try{
    const res=await fetch('/api/admin/pagespeed?url='+encodeURIComponent('https://atiendemelapyme.cl/'));
    const d=await res.json();
    out.innerHTML='<div class="psi-grid">'+psiCol('Celular',d.mobile)+psiCol('Computador',d.desktop)+'</div>';
    status.textContent='Último análisis: '+new Date(d.checkedAt).toLocaleTimeString('es-CL',{timeZone:TZ});
  }catch(err){
    out.innerHTML='<p class="empty">No se pudo consultar PageSpeed: '+esc(err.message)+'</p>';
    status.textContent='';
  }finally{btn.disabled=false;}
});

// vista inicial según el hash
show((location.hash||'#inicio').slice(1));
`;

const ADMIN_SCRIPT_LIVE = `
// ---------- chat en vivo ----------
let liveSocket=null;
let liveSessionId=null;
const livePanel=$('#live-chat-panel');
const liveMessages=$('#live-chat-messages');
const liveSessionLabel=$('#live-chat-session');
const liveInput=$('#live-chat-input');

function addLiveMsg(text,cls){
  const div=document.createElement('div');
  div.className='live-msg '+cls;
  div.textContent=text;
  liveMessages.appendChild(div);
  liveMessages.scrollTop=liveMessages.scrollHeight;
}

function openLiveChat(sessionId){
  if(liveSocket&&liveSessionId===sessionId){livePanel.classList.add('open');liveInput.focus();return;}
  closeLiveChat();
  liveSessionId=sessionId;
  const s=sessions.find(x=>x.session_id===sessionId);
  liveSessionLabel.textContent=s?titleOf(s):sessionId;
  liveMessages.innerHTML='';
  livePanel.classList.add('open');

  const priorMsgs=s&&Array.isArray(s.messages)?s.messages:[];
  if(priorMsgs.length){
    addLiveMsg('— conversación previa con Dominga —','sys');
    priorMsgs.forEach(m=>addLiveMsg(m.role==='user'?m.content:'Dominga: '+m.content, m.role==='user'?'visitor':'admin'));
    addLiveMsg('— te uniste aquí —','sys');
  }

  addLiveMsg('Conectando…','sys');
  const proto=location.protocol==='https:'?'wss:':'ws:';
  liveSocket=new WebSocket(proto+'//'+location.host+'/ws/admin-chat/'+encodeURIComponent(sessionId));
  liveSocket.addEventListener('open',()=>{addLiveMsg('Conectado — el cliente ve que te uniste','sys');liveInput.focus();});
  liveSocket.addEventListener('message',(evt)=>{
    let d;
    try{d=JSON.parse(evt.data);}catch(e){return;}
    if(d.type==='visitor_message'){addLiveMsg(d.text,'visitor');}
  });
  liveSocket.addEventListener('close',()=>{addLiveMsg('Conexión cerrada','sys');});
  liveSocket.addEventListener('error',()=>{addLiveMsg('Error de conexión','sys');});
}

function closeLiveChat(){
  if(liveSocket){try{liveSocket.close();}catch(e){}}
  liveSocket=null;
  liveSessionId=null;
  livePanel.classList.remove('open');
}

function sendLiveMsg(){
  const text=liveInput.value.trim();
  if(!text||!liveSocket||liveSocket.readyState!==WebSocket.OPEN)return;
  liveSocket.send(JSON.stringify({type:'admin_message',text:text}));
  addLiveMsg(text,'admin');
  liveInput.value='';
}

document.addEventListener('click',(e)=>{
  const btn=e.target.closest('.live-btn');
  if(btn){e.preventDefault();openLiveChat(btn.dataset.session);return;}
  if(e.target.closest('#live-chat-close')){closeLiveChat();return;}
  if(e.target.closest('#live-chat-send')){sendLiveMsg();return;}
});
liveInput.addEventListener('keydown',(e)=>{if(e.key==='Enter')sendLiveMsg();});
document.addEventListener('keydown',(e)=>{if(e.key==='Escape'&&livePanel.classList.contains('open'))closeLiveChat();});
`;

function navButtons(extraClass = '') {
    const items = [
        ['inicio', 'home', 'Inicio'],
        ['conversaciones', 'chat', 'Conversaciones'],
        ['agenda', 'calendar', 'Agenda'],
        ['sistema', 'system', 'Sistema']
    ];
    return items.map(([view, ico, label]) =>
        `<button class="nav-btn${extraClass}" data-view="${view}"${view === 'inicio' ? ' aria-current="page"' : ''}>${icon(ico)}<span>${label}</span>${view === 'conversaciones' ? '<span class="nav-count num-tab" data-escalated-count hidden></span>' : ''}</button>`
    ).join('');
}

async function onRequestGetAdmin(context) {
    const { request, env } = context;
    if (!(await checkSessionAuth(request, env))) {
        return loginPageResponse();
    }

    const [sessionsResult, appointmentsResult, connections, whatsappConnections] = await Promise.all([
        fetchChatSessions(env),
        fetchAppointments(env),
        listConnections(env),
        listWhatsappConnections(env)
    ]);

    const brand = `<div class="brand"><span class="brand-mark">a<i></i></span>Atiéndeme la Pyme</div>`;

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Dashboard — Atiéndeme la Pyme</title>
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="#0A0A0A">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Space+Grotesk:wght@700&display=swap">
<style>${ADMIN_STYLES}</style>
</head>
<body>
<header class="topbar">
  ${brand}
  <button class="btn btn-sm" data-refresh aria-label="Actualizar datos">${icon('refresh', 16)}</button>
</header>
<div class="layout">
  <aside class="side" aria-label="Navegación principal">
    ${brand}
    <nav class="nav">${navButtons()}</nav>
    <div class="side-foot">
      <div class="status"><span class="dot"></span><span>Dominga en línea</span></div>
      <form method="POST" action="/admin/logout">
        <button type="submit" class="logout">${icon('logout', 16)}Cerrar sesión</button>
      </form>
    </div>
  </aside>

  <main class="main">
    <section class="view active" data-view="inicio" aria-labelledby="h-inicio">
      <div class="page-head">
        <div>
          <h1 id="h-inicio">Hoy, <span id="today-label"></span></h1>
          <p class="page-sub" id="last-activity"></p>
        </div>
        <button class="btn" data-refresh>${icon('refresh', 16)}Actualizar</button>
      </div>

      <div class="section">
        <div class="section-head">
          <h2>Requiere tu atención</h2>
          <span class="section-note">Últimos 7 días</span>
        </div>
        <div class="attention">
          <div class="lane">
            <div class="lane-head"><span class="lane-title">Esperan a una persona</span><span class="lane-count num-tab" id="count-escalated"></span></div>
            <div id="lane-escalated"></div>
          </div>
          <div class="lane">
            <div class="lane-head"><span class="lane-title">Citas de hoy y mañana</span><span class="lane-count num-tab" id="count-appts"></span></div>
            <div id="lane-appts"></div>
          </div>
          <div class="lane">
            <div class="lane-head"><span class="lane-title">Contactos nuevos</span><span class="lane-count num-tab" id="count-leads"></span></div>
            <div id="lane-leads"></div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-head">
          <h2>Últimos 7 días</h2>
          <span class="section-note">Horario hábil: lunes a viernes, 9:00 a 19:00</span>
        </div>
        <div class="metrics">
          <div class="metric"><div class="metric-label">Conversaciones</div><div class="metric-value num-tab" id="m-convos"></div><div class="metric-foot" id="m-convos-foot"></div></div>
          <div class="metric key"><div class="metric-label">Fuera de horario</div><div class="metric-value num-tab" id="m-after"></div><div class="metric-foot" id="m-after-foot"></div></div>
          <div class="metric"><div class="metric-label">Contactos</div><div class="metric-value num-tab" id="m-contacts"></div><div class="metric-foot" id="m-contacts-foot"></div></div>
          <div class="metric"><div class="metric-label">Citas</div><div class="metric-value num-tab" id="m-booked"></div><div class="metric-foot" id="m-booked-foot"></div></div>
        </div>
        <div class="chart-wrap">
          <div class="chart-legend"><span><i class="swatch after"></i>Fuera de horario</span><span><i class="swatch office"></i>En horario</span></div>
          <div class="chart" id="chart" role="img" aria-label="Conversaciones por día de los últimos 7 días"></div>
          <p class="chart-note" id="chart-note"></p>
        </div>
      </div>

      <div class="section">
        <div class="section-head">
          <h2>Canales conectados</h2>
        </div>
        <div class="channels">
          ${connectionsCardHtml(connections)}
          ${whatsappConnectionsCardHtml(whatsappConnections)}
        </div>
      </div>
    </section>

    <section class="view" data-view="conversaciones" aria-labelledby="h-convos">
      <div class="page-head">
        <div>
          <h1 id="h-convos">Conversaciones</h1>
          <p class="page-sub" id="convo-total"></p>
        </div>
      </div>
      <div class="toolbar">
        <input class="search" id="convo-search" type="search" placeholder="Buscar por contacto o mensaje…" aria-label="Buscar conversaciones">
        <div class="filters" id="convo-filters" role="group" aria-label="Filtrar conversaciones">
          <button class="chip" data-filter="todas" aria-pressed="true">Todas<span class="n num-tab"></span></button>
          <button class="chip" data-filter="escaladas" aria-pressed="false">Escaladas<span class="n num-tab"></span></button>
          <button class="chip" data-filter="contacto" aria-pressed="false">Con contacto<span class="n num-tab"></span></button>
          <button class="chip" data-filter="fuera" aria-pressed="false">Fuera de horario<span class="n num-tab"></span></button>
        </div>
      </div>
      <div class="list" id="convo-list"></div>
    </section>

    <section class="view" data-view="agenda" aria-labelledby="h-agenda">
      <div class="page-head">
        <div>
          <h1 id="h-agenda">Agenda</h1>
          <p class="page-sub" id="agenda-total"></p>
        </div>
      </div>
      <div class="toolbar">
        <div class="filters" id="agenda-filters" role="group" aria-label="Filtrar citas">
          <button class="chip" data-mode="proximas" aria-pressed="true">Próximas</button>
          <button class="chip" data-mode="todas" aria-pressed="false">Todas</button>
        </div>
      </div>
      <div id="agenda-list"></div>
    </section>

    <section class="view" data-view="sistema" aria-labelledby="h-sistema">
      <div class="page-head">
        <div>
          <h1 id="h-sistema">Sistema</h1>
          <p class="page-sub">Herramientas internas de Atiéndeme la Pyme.</p>
        </div>
      </div>
      <p class="system-note">Esta sección no forma parte del panel de un cliente: al replicar el dashboard, se quita completa.</p>

      <div class="section">
        <div class="section-head"><h2>Rendimiento del sitio</h2><span class="section-note" id="psi-status"></span></div>
        <button class="btn btn-primary" id="psi-run">Analizar atiendemelapyme.cl</button>
        <div id="psi-results"><p class="empty" style="margin-top:12px;">Corre Lighthouse (Google PageSpeed) sobre el sitio en celular y computador. Tarda entre 15 y 30 segundos.</p></div>
      </div>

      <div class="section">
        <div class="section-head"><h2>Accesos</h2></div>
        <div class="links-list">
          <a href="https://calendar.google.com" target="_blank" rel="noopener">Google Calendar${icon('external', 15)}</a>
          <a href="https://supabase.com/dashboard/project/ewhqshvmrinqsevjfjtz" target="_blank" rel="noopener">Supabase (datos)${icon('external', 15)}</a>
          <a href="https://dash.cloudflare.com" target="_blank" rel="noopener">Cloudflare (Worker)${icon('external', 15)}</a>
          <a href="https://analytics.google.com" target="_blank" rel="noopener">Google Analytics${icon('external', 15)}</a>
          <a href="/" target="_blank" rel="noopener">Ver el sitio${icon('external', 15)}</a>
        </div>
      </div>
    </section>
  </main>
</div>

<nav class="tabbar" aria-label="Navegación">${navButtons()}</nav>

<div class="live-chat-panel" id="live-chat-panel" role="dialog" aria-label="Chat en vivo">
  <div class="live-chat-header">
    <span class="live-chat-dot"></span>
    <span class="live-chat-title">En vivo</span>
    <span class="live-chat-session" id="live-chat-session"></span>
    <button class="live-chat-close" id="live-chat-close" aria-label="Cerrar chat en vivo">✕</button>
  </div>
  <div class="live-chat-messages" id="live-chat-messages" aria-live="polite"></div>
  <div class="live-chat-input-row">
    <input type="text" class="live-chat-input" id="live-chat-input" placeholder="Escribe tu respuesta…" autocomplete="off" aria-label="Mensaje para el cliente">
    <button class="live-chat-send" id="live-chat-send">Enviar</button>
  </div>
</div>
<script>window.__DATA__=${safeJson({
    sessions: sessionsResult.rows,
    appointments: appointmentsResult.rows,
    totals: { sessions: sessionsResult.total, appointments: appointmentsResult.total }
})};</script>
<script>${ADMIN_SCRIPT}${ADMIN_SCRIPT_2}${ADMIN_SCRIPT_LIVE}</script>
</body>
</html>`;

    return new Response(html, {
        status: 200,
        headers: {
            'Content-Type': 'text/html; charset=utf-8',
            ...ADMIN_SECURITY_HEADERS
        }
    });
}

async function runPSI(targetUrl, strategy, env) {
    const keyParam = env.GOOGLE_PAGESPEED_API_KEY ? `&key=${env.GOOGLE_PAGESPEED_API_KEY}` : '';
    const psiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(targetUrl)}&strategy=${strategy}&category=performance&category=seo&category=best-practices&category=accessibility${keyParam}`;
    try {
        const res = await fetch(psiUrl);
        if (!res.ok) {
            const errText = await res.text();
            return { error: `PageSpeed (${strategy}) fall\u00f3: ${res.status} ${errText.slice(0, 160)}` };
        }
        const data = await res.json();
        const lr = data.lighthouseResult;
        const audits = lr?.audits || {};
        const cats = lr?.categories || {};
        const pct = (c) => (cats[c]?.score != null ? Math.round(cats[c].score * 100) : null);
        return {
            performance: pct('performance'),
            accessibility: pct('accessibility'),
            bestPractices: pct('best-practices'),
            seo: pct('seo'),
            lcp: audits['largest-contentful-paint']?.displayValue || null,
            cls: audits['cumulative-layout-shift']?.displayValue || null,
            tbt: audits['total-blocking-time']?.displayValue || null,
            fcp: audits['first-contentful-paint']?.displayValue || null,
            speedIndex: audits['speed-index']?.displayValue || null
        };
    } catch (err) {
        return { error: `PageSpeed (${strategy}) error: ${err.message}` };
    }
}

async function onRequestGetPagespeed(context) {
    const { request, env } = context;
    if (!(await checkSessionAuth(request, env))) {
        return new Response('No autorizado', { status: 401 });
    }
    const url = new URL(request.url);
    const requestedUrl = url.searchParams.get('url');
    // Solo se audita el propio sitio -- sin esto, este endpoint es un proxy
    // SSRF que permite al Worker hacer fetch() a cualquier URL arbitraria
    // que indique quien tenga sesion de admin.
    let targetUrl = 'https://atiendemelapyme.cl/';
    if (requestedUrl) {
        try {
            const parsed = new URL(requestedUrl);
            if (parsed.protocol === 'https:' && parsed.hostname === 'atiendemelapyme.cl') {
                targetUrl = parsed.toString();
            } else {
                return new Response(JSON.stringify({ error: 'Solo se permite auditar https://atiendemelapyme.cl' }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json; charset=utf-8' }
                });
            }
        } catch {
            return new Response(JSON.stringify({ error: 'url invalida' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json; charset=utf-8' }
            });
        }
    }
    const [mobile, desktop] = await Promise.all([
        runPSI(targetUrl, 'mobile', env),
        runPSI(targetUrl, 'desktop', env)
    ]);
    return new Response(JSON.stringify({ url: targetUrl, mobile, desktop, checkedAt: new Date().toISOString() }), {
        status: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
    });
}

export { onRequestGetAdmin, onRequestGetPagespeed, onRequestPostAdminLogin, onRequestPostAdminLogout };
