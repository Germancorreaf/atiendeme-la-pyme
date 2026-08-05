<!DOCTYPE html>
<html lang="es"><head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Chatbot con IA para Pymes en Chile | Atiéndeme la Pyme</title>
<meta name="description" content="Agentes de IA que venden, atienden por WhatsApp e Instagram y agendan citas 24/7 para pymes en Chile. Implementación en 1 a 3 semanas, sin contratos largos.">
<meta name="robots" content="index, follow">
<meta name="theme-color" content="#0A0A0A">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Atiéndeme la Pyme">
<meta property="og:title" content="Chatbot con IA para Pymes en Chile | Atiéndeme la Pyme">
<meta property="og:description" content="Agentes de IA que venden, atienden por WhatsApp e Instagram y agendan citas 24/7 para pymes en Chile. Sin contratar más gente.">
<meta property="og:locale" content="es_CL">
<meta property="og:image" content="https://atiendemelapyme.cl/og-image.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Atiéndeme la Pyme — chatbots con IA para pymes en Chile">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Chatbot con IA para Pymes en Chile | Atiéndeme la Pyme">
<meta name="twitter:description" content="Agentes de IA que venden, atienden y agendan citas 24/7 para pymes en Chile.">
<meta name="twitter:image" content="https://atiendemelapyme.cl/og-image.png">
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2064%2064%22%3E%3Crect%20width%3D%2264%22%20height%3D%2264%22%20fill%3D%22%230A0A0A%22%2F%3E%3Ctext%20x%3D%2210%22%20y%3D%2248%22%20font-family%3D%22'Space%20Grotesk'%2C'Arial%20Black'%2Csans-serif%22%20font-weight%3D%22700%22%20font-size%3D%2242%22%20fill%3D%22%23EDEDE8%22%3Ea%3C%2Ftext%3E%3Crect%20x%3D%2240%22%20y%3D%2216%22%20width%3D%2213%22%20height%3D%2234%22%20fill%3D%22%23E8A33D%22%2F%3E%3C%2Fsvg%3E">
<link rel="canonical" href="https://atiendemelapyme.cl/">
<meta property="og:url" content="https://atiendemelapyme.cl/">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="">
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700;800&family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet">

<style>





























</style>
<style>
:root{
  --bg:#0A0A0A;
  --panel:#0F0F0F;
  --line:#242424;
  --line-hard:#EDEDE8;
  --text:#EDEDE8;
  --muted:#8A8A82;
  --muted2:#5C5C55;
  --accent:#E8A33D;
  --ok:#43D17C;
  --err:#FF5F57;
  --ink:#0A0A0A;
  --ease:cubic-bezier(0.23,1,0.32,1);
}
*{box-sizing:border-box;border-radius:0 !important;}
html{scroll-behavior:smooth;scroll-padding-top:72px;scrollbar-color:var(--accent) var(--bg);}
body{margin:0;background:var(--bg);color:var(--text);font-family:'JetBrains Mono',ui-monospace,monospace;font-size:14px;line-height:1.6;-webkit-font-smoothing:antialiased;-webkit-tap-highlight-color:transparent;overflow-x:hidden;}
::selection{background:var(--accent);color:var(--ink);}
a{color:var(--text);text-decoration:none;transition:color 150ms var(--ease),background 150ms var(--ease);}
a:hover{color:var(--accent);}
button{font-family:inherit;cursor:pointer;}
:focus-visible{outline:2px solid var(--accent);outline-offset:2px;}
p{text-wrap:pretty;}
.num-tab{font-variant-numeric:tabular-nums;}
@media (prefers-reduced-motion: reduce){
  *,*::before,*::after{animation-duration:0.01ms !important;animation-iteration-count:1 !important;transition-duration:0.01ms !important;scroll-behavior:auto !important;}
}

/* ---------- paletas ---------- */
html[data-palette="matrix"]{--bg:#050805;--panel:#0A100A;--line:#1C271C;--line-hard:#D8EAD8;--text:#D8EAD8;--muted:#7FA07F;--muted2:#547054;--accent:#4AF626;--ok:#4AF626;}
html[data-palette="cyber"]{--bg:#06090D;--panel:#0A0F16;--line:#1B2632;--line-hard:#E4EEF6;--text:#E4EEF6;--muted:#7E93A6;--muted2:#526475;--accent:#38E1FF;--ok:#43D17C;}
html[data-palette="ultra"]{--bg:#0A0910;--panel:#100E18;--line:#242033;--line-hard:#EBE8F4;--text:#EBE8F4;--muted:#948FA8;--muted2:#645F78;--accent:#A78BFA;--ok:#43D17C;}
html[data-palette="paper"]{--bg:#EFEDE4;--panel:#E6E3D6;--line:#D2CFC0;--line-hard:#141414;--text:#141414;--muted:#5C584B;--muted2:#8B8778;--accent:#D14E0C;--ok:#0F8A4F;--ink:#F5F3EA;}
html[data-palette="paper"] .grid-bg{opacity:.5;}
html[data-palette="paper"] .preview-dots span{opacity:.9;}

/* ---------- selector de paleta ---------- */
.palette-bar{position:fixed;left:0;bottom:0;z-index:60;display:flex;flex-direction:row;align-items:stretch;border:2px solid var(--line-hard);border-left:none;border-bottom:none;background:var(--bg);}
.palette-bar .pb-label{font-size:9px;letter-spacing:.2em;color:var(--muted2);padding:0 10px;border-right:2px solid var(--line-hard);text-transform:uppercase;display:flex;align-items:center;}
.pal-btn{width:36px;height:36px;border:none;border-right:1px solid var(--line);background:var(--bg);display:flex;align-items:center;justify-content:center;transition:background 150ms var(--ease);}
.pal-btn:last-child{border-right:none;}
.pal-btn i{width:16px;height:16px;display:block;border:1px solid var(--line-hard);}
.pal-btn:hover{background:var(--panel);}
.pal-btn.active{background:var(--accent);}
@media (max-width:768px){.palette-bar{bottom:0;left:0;}}

/* fondo: cuadrícula de terminal */
.grid-bg{position:fixed;inset:0;z-index:0;pointer-events:none;background-image:linear-gradient(var(--line) 1px,transparent 1px),linear-gradient(90deg,var(--line) 1px,transparent 1px);background-size:64px 64px;opacity:.35;}

@keyframes blink{0%,49%{opacity:1;}50%,100%{opacity:0;}}
@keyframes flowdash{to{stroke-dashoffset:-24;}}
@keyframes nodepulse{0%,100%{opacity:.4;}50%{opacity:1;}}
@keyframes barmove{to{background-position:48px 0;}}
@keyframes revealFade{from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:translateY(0);}}
.reveal{opacity:0;}
.reveal.in{animation:revealFade .4s var(--ease) both;}

.wrap{max-width:1180px;margin:0 auto;position:relative;z-index:1;border-left:1px solid var(--line);border-right:1px solid var(--line);background:var(--bg);}
section{border-bottom:1px solid var(--line);position:relative;}
.sec-num{position:absolute;top:0;left:0;font-size:11px;color:var(--muted2);padding:10px 16px;border-right:1px solid var(--line);border-bottom:1px solid var(--line);letter-spacing:.1em;user-select:none;}

/* etiquetas */
.label{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);}
.label b{color:var(--accent);font-weight:400;}
.comment{color:var(--muted2);}
.comment::before{content:'// ';}

/* ---------- nav ---------- */
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

/* ---------- hero ---------- */
.hero{padding:150px 40px 90px;border-bottom:2px solid var(--line-hard);}
.sign-badge{display:inline-flex;align-items:center;gap:10px;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--text);border:1px solid var(--accent);padding:8px 14px;background:var(--bg);box-shadow:4px 4px 0 var(--accent);}
.sign-badge .dot{width:8px;height:8px;background:var(--ok);animation:blink 1.4s steps(1) infinite;}
.hero h1{margin:36px 0 0;font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:clamp(40px,7vw,84px);line-height:0.98;letter-spacing:-0.03em;text-transform:uppercase;max-width:960px;}
.hero h1 em{font-style:normal;color:var(--accent);position:relative;}
.hero h1 .caret{display:inline-block;width:.55em;height:.82em;background:var(--accent);vertical-align:baseline;margin-left:6px;animation:blink 1s steps(1) infinite;}
.hero .sub{margin:28px 0 0;max-width:600px;font-size:15px;line-height:1.75;color:var(--muted);}
.hero .sub b{color:var(--text);font-weight:400;}
.btn-row{display:flex;gap:16px;margin-top:40px;flex-wrap:wrap;}
.btn-primary{display:inline-block;background:var(--accent);color:var(--ink);font-size:13px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:16px 30px;border:2px solid var(--accent);box-shadow:5px 5px 0 var(--line-hard);transition:transform 150ms var(--ease),box-shadow 150ms var(--ease),background 150ms var(--ease);}
.btn-primary:hover{transform:translate(-2px,-2px);box-shadow:7px 7px 0 var(--line-hard);color:var(--ink);}
.btn-primary:active{transform:translate(3px,3px);box-shadow:2px 2px 0 var(--line-hard);}
.btn-outline{display:inline-block;background:var(--bg);color:var(--text);font-size:13px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;padding:16px 30px;border:2px solid var(--line-hard);box-shadow:5px 5px 0 var(--accent);transition:transform 150ms var(--ease),box-shadow 150ms var(--ease),background 150ms var(--ease),color 150ms var(--ease);}
.btn-outline:hover{transform:translate(-2px,-2px);box-shadow:7px 7px 0 var(--accent);background:var(--text);color:var(--ink);}
.btn-outline:active{transform:translate(3px,3px);box-shadow:2px 2px 0 var(--accent);}

/* ---------- section head ---------- */
.sec-head{padding:64px 40px 0;max-width:720px;}
.sec-head h2,h2.big{margin:14px 0 0;font-family:'Space Grotesk',sans-serif;font-size:clamp(26px,3.6vw,42px);font-weight:700;letter-spacing:-0.02em;line-height:1.08;text-transform:uppercase;}

/* ---------- features ---------- */
.features-grid{display:grid;grid-template-columns:repeat(3,1fr);margin-top:48px;border-top:1px solid var(--line);}
.feature{padding:36px 32px 40px;border-right:1px solid var(--line);display:flex;flex-direction:column;gap:14px;transition:background 150ms var(--ease);position:relative;}
.feature:last-child{border-right:none;}
.feature:hover{background:var(--panel);}
.feature:hover .f-idx{background:var(--accent);color:var(--ink);}
.f-idx{align-self:flex-start;font-size:11px;letter-spacing:.1em;color:var(--muted);border:1px solid var(--line-hard);padding:4px 10px;transition:background 150ms var(--ease),color 150ms var(--ease);}
.feature h3{margin:6px 0 0;font-family:'Space Grotesk',sans-serif;font-size:20px;font-weight:700;letter-spacing:-0.01em;text-transform:uppercase;}
.feature p{margin:0;font-size:13px;line-height:1.7;color:var(--muted);}
.preview-box{margin-top:auto;border:1px solid var(--line-hard);background:var(--panel);}
.preview-dots{display:flex;align-items:center;gap:8px;padding:8px 12px;border-bottom:1px solid var(--line-hard);font-size:10px;color:var(--muted2);letter-spacing:.1em;}
.preview-dots span{width:8px;height:8px;display:inline-block;}
.preview-body{padding:16px;min-height:118px;}
.chat-row{display:flex;margin-bottom:8px;}
.chat-row.mine{justify-content:flex-end;}
.chat-bubble{max-width:88%;font-size:11px;line-height:1.5;padding:7px 10px;border:1px solid var(--line);color:var(--text);}
.chat-row.mine .chat-bubble{background:var(--accent);border-color:var(--accent);color:var(--ink);}
.voice-bars{display:flex;align-items:flex-end;gap:3px;height:44px;}
.voice-bars i{width:5px;background:var(--line);display:block;}
.voice-bars i.on{background:var(--accent);animation:nodepulse 1.8s ease-in-out infinite;}
.voice-meta{font-size:10.5px;color:var(--muted2);display:flex;gap:8px;align-items:center;margin-top:10px;}
.voice-meta .live{width:7px;height:7px;background:var(--ok);display:inline-block;animation:blink 1.4s steps(1) infinite;}
.cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:3px;margin-bottom:10px;}
.cal-grid .h{font-size:9px;color:var(--muted2);text-align:center;}
.cal-grid .c{height:16px;background:var(--line);border:1px solid var(--line-hard);}
.cal-grid .c.on{background:var(--accent);}
.cal-meta{font-size:10.5px;color:var(--muted2);}

/* ---------- canales ---------- */
.canales{display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));}
.canales-diagram{padding:70px 32px;border-right:1px solid var(--line);display:flex;align-items:center;justify-content:center;}
.canales-text{padding:70px 40px;display:flex;flex-direction:column;justify-content:center;gap:18px;}
.canales-text h2{margin:0;font-family:'Space Grotesk',sans-serif;font-size:clamp(22px,2.6vw,30px);line-height:1.25;letter-spacing:-0.01em;font-weight:700;}
.canales-text h2 span{color:var(--muted);font-weight:500;}
.canales-text p{margin:0;font-size:13.5px;line-height:1.8;color:var(--muted);max-width:480px;}

/* ---------- banner ---------- */
.scale-banner{padding:80px 40px;text-align:center;}
.scale-banner .row{font-family:'Space Grotesk',sans-serif;font-size:clamp(22px,3.6vw,34px);font-weight:700;text-transform:uppercase;letter-spacing:-0.01em;line-height:1.5;display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:14px;max-width:820px;margin:0 auto;}
.pill{display:inline-flex;align-items:center;gap:10px;background:var(--bg);border:2px solid var(--line-hard);padding:8px 20px;font-family:'JetBrains Mono',monospace;font-size:.5em;letter-spacing:.1em;box-shadow:4px 4px 0 var(--accent);transition:transform 150ms var(--ease),box-shadow 150ms var(--ease);}
.pill:hover{transform:translate(-2px,-2px);box-shadow:6px 6px 0 var(--accent);}
.pill em{font-style:normal;color:var(--accent);}

/* ---------- 24/7 ---------- */
.always{display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));}
.always-text{padding:70px 40px;border-right:1px solid var(--line);display:flex;flex-direction:column;justify-content:center;gap:18px;}
.always-text h2{margin:0;font-family:'Space Grotesk',sans-serif;font-size:clamp(26px,3.4vw,38px);line-height:1.1;letter-spacing:-0.02em;font-weight:700;text-transform:uppercase;max-width:420px;}
.always-text p{margin:0;font-size:13.5px;line-height:1.8;color:var(--muted);max-width:440px;}
.always-viz{padding:70px 40px;display:flex;align-items:center;}
.activity-card{width:100%;border:2px solid var(--line-hard);background:var(--panel);padding:22px 20px;display:flex;flex-direction:column;gap:16px;box-shadow:6px 6px 0 var(--line);}
.activity-head{display:flex;justify-content:space-between;font-size:11px;letter-spacing:.1em;color:var(--muted2);}
.activity-head .on{color:var(--ok);}
.activity-row{display:flex;align-items:center;gap:14px;}
.activity-row .lbl{font-size:11px;color:var(--muted2);width:96px;flex-shrink:0;}
.activity-bar{flex:1;height:10px;overflow:hidden;background-size:48px 10px;animation:barmove 2.8s linear infinite;}
.activity-row .tag{font-size:11px;color:var(--muted2);width:100px;text-align:right;flex-shrink:0;}
.activity-row .tag.on{color:var(--accent);}

/* ---------- conversación + resultados ---------- */
.convo-section{display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));align-items:center;}
.convo-left{padding:70px 40px;border-right:1px solid var(--line);display:flex;flex-direction:column;gap:18px;}
.convo-left h2{margin:0;font-family:'Space Grotesk',sans-serif;font-size:clamp(22px,2.6vw,28px);line-height:1.25;letter-spacing:-0.01em;font-weight:700;}
.convo-left h2 span{color:var(--muted);font-weight:500;}
.convo-box{border:2px solid var(--line-hard);background:var(--panel);}
.tab-row{display:flex;align-items:center;border-bottom:2px solid var(--line-hard);}
.tab-btn{background:none;border:none;border-right:1px solid var(--line);font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:.1em;text-transform:uppercase;padding:13px 18px;color:var(--muted2);transition:color 150ms var(--ease),background 150ms var(--ease);}
.tab-btn:hover{color:var(--text);}
.tab-btn.active{color:var(--ink);background:var(--accent);font-weight:700;}
.convo-body{padding:20px;display:flex;flex-direction:column;gap:10px;min-height:200px;}
.convo-msg-row{display:flex;}
.convo-msg-row.b{justify-content:flex-end;}
.convo-bubble{max-width:84%;font-size:12.5px;line-height:1.6;padding:9px 13px;border:1px solid var(--line);color:var(--text);}
.convo-msg-row.b .convo-bubble{background:var(--accent);border-color:var(--accent);color:var(--ink);}
.convo-stage{padding:22px 16px;display:flex;flex-direction:row;flex-wrap:nowrap;align-items:center;justify-content:center;gap:18px;background:repeating-linear-gradient(45deg,var(--line) 0 1px,transparent 1px 14px);}
.phone-frame{width:222px;flex-shrink:0;border-radius:42px !important;background:linear-gradient(155deg,#48484a,#151516 45%,#000);padding:9px;box-shadow:6px 6px 0 var(--line),inset 0 0 0 2px rgba(255,255,255,.06);position:relative;}
.phone-btn{position:absolute;background:#0c0c0d;border-radius:2px !important;}
.phone-btn.action{left:-3px;top:64px;width:3px;height:20px;}
.phone-btn.vol-up{left:-3px;top:100px;width:3px;height:32px;}
.phone-btn.vol-down{left:-3px;top:140px;width:3px;height:32px;}
.phone-btn.power{right:-3px;top:110px;width:3px;height:52px;}
.phone-screen{position:relative;border-radius:33px !important;height:490px;background:#111;color:#fff;overflow:hidden;display:flex;flex-direction:column;}
.dynamic-island{position:absolute;top:10px;left:50%;transform:translateX(-50%);width:76px;height:25px;background:#000;border-radius:13px !important;z-index:10;}
.home-indicator{position:absolute;bottom:6px;left:50%;transform:translateX(-50%);width:110px;height:4px;background:rgba(255,255,255,.55);border-radius:3px !important;z-index:10;}
.phone-content{flex:1;min-height:0;padding-top:0;padding-bottom:14px;display:flex;flex-direction:column;}
.transcript-bubble{display:none;max-width:190px;flex-shrink:0;background:var(--panel);border:2px solid var(--line-hard);border-radius:16px !important;padding:14px 16px;box-shadow:5px 5px 0 var(--line);}

.transcript-bubble.show{display:block;}
.transcript-label{font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--accent);font-weight:700;margin-bottom:8px;display:flex;align-items:center;gap:5px;}
.transcript-label .dot-live{width:6px;height:6px;border-radius:50% !important;background:#ff5f57;flex-shrink:0;}
.transcript-line{font-size:12px;line-height:1.55;color:var(--text);margin-bottom:8px;}
.transcript-line b{color:var(--muted2);font-weight:600;}
.transcript-line:last-child{margin-bottom:0;}
.phone-screen,.phone-screen *{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif !important;transition:none !important;animation:none !important;box-shadow:none !important;text-shadow:none !important;filter:none !important;}
.phone-screen *{scrollbar-width:none !important;}
.phone-screen *::-webkit-scrollbar{display:none !important;width:0 !important;height:0 !important;}
.ph-status{display:flex;justify-content:space-between;align-items:center;font-size:13px;font-weight:600;padding:13px 15px 6px;color:#fff;letter-spacing:.01em;}
.ph-status-light{color:#111;background:#fff;}
.ph-wa-head{background:#111b21;color:#fff;display:flex;align-items:center;gap:7px;padding:8px 10px;border-bottom:1px solid #222d34;}
.ph-wa-avatar{width:32px;height:32px;border-radius:50% !important;background:#3b4a54;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:13px;flex-shrink:0;}
.ph-wa-name{font-size:14px;font-weight:600;line-height:1.3;color:#e9edef;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.ph-wa-sub{font-size:10.5px;line-height:1.3;color:#8696a0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.ph-wa-body{flex:1;min-height:0;background:#0b141a;padding:10px 8px;display:flex;flex-direction:column;gap:5px;overflow-y:auto;}
.ph-wa-date{align-self:center;background:#182229;color:#8696a0;font-size:10px;padding:4px 10px;border-radius:8px !important;margin:2px 0 6px;}
.ph-wa-lock{align-self:center;max-width:88%;background:#182229;color:#fdd88a;font-size:9.5px;line-height:1.5;text-align:center;padding:8px 12px;border-radius:8px !important;margin-bottom:8px;}
.ph-wa-time{display:block;text-align:right;font-size:9px;color:#8696a0;margin-top:2px;}
.ph-row.out .ph-wa-time{color:#a2e5c9;}
.ph-wa-time svg{color:#53bdeb;}
.ph-wa-input{height:48px;flex-shrink:0;background:#111b21;border-top:1px solid #222d34;display:flex;align-items:center;gap:8px;padding:0 8px;}
.wa-pill{flex:1;height:32px;background:#1f2c33;border:none;border-radius:18px !important;}
.ph-wa-input .mic{width:32px;height:32px;flex-shrink:0;border-radius:50% !important;background:#00a884;display:flex;align-items:center;justify-content:center;}
.ph-ig-head{background:#fff;display:flex;align-items:center;gap:10px;padding:8px 12px 12px;border-bottom:1px solid #efefef;}
.ph-ig-avatar{width:32px;height:32px;border-radius:50% !important;background:linear-gradient(45deg,#F58529,#DD2A7B 55%,#8134AF);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:12px;flex-shrink:0;}
.ph-ig-name{font-size:14px;font-weight:600;color:#111;line-height:1.25;}
.ph-ig-sub{font-size:11px;color:#8e8e8e;line-height:1.25;}
.ph-ig-body{flex:1;min-height:0;background:#fff;padding:10px 8px;display:flex;flex-direction:column;gap:6px;overflow-y:auto;}
.ph-ig-input{height:48px;flex-shrink:0;background:#fff;border-top:1px solid #efefef;display:flex;align-items:center;gap:7px;padding:0 10px;}
.ig-pill{flex:1;height:32px;display:flex;align-items:center;padding:0 10px;background:#fafafa;border:1px solid #dbdbdb;border-radius:18px !important;}
.ph-row{display:flex;}
.ph-row.out,.ph-row.out-ig{justify-content:flex-end;}
.ph-bubble{max-width:78%;font-size:13.5px;line-height:1.35;padding:8px 12px;border-radius:18px !important;}
.ph-row.in .ph-bubble{background:#202c33;color:#e9edef;border-bottom-left-radius:4px !important;}
.ph-row.out .ph-bubble{background:#005c4b;color:#e9edef;border-bottom-right-radius:4px !important;}
.ph-row.in-ig .ph-bubble{background:#EFEFEF;color:#111;}
.ph-row.out-ig .ph-bubble{background:#3797F0;color:#fff;}
.ph-call-body{flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;padding:20px 16px 18px;color:#fff;}
.ph-call-avatar{width:64px;height:64px;border-radius:50% !important;background:#2c2c2e;border:1px solid #3a3a3c;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:22px;color:#8e8e93;margin-bottom:10px;}
.ph-call-name{font-size:18px;font-weight:600;}
.ph-call-sub{font-size:12px;color:#8e8e93;margin-top:4px;}
.ph-call-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:16px 0;width:100%;}
.ph-call-btn{aspect-ratio:1;border-radius:50% !important;background:#2c2c2e;border:1px solid #3a3a3c;display:flex;align-items:center;justify-content:center;}
.ph-call-btn.wa-active{background:#fff;}
.ph-call-end{width:48px;height:48px;border-radius:50% !important;background:#ff3b30;margin-top:14px;flex-shrink:0;display:flex;align-items:center;justify-content:center;}
.ph-caption{margin-top:auto;width:100%;border-top:1px solid #2c2c2e;padding:8px 14px;font-size:10.5px;color:#8e8e93;line-height:1.4;max-height:44px;overflow:hidden;}
.ph-caption b{color:var(--accent);font-weight:400;}
.channels-row{display:flex;align-items:center;flex-wrap:wrap;gap:10px;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted2);}
.chan-pill{display:inline-flex;align-items:center;gap:8px;border:1px solid var(--line-hard);padding:5px 12px;font-size:11px;color:var(--text);transition:background 150ms var(--ease),color 150ms var(--ease);}
.chan-pill:hover{background:var(--panel);}
.chan-pill i{width:8px;height:8px;display:inline-block;}
.convo-right{padding:70px 40px;display:flex;flex-direction:column;justify-content:center;gap:18px;}
.results-label{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted2);}
.results-list{display:flex;flex-direction:column;border-top:1px solid var(--line);}
.result-row{display:flex;align-items:center;gap:14px;padding:13px 4px;border-bottom:1px solid var(--line);font-size:13px;transition:background 150ms var(--ease),padding-left 150ms var(--ease);}
.result-row:hover{background:var(--panel);padding-left:12px;}
.result-row .pos{color:var(--muted2);width:24px;font-size:11px;}
.result-row .dot{width:8px;height:8px;display:inline-block;}
.result-row .name{color:var(--text);}
.result-row .metric{margin-left:auto;color:var(--accent);font-size:12px;}
.stat-row{display:flex;gap:0;margin-top:16px;border:2px solid var(--line-hard);}
.stat-cell{flex:1;padding:18px 20px;border-right:2px solid var(--line-hard);}
.stat-cell:last-child{border-right:none;}
.stat-num{font-family:'Space Grotesk',sans-serif;font-size:32px;font-weight:700;letter-spacing:-0.01em;color:var(--accent);}
.stat-label{font-size:11px;color:var(--muted);margin-top:4px;letter-spacing:.06em;text-transform:uppercase;}

/* ---------- precios ---------- */
.pricing{padding-bottom:80px;}
.pricing-head{padding:64px 40px 0;text-align:left;max-width:720px;}
.pricing-head p{margin:14px 0 0;color:var(--muted);font-size:13px;}
.plans{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:32px;max-width:900px;margin:48px auto 0;padding:0 40px;}
.plans-3{max-width:1180px;}
.plan-price-sub{margin-top:8px;font-size:13px;color:var(--muted);}
.addon-wrap{max-width:1180px;margin:36px auto 0;padding:0 40px;position:relative;}
.addon-plus{position:absolute;top:-15px;left:50%;transform:translateX(-50%);width:30px;height:30px;background:var(--bg);border:2px solid var(--line-hard);display:flex;align-items:center;justify-content:center;font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:16px;color:var(--accent);z-index:2;}
.addon-card{border:2px solid var(--line-hard);background:var(--accent);color:var(--ink);box-shadow:8px 8px 0 var(--line);display:flex;flex-direction:column;align-items:center;text-align:center;gap:14px;padding:28px 40px;transition:transform 150ms var(--ease),box-shadow 150ms var(--ease);}
.addon-card:hover{transform:translate(-3px,-3px);box-shadow:11px 11px 0 var(--line);}
.addon-card .plan-tag{color:var(--ink);opacity:.7;}
.addon-card .plan-price .period{color:var(--ink);opacity:.7;}
.addon-main{display:flex;flex-direction:column;align-items:center;gap:8px;}
.addon-main h3{margin:0;font-family:'Space Grotesk',sans-serif;font-size:22px;font-weight:700;text-transform:uppercase;letter-spacing:-0.01em;color:var(--ink);}
.addon-items-inline{display:flex;flex-wrap:wrap;justify-content:center;gap:8px 20px;}
.addon-items-inline span{font-size:12px;color:var(--ink);opacity:.8;}
.addon-cta{display:flex;flex-direction:column;align-items:center;gap:10px;}
.addon-cta .plan-price{flex-direction:column;align-items:center;gap:2px;margin-top:0;}
.addon-cta .plan-btn{background:var(--ink);color:var(--accent);border-color:var(--ink);}
.addon-cta .plan-btn:hover{background:var(--bg);color:var(--accent);border-color:var(--bg);}
.addon-note{margin-top:18px;font-size:12px;color:var(--muted);text-align:center;}
.plan-card{border:2px solid var(--line-hard);padding:32px 28px;background:var(--panel);display:flex;flex-direction:column;position:relative;box-shadow:8px 8px 0 var(--line);transition:transform 150ms var(--ease),box-shadow 150ms var(--ease);}
.plan-card:hover{transform:translate(-3px,-3px);box-shadow:11px 11px 0 var(--line);}
.plan-card.highlight{box-shadow:8px 8px 0 var(--accent);}
.plan-card.highlight:hover{box-shadow:11px 11px 0 var(--accent);}
.plan-badge{position:absolute;top:-13px;right:20px;font-size:10px;letter-spacing:.12em;padding:5px 12px;background:var(--accent);color:var(--ink);font-weight:700;}
.plan-tag{font-size:11px;letter-spacing:.14em;color:var(--muted);}
.plan-price{display:flex;align-items:baseline;gap:10px;margin-top:16px;}
.plan-price .num{font-family:'Space Grotesk',sans-serif;font-size:40px;font-weight:700;letter-spacing:-0.02em;font-variant-numeric:tabular-nums;}
.plan-price .period{font-size:12px;color:var(--muted2);}
.plan-items{display:flex;flex-direction:column;margin-top:24px;margin-bottom:28px;border-top:1px solid var(--line);}
.plan-item{display:flex;gap:12px;font-size:12.5px;color:var(--muted);line-height:1.5;padding:9px 0;border-bottom:1px solid var(--line);}
.plan-item .check{color:var(--ok);}
.plan-btn{margin-top:auto;text-align:center;border:2px solid var(--line-hard);color:var(--text);font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;padding:14px 18px;background:var(--bg);transition:background 150ms var(--ease),color 150ms var(--ease);}
.plan-btn:hover{background:var(--text);color:var(--ink);}
.plan-btn.solid{background:var(--accent);color:var(--ink);border-color:var(--accent);}
.plan-btn.solid:hover{background:var(--text);border-color:var(--text);}

/* ---------- faq ---------- */
.faq{padding:0 40px 80px;}
.faq .sec-head{padding:64px 0 0;}
.faq-list{max-width:760px;margin-top:40px;border:2px solid var(--line-hard);}
.faq-item{border-bottom:1px solid var(--line);}
.faq-item:last-child{border-bottom:none;}
.faq-q{width:100%;display:flex;justify-content:space-between;align-items:center;gap:16px;background:none;border:none;color:var(--text);font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:500;text-align:left;padding:18px 20px;transition:background 150ms var(--ease),color 150ms var(--ease);}
.faq-q:hover{background:var(--panel);color:var(--accent);}
.faq-q .chev{color:var(--accent);font-size:16px;transition:transform 250ms var(--ease);}
.faq-item.open .faq-q{background:var(--panel);}
.faq-item.open .faq-q .chev{transform:rotate(45deg);}
.faq-a{display:none;padding:0 20px 20px;font-size:12.5px;line-height:1.8;color:var(--muted);max-width:620px;}
.faq-a::before{content:'> ';color:var(--accent);}
.faq-item.open .faq-a{display:block;}

/* ---------- cta ---------- */
.cta{display:grid;grid-template-columns:1.2fr 1fr 1fr;gap:32px;padding:70px 40px;border-bottom:2px solid var(--line-hard);align-items:stretch;}
.cta-left{padding:0 20px 0 0;display:flex;flex-direction:column;justify-content:center;gap:18px;}
.cta-left h2{margin:0;font-family:'Space Grotesk',sans-serif;font-size:clamp(26px,3.4vw,40px);line-height:1.05;letter-spacing:-0.02em;font-weight:700;text-transform:uppercase;}
.cta-left p{margin:0;font-size:13px;color:var(--muted);line-height:1.7;}
.cta-card{padding:36px 28px;border:2px solid var(--line-hard);background:var(--panel);box-shadow:6px 6px 0 var(--line);display:flex;flex-direction:column;align-items:flex-start;justify-content:center;gap:14px;cursor:pointer;transition:transform 150ms var(--ease),box-shadow 150ms var(--ease),background 150ms var(--ease);}
.cta-card:hover{transform:translate(-3px,-3px);box-shadow:9px 9px 0 var(--line);}
.cta-card:hover .cta-icon{background:var(--accent);color:var(--ink);border-color:var(--accent);}
.cta-icon{width:52px;height:52px;border:2px solid var(--line-hard);display:flex;align-items:center;justify-content:center;color:var(--accent);transition:background 150ms var(--ease),color 150ms var(--ease),border-color 150ms var(--ease);}
.cta-card .lbl{font-family:'Space Grotesk',sans-serif;font-size:16px;font-weight:700;text-transform:uppercase;letter-spacing:.02em;}
.cta-card .sub{font-size:12px;color:var(--muted);max-width:230px;line-height:1.7;}

/* ---------- footer ---------- */
footer{padding:0;display:flex;flex-wrap:wrap;align-items:stretch;justify-content:space-between;font-size:11px;letter-spacing:.06em;color:var(--muted2);}
footer .cell{padding:20px 24px;display:flex;align-items:center;gap:8px;}
footer .cell .ok-dot{width:7px;height:7px;background:var(--ok);display:inline-block;animation:blink 1.4s steps(1) infinite;}
footer .links{display:flex;align-items:stretch;}
footer .links a{color:var(--muted2);padding:20px 20px;display:flex;align-items:center;border-left:1px solid var(--line);text-transform:uppercase;}
footer .links a:hover{color:var(--accent);background:var(--panel);}

/* ---------- responsive ---------- */
@media (max-width:1024px){
  .wrap{border-left:none;border-right:none;}
  .cta{grid-template-columns:1fr 1fr;}
  .cta-left{grid-column:1/-1;padding:0 0 10px;}
}
@media (max-width:768px){
  .hero{padding:120px 20px 60px;}
  .sec-head,.pricing-head{padding:48px 20px 0;}
  .features-grid{grid-template-columns:1fr;}
  .feature{border-right:none;border-bottom:1px solid var(--line);}
  .canales-diagram,.canales-text,.always-text,.always-viz,.convo-left,.convo-right{padding:40px 20px;border-right:none;}
  .canales-diagram,.always-text,.convo-left{border-bottom:1px solid var(--line);}
  .cta{grid-template-columns:1fr;padding:40px 20px;gap:24px;}
  .cta-card{padding:28px 22px;}
  .plans{padding:0 20px;gap:36px;}
  .addon-wrap{padding:0 20px;}
  .addon-card{padding:28px 22px;}
  .addon-cta{width:100%;}
  .addon-cta .plan-btn{width:100%;text-align:center;}
  .faq{padding:0 20px 60px;}
  .scale-banner{padding:60px 20px;}
  .menu-list a{font-size:1.5rem;}
  #atp-chat-btn{bottom:16px;right:16px;}
  #atp-chat-panel{width:calc(100vw - 32px);bottom:76px;right:16px;height:55vh;max-height:70vh;}
}
@media (max-width:480px){
  html{scroll-padding-top:64px;}
  .nav-logo{padding:14px 14px;font-size:11px;}
  .nav-toggle{padding:0 18px;font-size:11px;}
  .hero{padding:104px 16px 48px;}
  .hero .sub{font-size:13px;}
  .btn-row{flex-direction:column;gap:14px;}
  .btn-primary,.btn-outline{width:100%;text-align:center;}
  .stat-row{flex-direction:column;}
  .stat-cell{border-right:none;border-bottom:2px solid var(--line-hard);}
  .stat-cell:last-child{border-bottom:none;}
  .plan-card{padding:24px 18px;}
  .menu-panel{width:min(100vw - 16px,320px);padding:88px 20px 20px;}
  .menu-list a{font-size:1.3rem;}
  #atp-chat-panel{bottom:70px;right:12px;width:calc(100vw - 24px);height:58vh;max-height:75vh;}
  #atp-chat-btn{bottom:12px;right:12px;}
}
@media (max-height:600px) and (orientation:landscape){
  .hero{padding:100px 20px 40px;}
  #atp-chat-panel{bottom:56px;}
}

/* ---------- ATP CHAT WIDGET ---------- */
#atp-chat-btn{position:fixed;bottom:24px;right:24px;z-index:9999;width:56px;height:56px;border:2px solid var(--line-hard);background:var(--bg);color:var(--text);box-shadow:5px 5px 0 var(--accent);display:flex;align-items:center;justify-content:center;transition:transform 150ms var(--ease),box-shadow 150ms var(--ease),background 150ms var(--ease);}
#atp-chat-btn:hover{transform:translate(-2px,-2px);box-shadow:7px 7px 0 var(--accent);background:var(--panel);}
#atp-chat-btn:active{transform:translate(3px,3px);box-shadow:2px 2px 0 var(--accent);}
#atp-chat-btn::after{content:'';position:absolute;top:-4px;right:-4px;width:12px;height:12px;background:var(--ok);border:2px solid var(--bg);animation:blink 1.4s steps(1) infinite;}
#atp-chat-panel{position:fixed;bottom:96px;right:24px;z-index:9999;width:clamp(300px,95vw - 48px,420px);max-width:90vw;height:clamp(400px,60vh,600px);max-height:80vh;background:var(--bg);border:2px solid var(--line-hard);box-shadow:8px 8px 0 var(--accent);display:none;flex-direction:column;overflow:hidden;font-family:'JetBrains Mono',monospace;}
#atp-chat-panel.open{display:flex;animation:panelIn 200ms var(--ease);}
@keyframes panelIn{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}
#atp-chat-header{display:flex;align-items:center;gap:12px;padding:16px;border-bottom:2px solid var(--line-hard);}
#atp-chat-avatar{width:36px;height:36px;background:var(--accent);display:flex;align-items:center;justify-content:center;font-size:17px;flex-shrink:0;}
#atp-chat-title{color:var(--text);font-weight:700;font-size:13px;letter-spacing:.08em;text-transform:uppercase;}
#atp-chat-subtitle{color:var(--muted2);font-size:11px;margin-top:2px;}
#atp-chat-close{margin-left:auto;background:none;border:1px solid var(--line);color:var(--muted);font-size:14px;padding:4px 8px;transition:background 150ms ease,color 150ms ease;}
#atp-chat-close:hover{background:var(--err);color:var(--ink);border-color:var(--err);}
#atp-chat-messages{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;}
.atp-msg{max-width:88%;padding:10px 13px;font-size:12.5px;line-height:1.6;white-space:pre-line;animation:atpPop 0.2s var(--ease);}
@keyframes atpPop{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:translateY(0);}}
.atp-msg.user{align-self:flex-end;background:var(--accent);color:var(--ink);}
.atp-msg.bot{align-self:flex-start;background:var(--panel);border:1px solid var(--line);color:var(--text);}
#atp-chat-input-wrap{padding:12px;border-top:2px solid var(--line-hard);}
#atp-chat-input-row{display:flex;align-items:center;gap:8px;border:1px solid var(--line-hard);padding:4px 4px 4px 12px;background:var(--panel);}
#atp-chat-input-row::before{content:'>';color:var(--accent);}
#atp-chat-input-row:focus-within{border-color:var(--accent);}
#atp-chat-input{flex:1;border:none;background:transparent;color:var(--text);padding:8px 0;font-size:16px;outline:none;font-family:'JetBrains Mono',monospace;}
#atp-chat-input::placeholder{color:var(--muted2);}
#atp-chat-send{width:36px;height:36px;border:none;background:var(--accent);color:var(--ink);font-size:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:background 150ms ease;}
#atp-chat-send:hover{background:var(--text);}
#atp-chat-send:disabled{opacity:0.5;cursor:not-allowed;}
</style>
<script type="application/ld+json">{"@context":"https://schema.org","@type":"Organization","name":"Atiéndeme la Pyme","url":"https://atiendemelapyme.cl/","email":"hola@atiendemelapyme.cl","description":"Agentes de inteligencia artificial que automatizan ventas, atención al cliente y agendamiento de citas para pequeñas y medianas empresas en Chile, vía WhatsApp, Instagram y voz.","areaServed":"CL","address":{"@type":"PostalAddress","addressLocality":"Santiago","addressCountry":"CL"}}</script>
<script type="application/ld+json">{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{"@type":"Question","name":"¿Necesito conocimientos técnicos?","acceptedAnswer":{"@type":"Answer","text":"No. Nosotros hacemos toda la configuración técnica. Tú solo nos das información sobre tu negocio."}},{"@type":"Question","name":"¿Cuánto tarda la implementación?","acceptedAnswer":{"@type":"Answer","text":"Entre 2 y 3 semanas desde que contratas hasta que está 100% operativo."}},{"@type":"Question","name":"¿Funciona con mi calendario actual?","acceptedAnswer":{"@type":"Answer","text":"Sí. Se integra con Google Calendar, Calendly, o casi cualquier sistema."}},{"@type":"Question","name":"¿Puedo cancelar cuando quiera?","acceptedAnswer":{"@type":"Answer","text":"Sí. Sin penalizaciones, sin contratos largos. Cancela cuando quieras."}},{"@type":"Question","name":"¿Qué pasa con los datos de mis clientes?","acceptedAnswer":{"@type":"Answer","text":"Máxima seguridad. Encriptación de nivel empresarial. Cumplimos con la Ley de Protección de Datos Personales de Chile."}}]}</script>
</head>
<body>


<div class="grid-bg"></div>

<!-- SELECTOR DE PALETA -->
<div class="palette-bar" role="group" aria-label="Paleta de colores">
  <span class="pb-label">Paleta</span>
  <button class="pal-btn active" data-pal="amber" title="Ámbar" aria-label="Paleta ámbar"><i style="background:#E8A33D"></i></button>
  <button class="pal-btn" data-pal="matrix" title="Matrix" aria-label="Paleta verde terminal"><i style="background:#4AF626"></i></button>
  <button class="pal-btn" data-pal="cyber" title="Cyber" aria-label="Paleta cian"><i style="background:#38E1FF"></i></button>
  <button class="pal-btn" data-pal="ultra" title="Violeta" aria-label="Paleta violeta"><i style="background:#A78BFA"></i></button>
  <button class="pal-btn" data-pal="paper" title="Papel (claro)" aria-label="Paleta clara"><i style="background:#EFEDE4"></i></button>
</div>

<!-- NAV -->
<a href="#solucion" class="skip-link" style="position:fixed;top:-60px;left:16px;z-index:100;background:var(--accent);color:var(--ink);padding:10px 18px;font-weight:700;font-size:12px;letter-spacing:.1em;text-transform:uppercase;transition:top 150ms var(--ease);" onfocus="this.style.top='16px'" onblur="this.style.top='-60px'">Saltar al contenido</a>
<header class="nav-header">
  <div class="nav-logo">ATIÉNDEME_LA_PYME<span class="cursor"></span></div>
  <button class="nav-toggle" id="menuToggle" aria-label="Abrir menú" aria-expanded="false" aria-controls="menuPanel">
    <span class="bars"><span></span><span></span></span>
    Menú
  </button>
</header>
<div class="menu-overlay" id="menuOverlay"></div>
<nav class="menu-panel" id="menuPanel" aria-label="Navegación principal">
  <ul class="menu-list">
    <li><a href="#solucion" class="menu-link">Solución</a></li>
    <li><a href="#canales" class="menu-link">Canales</a></li>
    <li><a href="#precios" class="menu-link">Precios</a></li>
    <li><a href="#faq" class="menu-link">FAQ</a></li>
    <li><a href="#contacto" class="menu-link">Agendar demo</a></li>
  </ul>
  <div class="menu-socials">
    <p class="menu-socials-title">Síguenos</p>
    <div class="menu-socials-list">
      <a href="https://instagram.com" target="_blank" rel="noopener">Instagram</a>
      <a href="https://wa.me/56900000000" target="_blank" rel="noopener">WhatsApp</a>
      <a href="mailto:hola@atiendemelapyme.cl">Correo</a>
    </div>
  </div>
</nav>

<main class="wrap">

  <!-- HERO -->
  <section class="hero" data-screen-label="Hero">
    <span class="sign-badge"><span class="dot"></span>Implementación en 2–3 semanas</span>
    <h1>Tu negocio despierto, <em>siempre</em><span class="caret"></span></h1>
    <p class="sub"><span class="comment">agentes de IA para pymes</span><br>Agentes de IA que <b>venden, atienden y agendan citas</b> por ti, las 24 horas del día. Sin contratar más gente.</p>
    <div class="btn-row">
      <a href="#contacto" class="btn-primary">Agendar demo</a>
      <a href="#solucion" class="btn-outline">Ver cómo funciona</a>
    </div>
  </section>

  <!-- FEATURES -->
  <section id="solucion" class="reveal" data-screen-label="Solución">
    <span class="sec-num">01</span>
    <div class="sec-head">
      <span class="label"><b>./</b>solución</span>
      <h2>Tu asistente de IA responde por ti en tres canales</h2>
    </div>
    <div class="features-grid">
      <div class="feature">
        <span class="f-idx">[01] CHAT</span>
        <h3>Chatbots inteligentes</h3>
        <p>Tus redes — WhatsApp, Instagram, Facebook — responden consultas, califican leads y agendan citas por ti.</p>
        <div class="preview-box">
          <div class="preview-dots"><span style="background:#FF5F57"></span><span style="background:#FEBC2E"></span><span style="background:#28C840"></span>&nbsp;chat.log</div>
          <div class="preview-body">
            <div class="chat-row"><div class="chat-bubble">Hola, ¿tienen hora para mañana?</div></div>
            <div class="chat-row mine"><div class="chat-bubble">¡Sí! Tengo a las 10:30 o 16:00. ¿Cuál te acomoda?</div></div>
            <div class="chat-row"><div class="chat-bubble">La de 10:30 ✓</div></div>
          </div>
        </div>
      </div>
      <div class="feature">
        <span class="f-idx">[02] VOZ</span>
        <h3>Asistentes de voz</h3>
        <p>Contestan llamadas, explican servicios y agendan citas automáticamente, con acento chileno neutro. Transfieren a humanos si hace falta.</p>
        <div class="preview-box">
          <div class="preview-dots"><span style="background:#FF5F57"></span><span style="background:#FEBC2E"></span><span style="background:#28C840"></span>&nbsp;call.wav</div>
          <div class="preview-body">
            <div class="voice-bars" id="voiceBars"></div>
            <div class="voice-meta"><span class="live"></span>Duración de llamada: 3:45</div>
          </div>
        </div>
      </div>
      <div class="feature">
        <span class="f-idx">[03] AGENDA</span>
        <h3>Calendario integrado</h3>
        <p>Google Calendar o Calendly sincronizado: sin dobles reservas y con recordatorios automáticos.</p>
        <div class="preview-box">
          <div class="preview-dots"><span style="background:#FF5F57"></span><span style="background:#FEBC2E"></span><span style="background:#28C840"></span>&nbsp;cal.db</div>
          <div class="preview-body">
            <div class="cal-grid" id="calGrid"></div>
            <div class="cal-meta">4 citas confirmadas esta semana</div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- CANALES -->
  <section id="canales" class="canales reveal" data-screen-label="Canales">
    <span class="sec-num">02</span>
    <div class="canales-diagram" id="diagramHost"></div>
    <div class="canales-text">
      <span class="label"><b>./</b>canales — todos conectados</span>
      <h2>De la consulta a la cita agendada, sin que muevas un dedo. <span>Tu asistente responde en WhatsApp, Instagram, Facebook y correo. Agenda directo en tu calendario.</span></h2>
      <p>Entrenado con la información de tu negocio: tus servicios, tus precios, tus horarios. Responde en segundos y con tu tono.</p>
    </div>
  </section>

  <!-- SCALE BANNER -->
  <section class="scale-banner reveal" data-screen-label="Banner">
    <div class="row">
      <span>Atiende a</span>
      <span class="pill"><em>↗</em> más clientes</span>
      <span>sin contratar</span>
      <span class="pill"><em>＋</em> más gente</span>
    </div>
  </section>

  <!-- 24/7 -->
  <section class="always reveal" data-screen-label="24/7">
    <span class="sec-num">03</span>
    <div class="always-text">
      <span class="label"><b>status:</b> siempre_activo</span>
      <h2>Tu equipo descansa. Tu atención, no.</h2>
      <p>Las consultas de noche y fin de semana ya no se pierden: tu asistente responde, califica y agenda mientras duermes.</p>
      <a href="#contacto" class="btn-outline" style="align-self:flex-start;margin-top:6px;padding:12px 22px;font-size:12px;">Saber más</a>
    </div>
    <div class="always-viz">
      <div class="activity-card">
        <div class="activity-head"><span>ACTIVIDAD · ÚLTIMAS 24H</span><span class="on">● EN LÍNEA</span></div>
        <div class="activity-row">
          <span class="lbl">09:00 – 18:00</span>
          <div class="activity-bar" style="background-image:repeating-linear-gradient(90deg, var(--ok) 0 14px, transparent 14px 24px)"></div>
          <span class="tag" style="color:var(--ok)">Tu equipo + IA</span>
        </div>
        <div class="activity-row">
          <span class="lbl">18:00 – 00:00</span>
          <div class="activity-bar" style="background-image:repeating-linear-gradient(90deg, var(--accent) 0 14px, transparent 14px 24px)"></div>
          <span class="tag on">IA activa</span>
        </div>
        <div class="activity-row">
          <span class="lbl">00:00 – 09:00</span>
          <div class="activity-bar" style="background-image:repeating-linear-gradient(90deg, var(--accent) 0 14px, transparent 14px 24px)"></div>
          <span class="tag on">IA activa</span>
        </div>
        <div class="activity-row">
          <span class="lbl">Fin de semana</span>
          <div class="activity-bar" style="background-image:repeating-linear-gradient(90deg, var(--accent) 0 14px, transparent 14px 24px)"></div>
          <span class="tag on">IA activa</span>
        </div>
      </div>
    </div>
  </section>

  <!-- CONVERSACIÓN + RESULTADOS -->
  <section class="convo-section reveal" data-screen-label="Conversaciones">
    <span class="sec-num">04</span>
    <div class="convo-left">
      <span class="label"><b>./</b>conversaciones_reales</span>
      <h2>Así atiende tu asistente. <span>Del primer mensaje a la cita confirmada.</span></h2>
      <div class="convo-box">
        <div class="tab-row" id="tabRow" role="tablist" aria-label="Ejemplos de conversación">
          <button class="tab-btn active" data-tab="0" role="tab" aria-selected="true">WhatsApp</button>
          <button class="tab-btn" data-tab="1" role="tab" aria-selected="false">Llamada</button>
          <button class="tab-btn" data-tab="2" role="tab" aria-selected="false">Instagram</button>
        </div>
        <div class="convo-stage"><div class="phone-frame" id="phoneFrame"><div class="phone-btn action"></div><div class="phone-btn vol-up"></div><div class="phone-btn vol-down"></div><div class="phone-btn power"></div><div class="phone-screen"><div class="dynamic-island"></div><div class="phone-content" id="phoneScreen"></div><div class="home-indicator"></div></div></div><div class="transcript-bubble" id="transcriptBubble"></div></div>
      </div>
      </div>
    </div>
    <div class="convo-right">
      <div class="channels-row">
        <span>Funciona con</span>
        <span class="chan-pill"><i style="background:#25D366"></i>WhatsApp</span>
        <span class="chan-pill"><i style="background:#E1306C"></i>Instagram</span>
        <span class="chan-pill"><i style="background:#1877F2"></i>Facebook</span>
        <span class="chan-pill"><i style="background:#F59E0B"></i>Correo</span>
        <span class="chan-pill"><i style="background:var(--accent)"></i>Google Calendar</span>
      </div>
      <div class="results-label">Resultados de clientes</div>
      <div class="results-list">
        <div class="result-row"><span class="pos">01</span><span class="dot" style="background:#25D366"></span><span class="name">Consultorio dental</span><span class="metric num-tab">0 inasistencias</span></div>
        <div class="result-row"><span class="pos">02</span><span class="dot" style="background:var(--accent)"></span><span class="name">Peluquería</span><span class="metric num-tab">24/7 atendida</span></div>
        <div class="result-row"><span class="pos">03</span><span class="dot" style="background:#E1306C"></span><span class="name">Taller mecánico</span><span class="metric num-tab">+38% servicios</span></div>
        <div class="result-row"><span class="pos">04</span><span class="dot" style="background:#F59E0B"></span><span class="name">Centro estético</span><span class="metric num-tab">−50% tareas manuales</span></div>
        <div class="result-row"><span class="pos">05</span><span class="dot" style="background:#1877F2"></span><span class="name">Clínica veterinaria</span><span class="metric num-tab">+120 citas/mes</span></div>
      </div>
      <div class="stat-row">
        <div class="stat-cell"><div class="stat-num num-tab">+400</div><div class="stat-label">citas agendadas en automático</div></div>
        <div class="stat-cell"><div class="stat-num num-tab">+100</div><div class="stat-label">pymes creciendo con nosotros</div></div>
      </div>
    </div>
  </section>

  <!-- PRECIOS -->
  <section id="precios" class="pricing reveal" data-screen-label="Precios">
    <span class="sec-num">05</span>
    <div class="pricing-head">
      <span class="label"><b>./</b>precios</span>
      <h2 class="big">Precios transparentes</h2>
      <p><span class="comment">sin sorpresas. sin contratos largos.</span></p>
    </div>
    <div class="plans plans-3">
      <div class="plan-card">
        <div class="plan-tag">CHATBOT WEB IA BÁSICO</div>
        <div class="plan-price"><span class="num">$149.990</span><span class="period">pago único</span></div>
        <div class="plan-price-sub">+ $49.990/mes</div>
        <div class="plan-items">
          <div class="plan-item"><span class="check">✓</span><span>Chatbot IA entrenado con la información de tu negocio</span></div>
          <div class="plan-item"><span class="check">✓</span><span>Instalado en tu sitio web</span></div>
          <div class="plan-item"><span class="check">✓</span><span>Transferencia automática a un humano cuando no puede resolver</span></div>
          <div class="plan-item"><span class="check">✓</span><span>Capacitación de tu equipo</span></div>
          <div class="plan-item"><span class="check">✓</span><span>Primeros 30 días de soporte</span></div>
          <div class="plan-item"><span class="check">✓</span><span>Listo en 1 semana</span></div>
        </div>
        <a href="#contacto" class="plan-btn">Comenzar ahora</a>
      </div>
      <div class="plan-card highlight">
        <div class="plan-badge">RECOMENDADO</div>
        <div class="plan-tag">CHATBOT IA + AGENDA + RRSS</div>
        <div class="plan-price"><span class="num">$249.990</span><span class="period">pago único</span></div>
        <div class="plan-price-sub">+ $99.990/mes</div>
        <div class="plan-items">
          <div class="plan-item"><span class="check">✓</span><span>Chatbot IA entrenado con la información de tu negocio</span></div>
          <div class="plan-item"><span class="check">✓</span><span>Instalado en tu sitio web, WhatsApp e Instagram</span></div>
          <div class="plan-item"><span class="check">✓</span><span>Agenda automática (Google Calendar, Calendly o Agenda Pro)</span></div>
          <div class="plan-item"><span class="check">✓</span><span>Transferencia automática a un humano cuando no puede resolver</span></div>
          <div class="plan-item"><span class="check">✓</span><span>Capacitación de tu equipo</span></div>
          <div class="plan-item"><span class="check">✓</span><span>Listo en 2 semanas</span></div>
        </div>
        <a href="#contacto" class="plan-btn solid">Comenzar ahora</a>
      </div>
      <div class="plan-card">
        <div class="plan-tag">CHATBOT IA EXPERTO + RRSS + VOICEBOT</div>
        <div class="plan-price"><span class="num">$449.990</span><span class="period">pago único</span></div>
        <div class="plan-price-sub">+ $179.990/mes</div>
        <div class="plan-items">
          <div class="plan-item"><span class="check">✓</span><span>Chatbot IA entrenado con la información de tu negocio</span></div>
          <div class="plan-item"><span class="check">✓</span><span>Instalado en sitio web, WhatsApp, Instagram y llamadas</span></div>
          <div class="plan-item"><span class="check">✓</span><span>Voicebot: contesta y agenda por voz</span></div>
          <div class="plan-item"><span class="check">✓</span><span>Agenda automática (Google Calendar, Calendly o Agenda Pro)</span></div>
          <div class="plan-item"><span class="check">✓</span><span>Capacitación de tu equipo</span></div>
          <div class="plan-item"><span class="check">✓</span><span>Listo en 3 semanas</span></div>
        </div>
        <a href="#contacto" class="plan-btn">Comenzar ahora</a>
      </div>
    </div>
    <div class="addon-wrap">
      <div class="addon-plus">+</div>
      <div class="addon-card">
        <div class="addon-main">
          <span class="plan-tag">LANDING PAGE PROFESIONAL</span>
          <h3>¿Necesitas también una página web?</h3>
          <div class="addon-items-inline">
            <span>✓ Diseño mobile-first con tu marca</span>
            <span>✓ SEO básico configurado</span>
            <span>✓ Integrado con tu chatbot Dominga</span>
            <span>✓ Google Analytics configurado</span>
            <span>✓ Entrega en 1 semana</span>
          </div>
        </div>
        <div class="addon-cta">
          <div class="plan-price"><span class="num">$199.990</span><span class="period">pago único · aplica a cualquier plan</span></div>
          <a href="#contacto" class="plan-btn">Comenzar ahora</a>
        </div>
      </div>
      <p class="addon-note">¿Contratas landing + cualquier plan de chatbot juntos? Escríbenos y te armamos un precio combinado.</p>
    </div>
  </section>

  <!-- FAQ -->
  <section id="faq" class="faq reveal" data-screen-label="FAQ">
    <span class="sec-num">06</span>
    <div class="sec-head">
      <span class="label"><b>./</b>faq</span>
      <h2>Preguntas frecuentes</h2>
    </div>
    <div class="faq-list" id="faqList">
      <div class="faq-item">
        <button class="faq-q" type="button" aria-expanded="false"><span>¿Necesito conocimientos técnicos?</span><span class="chev">+</span></button>
        <div class="faq-a">No. Nosotros hacemos toda la configuración técnica. Tú solo nos das información sobre tu negocio.</div>
      </div>
      <div class="faq-item">
        <button class="faq-q" type="button" aria-expanded="false"><span>¿Cuánto tarda la implementación?</span><span class="chev">+</span></button>
        <div class="faq-a">Entre 2 y 3 semanas desde que contratas hasta que está 100% operativo.</div>
      </div>
      <div class="faq-item">
        <button class="faq-q" type="button" aria-expanded="false"><span>¿Funciona con mi calendario actual?</span><span class="chev">+</span></button>
        <div class="faq-a">Sí. Se integra con Google Calendar, Calendly, o casi cualquier sistema.</div>
      </div>
      <div class="faq-item">
        <button class="faq-q" type="button" aria-expanded="false"><span>¿Puedo cancelar cuando quiera?</span><span class="chev">+</span></button>
        <div class="faq-a">Sí. Sin penalizaciones, sin contratos largos. Cancela cuando quieras.</div>
      </div>
      <div class="faq-item">
        <button class="faq-q" type="button" aria-expanded="false"><span>¿Qué pasa con los datos de mis clientes?</span><span class="chev">+</span></button>
        <div class="faq-a">Máxima seguridad. Encriptación de nivel empresarial. Cumplimos con la Ley de Protección de Datos Personales de Chile.</div>
      </div>
    </div>
  </section>

  <!-- CTA FINAL -->
  <section id="contacto" class="cta reveal" data-screen-label="Contacto">
    <span class="sec-num">07</span>
    <div class="cta-left">
      <span class="label"><b>./</b>contacto</span>
      <h2>¿Listo para automatizar tu atención?</h2>
      <p><span class="comment">sin compromiso. sin costo. solo conversamos.</span></p>
      <a href="mailto:hola@atiendemelapyme.cl?subject=Quiero%20agendar%20una%20demo" class="btn-primary" style="align-self:flex-start;margin-top:6px;">Agendar consulta gratuita</a>
    </div>
    <div class="cta-card">
      <div class="cta-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square"><path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"></path></svg></div>
      <div class="lbl">Agenda una demo</div>
      <div class="sub">20 minutos, sin compromiso. Vemos tu caso en vivo.</div>
    </div>
    <div class="cta-card">
      <div class="cta-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22z"></path></svg></div>
      <div class="lbl">Escríbenos</div>
      <div class="sub">hola@atiendemelapyme.cl — respondemos el mismo día.</div>
    </div>
  </section>

  <footer>
    <span class="cell"><span class="ok-dot"></span>SYS.OK — © 2026 ATIÉNDEME LA PYME</span>
    <div class="links">
      <a href="#">Términos</a>
      <a href="/privacidad">Privacidad</a>
      <a href="mailto:hola@atiendemelapyme.cl">Contacto</a>
    </div>
  </footer>

</main>

<script>
/* ---------- menú lateral ---------- */
const menuOverlay = document.getElementById('menuOverlay');
document.addEventListener('click', (e) => {
  if (e.target.closest('#menuToggle')) { document.body.classList.toggle('menu-open'); syncMenu(); return; }
  if (e.target === menuOverlay || e.target.closest('.menu-link')) { document.body.classList.remove('menu-open'); syncMenu(); }
});
function syncMenu(){ document.getElementById('menuToggle').setAttribute('aria-expanded', document.body.classList.contains('menu-open')); }
document.addEventListener('keydown', (e)=>{ if(e.key==='Escape' && document.body.classList.contains('menu-open')){ document.body.classList.remove('menu-open'); syncMenu(); } });

/* ---------- voice bars ---------- */
const voiceHeights = [10,18,30,42,26,38,16,32,22,40,12,28,36,18,24,34,14,20];
const vb = document.getElementById('voiceBars');
voiceHeights.forEach((h,i)=>{
  const el = document.createElement('i');
  el.style.height = h+'px';
  if(i%4===0){ el.classList.add('on'); el.style.animationDelay=(i*0.1)+'s'; }
  vb.appendChild(el);
});

/* ---------- calendar grid ---------- */
const days = ['L','M','M','J','V','S','D'];
const activeCells = [3,6,10,12];
const cg = document.getElementById('calGrid');
days.forEach(d=>{ const el=document.createElement('div'); el.className='h'; el.textContent=d; cg.appendChild(el); });
for(let i=0;i<14;i++){
  const el = document.createElement('div');
  el.className = 'c' + (activeCells.includes(i)?' on':'');
  cg.appendChild(el);
}

/* ---------- diagrama de canales (SVG) ---------- */
function cssVar(n){ return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
const chansBase = [
  {name:'WhatsApp', color:'#25D366', y:30},
  {name:'Instagram', color:'#E1306C', y:85},
  {name:'Facebook', color:'#1877F2', y:140},
  {name:'Correo', color:'#F59E0B', y:195},
  {name:'Calendario', color:null, y:251},
];
function drawDiagram(){
  const A1 = cssVar('--accent'), BG = cssVar('--bg'), PANEL = cssVar('--panel'), HARD = cssVar('--line-hard'), MUT = cssVar('--muted');
  const chans = chansBase.map(c=>({...c, color:c.color||A1}));
  let svg = `<svg width="420" height="292" viewBox="0 0 420 292" style="max-width:100%;height:auto;">`;
  chans.forEach((c)=>{
    svg += `<path d="M 78 140 L 180 140 L 200 ${c.y+15} L 268 ${c.y+15}" stroke="${c.color}" stroke-width="1.5" fill="none" opacity="0.35"/>`;
  });
  svg += `<rect x="26" y="112" width="56" height="56" fill="none" stroke="${A1}" stroke-width="2" opacity="0"><animate attributeName="opacity" values="0;0.5;0" dur="2.2s" repeatCount="indefinite"/><animate attributeName="x" values="26;18;26" dur="2.2s" repeatCount="indefinite"/><animate attributeName="y" values="112;104;112" dur="2.2s" repeatCount="indefinite"/><animate attributeName="width" values="56;72;56" dur="2.2s" repeatCount="indefinite"/><animate attributeName="height" values="56;72;56" dur="2.2s" repeatCount="indefinite"/></rect>`;
  svg += `<rect x="30" y="116" width="48" height="48" fill="${BG}" stroke="${A1}" stroke-width="2"/>`;
  svg += `<text x="54" y="147" text-anchor="middle" fill="${A1}" font-size="16" font-weight="700" font-family="JetBrains Mono,monospace">&gt;_</text>`;
  chans.forEach((c,i)=>{
    const pathIn = `M 268 ${c.y+15} L 200 ${c.y+15} L 180 140 L 78 140`;
    svg += `<circle r="4" fill="${c.color}"><animateMotion dur="2.2s" begin="${i*0.4}s" repeatCount="indefinite" path="${pathIn}"/></circle>`;
  });
  chans.forEach((c,i)=>{
    svg += `<g><rect x="268" y="${c.y}" width="132" height="30" fill="${PANEL}" stroke="${HARD}" stroke-width="1"/>`;
    svg += `<rect x="280" y="${c.y+11}" width="8" height="8" fill="${c.color}" style="animation:nodepulse 2.2s ease-in-out ${i*0.4}s infinite"/>`;
    svg += `<text x="298" y="${c.y+20}" fill="${MUT}" font-size="11" font-family="JetBrains Mono,monospace">${c.name}</text></g>`;
  });
  svg += `</svg>`;
  svg += `<div style="text-align:center;margin-top:14px;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:${MUT};font-family:'JetBrains Mono',monospace;">mensajes en tiempo real &rarr; un solo cerebro</div>`;
  document.getElementById('diagramHost').innerHTML = svg;
}
drawDiagram();

/* ---------- selector de paleta ---------- */
(function(){
  const saved = localStorage.getItem('atp_palette');
  function apply(p){
    if(p==='amber'){ document.documentElement.removeAttribute('data-palette'); }
    else{ document.documentElement.setAttribute('data-palette', p); }
    document.querySelectorAll('.pal-btn').forEach(b=>b.classList.toggle('active', b.dataset.pal===p));
    localStorage.setItem('atp_palette', p);
    drawDiagram();
  }
  if(saved && saved!=='amber' && document.querySelector('.pal-btn[data-pal="'+saved+'"]')) apply(saved); else if(saved && saved!=='amber'){ localStorage.setItem('atp_palette','amber'); }
  document.querySelectorAll('.pal-btn').forEach(b=>b.addEventListener('click', ()=>apply(b.dataset.pal)));
})();

/* ---------- conversaciones por tab ---------- */
const convos = [
  [
    {who:'c', text:'Hola! 👋 ¿Tienen hora esta semana?'},
    {who:'b', text:'¡Hola! Sí, jueves 11:00 o viernes 16:30 con el Dr. Rojas 😊 ¿Cuál prefieres?'},
    {who:'c', text:'El jueves a las 11 porfa 👍'},
    {who:'b', text:'Listo ✓ Agendado jueves 11:00. Te llega un recordatorio 1h antes 📅'},
  ],
  [
    {who:'c', text:'«Quería una hora con cardiología»'},
    {who:'b', text:'«¡Claro! Viernes 9:30 o lunes 15:00. ¿Cuál prefiere?»'},
    {who:'c', text:'«El viernes 9:30, por favor.»'},
    {who:'b', text:'«Agendado. Le enviamos la confirmación. ¡Buen día!»'},
  ],
  [
    {who:'c', text:'Vi su post de chequeos 👀 ¿hacen control general?'},
    {who:'b', text:'¡Sí! Incluye presión, glicemia y médico general, desde $25.000 😊 ¿Te agendo?'},
    {who:'c', text:'Sí, el sábado si se puede 🙌'},
    {who:'b', text:'Perfecto ✓ Sábado 10:00 confirmado 🎉'},
  ],
];
const phoneFrame = document.getElementById('phoneFrame');
const phoneScreen = document.getElementById('phoneScreen');
function waMsgs(msgs){
  const times = ['10:19','10:20','10:20','10:21'];
  return msgs.map((m,idx)=>`<div class="ph-row ${m.who==='b'?'out':'in'}"><div class="ph-bubble">${m.text}<span class="ph-wa-time">${times[idx%times.length]}${m.who==='b'?'<svg width="14" height="10" viewBox="0 0 16 11" fill="none" style="vertical-align:-1px;margin-left:3px"><path d="M1 5.5L4.5 9L11 1.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M5.5 5.5L9 9L15.5 1.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>':''}</span></div></div>`).join('');
}
function igMsgs(msgs){
  return msgs.map((m)=>`<div class="ph-row ${m.who==='b'?'out-ig':'in-ig'}"><div class="ph-bubble">${m.text}</div></div>`).join('');
}
function renderPhone(i){
  const tb = document.getElementById('transcriptBubble');
  if(i!==1){ tb.className = 'transcript-bubble'; tb.innerHTML=''; }
  if(i===0){
    phoneScreen.innerHTML = `
      <div class="ph-status"><span>9:41</span><span style="display:flex;align-items:center;gap:3px"><svg width="12" height="9" viewBox="0 0 16 11" fill="none"><rect x="0" y="7" width="3" height="4" rx="0.5" fill="currentColor"/><rect x="4.3" y="5" width="3" height="6" rx="0.5" fill="currentColor"/><rect x="8.6" y="3" width="3" height="8" rx="0.5" fill="currentColor"/><rect x="12.9" y="1" width="3" height="10" rx="0.5" fill="currentColor"/></svg><svg width="11" height="9" viewBox="0 0 16 12" fill="none"><path d="M1 4.5C5.5 0.5 10.5 0.5 15 4.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M3.5 7C6.7 4.2 9.3 4.2 12.5 7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><circle cx="8" cy="10" r="1.3" fill="currentColor"/></svg><svg width="19" height="10" viewBox="0 0 24 12" fill="none"><rect x="1" y="1" width="19" height="10" rx="2.5" stroke="currentColor" stroke-width="1.2"/><rect x="2.5" y="2.5" width="15" height="7" rx="1.2" fill="currentColor"/><rect x="21" y="4" width="1.6" height="4" rx="0.8" fill="currentColor"/></svg></span></div>
      <div class="ph-wa-head"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 19l-7-7 7-7" stroke="#53bdeb" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg><span class="ph-wa-avatar">+</span><div style="flex:1;min-width:0"><div class="ph-wa-name">Centro Médico</div><div class="ph-wa-sub">últ. vez hoy a la(s) 10:21</div></div><svg width="19" height="19" viewBox="0 0 24 24" fill="none"><rect x="2" y="6" width="14" height="12" rx="2.5" stroke="#53bdeb" stroke-width="1.7"/><path d="M16 10.5l5.5-3.3a1 1 0 011.5.9v9.8a1 1 0 01-1.5.9L16 15.5" stroke="#53bdeb" stroke-width="1.7" stroke-linejoin="round"/></svg><svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M6.6 10.8c1.5 3 4 5.5 7 7l2.1-2.1c.3-.3.7-.4 1.1-.3 1.2.4 2.5.6 3.8.6.6 0 1 .4 1 1V21c0 .6-.4 1-1 1C10.7 22 2 13.3 2 2.6 2 2 2.4 1.6 3 1.6h4c.6 0 1 .4 1 1 0 1.3.2 2.6.6 3.8.1.4 0 .8-.3 1.1L6.6 10.8z" stroke="#53bdeb" stroke-width="1.5" stroke-linejoin="round" fill="none"/></svg></div>
      <div class="ph-wa-body"><div class="ph-wa-date">Hoy</div><div class="ph-wa-lock"><svg width="9" height="9" viewBox="0 0 24 24" fill="#fdd88a" style="vertical-align:-1px;margin-right:3px"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4" stroke="#fdd88a" stroke-width="2" fill="none"/></svg>Los mensajes y las llamadas están cifrados de extremo a extremo.</div>${waMsgs(convos[0])}</div>
      <div class="ph-wa-input"><div class="wa-pill"></div><div class="mic"><svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 15a3 3 0 003-3V6a3 3 0 00-6 0v6a3 3 0 003 3z" fill="#fff"/><path d="M17 11a5 5 0 01-10 0" stroke="#fff" stroke-width="1.8" stroke-linecap="round" fill="none"/><path d="M12 16v3" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/></svg></div></div>
    `;
  } else if(i===1){
    const prev = convos[1][convos[1].length-2];
    const last = convos[1][convos[1].length-1];
    document.getElementById('transcriptBubble').className = 'transcript-bubble show';
    document.getElementById('transcriptBubble').innerHTML = `<div class="transcript-label"><span class="dot-live"></span>Transcripción en vivo</div><div class="transcript-line"><b>Cliente:</b> ${prev.text}</div><div class="transcript-line"><b>Asistente:</b> ${last.text}</div>`;
    phoneScreen.innerHTML = `
      <div class="ph-status"><span>9:41</span><span style="display:flex;align-items:center;gap:3px"><svg width="12" height="9" viewBox="0 0 16 11" fill="none"><rect x="0" y="7" width="3" height="4" rx="0.5" fill="currentColor"/><rect x="4.3" y="5" width="3" height="6" rx="0.5" fill="currentColor"/><rect x="8.6" y="3" width="3" height="8" rx="0.5" fill="currentColor"/><rect x="12.9" y="1" width="3" height="10" rx="0.5" fill="currentColor"/></svg><svg width="11" height="9" viewBox="0 0 16 12" fill="none"><path d="M1 4.5C5.5 0.5 10.5 0.5 15 4.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M3.5 7C6.7 4.2 9.3 4.2 12.5 7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><circle cx="8" cy="10" r="1.3" fill="currentColor"/></svg><svg width="19" height="10" viewBox="0 0 24 12" fill="none"><rect x="1" y="1" width="19" height="10" rx="2.5" stroke="currentColor" stroke-width="1.2"/><rect x="2.5" y="2.5" width="15" height="7" rx="1.2" fill="currentColor"/><rect x="21" y="4" width="1.6" height="4" rx="0.8" fill="currentColor"/></svg></span></div>
      <div class="ph-call-body">
        <div class="ph-call-avatar">+</div>
        <div class="ph-call-name">Centro Médico</div>
        <div class="ph-call-sub">móvil · 03:45</div>
        <div class="ph-call-grid">
          <div class="ph-call-btn"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 15a3 3 0 003-3V6a3 3 0 00-6 0v4" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/><path d="M6 11a6 6 0 0010.7 3.7M18 11a6 6 0 00-.4-2.1" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/><path d="M12 18v3M4 4l16 16" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/></svg></div><div class="ph-call-btn wa-active"><svg width="18" height="18" viewBox="0 0 18 18" fill="#111"><circle cx="2" cy="2" r="1.7"/><circle cx="9" cy="2" r="1.7"/><circle cx="16" cy="2" r="1.7"/><circle cx="2" cy="9" r="1.7"/><circle cx="9" cy="9" r="1.7"/><circle cx="16" cy="9" r="1.7"/><circle cx="2" cy="16" r="1.7"/><circle cx="9" cy="16" r="1.7"/><circle cx="16" cy="16" r="1.7"/></svg></div><div class="ph-call-btn"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="#fff"/><path d="M17 8.5a5 5 0 010 7M19.5 6a8.5 8.5 0 010 12" stroke="#fff" stroke-width="1.8" stroke-linecap="round" fill="none"/></svg></div>
          <div class="ph-call-btn"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="9" cy="8" r="3.2" stroke="#fff" stroke-width="1.6"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/><path d="M18 8v6M15 11h6" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/></svg></div><div class="ph-call-btn"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="2" y="6" width="14" height="12" rx="2.5" stroke="#fff" stroke-width="1.7"/><path d="M16 10.5l5.5-3.3a1 1 0 011.5.9v9.8a1 1 0 01-1.5.9L16 15.5" stroke="#fff" stroke-width="1.7" stroke-linejoin="round"/></svg></div><div class="ph-call-btn"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="3.6" stroke="#fff" stroke-width="1.7"/><path d="M4.5 20c0-4.1 3.4-7.5 7.5-7.5s7.5 3.4 7.5 7.5" stroke="#fff" stroke-width="1.7" stroke-linecap="round"/></svg></div>
        </div>
        <div class="ph-call-end"><svg width="22" height="22" viewBox="0 0 24 24" fill="#fff" style="transform:rotate(135deg);transform-box:fill-box;transform-origin:center"><path d="M6.6 10.8c1.5 3 4 5.5 7 7l2.1-2.1c.3-.3.7-.4 1.1-.3 1.2.4 2.5.6 3.8.6.6 0 1 .4 1 1V21c0 .6-.4 1-1 1C10.7 22 2 13.3 2 2.6 2 2 2.4 1.6 3 1.6h4c.6 0 1 .4 1 1 0 1.3.2 2.6.6 3.8.1.4 0 .8-.3 1.1L6.6 10.8z"/></svg></div>
      </div>
    `;
  } else {
    phoneScreen.innerHTML = `
      <div class="ph-status ph-status-light"><span>9:41</span><span style="display:flex;align-items:center;gap:3px"><svg width="12" height="9" viewBox="0 0 16 11" fill="none"><rect x="0" y="7" width="3" height="4" rx="0.5" fill="currentColor"/><rect x="4.3" y="5" width="3" height="6" rx="0.5" fill="currentColor"/><rect x="8.6" y="3" width="3" height="8" rx="0.5" fill="currentColor"/><rect x="12.9" y="1" width="3" height="10" rx="0.5" fill="currentColor"/></svg><svg width="11" height="9" viewBox="0 0 16 12" fill="none"><path d="M1 4.5C5.5 0.5 10.5 0.5 15 4.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M3.5 7C6.7 4.2 9.3 4.2 12.5 7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><circle cx="8" cy="10" r="1.3" fill="currentColor"/></svg><svg width="19" height="10" viewBox="0 0 24 12" fill="none"><rect x="1" y="1" width="19" height="10" rx="2.5" stroke="currentColor" stroke-width="1.2"/><rect x="2.5" y="2.5" width="15" height="7" rx="1.2" fill="currentColor"/><rect x="21" y="4" width="1.6" height="4" rx="0.8" fill="currentColor"/></svg></span></div>
      <div class="ph-ig-head"><span class="ph-ig-avatar">+</span><div><div class="ph-ig-name">centromedico.andes</div><div class="ph-ig-sub">Activo hace 5 min</div></div></div>
      <div class="ph-ig-body">${igMsgs(convos[2])}</div>
      <div class="ph-ig-input"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111" stroke-width="1.6"><circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/></svg><div class="ig-pill"><span style="font-size:11px;color:#999">Mensaje...</span></div><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#111" stroke-width="1.6"><rect x="3" y="6" width="18" height="14" rx="2"/><circle cx="12" cy="13" r="3.2"/></svg><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#111" stroke-width="1.6"><path d="M12 21s-8-5-8-11a5 5 0 019-3 5 5 0 019 3c0 6-8 11-8 11z"/></svg></div>
    `;
  }
}
function scrollPhoneToBottom(){
  const body = phoneScreen.querySelector('.ph-wa-body, .ph-ig-body');
  if(body) body.scrollTop = body.scrollHeight;
}
document.getElementById('tabRow').addEventListener('click', (e)=>{
  const btn = e.target.closest('.tab-btn');
  if(!btn) return;
  document.querySelectorAll('.tab-btn').forEach(b=>{ b.classList.remove('active'); b.setAttribute('aria-selected','false'); });
  btn.classList.add('active'); btn.setAttribute('aria-selected','true');
  renderPhone(Number(btn.dataset.tab));
  scrollPhoneToBottom();
});
renderPhone(0);
scrollPhoneToBottom();

/* ---------- FAQ acordeón ---------- */
document.getElementById('faqList').addEventListener('click', (e)=>{
  const q = e.target.closest('.faq-q');
  if(!q) return;
  const item = q.closest('.faq-item');
  const wasOpen = item.classList.contains('open');
  document.querySelectorAll('.faq-item').forEach(el=>{ el.classList.remove('open'); el.querySelector('.faq-q').setAttribute('aria-expanded','false'); });
  if(!wasOpen){ item.classList.add('open'); q.setAttribute('aria-expanded','true'); }
});

/* ---------- reveal on scroll ---------- */
const io = new IntersectionObserver((entries)=>{
  entries.forEach(en=>{ if(en.isIntersecting){ en.target.classList.add('in'); io.unobserve(en.target); } });
},{threshold:0.12});
document.querySelectorAll('.reveal').forEach(el=>io.observe(el));
</script>

<!-- ATP CHAT WIDGET -->
<button id="atp-chat-btn" aria-label="Abrir chat">
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square">
    <path d="M4 5.5C4 4.7 4.7 4 5.5 4h13c.8 0 1.5.7 1.5 1.5v10c0 .8-.7 1.5-1.5 1.5H9l-4 3.5v-3.5H5.5C4.7 17 4 16.3 4 15.5v-10z"></path>
    <line x1="8" y1="9" x2="16" y2="9"></line>
    <line x1="8" y1="12.5" x2="13" y2="12.5"></line>
  </svg>
</button>

<div id="atp-chat-panel" role="dialog" aria-label="Chat con Dominga">
  <div id="atp-chat-header">
    <div id="atp-chat-avatar">👩‍💻</div>
    <div>
      <div id="atp-chat-title">Dominga</div>
      <div id="atp-chat-subtitle">El equipo también puede ayudar</div>
    </div>
    <button id="atp-chat-close" aria-label="Cerrar chat">✕</button>
  </div>
  <div id="atp-chat-messages" aria-live="polite"></div>
  <div id="atp-chat-input-wrap">
    <div id="atp-chat-input-row">
      <input id="atp-chat-input" type="text" placeholder="Haz una pregunta..." autocomplete="off">
      <button id="atp-chat-send" aria-label="Enviar mensaje">➤</button>
    </div>
  </div>
</div>

<script>
(function () {
  const atpBtn = document.getElementById('atp-chat-btn');
  const atpPanel = document.getElementById('atp-chat-panel');
  const atpClose = document.getElementById('atp-chat-close');
  const atpMessages = document.getElementById('atp-chat-messages');
  const atpInput = document.getElementById('atp-chat-input');
  const atpSend = document.getElementById('atp-chat-send');

  let history = [];
  let opened = false;
  let isSending = false;

  function generateId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      return window.crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  let sessionId = localStorage.getItem('atp_session_id');
  if (!sessionId) {
    sessionId = generateId();
    localStorage.setItem('atp_session_id', sessionId);
  }

  atpBtn.addEventListener('click', () => {
    atpPanel.classList.add('open');
    setTimeout(()=>atpInput.focus(), 250);
    if (!opened) {
      opened = true;
      const greetings = [
        {
          first: '¡Hola! 👋 Por acá Dominga, de Atiéndeme la Pyme. ¿Cómo va todo?',
          second: 'Dime no más de qué es tu negocio 💡 y te muestro al toque cómo automatizar tus respuestas o cotizaciones 📲 para no dejar ir ni un solo cliente. ⚡'
        },
        {
          first: '¡Hola! 😊 Qué gusto saludarte. Soy Dominga de Atiéndeme la Pyme.',
          second: 'Cuéntame brevemente ✍️ a qué te dedicas y te envío directo un par de ideas concretas 🚀 para que la IA atienda tus chats 24/7. 📲'
        },
        {
          first: 'Estimado/a, un gusto saludarte. 💼 Te habla Dominga de Atiéndeme la Pyme.',
          second: 'Si me indicas el rubro 📊 de tu empresa, te preparo al instante ejemplos prácticos ⚡ para reducir tareas manuales y optimizar tus ventas por WhatsApp. 📈'
        },
        {
          first: '¡Hola! 🌟 Espero que estés teniendo un gran día. Por aquí Dominga de Atiéndeme la Pyme.',
          second: '¿De qué es tu negocio? 🏪 Cuéntame un poco y te muestro cómo dejar un asistente respondiendo por ti 💬 a cualquier hora, ¡incluso los fines de semana! ⏱️'
        },
        {
          first: '¡Hola! 🙌 Te doy la bienvenida a Atiéndeme la Pyme. Soy Dominga.',
          second: '¡Dime qué vendes u ofreces! 🏷️ Te armo altiro una propuesta 🤖 para responder consultas y agendar citas 🗓️ en automático para tu caso. 🤝'
        },
        {
          first: '¡Hola! 📲 Qué tal. Soy Dominga de Atiéndeme la Pyme.',
          second: 'Coméntame de qué se trata tu pyme 💡 y te muestro cómo resolver las dudas de tus clientes en segundos ⚡ sin que tengas que estar pegado al celular. 😊'
        },
        {
          first: '¡Hola! 👋 Soy Dominga de Atiéndeme la Pyme. ¡Bienvenido/a!',
          second: '¿De qué es tu negocio? 🏢 Cuéntame y te muestro de inmediato 💡 cómo la IA puede atender 📲 y agendar por ti 🗓️ desde hoy.'
        }
      ];
      const rg = greetings[Math.floor(Math.random() * greetings.length)];
      addBubble(rg.first, 'bot');
      setTimeout(() => {
        addBubble('✏️ escribiendo...', 'bot-typing');
      }, 800);
      setTimeout(() => {
        document.querySelectorAll('.bot-typing').forEach(el => el.remove());
        addBubble(rg.second, 'bot');
      }, 1800);
    }
  });

  atpClose.addEventListener('click', () => atpPanel.classList.remove('open'));

  function addBubble(text, role) {
    const div = document.createElement('div');
    div.className = 'atp-msg ' + role;
    div.textContent = text;
    atpMessages.appendChild(div);
    atpMessages.scrollTop = atpMessages.scrollHeight;
    return div;
  }

  async function sendMessage() {
    if (isSending) return;
    const text = atpInput.value.trim();
    if (!text) return;

    isSending = true;
    atpSend.disabled = true;
    atpInput.value = '';
    addBubble(text, 'user');
    history.push({ role: 'user', content: text });

    const loadingDiv = addBubble('...', 'bot');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history, sessionId: sessionId })
      });

      let data;
      try {
        data = await res.json();
      } catch (parseErr) {
        loadingDiv.remove();
        addBubble('Ups, el servidor respondió de forma inesperada. Intenta de nuevo.', 'bot');
        return;
      }

      loadingDiv.remove();

      if (!res.ok || data.error) {
        addBubble('Ups, tuve un problema técnico. Intenta de nuevo en unos segundos.', 'bot');
        console.error('Error del servidor /api/chat:', data);
        return;
      }

      const botReply = data.reply ?? data.message ?? data.response ?? data.text ?? data.answer;

      if (botReply) {
        let scheduleData = null;
        let displayText = botReply;

        try {
          scheduleData = JSON.parse(botReply);
        } catch (e) {
          const jsonMatch = botReply.match(/\\{[\\s\\S]*"action"\\s*:\\s*"schedule"[\\s\\S]*\\}/);
          if (jsonMatch) {
            try {
              scheduleData = JSON.parse(jsonMatch[0]);
              displayText = botReply.replace(jsonMatch[0], '').trim();
            } catch (parseErr) {}
          }
        }

        if (scheduleData && scheduleData.action === 'schedule') {
          addBubble('Procesando tu cita...', 'bot');

          try {
            const scheduleRes = await fetch('/api/schedule', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                date: scheduleData.date,
                time: scheduleData.time,
                name: scheduleData.name,
                email: scheduleData.email,
                sessionId: sessionId
              })
            });

            const scheduleResult = await scheduleRes.json();

            if (scheduleRes.ok && scheduleResult.success) {
              addBubble(`✅ ${scheduleResult.message}\
\
Te enviaremos un correo de confirmación a ${scheduleData.email}`, 'bot');
              history.push({ role: 'assistant', content: `Cita agendada exitosamente para ${scheduleData.date} a las ${scheduleData.time}` });
            } else {
              addBubble(`❌ No pude agendar la cita: ${scheduleResult.error || 'Error desconocido'}`, 'bot');
            }
          } catch (scheduleErr) {
            addBubble('❌ Error al procesar tu cita. Intenta de nuevo.', 'bot');
            console.error('Scheduling error:', scheduleErr);
          }
        } else {
          if (displayText) {
            addBubble(displayText, 'bot');
            history.push({ role: 'assistant', content: displayText });
          }
        }
      } else {
        addBubble('No recibí una respuesta válida del servidor. Revisa la consola para más detalles.', 'bot');
        console.warn('Respuesta de /api/chat sin campo reconocido:', data);
      }

      if (data.debugInfo) {
        addBubble('🔧 DEBUG: ' + data.debugInfo, 'bot');
      }
    } catch (e) {
      loadingDiv.remove();
      addBubble('No pude conectarme. Revisa tu conexión e intenta de nuevo.', 'bot');
      console.error('Error de red al llamar /api/chat:', e);
    } finally {
      isSending = false;
      atpSend.disabled = false;
    }
  }

  atpSend.addEventListener('click', sendMessage);
  atpInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendMessage();
  });
})();
</script>


</body></html>
