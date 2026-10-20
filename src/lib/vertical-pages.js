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
@media (max-width:480px){html{scroll-padding-top:64px;}.nav-logo{padding:14px 14px;font-size:11px;}.nav-toggle{padding:0 18px;font-size:11px;}.hero{padding:104px 16px 48px;}.hero .sub{font-size:13px;}.btn-row{flex-direction:column;gap:14px;}.btn-primary,.btn-outline{width:100%;text-align:center;}.menu-panel{width:min(100vw - 16px,320px);padding:88px 20px 20px;}.menu-list a{font-size:1.3rem;}}
.crumbs{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted2);margin:0 0 24px;}
.crumbs a{color:var(--muted);}
.crumbs a:hover{color:var(--accent);}
.content-body h3{font-family:'Space Grotesk',sans-serif;font-size:18px;margin:28px 0 8px;color:var(--text);}
.chat-demo{border:1px solid var(--line);background:var(--panel);padding:20px;max-width:560px;display:flex;flex-direction:column;gap:10px;margin:0 0 10px;}
.chat-demo .msg{max-width:88%;padding:10px 14px;font-size:13px;line-height:1.6;border:1px solid var(--line);color:var(--text);}
.chat-demo .msg.cli{align-self:flex-start;background:var(--bg);}
.chat-demo .msg.bot{align-self:flex-end;border-color:var(--accent);background:var(--bg);}
.chat-demo .who{display:block;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted2);margin-bottom:4px;}
.demo-note{font-size:11px;color:var(--muted2);letter-spacing:.04em;margin:0;}
.steps{margin:0;padding:0;list-style:none;counter-reset:st;}
.steps li{counter-increment:st;display:flex;gap:16px;}
.steps li::before{content:'0' counter(st);color:var(--accent);font-size:12px;flex:0 0 auto;padding-top:2px;}
.plans{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));border:1px solid var(--line);margin:0 0 16px;}
.plan{padding:20px;border-right:1px solid var(--line);border-bottom:1px solid var(--line);}
.plan h3{margin:0 0 6px;font-size:15px;}
.plan .price{color:var(--accent);font-size:13px;margin:0 0 8px;}
.plan p{font-size:13px;margin:0;}
.faq details{border-top:1px solid var(--line);padding:16px 0;}
.faq details:last-child{border-bottom:1px solid var(--line);}
.faq summary{cursor:pointer;list-style:none;color:var(--text);font-weight:700;font-size:14px;display:flex;justify-content:space-between;gap:16px;}
.faq summary::-webkit-details-marker{display:none;}
.faq summary::after{content:'+';color:var(--accent);}
.faq details[open] summary::after{content:'−';}
.faq details p{margin:12px 0 0;}
.related ul{display:flex;flex-wrap:wrap;gap:10px;}
.related li{border:none !important;padding:0;}
.related a{display:inline-block;border:1px solid var(--line);padding:10px 14px;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);}
.related a:hover{border-color:var(--accent);color:var(--accent);}
.cta-final{padding:64px 40px;}
.cta-final h2{margin:0;font-family:'Space Grotesk',sans-serif;font-size:clamp(24px,3.2vw,36px);letter-spacing:-0.02em;line-height:1.1;max-width:720px;}
.cta-final p{color:var(--muted);max-width:620px;margin:16px 0 0;}
@media (max-width:768px){.cta-final{padding:48px 20px;}}`;

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
    <span class="cell"><span class="ok-dot"></span>SYS.OK — © 2026 ATIÉNDEME LA PYME · HIGH LIFE SPA · RUT 77.794.178-K</span>
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
// gtag.js pesa ~170 KB y bloquea el hilo principal ~300 ms en mobile: se carga
// recién con la primera interacción (scroll, toque, tecla) o a los 6 s de la
// carga. Los eventos anteriores quedan en dataLayer y se envían al cargar.
(function(){
  var loaded = false;
  var triggers = ['scroll', 'pointerdown', 'keydown', 'touchstart'];
  function loadGA(){
    if (loaded) return;
    loaded = true;
    triggers.forEach(function(t){ window.removeEventListener(t, loadGA); });
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=G-V709QK49JE';
    document.head.appendChild(s);
    // Microsoft Clarity (mapas de calor y grabaciones), con la misma carga diferida.
    window.clarity = window.clarity || function(){ (window.clarity.q = window.clarity.q || []).push(arguments); };
    var c = document.createElement('script');
    c.async = true;
    c.src = 'https://www.clarity.ms/tag/yu5gw10tb4';
    document.head.appendChild(c);
  }
  triggers.forEach(function(t){ window.addEventListener(t, loadGA, { passive: true }); });
  window.addEventListener('load', function(){ setTimeout(loadGA, 6000); });
})();
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

// Precios: los mismos de la landing (index.js) y del prompt de Dominga
// (PRICING_SUMMARY en dominga-prompt.js). test/vertical-pages.test.js revisa
// que coincidan.
const PLANS = [
  { name: 'Básico', once: '$149.990', monthly: '$49.990', price: 149990, what: 'Chatbot de IA en tu sitio web, con derivación a una persona y panel de control. Listo en 1 semana.' },
  { name: 'Recomendado', once: '$249.990', monthly: '$99.990', price: 249990, what: 'Todo lo del Básico, más WhatsApp, Instagram y agenda automática con Google Calendar. Listo en 2 semanas.' },
  { name: 'Experto', once: '$449.990', monthly: '$179.990', price: 449990, what: 'Todo lo del Recomendado, más llamadas con voicebot (se activa al contratarlo). Listo en 3 semanas.' }
];

// Preguntas frecuentes que aplican a todos los rubros (van después de las propias).
const SHARED_FAQS = [
  { q: '¿Cuánto cuesta?', a: `Hay tres planes. El Básico, para el chat de tu sitio web, cuesta ${PLANS[0].once} de pago único más ${PLANS[0].monthly} al mes. El Recomendado suma WhatsApp, Instagram y agenda automática por ${PLANS[1].once} más ${PLANS[1].monthly} al mes. El Experto agrega llamadas por ${PLANS[2].once} más ${PLANS[2].monthly} al mes. Sin contratos largos: cancelas cuando quieras.` },
  { q: '¿Cuánto demora tenerlo funcionando?', a: 'Entre 1 y 3 semanas según el plan. Tú nos entregas la información de tu negocio y nosotros hacemos toda la configuración: no necesitas conocimientos técnicos.' },
  { q: '¿Mis clientes saben que hablan con una inteligencia artificial?', a: 'Sí. El asistente siempre se presenta como asistente de IA. Tú ves cada conversación en el panel, y en el chat de tu sitio web puedes tomarla en vivo cuando quieras.' }
];

const VERTICALS = {
  'chatbot-ia-para-centros-esteticos': {
    rubro: 'centros estéticos',
    singular: 'tu centro estético',
    metaTitle: 'Chatbot con IA para Centros Estéticos en Chile | Atiéndeme la Pyme',
    metaDesc: 'Asistente de IA que responde consultas y agenda tratamientos por WhatsApp, Instagram y tu web, también de noche y el fin de semana. Para centros estéticos en Chile.',
    h1: 'Chatbot con IA para centros estéticos',
    sub: 'Responde consultas y agenda tratamientos de noche y el fin de semana, en WhatsApp, Instagram y tu sitio web.',
    intro: [
      'Muchas clientas escriben cuando ven una publicación: un domingo en la noche, después del trabajo o en un feriado. Preguntan cuánto cuesta una limpieza facial, cuántas sesiones necesita un tratamiento o si hay hora el sábado. Si la respuesta llega al día siguiente, muchas ya reservaron en otro centro.',
      'Dominga, la asistente de IA de Atiéndeme la Pyme, responde esas consultas en el momento con la información real de tu centro (tratamientos, precios, duración y horarios) y deja la hora agendada en tu calendario. Tú revisas todo desde un panel.'
    ],
    example: [
      ['cli', 'Hola! Vi en Instagram la limpieza facial profunda, ¿cuánto sale y tienen hora este sábado?'],
      ['bot', 'Hola, soy la asistente de IA del centro. La limpieza facial profunda cuesta $35.000 y dura 60 minutos. El sábado hay hora a las 10:00 o a las 12:30, ¿cuál te acomoda?'],
      ['cli', 'La de las 10, porfa'],
      ['bot', 'Listo, quedaste agendada el sábado a las 10:00. Te llegará un recordatorio el día antes.']
    ],
    solves: [
      { t: 'Responde consultas sobre tratamientos', d: 'precios, duración, número de sesiones y cuidados previos, con la información que tú le entregas.' },
      { t: 'Agenda en tu calendario', d: 'directo en Google Calendar, sin dobles reservas.' },
      { t: 'Envía recordatorios automáticos', d: 'el día antes de la hora, para que tus clientas no se olviden.' },
      { t: 'Ordena a quién responder primero', d: 'sabes qué tratamiento le interesa a cada persona y cómo contactarla.' },
      { t: 'Te avisa cuando hace falta una persona', d: 'si alguien quiere hablar con tu equipo o pregunta algo que no está en la información.' }
    ],
    faqs: [
      { q: '¿Puede responder sobre contraindicaciones o resultados de un tratamiento?', a: 'Responde solo con la información que tú le entregas. Si alguien pregunta algo que requiere una evaluación profesional, le indica que lo verá una especialista y deja la consulta anotada para que la respondas tú.' },
      { q: '¿Sirve si mis clientas me escriben por Instagram?', a: 'Sí. Responde mensajes directos de Instagram, además de WhatsApp, Facebook y el chat de tu sitio web, según el plan que elijas.' },
      { q: '¿Puede ofrecer promociones o packs?', a: 'Sí. Las incluimos en la información del asistente y las menciona cuando corresponde. Cuando cambian, se actualizan.' },
      { q: '¿Funciona con mi agenda actual?', a: 'La agenda automática funciona con Google Calendar, y AgendaPro se integra a pedido. Si usas otro sistema, lo revisamos contigo en la demo.' }
    ]
  },
  'chatbot-ia-para-clinicas-dentales': {
    rubro: 'clínicas dentales',
    singular: 'tu clínica dental',
    metaTitle: 'Chatbot con IA para Clínicas Dentales en Chile | Atiéndeme la Pyme',
    metaDesc: 'Asistente de IA que agenda horas, responde dudas de pacientes y envía recordatorios por WhatsApp, Instagram y tu web, también fuera de horario. Para clínicas dentales.',
    h1: 'Chatbot con IA para clínicas dentales',
    sub: 'Agenda horas, responde dudas de pacientes y envía recordatorios, también fuera del horario de atención.',
    intro: [
      'Un paciente con dolor de muela, alguien que quiere cotizar una ortodoncia o una mamá que busca hora para su hijo: muchas de esas consultas llegan de noche o el fin de semana, cuando la recepción está cerrada. Si nadie responde, el paciente sigue buscando.',
      'Dominga, la asistente de IA de Atiéndeme la Pyme, responde en el momento con la información real de tu clínica (tratamientos, valores, convenios y horarios), agenda la hora en tu calendario y envía un recordatorio antes de la cita.'
    ],
    example: [
      ['cli', 'Hola, ¿tienen hora para limpieza esta semana? ¿Cuánto cuesta?'],
      ['bot', 'Hola, soy la asistente de IA de la clínica. La limpieza dental cuesta $30.000. Hay hora el jueves a las 11:00 o el viernes a las 16:30, ¿cuál prefieres?'],
      ['cli', 'El viernes a las 16:30'],
      ['bot', 'Listo, tu hora quedó agendada para el viernes a las 16:30. Te llegará un recordatorio el día antes.']
    ],
    solves: [
      { t: 'Agenda horas en tu calendario', d: 'directo en Google Calendar, sin dobles reservas.' },
      { t: 'Envía recordatorios automáticos', d: 'un día antes de la cita, sin que nadie tenga que llamar a confirmar.' },
      { t: 'Responde preguntas frecuentes', d: 'tratamientos, valores, convenios y horarios, con la información real de tu clínica.' },
      { t: 'Orienta en caso de urgencia', d: 'entrega las indicaciones que tú definas, como el teléfono o el horario de urgencias.' },
      { t: 'Te deja el caso ordenado', d: 'nombre, contacto, motivo de consulta y si es primera vez o control.' }
    ],
    faqs: [
      { q: '¿Qué hace si un paciente escribe por una urgencia?', a: 'Le entrega las indicaciones que tú definas, como el teléfono o el horario de urgencias, y deja la consulta anotada para tu equipo. No da indicaciones clínicas.' },
      { q: '¿Puede informar convenios, Fonasa o isapres?', a: 'Sí, si incluyes esa información al configurarlo. Responde solo con lo que le entregas, para no dar datos equivocados.' },
      { q: '¿Se integra con mi software dental?', a: 'La agenda automática funciona con Google Calendar, y AgendaPro se integra a pedido. Si tu clínica usa otro software, lo revisamos contigo en la demo.' },
      { q: '¿Qué datos del paciente pide?', a: 'Solo lo necesario para agendar: nombre, contacto y motivo de consulta. No pide antecedentes clínicos.' }
    ]
  },
  'chatbot-ia-para-veterinarias': {
    rubro: 'veterinarias',
    singular: 'tu veterinaria',
    metaTitle: 'Chatbot con IA para Veterinarias en Chile | Atiéndeme la Pyme',
    metaDesc: 'Asistente de IA que agenda controles, vacunas y peluquería canina, y responde a los tutores por WhatsApp, Instagram y tu web a cualquier hora. Para veterinarias en Chile.',
    h1: 'Chatbot con IA para veterinarias',
    sub: 'Agenda controles, vacunas y peluquería, y responde las consultas de los tutores a cualquier hora.',
    intro: [
      'Los tutores de mascotas escriben a cualquier hora: para agendar una vacuna, preguntar por un control o porque su perro amaneció decaído. Si nadie contesta a tiempo, agendan en otra veterinaria o van directo a una urgencia.',
      'Dominga, la asistente de IA de Atiéndeme la Pyme, responde en el momento con la información real de tu veterinaria (servicios, valores, horarios y urgencias) y agenda la hora en tu calendario.'
    ],
    example: [
      ['cli', 'Hola, ¿cuándo tienen hora para vacunar a mi gata? Tiene 3 meses'],
      ['bot', 'Hola, soy la asistente de IA de la veterinaria. Para la vacuna de una gatita de 3 meses hay hora mañana a las 10:00 o el sábado a las 11:30, ¿cuál te acomoda? ¿Cómo se llama?'],
      ['cli', 'Mañana a las 10, se llama Luna'],
      ['bot', 'Listo, Luna quedó agendada para mañana a las 10:00. Te llegará un recordatorio el día antes.']
    ],
    solves: [
      { t: 'Agenda controles, vacunas y peluquería', d: 'directo en Google Calendar, sin dobles reservas.' },
      { t: 'Responde preguntas frecuentes', d: 'valores, servicios, horarios y medios de pago, con la información real de tu veterinaria.' },
      { t: 'Orienta en caso de urgencia', d: 'entrega las indicaciones que tú definas, como la dirección o el teléfono de urgencias.' },
      { t: 'Envía recordatorios automáticos', d: 'el día antes de la hora agendada.' },
      { t: 'Te deja el caso ordenado', d: 'especie, motivo de consulta y datos de contacto del tutor.' }
    ],
    faqs: [
      { q: '¿Qué hace si un tutor escribe por una urgencia?', a: 'Le entrega las indicaciones que tú definas, como la dirección o el teléfono de urgencias, y deja la consulta anotada para tu equipo.' },
      { q: '¿Puede dar indicaciones médicas sobre una mascota?', a: 'No. No diagnostica ni recomienda tratamientos: informa sobre los servicios de tu veterinaria y, si la consulta requiere a un veterinario, la deja anotada para tu equipo.' },
      { q: '¿Sirve para peluquería canina y venta de alimentos?', a: 'Puede agendar horas de peluquería y responder consultas sobre alimentos o productos con la información que le entregues. No procesa pagos ni pedidos en línea.' },
      { q: '¿Funciona con mi agenda actual?', a: 'La agenda automática funciona con Google Calendar, y AgendaPro se integra a pedido. Si usas otro sistema, lo revisamos contigo en la demo.' }
    ]
  },
  'chatbot-ia-para-centros-medicos': {
    rubro: 'centros médicos',
    singular: 'tu centro médico',
    metaTitle: 'Chatbot con IA para Centros Médicos en Chile | Atiéndeme la Pyme',
    metaDesc: 'Asistente de IA que responde consultas de pacientes y agenda horas con tus profesionales por WhatsApp, Instagram y tu web, también fuera de horario. Para centros médicos en Chile.',
    h1: 'Chatbot con IA para centros médicos',
    sub: 'Responde las consultas de tus pacientes y agenda horas con tus profesionales, también fuera de horario.',
    intro: [
      'En un centro médico la recepción vive con el teléfono sonando, pacientes en sala y mensajes acumulados. Las consultas que llegan de noche o el fin de semana (qué especialistas atienden, si hay hora esta semana, cuánto cuesta una consulta) quedan para el día siguiente, y algunos pacientes no esperan.',
      'Dominga, la asistente de IA de Atiéndeme la Pyme, responde en el momento con la información real de tu centro (especialidades, valores, convenios, preparación de exámenes y horarios) y agenda la hora con el profesional que corresponde.'
    ],
    example: [
      ['cli', 'Hola, ¿tienen hora con traumatólogo esta semana? Sería particular'],
      ['bot', 'Hola, soy la asistente de IA del centro. La consulta particular con traumatología cuesta $40.000. Hay hora el jueves a las 11:00 con el Dr. Rojas o el viernes a las 16:30 con la Dra. Muñoz, ¿cuál prefieres?'],
      ['cli', 'El jueves con el Dr. Rojas'],
      ['bot', 'Listo, tu hora quedó agendada para el jueves a las 11:00 con el Dr. Rojas. Te llegará un recordatorio el día antes.']
    ],
    solves: [
      { t: 'Agenda por especialidad o profesional', d: 'según cómo organizas hoy la agenda de tu centro, sin dobles reservas.' },
      { t: 'Responde preguntas frecuentes', d: 'especialidades, valores, convenios, bonos e indicaciones de preparación para exámenes que tú definas.' },
      { t: 'Envía recordatorios automáticos', d: 'el día antes de la hora, para reducir las horas perdidas.' },
      { t: 'Orienta en caso de urgencia', d: 'indica acudir a un servicio de urgencia o llamar al 131 (SAMU), según lo que definas.' },
      { t: 'Alivia a tu recepción', d: 'resuelve lo repetitivo y deja anotado lo que necesita a una persona.' }
    ],
    faqs: [
      { q: '¿Da indicaciones médicas o diagnósticos?', a: 'No. No da indicaciones médicas ni diagnósticos: informa sobre los servicios de tu centro y agenda horas. Si alguien describe una urgencia, le indica acudir a un servicio de urgencia o llamar al 131 (SAMU), según lo que definas, y deja la consulta anotada para tu equipo.' },
      { q: '¿Puede informar bonos Fonasa, isapres y convenios?', a: 'Sí, con la información que le entregues al configurarlo. Responde solo con esos datos, para no confundir a los pacientes.' },
      { q: '¿Sirve si tengo varios profesionales y especialidades?', a: 'Sí. Lo configuramos según cómo organizas hoy la agenda de tus profesionales. La agenda automática funciona con Google Calendar, y AgendaPro se integra a pedido; otros sistemas los revisamos en la demo.' },
      { q: '¿Qué pasa con los datos de los pacientes?', a: 'Solo pide lo necesario para agendar y no pide antecedentes clínicos. Los datos se tratan según nuestra política de privacidad.' }
    ]
  },
  'chatbot-ia-para-peluquerias-y-barberias': {
    rubro: 'peluquerías y barberías',
    singular: 'tu peluquería o barbería',
    metaTitle: 'Chatbot con IA para Peluquerías y Barberías | Atiéndeme la Pyme',
    metaDesc: 'Asistente de IA que agenda horas por WhatsApp e Instagram mientras atiendes o de noche. Responde precios y servicios con la información de tu peluquería o barbería.',
    h1: 'Chatbot con IA para peluquerías y barberías',
    sub: 'Tus clientes reservan hora por WhatsApp o Instagram aunque estés atendiendo o sea de noche.',
    intro: [
      'Mientras haces un corte no puedes tomar el celular, y en la noche es cuando más llegan mensajes: “¿tienes hora mañana?”, “¿cuánto sale el corte con barba?”. Si no respondes rápido, ese cliente reserva en otro lado.',
      'Dominga, la asistente de IA de Atiéndeme la Pyme, responde en el momento con tus servicios, precios y horarios, y deja la hora agendada en tu calendario. Tú sigues atendiendo tranquilo.'
    ],
    example: [
      ['cli', 'Hola, ¿tienes hora mañana para corte y barba?'],
      ['bot', 'Hola, soy la asistente de IA de la barbería. El corte con barba cuesta $15.000. Mañana hay hora a las 12:00 o a las 18:30, ¿cuál te acomoda?'],
      ['cli', 'A las 18:30'],
      ['bot', 'Listo, quedaste agendado para mañana a las 18:30. Te llegará un recordatorio el día antes.']
    ],
    solves: [
      { t: 'Agenda horas por WhatsApp e Instagram', d: 'directo en Google Calendar, sin dobles reservas.' },
      { t: 'Responde precios y servicios', d: 'cortes, color, barba, tratamientos y duración, con tu información.' },
      { t: 'Agenda con el profesional que elijan', d: 'si le entregas la disponibilidad de cada uno.' },
      { t: 'Envía recordatorios automáticos', d: 'el día antes, para que no se te pierdan horas.' },
      { t: 'Te deja todo ordenado', d: 'ves en el panel quién escribió, qué pidió y qué hora tomó.' }
    ],
    faqs: [
      { q: '¿Puede agendar con un peluquero o barbero específico?', a: 'Sí, si le entregas la disponibilidad de cada uno. Lo configuramos según cómo organizas hoy tu agenda.' },
      { q: '¿Y si alguien quiere cambiar o cancelar su hora?', a: 'Toma la solicitud y la deja registrada en el panel para que confirmes el cambio.' },
      { q: '¿Sirve si trabajo solo?', a: 'Sí, y es justamente cuando más ayuda: responde mientras atiendes. Si tus clientes te escriben por WhatsApp o Instagram, el plan que incluye esos canales es el Recomendado.' },
      { q: '¿Responde mensajes de Instagram?', a: 'Sí. Responde mensajes directos de Instagram, además de WhatsApp, Facebook y el chat de tu sitio web, según el plan.' }
    ]
  },
  'chatbot-ia-para-kinesiologos': {
    rubro: 'kinesiólogos',
    singular: 'tu consulta de kinesiología',
    metaTitle: 'Chatbot con IA para Kinesiólogos en Chile | Atiéndeme la Pyme',
    metaDesc: 'Asistente de IA que agenda sesiones y responde consultas sobre valores, bonos y atención a domicilio mientras atiendes. Para kinesiólogos y centros de kinesiología en Chile.',
    h1: 'Chatbot con IA para kinesiólogos',
    sub: 'Agenda sesiones y responde consultas mientras atiendes a tus pacientes.',
    intro: [
      'Durante una sesión no puedes tomar el celular, y entre paciente y paciente apenas alcanzas a responder. Las preguntas por valores, bonos, reembolsos o atención a domicilio se acumulan, y algunos pacientes no esperan la respuesta.',
      'Dominga, la asistente de IA de Atiéndeme la Pyme, responde en el momento con la información real de tu consulta y agenda las sesiones en tu calendario, para que tú te concentres en atender.'
    ],
    example: [
      ['cli', 'Hola, me operaron la rodilla y necesito kinesiología, ¿atienden con bono Fonasa?'],
      ['bot', 'Hola, soy la asistente de IA de la consulta. Sí, atendemos con bono Fonasa; para comenzar necesitas la orden médica. Hay hora el lunes a las 9:00 o el miércoles a las 18:00, ¿cuál te acomoda?'],
      ['cli', 'El miércoles a las 18:00'],
      ['bot', 'Listo, tu primera sesión quedó agendada para el miércoles a las 18:00. Recuerda traer la orden médica. Te llegará un recordatorio el día antes.']
    ],
    solves: [
      { t: 'Agenda sesiones en tu calendario', d: 'directo en Google Calendar, sin dobles reservas.' },
      { t: 'Responde preguntas frecuentes', d: 'valores, bonos, reembolsos, documentos necesarios y atención a domicilio.' },
      { t: 'Envía recordatorios automáticos', d: 'el día antes de cada sesión, para reducir las inasistencias.' },
      { t: 'Te deja el caso ordenado', d: 'motivo de consulta, si tiene orden médica y datos de contacto.' },
      { t: 'Te avisa cuando hace falta tu criterio', d: 'deja anotadas las consultas que requieren tu evaluación.' }
    ],
    faqs: [
      { q: '¿Puede recomendar ejercicios o evaluar una lesión?', a: 'No. No entrega indicaciones clínicas: informa sobre tu servicio, agenda y deja anotadas las consultas que requieren tu evaluación.' },
      { q: '¿Puede informar sobre bonos e isapres?', a: 'Sí, con la información que le entregues al configurarlo. Responde solo con esos datos.' },
      { q: '¿Sirve si atiendo a domicilio?', a: 'Sí. Puede informar las comunas que cubres y el valor de la visita, y pedir la dirección para coordinar la hora.' },
      { q: '¿Funciona con mi agenda actual?', a: 'La agenda automática funciona con Google Calendar, y AgendaPro se integra a pedido. Si usas otro sistema, lo revisamos contigo en la demo.' }
    ]
  },
  'chatbot-ia-para-psicologos': {
    rubro: 'psicólogos',
    singular: 'tu consulta de psicología',
    metaTitle: 'Chatbot con IA para Psicólogos en Chile | Atiéndeme la Pyme',
    metaDesc: 'Asistente de IA que responde consultas sobre valores, modalidad y reembolsos, y agenda sesiones mientras atiendes. Para psicólogos y centros de psicología en Chile.',
    h1: 'Chatbot con IA para psicólogos',
    sub: 'Responde consultas sobre tus sesiones y agenda horas sin interrumpir tu trabajo con los pacientes.',
    intro: [
      'Quien busca terapia muchas veces escribe de noche, después de pensarlo bastante. Pregunta por valores, modalidad online o presencial, reembolsos o disponibilidad. Responder rápido y con calidez ayuda a que esa persona dé el paso, pero en sesión no puedes contestar.',
      'Dominga, la asistente de IA de Atiéndeme la Pyme, responde en el momento con la información de tu consulta y agenda la sesión en tu calendario. No reemplaza tu atención: se encarga de lo administrativo.'
    ],
    example: [
      ['cli', 'Hola, quería saber si atiendes online y cuánto cuesta la sesión'],
      ['bot', 'Hola, soy la asistente de IA de la consulta. Sí, hay sesiones online y presenciales, de 50 minutos, a $35.000. ¿Te gustaría agendar una primera sesión?'],
      ['cli', 'Sí, ¿qué días tienes?'],
      ['bot', 'Hay disponibilidad el martes a las 19:00 o el jueves a las 18:00, ¿cuál te acomoda?']
    ],
    solves: [
      { t: 'Responde lo administrativo', d: 'valores, modalidad online o presencial, duración, reembolsos y boletas.' },
      { t: 'Agenda la primera sesión y las siguientes', d: 'directo en Google Calendar, sin dobles reservas.' },
      { t: 'Envía recordatorios automáticos', d: 'el día antes de cada sesión.' },
      { t: 'Cuida la privacidad', d: 'pide solo lo necesario para agendar y no pregunta por el motivo de consulta.' },
      { t: 'Deriva lo que necesita tu criterio', d: 'deja anotadas las consultas que debes responder tú.' }
    ],
    faqs: [
      { q: '¿Qué pasa si alguien escribe en crisis?', a: 'El asistente no da apoyo psicológico ni reemplaza tu atención. Lo configuramos para que, ante un mensaje de crisis, entregue de inmediato la información de ayuda que tú definas, como la línea *4141 de prevención del suicidio del Ministerio de Salud, y deje la conversación anotada para ti.' },
      { q: '¿Se mantiene la confidencialidad?', a: 'Pide solo lo necesario para agendar (nombre y contacto) y no pregunta por el motivo de consulta. Tú ves las conversaciones en tu panel, y los datos se tratan según nuestra política de privacidad.' },
      { q: '¿Sirve para sesiones online?', a: 'Sí. Informa si la sesión es online o presencial y agenda según tu disponibilidad.' },
      { q: '¿Puedo ajustar cómo habla?', a: 'Sí. Lo configuramos con un tono cálido, sobrio y respetuoso, acorde a tu forma de atender.' }
    ]
  },
  'chatbot-ia-para-spa-y-masajes': {
    rubro: 'spa y centros de masajes',
    singular: 'tu spa o centro de masajes',
    metaTitle: 'Chatbot con IA para Spa y Centros de Masajes | Atiéndeme la Pyme',
    metaDesc: 'Asistente de IA que agenda masajes y tratamientos e informa sobre gift cards por WhatsApp, Instagram y tu web, también de noche y el fin de semana.',
    h1: 'Chatbot con IA para spa y centros de masajes',
    sub: 'Responde consultas, informa sobre gift cards y agenda masajes y tratamientos a cualquier hora.',
    intro: [
      'Las consultas por masajes llegan cuando la gente tiene tiempo para pensar en descansar: de noche y los fines de semana. También preguntan por gift cards para regalar, muchas veces a última hora.',
      'Dominga, la asistente de IA de Atiéndeme la Pyme, responde en el momento con tus servicios, precios y horarios, explica cómo comprar una gift card y deja la hora agendada en tu calendario.'
    ],
    example: [
      ['cli', 'Hola, ¿tienen masaje descontracturante para el sábado? ¿Y venden gift cards?'],
      ['bot', 'Hola, soy la asistente de IA del spa. El masaje descontracturante dura 60 minutos y cuesta $32.000; el sábado hay hora a las 11:00 o a las 16:00. Las gift cards se pagan por transferencia y te las enviamos por correo. ¿Te agendo una de esas horas?'],
      ['cli', 'Sí, a las 16:00'],
      ['bot', 'Listo, quedaste agendada el sábado a las 16:00. Te llegará un recordatorio el día antes.']
    ],
    solves: [
      { t: 'Responde sobre masajes y tratamientos', d: 'duración, precios, beneficios y recomendaciones previas que tú definas.' },
      { t: 'Agenda en tu calendario', d: 'directo en Google Calendar, sin dobles reservas.' },
      { t: 'Informa sobre gift cards y packs', d: 'cómo comprarlas y qué incluyen, con tu información.' },
      { t: 'Envía recordatorios automáticos', d: 'el día antes de la hora agendada.' },
      { t: 'Te avisa cuando hace falta una persona', d: 'si alguien quiere hablar con tu equipo o pregunta algo que no está en la información.' }
    ],
    faqs: [
      { q: '¿Puede vender gift cards?', a: 'Puede explicar cómo comprarlas y qué incluyen, con la información que le entregues. No procesa pagos en línea: el pago se hace por el medio que tú uses hoy.' },
      { q: '¿Sirve para masajes en pareja o paquetes?', a: 'Sí. Informa los paquetes que ofreces y agenda según tu disponibilidad.' },
      { q: '¿Puede ofrecer promociones?', a: 'Sí. Las incluimos en la información del asistente y las menciona cuando corresponde.' },
      { q: '¿Funciona con mi agenda actual?', a: 'La agenda automática funciona con Google Calendar, y AgendaPro se integra a pedido. Si usas otro sistema, lo revisamos contigo en la demo.' }
    ]
  }
};

export const VERTICAL_SLUGS = Object.keys(VERTICALS);

const SITE = 'https://atiendemelapyme.cl';

// Nombre corto para los enlaces entre rubros (“Veterinarias”).
function shortName(v) {
  return v.rubro.charAt(0).toUpperCase() + v.rubro.slice(1);
}

// JSON-LD dentro de <script>: escapar “<” evita que un texto cierre la etiqueta.
function jsonLd(data) {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

function structuredData(v, faqs) {
  const url = `${SITE}/${v.slug}`;
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: v.h1,
      serviceType: 'Asistente de IA para atención de clientes y agendamiento',
      description: v.metaDesc,
      url,
      areaServed: { '@type': 'Country', name: 'Chile' },
      audience: { '@type': 'BusinessAudience', name: v.rubro },
      provider: { '@type': 'Organization', name: 'Atiéndeme la Pyme', legalName: 'HIGH LIFE SpA', url: SITE },
      offers: PLANS.map((p) => ({
        '@type': 'Offer',
        name: `Plan ${p.name}`,
        price: String(p.price),
        priceCurrency: 'CLP',
        description: `${p.once} de pago único más ${p.monthly} al mes. ${p.what}`
      }))
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } }))
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Inicio', item: `${SITE}/` },
        { '@type': 'ListItem', position: 2, name: v.h1, item: url }
      ]
    }
  ];
}

function renderVerticalPage(v) {
  const faqs = [...v.faqs, ...SHARED_FAQS];
  const intro = v.intro.map((p) => `<p>${p}</p>`).join('');
  const example = v.example
    .map(([who, text]) => `<div class="msg ${who}"><span class="who">${who === 'bot' ? 'Asistente de IA' : 'Cliente'}</span>${text}</div>`)
    .join('');
  const solves = v.solves.map((item) => `<li><b>${item.t}:</b> ${item.d}</li>`).join('');
  const plans = PLANS.map((p) => `<div class="plan"><h3>Plan ${p.name}</h3><p class="price">${p.once} pago único + ${p.monthly}/mes</p><p>${p.what}</p></div>`).join('');
  const faqHtml = faqs.map((f) => `<details><summary>${f.q}</summary><p>${f.a}</p></details>`).join('');
  const related = VERTICAL_SLUGS.filter((slug) => slug !== v.slug)
    .map((slug) => `<li><a href="/${slug}">${shortName(VERTICALS[slug])}</a></li>`)
    .join('');
  const url = `${SITE}/${v.slug}`;
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${v.metaTitle}</title><meta name="description" content="${v.metaDesc}"><meta name="robots" content="index, follow"><meta name="theme-color" content="#0A0A0A"><link rel="canonical" href="${url}"><meta property="og:type" content="website"><meta property="og:site_name" content="Atiéndeme la Pyme"><meta property="og:title" content="${v.metaTitle}"><meta property="og:description" content="${v.metaDesc}"><meta property="og:url" content="${url}"><meta property="og:locale" content="es_CL"><meta property="og:image" content="${SITE}/og-image.png"><meta name="twitter:card" content="summary_large_image"><link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2064%2064%22%3E%3Crect%20width%3D%2264%22%20height%3D%2264%22%20fill%3D%22%230A0A0A%22%2F%3E%3Ctext%20x%3D%2210%22%20y%3D%2248%22%20font-family%3D%22'Space%20Grotesk'%2C'Arial%20Black'%2Csans-serif%22%20font-weight%3D%22700%22%20font-size%3D%2242%22%20fill%3D%22%23EDEDE8%22%3Ea%3C%2Ftext%3E%3Crect%20x%3D%2240%22%20y%3D%2216%22%20width%3D%2213%22%20height%3D%2234%22%20fill%3D%22%23E8A33D%22%2F%3E%3C%2Fsvg%3E"><script type="application/ld+json">${jsonLd(structuredData(v, faqs))}</script><style>${SHARED_HEAD_STYLE}</style></head><body>
<div class="grid-bg"></div>
${SHARED_HEADER_NAV}
<main class="wrap">
  <section class="hero reveal">
    <span class="sec-num">01</span>
    <nav class="crumbs" aria-label="Migas de pan"><a href="/">Inicio</a> / ${shortName(v)}</nav>
    <span class="sign-badge"><span class="dot"></span>asistente de IA para ${v.rubro}</span>
    <h1>${v.h1}</h1>
    <p class="sub">${v.sub}</p>
    <div class="btn-row">
      <a href="/#contacto" class="btn-primary">Agendar demo gratuita</a>
      <a href="#precios" class="btn-outline">Ver planes y precios</a>
    </div>
  </section>
  <section class="reveal">
    <span class="sec-num">02</span>
    <div class="sec-head">
      <span class="label"><b>./</b>el problema</span>
      <h2>Las consultas que llegan fuera de horario</h2>
    </div>
    <div class="content-body">${intro}</div>
  </section>
  <section class="reveal">
    <span class="sec-num">03</span>
    <div class="sec-head">
      <span class="label"><b>./</b>así se ve</span>
      <h2>Una conversación de ejemplo</h2>
    </div>
    <div class="content-body">
      <div class="chat-demo" role="img" aria-label="Ejemplo de conversación entre un cliente y el asistente de IA">${example}</div>
      <p class="demo-note">Ejemplo ilustrativo: no es un cliente real. Los precios y horarios son de muestra.</p>
    </div>
  </section>
  <section class="reveal">
    <span class="sec-num">04</span>
    <div class="sec-head">
      <span class="label"><b>./</b>qué resuelve</span>
      <h2>Qué hace por ${v.singular}</h2>
    </div>
    <div class="content-body"><ul>${solves}</ul></div>
  </section>
  <section class="reveal">
    <span class="sec-num">05</span>
    <div class="sec-head">
      <span class="label"><b>./</b>cómo funciona</span>
      <h2>Listo en 1 a 3 semanas, sin conocimientos técnicos</h2>
    </div>
    <div class="content-body">
      <ol class="steps">
        <li><p>Nos cuentas cómo funciona ${v.singular}: servicios, precios, horarios, preguntas frecuentes y el tono con que hablas a tus clientes.</p></li>
        <li><p>Configuramos el asistente con esa información y lo conectamos a tus canales: sitio web, WhatsApp, Instagram y Facebook, según el plan.</p></li>
        <li><p>El asistente responde y agenda. Tú ves cada conversación en el panel y recibes un aviso cuando alguien necesita a una persona.</p></li>
      </ol>
    </div>
  </section>
  <section class="reveal" id="precios">
    <span class="sec-num">06</span>
    <div class="sec-head">
      <span class="label"><b>./</b>planes</span>
      <h2>Planes y precios</h2>
    </div>
    <div class="content-body">
      <div class="plans">${plans}</div>
      <p>Pago único al contratar y después solo la mensualidad mientras uses el servicio. Sin contratos largos: cancelas cuando quieras. <a href="/#precios">Ver el detalle de cada plan</a>.</p>
    </div>
  </section>
  <section class="reveal faq">
    <span class="sec-num">07</span>
    <div class="sec-head">
      <span class="label"><b>./</b>preguntas frecuentes</span>
      <h2>Preguntas frecuentes de ${v.rubro}</h2>
    </div>
    <div class="content-body">${faqHtml}</div>
  </section>
  <section class="reveal cta-final">
    <h2>Mira cómo funcionaría en ${v.singular}</h2>
    <p>En una demo de 20 minutos por videollamada vemos tu caso en vivo, sin costo ni compromiso.</p>
    <div class="btn-row">
      <a href="/#contacto" class="btn-primary">Agendar demo gratuita</a>
      <a href="mailto:hola@atiendemelapyme.cl" class="btn-outline">Escribir a hola@atiendemelapyme.cl</a>
    </div>
  </section>
  <section class="reveal related">
    <div class="sec-head">
      <span class="label"><b>./</b>otros rubros</span>
      <h2>También trabajamos con</h2>
    </div>
    <div class="content-body"><ul>${related}</ul></div>
  </section>
  ${SHARED_FOOTER}
</main>
<script>${SHARED_SCRIPT}</script>
</body></html>`;
}

export function getVerticalPage(slug) {
  // hasOwn: sin esto "/constructor" o "/__proto__" encontraban propiedades
  // heredadas de Object y el Worker respondía 500 en vez de 404.
  const v = Object.hasOwn(VERTICALS, slug) ? VERTICALS[slug] : null;
  if (!v) return null;
  return renderVerticalPage({ ...v, slug });
}
