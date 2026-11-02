// src/lib/consent.js
// Banner de cookies de la landing y las páginas por rubro. Google Analytics y
// Microsoft Clarity (crea cookies y graba la navegación) solo se cargan si la
// persona acepta. Sin decisión o con rechazo no sale ninguna petición a ellos:
// los eventos de gaTrack se quedan en dataLayer y se pierden al cerrar la página.

export const CONSENT_SNIPPET = `<style>
#cookie-banner{position:fixed;left:24px;bottom:24px;z-index:45;width:min(440px,calc(100vw - 48px));padding:20px;background:var(--panel);border:2px solid var(--line-hard);box-shadow:6px 6px 0 var(--accent);font-size:12px;line-height:1.7;color:var(--muted);}
#cookie-banner[hidden]{display:none;}
#cookie-banner p{margin:0 0 14px;}
#cookie-banner a{color:var(--text);text-decoration:underline;}
#cookie-banner .cookie-actions{display:flex;gap:10px;}
#cookie-banner button{flex:1;min-height:44px;padding:10px 14px;background:var(--bg);color:var(--text);border:2px solid var(--line-hard);font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;}
#cookie-banner button:hover{background:var(--text);color:var(--ink);}
@media (max-width:768px){#cookie-banner{left:16px;bottom:84px;width:calc(100vw - 32px);}}
</style>
<div id="cookie-banner" role="region" aria-label="Preferencias de cookies" hidden>
  <p>Usamos Google Analytics y Microsoft Clarity, que incluye grabaciones de la navegación, para entender cómo se usa este sitio. Solo se activan si aceptas. <a href="/privacidad">Política de privacidad</a>.</p>
  <div class="cookie-actions">
    <button type="button" id="cookie-accept">Aceptar</button>
    <button type="button" id="cookie-reject">Rechazar</button>
  </div>
</div>
<script>
(function(){
  var KEY = 'atp_analytics_consent';
  var banner = document.getElementById('cookie-banner');
  function read(){ try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function save(v){ try { localStorage.setItem(KEY, v); } catch (e) {} }
  var loaded = false;
  var triggers = ['scroll', 'pointerdown', 'keydown', 'touchstart'];
  function loadAnalytics(){
    if (loaded) return;
    loaded = true;
    triggers.forEach(function(t){ window.removeEventListener(t, loadAnalytics); });
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=G-V709QK49JE';
    document.head.appendChild(s);
    // Microsoft Clarity (mapas de calor y grabaciones).
    window.clarity = window.clarity || function(){ (window.clarity.q = window.clarity.q || []).push(arguments); };
    var c = document.createElement('script');
    c.async = true;
    c.src = 'https://www.clarity.ms/tag/yu5gw10tb4';
    document.head.appendChild(c);
  }
  function clearCookies(){
    document.cookie.split(';').forEach(function(c){
      var name = c.split('=')[0].trim();
      if (!/^(_ga|_gid|_cl)/.test(name)) return;
      [location.hostname, '.' + location.hostname].forEach(function(d){
        document.cookie = name + '=; Max-Age=0; path=/; domain=' + d;
      });
      document.cookie = name + '=; Max-Age=0; path=/';
    });
  }
  var choice = read();
  if (choice === 'granted') {
    // Quien ya aceptó mantiene la carga diferida: gtag.js pesa ~170 KB y bloquea
    // el hilo principal ~300 ms en mobile.
    triggers.forEach(function(t){ window.addEventListener(t, loadAnalytics, { passive: true }); });
    window.addEventListener('load', function(){ setTimeout(loadAnalytics, 6000); });
  } else if (choice !== 'denied') {
    banner.hidden = false;
  }
  document.addEventListener('click', function(e){
    if (e.target.closest('#cookie-accept')) { save('granted'); banner.hidden = true; loadAnalytics(); }
    else if (e.target.closest('#cookie-reject')) {
      var had = read() === 'granted' || loaded;
      save('denied'); banner.hidden = true; clearCookies();
      // Los scripts ya cargados no se pueden descargar: recargar los saca de la página.
      if (had) location.reload();
    }
    else if (e.target.closest('.cookie-settings')) { e.preventDefault(); banner.hidden = false; }
  });
})();
</script>`;
