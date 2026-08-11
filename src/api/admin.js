// src/api/admin.js
// Dashboard interno: conversaciones + agenda. Protegido con Basic Auth.
// Requiere el secret ADMIN_DASHBOARD_PASSWORD configurado en el Worker.

function unauthorizedResponse() {
    return new Response('Autenticaci\u00f3n requerida', {
        status: 401,
        headers: {
            'WWW-Authenticate': 'Basic realm="Panel Atiendeme la Pyme", charset="UTF-8"',
            'Content-Type': 'text/plain; charset=utf-8'
        }
    });
}

function checkAdminAuth(request, env) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Basic ')) return false;
    if (!env.ADMIN_DASHBOARD_PASSWORD) return false;
    try {
        const decoded = atob(authHeader.slice(6));
        const separatorIndex = decoded.indexOf(':');
        const password = separatorIndex === -1 ? decoded : decoded.slice(separatorIndex + 1);
        return password === env.ADMIN_DASHBOARD_PASSWORD;
    } catch {
        return false;
    }
}

async function fetchChatSessions(env) {
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) return [];
    try {
        const res = await fetch(
            `${env.SUPABASE_URL}/rest/v1/chat_sessions?select=*&order=updated_at.desc`,
            {
                headers: {
                    apikey: env.SUPABASE_SERVICE_KEY,
                    Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`
                }
            }
        );
        if (!res.ok) return [];
        return await res.json();
    } catch (err) {
        console.error('Admin: error fetching chat_sessions:', err.message);
        return [];
    }
}

async function fetchAppointments(env) {
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) return [];
    try {
        const res = await fetch(
            `${env.SUPABASE_URL}/rest/v1/scheduled_appointments?select=*&order=appointment_date.asc,appointment_time.asc`,
            {
                headers: {
                    apikey: env.SUPABASE_SERVICE_KEY,
                    Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`
                }
            }
        );
        if (!res.ok) return [];
        return await res.json();
    } catch (err) {
        console.error('Admin: error fetching scheduled_appointments:', err.message);
        return [];
    }
}

function escapeHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, (c) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[c]);
}

function formatDate(iso) {
    if (!iso) return '';
    try {
        return new Date(iso).toLocaleString('es-CL', {
            dateStyle: 'medium',
            timeStyle: 'short',
            timeZone: 'America/Santiago'
        });
    } catch {
        return iso;
    }
}

function renderConversations(sessions) {
    if (!sessions.length) {
        return `<p class="admin-empty">No hay conversaciones todav\u00eda.</p>`;
    }
    return sessions.map((s) => {
        const messages = Array.isArray(s.messages) ? s.messages : [];
        const lastMsg = messages.length ? messages[messages.length - 1] : null;
        const preview = lastMsg ? escapeHtml(lastMsg.content).slice(0, 140) : '(sin mensajes)';
        const thread = messages.map((m) => `
      <div class="admin-msg admin-msg-${m.role === 'user' ? 'user' : 'bot'}">
        <span class="admin-msg-role">${m.role === 'user' ? 'Visitante' : 'Dominga'}</span>
        <p>${escapeHtml(m.content)}</p>
      </div>
    `).join('');
        return `
      <details class="admin-card">
        <summary>
          <span class="admin-card-title">${escapeHtml(s.lead_contact) || 'Contacto no identificado'}</span>
          <span class="admin-card-meta">${messages.length} mensajes \u00b7 ${formatDate(s.updated_at)}</span>
          <span class="admin-card-preview">${preview}</span>
        </summary>
        <div class="admin-thread">${thread}</div>
      </details>
    `;
    }).join('');
}

function renderAgenda(appointments) {
    if (!appointments.length) {
        return `<p class="admin-empty">No hay citas agendadas.</p>`;
    }
    const byDate = {};
    for (const a of appointments) {
        (byDate[a.appointment_date] ||= []).push(a);
    }
    return Object.entries(byDate).map(([date, items]) => `
    <div class="admin-day">
      <h3>${escapeHtml(date)}</h3>
      ${items.map((a) => `
        <div class="admin-appt">
          <span class="admin-appt-time">${escapeHtml(a.appointment_time)}</span>
          <span class="admin-appt-name">${escapeHtml(a.client_name)}</span>
          <span class="admin-appt-email">${escapeHtml(a.client_email)}</span>
          ${a.calendar_link ? `<a href="${escapeHtml(a.calendar_link)}" target="_blank" rel="noopener">Ver en Calendar</a>` : ''}
          ${a.reminder_sent ? `<span class="admin-badge">Recordatorio enviado</span>` : ''}
        </div>
      `).join('')}
    </div>
  `).join('');
}

const ADMIN_STYLES = `
  :root { --bg:#0A0A0A; --panel:#141414; --line:#262626; --text:#EDEDE8; --muted:#8A8A82; --accent:#E8A33D; }
  * { box-sizing: border-box; }
  body { background: var(--bg); color: var(--text); font-family: 'JetBrains Mono', monospace; margin:0; padding: 32px 20px; }
  .admin-wrap { max-width: 900px; margin: 0 auto; }
  h1 { font-size: 22px; margin-bottom: 4px; }
  .admin-sub { color: var(--muted); font-size: 13px; margin-bottom: 28px; }
  .admin-tabs { display:flex; gap: 8px; margin-bottom: 20px; }
  .admin-tabs a { color: var(--muted); text-decoration:none; padding: 8px 14px; border:1px solid var(--line); border-radius:6px; font-size: 13px; }
  .admin-tabs a.active { color: var(--bg); background: var(--accent); border-color: var(--accent); }
  .admin-card { background: var(--panel); border:1px solid var(--line); border-radius:8px; margin-bottom:10px; padding: 4px 14px; }
  .admin-card summary { cursor:pointer; padding: 10px 0; display:flex; flex-wrap:wrap; gap: 10px; align-items:baseline; list-style:none; }
  .admin-card summary::-webkit-details-marker { display:none; }
  .admin-card-title { font-weight:600; }
  .admin-card-meta { color: var(--muted); font-size:12px; }
  .admin-card-preview { color: var(--muted); font-size: 12px; flex-basis:100%; }
  .admin-thread { border-top:1px solid var(--line); padding: 12px 0; }
  .admin-msg { margin-bottom:10px; padding: 8px 12px; border-radius:6px; }
  .admin-msg-user { background: #1c1c1c; }
  .admin-msg-bot { background: #1a1508; }
  .admin-msg-role { font-size:11px; color: var(--accent); }
  .admin-msg p { margin: 4px 0 0; font-size: 13px; white-space: pre-wrap; }
  .admin-day { margin-bottom: 18px; }
  .admin-day h3 { color: var(--accent); font-size:14px; margin-bottom:8px; }
  .admin-appt { display:flex; gap: 12px; align-items:center; padding:8px 12px; background: var(--panel); border:1px solid var(--line); border-radius:6px; margin-bottom:6px; font-size:13px; flex-wrap:wrap; }
  .admin-appt-time { color: var(--accent); font-weight:600; }
  .admin-appt a { color: var(--accent); }
  .admin-badge { font-size:11px; color: var(--muted); border:1px solid var(--line); padding:2px 8px; border-radius:10px; }
  .admin-empty { color: var(--muted); }
`;

async function onRequestGetAdmin(context) {
    const { request, env } = context;
    if (!checkAdminAuth(request, env)) {
        return unauthorizedResponse();
    }

    const url = new URL(request.url);
    const view = url.searchParams.get('view') === 'agenda' ? 'agenda' : 'conversaciones';

    const [sessions, appointments] = await Promise.all([
        fetchChatSessions(env),
        fetchAppointments(env)
    ]);

    const body = view === 'agenda' ? renderAgenda(appointments) : renderConversations(sessions);

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Dashboard \u2014 Ati\u00e9ndeme la Pyme</title>
<meta name="robots" content="noindex, nofollow">
<style>${ADMIN_STYLES}</style>
</head>
<body>
  <div class="admin-wrap">
    <h1>Dashboard \u2014 Ati\u00e9ndeme la Pyme</h1>
    <p class="admin-sub">${sessions.length} conversaciones \u00b7 ${appointments.length} citas agendadas</p>
    <div class="admin-tabs">
      <a href="/admin?view=conversaciones" class="${view === 'conversaciones' ? 'active' : ''}">Conversaciones</a>
      <a href="/admin?view=agenda" class="${view === 'agenda' ? 'active' : ''}">Agenda</a>
    </div>
    ${body}
  </div>
</body>
</html>`;

    return new Response(html, {
        status: 200,
        headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'X-Robots-Tag': 'noindex, nofollow',
            'Cache-Control': 'no-store'
        }
    });
}

export { onRequestGetAdmin, checkAdminAuth };
