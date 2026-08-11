// src/api/admin.js
// Dashboard interno: metricas + conversaciones + agenda. Protegido con Basic Auth.
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

async function fetchTable(env, path) {
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) return [];
    try {
        const res = await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, {
            headers: {
                apikey: env.SUPABASE_SERVICE_KEY,
                Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`
            }
        });
        if (!res.ok) return [];
        return await res.json();
    } catch (err) {
        console.error('Admin fetch error:', path, err.message);
        return [];
    }
}

function fetchChatSessions(env) {
    return fetchTable(env, 'chat_sessions?select=*&order=updated_at.desc');
}

function fetchAppointments(env) {
    return fetchTable(env, 'scheduled_appointments?select=*&order=appointment_date.asc,appointment_time.asc');
}

// Serializa datos para inyectar en <script> de forma segura
function safeJson(data) {
    return JSON.stringify(data)
        .replace(/</g, '\\u003c')
        .replace(/\u2028/g, '\\u2028')
        .replace(/\u2029/g, '\\u2029');
}

const ADMIN_STYLES = `
:root{--bg:#0A0A0A;--panel:#141414;--panel2:#1A1A1A;--line:#262626;--text:#EDEDE8;--muted:#8A8A82;--accent:#E8A33D;--accent-ink:#0A0A0A;--ok:#43D17C;}
*{box-sizing:border-box;margin:0;padding:0;}
body{background:var(--bg);color:var(--text);font-family:'JetBrains Mono',ui-monospace,monospace;font-size:13px;line-height:1.55;}
a{color:var(--accent);text-decoration:none;}
.layout{display:flex;min-height:100vh;}
/* ---- sidebar ---- */
.side{width:210px;flex-shrink:0;border-right:1px solid var(--line);padding:22px 14px;display:flex;flex-direction:column;gap:4px;position:sticky;top:0;height:100vh;}
.brand{font-weight:700;font-size:14px;margin-bottom:22px;letter-spacing:.02em;}
.brand span{color:var(--accent);}
.nav-btn{display:flex;align-items:center;gap:10px;width:100%;text-align:left;background:none;border:none;color:var(--muted);font:inherit;padding:10px 12px;border-radius:8px;cursor:pointer;transition:background .15s,color .15s;}
.nav-btn:hover{background:var(--panel);color:var(--text);}
.nav-btn.active{background:var(--accent);color:var(--accent-ink);font-weight:700;}
.nav-btn .ico{width:16px;text-align:center;}
.side-foot{margin-top:auto;color:var(--muted);font-size:11px;line-height:1.7;}
/* ---- main ---- */
.main{flex:1;padding:26px 28px;max-width:1200px;}
.head{display:flex;align-items:baseline;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:20px;}
h1{font-size:20px;}
.head .sub{color:var(--muted);font-size:12px;}
.refresh{background:var(--panel);border:1px solid var(--line);color:var(--text);font:inherit;font-size:12px;padding:8px 14px;border-radius:8px;cursor:pointer;}
.refresh:hover{border-color:var(--accent);color:var(--accent);}
/* ---- stat cards ---- */
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px;margin-bottom:20px;}
.stat{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:16px;position:relative;overflow:hidden;}
.stat.hero{background:var(--accent);color:var(--accent-ink);border-color:var(--accent);}
.stat .label{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);}
.stat.hero .label{color:rgba(10,10,10,.65);}
.stat .num{font-size:30px;font-weight:700;margin-top:6px;}
.stat .hint{font-size:11px;color:var(--muted);margin-top:4px;}
.stat.hero .hint{color:rgba(10,10,10,.65);}
/* ---- grid ---- */
.grid{display:grid;grid-template-columns:1.6fr 1fr;gap:14px;align-items:start;}
@media(max-width:900px){.grid{grid-template-columns:1fr;}.side{display:none;}.mobile-nav{display:flex!important;}}
.card{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:18px;}
.card h2{font-size:13px;text-transform:uppercase;letter-spacing:.08em;margin-bottom:14px;display:flex;justify-content:space-between;align-items:center;}
.card h2 .count{color:var(--muted);font-weight:400;text-transform:none;letter-spacing:0;}
.stack{display:flex;flex-direction:column;gap:14px;}
/* ---- chart ---- */
.chart{display:flex;align-items:flex-end;gap:6px;height:110px;padding-top:6px;}
.chart .col{flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;height:100%;justify-content:flex-end;}
.chart .bar{width:100%;max-width:34px;background:var(--accent);border-radius:6px 6px 0 0;min-height:3px;opacity:.9;transition:opacity .15s;}
.chart .bar.zero{background:var(--panel2);}
.chart .col:hover .bar{opacity:1;}
.chart .lbl{font-size:10px;color:var(--muted);}
.chart .val{font-size:10px;color:var(--text);}
/* ---- next appointment ---- */
.next-appt{background:linear-gradient(135deg,var(--panel2),var(--panel));border:1px solid var(--accent);border-radius:12px;padding:18px;}
.next-appt .when{color:var(--accent);font-weight:700;font-size:15px;}
.next-appt .who{margin-top:6px;font-size:14px;}
.next-appt .mail{color:var(--muted);font-size:12px;}
.next-appt .cta{display:inline-block;margin-top:12px;background:var(--accent);color:var(--accent-ink);font-weight:700;font-size:12px;padding:9px 16px;border-radius:8px;}
/* ---- search ---- */
.search{width:100%;background:var(--panel2);border:1px solid var(--line);border-radius:8px;color:var(--text);font:inherit;padding:10px 12px;margin-bottom:12px;}
.search:focus{outline:none;border-color:var(--accent);}
/* ---- conversation cards ---- */
.convo{background:var(--panel2);border:1px solid var(--line);border-radius:10px;margin-bottom:10px;overflow:hidden;}
.convo-head{padding:12px 14px;cursor:pointer;display:flex;flex-wrap:wrap;gap:8px 12px;align-items:baseline;}
.convo-head:hover{background:#1f1f1f;}
.convo-title{font-weight:700;}
.convo-title.anon{color:var(--muted);font-weight:400;}
.convo-meta{color:var(--muted);font-size:11px;}
.convo-preview{flex-basis:100%;color:var(--muted);font-size:11.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.badge{font-size:10px;border:1px solid var(--line);border-radius:20px;padding:2px 9px;color:var(--muted);}
.badge.lead{border-color:var(--ok);color:var(--ok);}
.thread{display:none;border-top:1px solid var(--line);padding:12px 14px;max-height:420px;overflow-y:auto;}
.convo.open .thread{display:block;}
.msg{margin-bottom:10px;padding:9px 12px;border-radius:8px;max-width:92%;}
.msg.user{background:#1c1c1c;}
.msg.bot{background:#211a09;margin-left:auto;}
.msg .role{font-size:10px;color:var(--accent);display:block;margin-bottom:3px;}
.msg p{font-size:12.5px;white-space:pre-wrap;}
/* ---- agenda ---- */
.day{margin-bottom:16px;}
.day h3{color:var(--accent);font-size:12px;margin-bottom:8px;display:flex;gap:8px;align-items:baseline;}
.day h3 .dow{color:var(--muted);font-weight:400;text-transform:capitalize;}
.appt{display:flex;gap:12px;align-items:center;padding:10px 12px;background:var(--panel2);border:1px solid var(--line);border-radius:8px;margin-bottom:6px;flex-wrap:wrap;}
.appt.past{opacity:.45;}
.appt .time{color:var(--accent);font-weight:700;min-width:52px;}
.appt .mail{color:var(--muted);font-size:11.5px;}
.appt .cal{margin-left:auto;font-size:11.5px;}
.filter-row{display:flex;gap:8px;margin-bottom:12px;}
.chip{background:var(--panel2);border:1px solid var(--line);border-radius:20px;color:var(--muted);font:inherit;font-size:11.5px;padding:6px 14px;cursor:pointer;}
.chip.active{background:var(--accent);border-color:var(--accent);color:var(--accent-ink);font-weight:700;}
.empty{color:var(--muted);padding:16px 0;}
.view{display:none;}
.view.active{display:block;}
.mobile-nav{display:none;gap:8px;margin-bottom:16px;}
`;

const ADMIN_SCRIPT = `
const $=(s,r=document)=>r.querySelector(s);const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=(x)=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const TZ='America/Santiago';
const fmtDT=(iso)=>{try{return new Date(iso).toLocaleString('es-CL',{dateStyle:'medium',timeStyle:'short',timeZone:TZ});}catch{return iso||'';}};
const todayStr=()=>new Date().toLocaleDateString('en-CA',{timeZone:TZ});
const dowOf=(d)=>{try{return new Date(d+'T12:00:00').toLocaleDateString('es-CL',{weekday:'long',timeZone:TZ});}catch{return'';}};

// ---------- navegacion ----------
function show(view){
  $$('.view').forEach(v=>v.classList.toggle('active',v.dataset.view===view));
  $$('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.view===view));
  history.replaceState(null,'','#'+view);
}
$$('.nav-btn').forEach(b=>b.addEventListener('click',()=>show(b.dataset.view)));

// ---------- stats ----------
const sessions=window.__DATA__.sessions||[];
const appts=window.__DATA__.appointments||[];
const leads=sessions.filter(s=>s.lead_contact);
const today=todayStr();
const upcoming=appts.filter(a=>a.appointment_date>=today);
$('#st-conv').textContent=sessions.length;
$('#st-leads').textContent=leads.length;
$('#st-appts').textContent=appts.length;
$('#st-upcoming').textContent=upcoming.length;

// ---------- proxima cita ----------
(function(){
  const el=$('#next-appt');
  if(!upcoming.length){el.innerHTML='<p class="empty">No hay citas pr\\u00f3ximas.</p>';return;}
  const n=upcoming[0];
  const dow=dowOf(n.appointment_date);
  el.innerHTML='<div class="when">'+esc(dow)+' '+esc(n.appointment_date)+' \\u00b7 '+esc((n.appointment_time||'').slice(0,5))+'</div>'
    +'<div class="who">'+esc(n.client_name)+'</div>'
    +'<div class="mail">'+esc(n.client_email)+'</div>'
    +(n.calendar_link?'<a class="cta" href="'+esc(n.calendar_link)+'" target="_blank" rel="noopener">Abrir en Calendar \\u2192</a>':'');
})();

// ---------- grafico: conversaciones ultimos 7 dias ----------
(function(){
  const days=[];
  for(let i=6;i>=0;i--){
    const d=new Date();d.setDate(d.getDate()-i);
    days.push(d.toLocaleDateString('en-CA',{timeZone:TZ}));
  }
  const counts=days.map(day=>sessions.filter(s=>(s.updated_at||'').slice(0,10)===day).length);
  const max=Math.max(...counts,1);
  $('#chart').innerHTML=days.map((day,i)=>{
    const h=Math.round(counts[i]/max*80);
    const lbl=new Date(day+'T12:00:00').toLocaleDateString('es-CL',{weekday:'short',timeZone:TZ});
    return '<div class="col"><span class="val">'+(counts[i]||'')+'</span><div class="bar'+(counts[i]?'':' zero')+'" style="height:'+Math.max(h,3)+'px"></div><span class="lbl">'+esc(lbl)+'</span></div>';
  }).join('');
})();
`;

const ADMIN_SCRIPT_2 = `
// ---------- conversaciones ----------
function renderConvos(list,mount){
  if(!list.length){mount.innerHTML='<p class="empty">Sin resultados.</p>';return;}
  mount.innerHTML=list.map((s,i)=>{
    const msgs=Array.isArray(s.messages)?s.messages:[];
    const last=msgs[msgs.length-1];
    const preview=last?esc(last.content).slice(0,160):'(sin mensajes)';
    const thread=msgs.map(m=>'<div class="msg '+(m.role==='user'?'user':'bot')+'"><span class="role">'+(m.role==='user'?'Visitante':'Dominga')+'</span><p>'+esc(m.content)+'</p></div>').join('');
    return '<div class="convo" data-i="'+i+'">'
      +'<div class="convo-head">'
      +(s.lead_contact?'<span class="convo-title">'+esc(s.lead_contact)+'</span><span class="badge lead">lead</span>':'<span class="convo-title anon">An\\u00f3nimo</span>')
      +'<span class="convo-meta">'+msgs.length+' msjs \\u00b7 '+fmtDT(s.updated_at)+'</span>'
      +'<span class="convo-preview">'+preview+'</span>'
      +'</div><div class="thread">'+thread+'</div></div>';
  }).join('');
  $$('.convo-head',mount).forEach(h=>h.addEventListener('click',()=>h.parentElement.classList.toggle('open')));
}
const convoMount=$('#convo-list');
$('#convo-count').textContent=sessions.length+' totales';
renderConvos(sessions,convoMount);
renderConvos(sessions.slice(0,4),$('#convo-recent'));
$('#convo-search').addEventListener('input',(e)=>{
  const q=e.target.value.toLowerCase().trim();
  if(!q){renderConvos(sessions,convoMount);return;}
  renderConvos(sessions.filter(s=>{
    if((s.lead_contact||'').toLowerCase().includes(q))return true;
    return (Array.isArray(s.messages)?s.messages:[]).some(m=>(m.content||'').toLowerCase().includes(q));
  }),convoMount);
});

// ---------- agenda ----------
let agendaMode='upcoming';
function renderAgenda(){
  const mount=$('#agenda-list');
  const source=agendaMode==='upcoming'?upcoming:appts;
  if(!source.length){mount.innerHTML='<p class="empty">No hay citas'+(agendaMode==='upcoming'?' pr\\u00f3ximas':'')+'.</p>';return;}
  const byDate={};
  source.forEach(a=>{(byDate[a.appointment_date]=byDate[a.appointment_date]||[]).push(a);});
  mount.innerHTML=Object.keys(byDate).sort().map(date=>{
    const rows=byDate[date].map(a=>'<div class="appt'+(date<today?' past':'')+'">'
      +'<span class="time">'+esc((a.appointment_time||'').slice(0,5))+'</span>'
      +'<span>'+esc(a.client_name)+'</span>'
      +'<span class="mail">'+esc(a.client_email)+'</span>'
      +(a.reminder_sent?'<span class="badge">recordatorio \\u2713</span>':'')
      +(a.calendar_link?'<a class="cal" href="'+esc(a.calendar_link)+'" target="_blank" rel="noopener">Calendar \\u2192</a>':'')
      +'</div>').join('');
    return '<div class="day"><h3>'+esc(date)+' <span class="dow">'+esc(dowOf(date))+'</span>'+(date===today?' <span class="badge lead">hoy</span>':'')+'</h3>'+rows+'</div>';
  }).join('');
}
$$('.chip').forEach(c=>c.addEventListener('click',()=>{
  agendaMode=c.dataset.mode;
  $$('.chip').forEach(x=>x.classList.toggle('active',x===c));
  renderAgenda();
}));
renderAgenda();

// ---------- pagespeed ----------
function scoreColor(n){if(n==null)return'var(--muted)';if(n>=90)return'#43D17C';if(n>=50)return'var(--accent)';return'#E85D3D';}
function psiCol(label,data){
  if(!data)return'';
  if(data.error)return '<div class="card" style="flex:1;min-width:220px;"><h2 style="font-size:12px;">'+label+'</h2><p class="empty">'+esc(data.error)+'</p></div>';
  const rows=[['Performance',data.performance],['Accesibilidad',data.accessibility],['Buenas pr\\u00e1cticas',data.bestPractices],['SEO',data.seo]];
  const scores=rows.map(([lbl,val])=>'<div style="text-align:center;flex:1;"><div style="font-size:26px;font-weight:700;color:'+scoreColor(val)+'">'+(val??'\\u2013')+'</div><div style="font-size:10px;color:var(--muted);margin-top:2px;">'+lbl+'</div></div>').join('');
  const vitals=[['LCP',data.lcp],['CLS',data.cls],['TBT',data.tbt],['FCP',data.fcp],['Speed Index',data.speedIndex]]
    .filter(([,v])=>v).map(([lbl,v])=>'<div class="badge" style="margin:2px 4px 0 0;display:inline-block;">'+lbl+': '+esc(v)+'</div>').join('');
  return '<div class="card" style="flex:1;min-width:260px;">'
    +'<h2 style="font-size:12px;">'+label+'</h2>'
    +'<div style="display:flex;gap:6px;margin-bottom:12px;">'+scores+'</div>'
    +'<div>'+vitals+'</div>'
    +'</div>';
}
$('#psi-run').addEventListener('click',async()=>{
  const btn=$('#psi-run');const status=$('#psi-status');const out=$('#psi-results');
  btn.disabled=true;status.textContent='Corriendo Lighthouse en mobile y desktop\\u2026';
  out.innerHTML='<p class="empty">Analizando\\u2026 esto puede tardar hasta 30 segundos.</p>';
  try{
    const res=await fetch('/api/admin/pagespeed?url='+encodeURIComponent('https://atiendemelapyme.cl/'));
    const data=await res.json();
    out.innerHTML='<div style="display:flex;gap:14px;flex-wrap:wrap;">'+psiCol('\\u{1F4F1} Mobile',data.mobile)+psiCol('\\u{1F5A5}\\uFE0F Desktop',data.desktop)+'</div>';
    status.textContent='\\u00daltimo an\\u00e1lisis: '+new Date(data.checkedAt).toLocaleTimeString('es-CL',{timeZone:TZ});
  }catch(err){
    out.innerHTML='<p class="empty">Error al consultar PageSpeed: '+esc(err.message)+'</p>';
    status.textContent='';
  }finally{btn.disabled=false;}
});

// vista inicial segun hash
show((location.hash||'#inicio').slice(1));
`;

async function onRequestGetAdmin(context) {
    const { request, env } = context;
    if (!checkAdminAuth(request, env)) {
        return unauthorizedResponse();
    }

    const [sessions, appointments] = await Promise.all([
        fetchChatSessions(env),
        fetchAppointments(env)
    ]);

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
<div class="layout">
  <aside class="side">
    <div class="brand">Ati\u00e9ndeme<span>_</span>la Pyme</div>
    <button class="nav-btn active" data-view="inicio"><span class="ico">\u25A6</span> Inicio</button>
    <button class="nav-btn" data-view="conversaciones"><span class="ico">\u2709</span> Conversaciones</button>
    <button class="nav-btn" data-view="agenda"><span class="ico">\u25F4</span> Agenda</button>
    <button class="nav-btn" data-view="rendimiento"><span class="ico">\u26A1</span> Rendimiento</button>
    <div class="side-foot">Panel interno<br>atiendemelapyme.cl</div>
  </aside>
  <main class="main">
    <div class="head">
      <div>
        <h1>Dashboard</h1>
        <div class="sub">Resumen de Dominga: conversaciones, leads y citas.</div>
      </div>
      <button class="refresh" onclick="location.reload()">\u21BB Actualizar</button>
    </div>
    <div class="mobile-nav">
      <button class="nav-btn active" data-view="inicio">Inicio</button>
      <button class="nav-btn" data-view="conversaciones">Chats</button>
      <button class="nav-btn" data-view="agenda">Agenda</button>
      <button class="nav-btn" data-view="rendimiento">Rendimiento</button>
    </div>
    <div class="stats">
      <div class="stat hero"><div class="label">Conversaciones</div><div class="num" id="st-conv">\u2013</div><div class="hint">total registradas</div></div>
      <div class="stat"><div class="label">Leads con contacto</div><div class="num" id="st-leads">\u2013</div><div class="hint">dejaron email/tel\u00e9fono</div></div>
      <div class="stat"><div class="label">Citas totales</div><div class="num" id="st-appts">\u2013</div><div class="hint">hist\u00f3rico agendado</div></div>
      <div class="stat"><div class="label">Citas pr\u00f3ximas</div><div class="num" id="st-upcoming">\u2013</div><div class="hint">desde hoy en adelante</div></div>
    </div>

    <section class="view active" data-view="inicio">
      <div class="grid">
        <div class="stack">
          <div class="card">
            <h2>Actividad \u00b7 \u00faltimos 7 d\u00edas <span class="count">conversaciones</span></h2>
            <div class="chart" id="chart"></div>
          </div>
          <div class="card">
            <h2>Conversaciones recientes <span class="count">\u00faltimas 4</span></h2>
            <div id="convo-recent"></div>
          </div>
        </div>
        <div class="stack">
          <div class="next-appt">
            <h2 style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px;">Pr\u00f3xima cita</h2>
            <div id="next-appt"></div>
          </div>
          <div class="card">
            <h2>Accesos r\u00e1pidos</h2>
            <div class="stack" style="gap:8px;">
              <a href="https://calendar.google.com" target="_blank" rel="noopener">\u2192 Google Calendar</a>
              <a href="https://supabase.com/dashboard/project/ewhqshvmrinqsevjfjtz" target="_blank" rel="noopener">\u2192 Supabase (datos)</a>
              <a href="https://dash.cloudflare.com" target="_blank" rel="noopener">\u2192 Cloudflare (Worker)</a>
              <a href="https://analytics.google.com" target="_blank" rel="noopener">\u2192 Google Analytics</a>
              <a href="/" target="_blank" rel="noopener">\u2192 Ver el sitio</a>
            </div>
          </div>
        </div>
      </div>
    </section>
    <section class="view" data-view="conversaciones">
      <div class="card">
        <h2>Conversaciones <span class="count" id="convo-count"></span></h2>
        <input class="search" id="convo-search" type="search" placeholder="Buscar por contacto o contenido del mensaje\u2026">
        <div id="convo-list"></div>
      </div>
    </section>
    <section class="view" data-view="agenda">
      <div class="card">
        <h2>Agenda</h2>
        <div class="filter-row">
          <button class="chip active" data-mode="upcoming">Pr\u00f3ximas</button>
          <button class="chip" data-mode="all">Todas</button>
        </div>
        <div id="agenda-list"></div>
      </div>
    </section>
    <section class="view" data-view="rendimiento">
      <div class="card">
        <h2>Rendimiento del sitio <span class="count">Google PageSpeed Insights</span></h2>
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:16px;">
          <button class="refresh" id="psi-run" style="border-color:var(--accent);color:var(--accent);">\u25B6 Analizar atiendemelapyme.cl</button>
          <span class="convo-meta" id="psi-status"></span>
        </div>
        <div id="psi-results"><p class="empty">Presiona "Analizar" para correr Lighthouse sobre el sitio (toma ~15-30s, corre en vivo contra Google).</p></div>
      </div>
    </section>
  </main>
</div>
<script>window.__DATA__=${safeJson({ sessions, appointments })};</script>
<script>${ADMIN_SCRIPT}${ADMIN_SCRIPT_2}</script>
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
    if (!checkAdminAuth(request, env)) {
        return unauthorizedResponse();
    }
    const url = new URL(request.url);
    const targetUrl = url.searchParams.get('url') || 'https://atiendemelapyme.cl/';
    const [mobile, desktop] = await Promise.all([
        runPSI(targetUrl, 'mobile', env),
        runPSI(targetUrl, 'desktop', env)
    ]);
    return new Response(JSON.stringify({ url: targetUrl, mobile, desktop, checkedAt: new Date().toISOString() }), {
        status: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
    });
}

export { onRequestGetAdmin, onRequestGetPagespeed, checkAdminAuth };
