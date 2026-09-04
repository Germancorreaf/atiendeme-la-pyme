// src/lib/vertical-pages.js
// Páginas de contenido por rubro (SEO long-tail). Reusa el mensaje validado
// ("recupera lo que pierdes fuera de horario") y solo describe capacidades
// reales del producto — nada de casos de éxito o cifras inventadas, ya que
// todavía no hay clientes pagando confirmados.
//
// El shell (fuentes, variables, nav, footer, JS de menú) es una copia del
// mismo bloque que usa la landing (HTML_CONTENT en index.js), recortado a
// lo que aplica a una página de contenido simple (sin las secciones de
// demo interactiva de la home). Si se rediseña la landing, este archivo
// puede quedar desalineado — no hay una única fuente compartida todavía.

const SHARED_HEAD_STYLE = `@font-face{font-family:'JetBrains Mono';font-style:normal;font-weight:400;font-display:swap;src:url(https://fonts.gstatic.com/s/jetbrainsmono/v24/tDbv2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKwBNntkaToggR7BYRbKPxDcwg.woff2) format('woff2');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD;}
@font-face{font-family:'JetBrains Mono';font-style:normal;font-weight:700;font-display:swap;src:url(https://fonts.gstatic.com/s/jetbrainsmono/v24/tDbv2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKwBNntkaToggR7BYRbKPxDcwg.woff2) format('woff2');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD;}
@font-face{font-family:'Space Grotesk';font-style:normal;font-weight:700;font-display:swap;src:url(https://fonts.gstatic.com/s/spacegrotesk/v22/V8mQoQDjQSkFtoMM3T6r8E7mF71Q-gOoraIAEj4PVnskPMA.woff2) format('woff2');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD;}
:root{--bg:#0A0A0A;--panel:#0F0F0F;--line:#242424;--line-hard:#EDEDE8;--text:#EDEDE8;--muted:#8A8A82;--muted2:#7D7D74;--accent:#E8A33D;--ok:#43D17C;--err:#FF5F57;--ink:#0A0A0A;--ease:cubic-bezier(0.23,1,0.32,1);}
*{box-sizing:border-box;border-radius:0 !important;}
html{scroll-behavior:smooth;scroll-padding-top:72px;scrollbar-color:var(--accent) var(--bg);}
body{margin:0;background:var(--bg);color:var(--text);font-family:'JetBrains Mono',ui-monospace,monospace;font-size:14px;line-height:1.6;-webkit-font-smoothing:antialiased;-webkit-tap-highlight-color:transparent;overflow-x:hidden;}
::selection{background:var(--accent);color:var(--ink);}
a{color:var(--text);text-decoration:none;transition:color 150ms var(--ease),background 150ms var(--ease);}
a:hover{color:var(--accent);}
button{font-family:inherit;cursor:pointer;}
:focus-visible{outline:2px solid var(--accent);outline-offset:2px;}
p{text-wrap:pretty;}
@media (prefers-reduced-motion: reduce){*,*::before,*::after{animation-duration:0.01ms !important;animation-iteration-count:1 !important;transition-duration:0.01ms !important;scroll-behavior:auto !important;}}
.grid-bg{position:fixed;inset:0;z-index:0;pointer-events:none;background-image:linear-gradient(var(--line) 1px,transparent 1px),linear-gradient(90deg,var(--line) 1px,transparent 1px);background-size:64px 64px;opacity:.35;}
@keyframes blink{0%,49%{opacity:1;}50%,100%{opacity:0;}}
@keyframes revealFade{from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:translateY(0);}}
.reveal{opacity:0;}
.reveal.in{animation:revealFade .4s var(--ease) both;}
.wrap{max-width:1180px;margin:0 auto;position:relative;z-index:1;border-left:1px solid var(--line);border-right:1px solid var(--line);background:var(--bg);}
section{border-bottom:1px solid var(--line);position:relative;}
.sec-num{position:absolute;top:0;left:0;font-size:11px;color:var(--muted2);padding:10px 16px;border-right:1px solid var(--line);border-bottom:1px solid var(--line);letter-spacing:.1em;user-select:none;}
.label{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);}
.label b{color:var(--accent);font-weight:400;}
.nav-header{position:fixed;top:0;left:0;width:100%;z-index:50;display:flex;align-items:stretch;justify-content:space-between;background:var(--bg);border-bottom:2px solid var(--line-hard);}
.nav-logo{font-weight:800;font-size:13px;letter-spacing:.06em;text-transform:uppercase;padding:18px 20px;display:flex;align-items:center;gap:10px;}
.nav-logo .cursor{display:inline-block;width:9px;height:16px;background:var(--accent);animation:blink 1.1s steps(1) infinite;}
.nav-toggle{display:inline-flex;align-items:center;gap:10px;background:var(--bg);border:none;border-left:2px solid var(--line-hard);padding:0 26px;color:var(--text);font-weight:700;font-size:12px;letter-spacing:.14em;text-transform:uppercase;transition:background 150ms var(--ease),color 150ms var(--ease);}
.nav-toggle:hover{background:var(--accent);color:var(--ink);}
body.menu-open .nav-toggle{background:var(--text);color:var(--ink);}
.nav-toggle .bars{position:relative;width:14px;height:10px;flex:0 0 14px;}
.nav-toggle .bars span{position:absolute;left:0;width:100%;height:2px;background:currentColor;transition:transform 200ms var(--ease);}
.nav-toggle .bars span:nth-child(1){top:0;}
.nav-toggle .bars span:nth-child(2){bottom:0;}
body.menu-open .nav-toggle .bars span:nth-child(1){transform:translateY(4px) rotate(45deg);}
body.menu-open .nav-toggle .bars span:nth-child(2){transform:translateY(-4px) rotate(-45deg);}
.menu-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.7);opacity:0;pointer-events:none;transition:opacity 200ms var(--ease);z-index:39;}
body.menu-open .menu-overlay{opacity:1;pointer-events:auto;}
.menu-panel{position:fixed;top:0;right:0;height:100%;width:clamp(300px,36vw,420px);background:var(--bg);border-left:2px solid var(--line-hard);display:flex;flex-direction:column;padding:96px 32px 32px;overflow-y:auto;z-index:40;transform:translateX(105%);transition:transform 300ms var(--ease);}
body.menu-open .menu-panel{transform:translateX(0);}
.menu-list{list-style:none;margin:0 0 auto;padding:0;display:flex;flex-direction:column;counter-reset:mi;}
.menu-list li{counter-increment:mi;border-bottom:1px solid var(--line);}
.menu-list a{display:flex;align-items:baseline;gap:14px;font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:1.9rem;line-height:1.1;letter-spacing:-0.01em;text-transform:uppercase;padding:18px 2px;opacity:0;transform:translateX(20px);transition:opacity 250ms var(--ease),transform 250ms var(--ease),color 150ms var(--ease),padding-left 150ms var(--ease);}
body.menu-open .menu-list a{opacity:1;transform:translateX(0);}
.menu-list li:nth-child(1) a{transition-delay:50ms;}
.menu-list li:nth-child(2) a{transition-delay:100ms;}
.menu-list li:nth-child(3) a{transition-delay:150ms;}
.menu-list li:nth-child(4) a{transition-delay:200ms;}
.menu-list li:nth-child(5) a{transition-delay:250ms;}
.menu-list a::before{content:'0' counter(mi);font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:400;color:var(--accent);}
.menu-list a:hover{color:var(--accent);padding-left:10px;}
.menu-socials{margin-top:2.5rem;padding-top:1.5rem;border-top:2px solid var(--line-hard);display:flex;flex-direction:column;gap:.75rem;}
.menu-socials-title{margin:0;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--accent);}
.menu-socials-list{list-style:none;margin:0;padding:0;display:flex;gap:1.4rem;flex-wrap:wrap;}
.menu-socials-list a{font-size:13px;color:var(--muted);display:inline-block;padding:10px 4px;}
.menu-socials-list a:hover{color:var(--accent);}
.hero{padding:150px 40px 90px;border-bottom:2px solid var(--line-hard);}
.sign-badge{display:inline-flex;align-items:center;gap:10px;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--text);border:1px solid var(--accent);padding:8px 14px;background:var(--bg);box-shadow:4px 4px 0 var(--accent);}
.sign-badge .dot{width:8px;height:8px;background:var(--ok);animation:blink 1.4s steps(1) infinite;}
.hero h1{margin:36px 0 0;font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:clamp(34px,6vw,64px);line-height:1.05;letter-spacing:-0.03em;max-width:900px;text-transform:none;}
.hero .sub{margin:28px 0 0;max-width:640px;font-size:15px;line-height:1.75;color:var(--muted);}
.btn-row{display:flex;gap:16px;margin-top:40px;flex-wrap:wrap;}
.btn-primary{display:inline-block;background:var(--accent);color:var(--ink);font-size:13px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:16px 30px;border:2px solid var(--accent);box-shadow:5px 5px 0 var(--line-hard);transition:transform 150ms var(--ease),box-shadow 150ms var(--ease),background 150ms var(--ease);}
.btn-primary:hover{transform:translate(-2px,-2px);box-shadow:7px 7px 0 var(--line-hard);color:var(--ink);}
.btn-primary:active{transform:translate(3px,3px);box-shadow:2px 2px 0 var(--line-hard);}
.btn-outline{display:inline-block;background:var(--bg);color:var(--text);font-size:13px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:16px 30px;border:2px solid var(--line-hard);box-shadow:5px 5px 0 var(--accent);transition:transform 150ms var(--ease),box-shadow 150ms var(--ease),background 150ms var(--ease),color 150ms var(--ease);}
.btn-outline:hover{transform:translate(-2px,-2px);box-shadow:7px 7px 0 var(--accent);background:var(--text);color:var(--ink);}
.btn-outline:active{transform:translate(3px,3px);box-shadow:2px 2px 0 var(--accent);}
.sec-head{padding:64px 40px 0;max-width:720px;}
.sec-head h2{margin:14px 0 0;font-family:'Space Grotesk',sans-serif;font-size:clamp(24px,3.2vw,36px);font-weight:700;letter-spacing:-0.02em;line-height:1.1;}
.content-body{padding:24px 40px 64px;max-width:720px;}
.content-body ul{margin:0;padding:0;list-style:none;}
.content-body li{padding:16px 0;border-top:1px solid var(--line);color:var(--muted);font-size:14px;line-height:1.7;}
.content-body li:last-child{border-bottom:1px solid var(--line);}
.content-body li b{color:var(--text);font-weight:700;}
.content-body p{color:var(--muted);font-size:14px;line-height:1.8;margin:0 0 16px;}
footer{padding:0;display:flex;flex-wrap:wrap;align-items:stretch;justify-content:space-between;font-size:11px;letter-spacing:.06em;color:var(--muted2);}
footer .cell{padding:20px 24px;display:flex;align-items:center;gap:8px;}
footer .cell .ok-dot{width:7px;height:7px;background:var(--ok);display:inline-block;animation:blink 1.4s steps(1) infinite;}
footer .links{display:flex;align-items:stretch;}
footer .links a{color:var(--muted2);padding:20px 20px;display:flex;align-items:center;border-left:1px solid var(--line);text-transform:uppercase;}
footer .links a:hover{color:var(--accent);background:var(--panel);}
@media (max-width:1024px){.wrap{border-left:none;border-right:none;}}
@media (max-width:768px){.hero{padding:120px 20px 60px;}.sec-head,.content-body{padding-left:20px;padding-right:20px;}.menu-list a{font-size:1.5rem;}}
@media (max-width:480px){html{scroll-padding-top:64px;}.nav-logo{padding:14px 14px;font-size:11px;}.nav-toggle{padding:0 18px;font-size:11px;}.hero{padding:104px 16px 48px;}.hero .sub{font-size:13px;}.btn-row{flex-direction:column;gap:14px;}.btn-primary,.btn-outline{width:100%;text-align:center;}.menu-panel{width:min(100vw - 16px,320px);padding:88px 20px 20px;}.menu-list a{font-size:1.3rem;}}`;

const SHARED_HEADER_NAV = `<header class="nav-header">
  <div class="nav-logo"><svg class="brand-mark" width="26" height="26" viewBox="0 0 64 64" aria-hidden="true" focusable="false" style="flex-shrink:0"><rect width="64" height="64" fill="var(--bg)"/><text x="10" y="48" font-family="'Space Grotesk','Arial Black',sans-serif" font-weight="700" font-size="42" fill="var(--text)">a</text><rect x="40" y="16" width="13" height="34" fill="var(--accent)"/></svg>ATIÉNDEME_LA_PYME<span class="cursor"></span></div>
  <button class="nav-toggle" id="menuToggle" aria-label="Abrir menú" aria-expanded="false" aria-controls="menuPanel">
    <span class="bars"><span></span><span></span></span>
    Menú
  </button>
</header>
<div class="menu-overlay" id="menuOverlay"></div>
<nav class="menu-panel" id="menuPanel" aria-label="Navegación principal">
  <ul class="menu-list">
    <li><a href="/#solucion" class="menu-link">Solución</a></li>
    <li><a href="/#canales" class="menu-link">Canales</a></li>
    <li><a href="/#precios" class="menu-link">Precios</a></li>
    <li><a href="/#faq" class="menu-link">FAQ</a></li>
    <li><a href="/#contacto" class="menu-link">Agendar demo</a></li>
  </ul>
  <div class="menu-socials">
    <p class="menu-socials-title">Síguenos</p>
    <div class="menu-socials-list">
      <a href="https://instagram.com/atiendemelapyme" target="_blank" rel="noopener">Instagram</a>
      <a href="https://wa.me/56922053594" target="_blank" rel="noopener">WhatsApp</a>
      <a href="mailto:hola@atiendemelapyme.cl">Correo</a>
    </div>
  </div>
</nav>`;

const SHARED_FOOTER = `<footer>
    <span class="cell"><span class="ok-dot"></span>SYS.OK — © 2026 ATIÉNDEME LA PYME</span>
    <div class="links">
      <a href="/terminos">Términos</a>
      <a href="/privacidad">Privacidad</a>
      <a href="mailto:hola@atiendemelapyme.cl">Contacto</a>
    </div>
  </footer>`;

const SHARED_SCRIPT = `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-V709QK49JE');
window.addEventListener('load', function(){
  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=G-V709QK49JE';
  document.head.appendChild(s);
});
const menuOverlay = document.getElementById('menuOverlay');
document.addEventListener('click', (e) => {
  if (e.target.closest('#menuToggle')) { document.body.classList.toggle('menu-open'); syncMenu(); return; }
  if (e.target === menuOverlay || e.target.closest('.menu-link')) { document.body.classList.remove('menu-open'); syncMenu(); }
});
function syncMenu(){ document.getElementById('menuToggle').setAttribute('aria-expanded', document.body.classList.contains('menu-open')); }
document.addEventListener('keydown', (e)=>{ if(e.key==='Escape' && document.body.classList.contains('menu-open')){ document.body.classList.remove('menu-open'); syncMenu(); } });
const io = new IntersectionObserver((entries)=>{
  entries.forEach(en=>{ if(en.isIntersecting){ en.target.classList.add('in'); io.unobserve(en.target); } });
},{threshold:0.12});
document.querySelectorAll('.reveal').forEach(el=>io.observe(el));`;

const VERTICALS = {
  'chatbot-ia-para-centros-esteticos': {
    rubro: 'centros estéticos',
    metaTitle: 'Chatbot IA para Centros Estéticos en Chile | Atiéndeme la Pyme',
    metaDesc: 'Chatbot de IA que responde consultas y agenda tratamientos fuera de horario para centros estéticos en Chile. WhatsApp, Instagram y web.',
    badge: 'chatbot ia para centros estéticos',
    h1: 'No pierdas clientas fuera de horario',
    intro: 'Una clienta que quiere agendar una limpieza facial un domingo a la noche, o pregunta el precio de un tratamiento a las 22:00, no siempre puede esperar hasta el lunes para que le contesten. Mientras tanto, sigue buscando en otro centro. Dominga responde esas consultas al tiro — en tu sitio web, WhatsApp o Instagram — y agenda directo en tu calendario.',
    whatItSolves: [
      { t: 'Responde preguntas frecuentes', d: 'sobre tratamientos, precios y duración, con la información real de tu centro.' },
      { t: 'Agenda citas directo en tu calendario', d: 'Google Calendar o Calendly, sin dobles reservas.' },
      { t: 'Envía recordatorios automáticos', d: 'antes de la cita, para reducir las inasistencias.' },
      { t: 'Califica a quien pregunta', d: 'antes de que tengas que hablar con ella — sabés si es una consulta real o solo curiosidad.' }
    ]
  },
  'chatbot-ia-para-clinicas-dentales': {
    rubro: 'clínicas dentales',
    metaTitle: 'Chatbot IA para Clínicas Dentales en Chile | Atiéndeme la Pyme',
    metaDesc: 'Chatbot de IA que agenda horas y responde consultas fuera de horario para clínicas dentales en Chile. Recordatorios automáticos, sin dobles reservas.',
    badge: 'chatbot ia para clínicas dentales',
    h1: 'Agenda horas y responde consultas fuera de horario',
    intro: 'Un paciente que necesita una hora de urgencia o pregunta por el precio de un tratamiento no siempre escribe en horario de atención. Si nadie contesta a tiempo, busca otra clínica. Dominga responde en tu sitio web, WhatsApp o Instagram, agenda directo en tu calendario y manda recordatorio antes de la hora.',
    whatItSolves: [
      { t: 'Agenda citas directo en tu calendario', d: 'Google Calendar o Calendly, sin dobles reservas.' },
      { t: 'Envía recordatorios automáticos', d: 'un día antes de la cita — menos inasistencias sin que nadie tenga que llamar a confirmar.' },
      { t: 'Responde preguntas frecuentes', d: 'sobre tratamientos, precios y horarios, con la información real de tu clínica.' },
      { t: 'Califica al paciente', d: 'antes de que hables con él — nombre, motivo de consulta, urgencia.' }
    ]
  },
  'chatbot-ia-para-veterinarias': {
    rubro: 'veterinarias',
    metaTitle: 'Chatbot IA para Veterinarias en Chile | Atiéndeme la Pyme',
    metaDesc: 'Chatbot de IA que responde consultas y agenda horas fuera del horario de atención para veterinarias en Chile. WhatsApp, Instagram y web.',
    badge: 'chatbot ia para veterinarias',
    h1: 'Atiende consultas fuera de tu horario de atención',
    intro: 'Los dueños de mascotas escriben a cualquier hora — de noche, un feriado, mientras están preocupados por su mascota. Si nadie responde a tiempo, agendan en otra veterinaria o van directo a una urgencia. Dominga responde en tu sitio web, WhatsApp o Instagram, y agenda controles y vacunas directo en tu calendario.',
    whatItSolves: [
      { t: 'Agenda controles, vacunas y horas', d: 'directo en Google Calendar o Calendly, sin dobles reservas.' },
      { t: 'Responde preguntas frecuentes', d: 'sobre precios y servicios, con la información real de tu veterinaria.' },
      { t: 'Envía recordatorios automáticos', d: 'antes de la hora agendada.' },
      { t: 'Califica la consulta', d: 'antes de que hables con el dueño — motivo, urgencia, mascota.' }
    ]
  }
};

function renderVerticalPage(v) {
  const items = v.whatItSolves.map((item) => `<li><b>${item.t}</b> — ${item.d}</li>`).join('');
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${v.metaTitle}</title><meta name="description" content="${v.metaDesc}"><meta name="robots" content="index, follow"><meta name="theme-color" content="#0A0A0A"><link rel="canonical" href="https://atiendemelapyme.cl/${v.slug}"><meta property="og:type" content="website"><meta property="og:site_name" content="Atiéndeme la Pyme"><meta property="og:title" content="${v.metaTitle}"><meta property="og:description" content="${v.metaDesc}"><meta property="og:url" content="https://atiendemelapyme.cl/${v.slug}"><meta property="og:locale" content="es_CL"><link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2064%2064%22%3E%3Crect%20width%3D%2264%22%20height%3D%2264%22%20fill%3D%22%230A0A0A%22%2F%3E%3Ctext%20x%3D%2210%22%20y%3D%2248%22%20font-family%3D%22'Space%20Grotesk'%2C'Arial%20Black'%2Csans-serif%22%20font-weight%3D%22700%22%20font-size%3D%2242%22%20fill%3D%22%23EDEDE8%22%3Ea%3C%2Ftext%3E%3Crect%20x%3D%2240%22%20y%3D%2216%22%20width%3D%2213%22%20height%3D%2234%22%20fill%3D%22%23E8A33D%22%2F%3E%3C%2Fsvg%3E"><style>${SHARED_HEAD_STYLE}</style></head><body>
<div class="grid-bg"></div>
${SHARED_HEADER_NAV}
<main class="wrap">
  <section class="hero reveal">
    <span class="sec-num">01</span>
    <span class="sign-badge"><span class="dot"></span>${v.badge}</span>
    <h1>${v.h1}</h1>
    <p class="sub">${v.intro}</p>
    <div class="btn-row">
      <a href="/#contacto" class="btn-primary">Agendar demo gratuita</a>
      <a href="/#precios" class="btn-outline">Ver planes y precios</a>
    </div>
  </section>
  <section class="reveal">
    <span class="sec-num">02</span>
    <div class="sec-head">
      <span class="label"><b>./</b>qué resuelve</span>
      <h2>Para ${v.rubro}</h2>
    </div>
    <div class="content-body">
      <ul>${items}</ul>
    </div>
  </section>
  <section class="reveal">
    <span class="sec-num">03</span>
    <div class="sec-head">
      <span class="label"><b>./</b>cómo funciona</span>
      <h2>Entrenado con la información de tu negocio</h2>
    </div>
    <div class="content-body">
      <p>Entrenamos a Dominga con la información real de tu negocio — servicios, precios, horarios — y responde en tu sitio web, WhatsApp e Instagram. Sin conocimientos técnicos de tu parte: nosotros hacemos la configuración.</p>
    </div>
  </section>
  ${SHARED_FOOTER}
</main>
<script>${SHARED_SCRIPT}</script>
</body></html>`;
}

export function getVerticalPage(slug) {
  const v = VERTICALS[slug];
  if (!v) return null;
  return renderVerticalPage({ ...v, slug });
}

export function getVerticalSlugs() {
  return Object.keys(VERTICALS);
}
