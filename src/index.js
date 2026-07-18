<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Atiéndeme la Pyme — Tu negocio despierto, siempre</title>
<meta name="description" content="Agentes de IA que venden, atienden y agendan citas por ti, las 24 horas del día.">
<meta name="theme-color" content="#070503">
<meta property="og:type" content="website">
<meta property="og:title" content="Atiéndeme la Pyme — Tu negocio despierto, siempre">
<meta property="og:description" content="Agentes de IA que venden, atienden y agendan citas por ti, las 24 horas del día. Sin contratar más gente.">
<meta property="og:locale" content="es_CL">
<meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,500&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
:root{
  --bg:#070503;
  --bg2:#0D0A06;
  --glass:rgba(245,235,215,0.035);
  --glass-2:rgba(245,235,215,0.055);
  --line:rgba(245,235,215,0.08);
  --line-strong:rgba(245,235,215,0.14);
  --text:#F5F2EA;
  --muted:#9C968A;
  --muted2:#847C6E;
  --a1:#E8A33D;               /* dorado */
  --a2:#F0C27B;               /* ámbar claro */
  --a1-soft:rgba(232,163,61,0.14);
  --a2-soft:rgba(240,194,123,0.12);
  --grad:linear-gradient(100deg,var(--a1),var(--a2));
  --confirm:#4F9D8C;
  --ease-out:cubic-bezier(0.23,1,0.32,1);
  --ease-drawer:cubic-bezier(0.32,0.72,0,1);
  --spring:cubic-bezier(0.34,1.56,0.64,1);
  --press:cubic-bezier(0.16,0.8,0.7,1);
}
*{box-sizing:border-box;}
html{scroll-behavior:smooth;scroll-padding-top:88px;}
::selection{background:rgba(232,163,61,0.35);color:#F5F2EA;}
html{scrollbar-color:rgba(232,163,61,0.35) #0D0A06;}
body{margin:0;-webkit-tap-highlight-color:transparent;background:radial-gradient(ellipse 120% 80% at 50% -10%, #1A1006 0%, var(--bg) 55%),var(--bg);color:var(--text);font-family:'Inter',system-ui,-apple-system,sans-serif;-webkit-font-smoothing:antialiased;overflow-x:hidden;}
a{color:var(--text);text-decoration:none;transition:color 250ms var(--ease-out);}
a:hover{color:var(--a2);}
.display{font-family:'Plus Jakarta Sans',sans-serif;}
.mono{font-family:'JetBrains Mono',monospace;}
button{font-family:inherit;cursor:pointer;}
:focus-visible{outline:2px solid var(--a2);outline-offset:3px;border-radius:6px;}
h1,h2,h3{font-family:'Plus Jakarta Sans',sans-serif;}
p{text-wrap:pretty;}
.plan-price .num,.stat-num,.result-row .metric{font-variant-numeric:tabular-nums;}
@media (prefers-reduced-motion: reduce){
  *,*::before,*::after{animation-duration:0.01ms !important;animation-iteration-count:1 !important;transition-duration:0.01ms !important;scroll-behavior:auto !important;}
}

/* ---------- aurora de fondo ---------- */
.aurora{position:fixed;inset:0;z-index:0;pointer-events:none;overflow:hidden;}
.aurora::before,.aurora::after{content:'';position:absolute;border-radius:50%;filter:blur(110px);opacity:.55;}
.aurora::before{width:80vw;height:80vw;top:-40vw;left:50%;transform:translateX(-50%);background:radial-gradient(circle,rgba(232,163,61,0.5),rgba(180,90,20,0.18) 45%,transparent 70%);animation:drift1 26s ease-in-out infinite alternate;}
.aurora::after{width:60vw;height:60vw;bottom:-24vw;right:-22vw;top:auto;background:radial-gradient(circle,rgba(200,110,30,0.32),transparent 68%);animation:drift2 32s ease-in-out infinite alternate;}
@keyframes drift1{to{transform:translateX(-50%) translateY(7vh) scale(1.15);}}
@keyframes drift2{to{transform:translate(-5vw,10vh) scale(1.08);}}
.vignette{position:fixed;inset:0;z-index:0;pointer-events:none;background:radial-gradient(ellipse 90% 90% at 50% 50%,transparent 55%,rgba(0,0,0,0.55) 100%);}
.grid-overlay{position:fixed;inset:0;z-index:0;pointer-events:none;background-image:linear-gradient(rgba(245,235,215,0.022) 1px,transparent 1px),linear-gradient(90deg,rgba(245,235,215,0.022) 1px,transparent 1px);background-size:56px 56px;mask-image:radial-gradient(ellipse 90% 60% at 50% 0%,black 30%,transparent 80%);}

/* ---------- layout ---------- */
.wrap{max-width:1180px;margin:0 auto;position:relative;z-index:1;padding:0 24px;}
section{position:relative;}

/* ---------- reveal ---------- */
@keyframes revealFade{from{opacity:0;transform:translateY(24px);}to{opacity:1;transform:translateY(0);}}
.reveal{opacity:0;}
.reveal.in{animation:revealFade .6s var(--ease-out) both;}

/* ---------- animaciones auxiliares ---------- */
@keyframes flowdash{to{stroke-dashoffset:-24;}}
@keyframes nodepulse{0%,100%{opacity:.4;transform:scale(1);}50%{opacity:1;transform:scale(1.25);}}
@keyframes barmove{to{background-position:48px 0;}}
@keyframes heroIn{to{opacity:1;transform:translateY(0);}}
@keyframes shimmer{to{background-position:200% center;}}

/* ---------- nav ---------- */
.nav-header{position:fixed;top:16px;left:50%;transform:translateX(-50%);width:min(1180px,calc(100% - 32px));display:flex;align-items:center;justify-content:space-between;padding:10px 12px 10px 22px;z-index:50;border-radius:18px;background:rgba(10,12,21,0.55);border:1px solid var(--line);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);box-shadow:0 8px 32px rgba(0,0,0,0.35);}
.nav-logo{font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:15px;letter-spacing:-0.01em;display:flex;align-items:center;gap:10px;}
.nav-toggle{display:inline-flex;align-items:center;gap:9px;background:var(--glass);border:1px solid var(--line);border-radius:12px;padding:10px 18px;color:var(--muted);font-weight:600;font-size:13px;transition:border-color 300ms var(--ease-out),background 300ms var(--ease-out),color 300ms var(--ease-out),transform 300ms var(--spring),box-shadow 300ms ease;}
.nav-toggle:hover{border-color:rgba(232,163,61,0.5);color:var(--text);background:var(--glass-2);box-shadow:0 0 20px rgba(232,163,61,0.18);}
.nav-toggle:active{transform:scale(0.94);transition:transform 120ms var(--press);}
body.menu-open .nav-toggle{background:var(--grad);border-color:transparent;color:#1a1305;}
.nav-toggle .bars{position:relative;width:14px;height:10px;flex:0 0 14px;}
.nav-toggle .bars span{position:absolute;left:0;width:100%;height:2px;background:currentColor;border-radius:2px;transition:transform 250ms var(--ease-out);}
.nav-toggle .bars span:nth-child(1){top:0;}
.nav-toggle .bars span:nth-child(2){bottom:0;}
body.menu-open .nav-toggle .bars span:nth-child(1){transform:translateY(4px) rotate(45deg);}
body.menu-open .nav-toggle .bars span:nth-child(2){transform:translateY(-4px) rotate(-45deg);}

.menu-overlay{position:fixed;inset:0;background:rgba(3,4,8,0.6);backdrop-filter:blur(4px);opacity:0;pointer-events:none;transition:opacity 250ms var(--ease-out);z-index:39;}
body.menu-open .menu-overlay{opacity:1;pointer-events:auto;}
.menu-panel{position:fixed;top:0;right:0;height:100%;width:clamp(300px,38vw,440px);background:rgba(10,12,21,0.85);backdrop-filter:blur(28px);-webkit-backdrop-filter:blur(28px);border-left:1px solid var(--line);display:flex;flex-direction:column;padding:7em 2.4em 2.4em;overflow-y:auto;z-index:40;transform:translateX(105%);transition:transform 380ms var(--ease-drawer);}
body.menu-open .menu-panel{transform:translateX(0);}
.menu-list{list-style:none;margin:0 0 auto;padding:0;display:flex;flex-direction:column;gap:.4rem;counter-reset:mi;}
.menu-list li{counter-increment:mi;position:relative;}
.menu-list a{display:inline-block;font-family:'Plus Jakarta Sans',sans-serif;color:var(--text);font-weight:800;font-size:2.3rem;line-height:1.08;letter-spacing:-0.02em;padding:8px 2.4em 8px 2px;opacity:0;transform:translateY(16px);transition:opacity 300ms var(--ease-out),transform 300ms var(--ease-out),color 200ms var(--ease-out);}
body.menu-open .menu-list a{opacity:1;transform:translateY(0);}
.menu-list li:nth-child(1) a{transition-delay:60ms;}
.menu-list li:nth-child(2) a{transition-delay:120ms;}
.menu-list li:nth-child(3) a{transition-delay:180ms;}
.menu-list li:nth-child(4) a{transition-delay:240ms;}
.menu-list li:nth-child(5) a{transition-delay:300ms;}
.menu-list a:hover{color:var(--a2);transform:translateX(8px);}
.menu-list a::after{content:counter(mi,decimal-leading-zero);position:absolute;top:.35em;right:0;font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:400;background:var(--grad);-webkit-background-clip:text;background-clip:text;color:transparent;}
.menu-socials{margin-top:2.5rem;padding-top:2rem;border-top:1px solid var(--line);display:flex;flex-direction:column;gap:.75rem;}
.menu-socials-title{margin:0;font-family:'JetBrains Mono',monospace;font-size:.72rem;letter-spacing:.08em;text-transform:uppercase;color:var(--a2);}
.menu-socials-list{list-style:none;margin:0;padding:0;display:flex;gap:1.2rem;flex-wrap:wrap;}
.menu-socials-list a{font-size:1rem;font-weight:500;color:var(--muted);}
.menu-socials-list a:hover{color:var(--a2);}

/* ---------- hero ---------- */
.hero{padding:180px 0 110px;text-align:center;}
.sign-badge{display:inline-flex;align-items:center;gap:9px;font-family:'JetBrains Mono',monospace;font-size:12px;letter-spacing:.03em;color:var(--muted);border:1px solid rgba(232,163,61,0.35);border-radius:999px;padding:8px 18px 8px 13px;background:var(--a1-soft);backdrop-filter:blur(8px);cursor:default;transition:border-color 300ms ease,background 300ms ease,box-shadow 300ms ease,transform 380ms var(--spring);
  @starting-style{opacity:0;transform:translateY(12px) scale(0.94);}}
.sign-badge:hover{border-color:var(--a1);box-shadow:0 0 24px rgba(232,163,61,0.25);transform:translateY(-1px);}
.hero h1{margin:30px auto 0;font-weight:800;font-size:clamp(42px,6.6vw,76px);line-height:1.03;letter-spacing:-0.03em;max-width:900px;text-wrap:balance;opacity:0;transform:translateY(18px);animation:heroIn .8s var(--spring) forwards .15s;}
.hero h1 em{font-style:italic;font-weight:500;background:var(--grad);background-size:200% auto;-webkit-background-clip:text;background-clip:text;color:transparent;animation:shimmer 5s linear infinite;}
.hero p{margin:24px auto 0;max-width:560px;font-size:17.5px;line-height:1.7;color:var(--muted);opacity:0;transform:translateY(18px);animation:heroIn .8s var(--spring) forwards .3s;}
.btn-row{display:flex;gap:14px;margin-top:38px;justify-content:center;flex-wrap:wrap;opacity:0;transform:translateY(18px);animation:heroIn .8s var(--spring) forwards .42s;}
.btn-primary{position:relative;background:var(--grad);color:#1a1305;font-size:15px;font-weight:600;padding:14px 30px;border-radius:12px;border:none;box-shadow:0 8px 28px rgba(232,163,61,0.35);transition:transform 280ms var(--spring),box-shadow 280ms ease,filter 280ms ease;}
.btn-primary:hover{transform:translateY(-2px);box-shadow:0 14px 40px rgba(232,163,61,0.5);filter:brightness(1.08);}
.btn-primary:active{transform:scale(0.96);transition:transform 120ms var(--press);}
.btn-outline{border:1px solid var(--line-strong);color:var(--text);font-size:15px;font-weight:500;padding:14px 30px;border-radius:12px;background:var(--glass);backdrop-filter:blur(8px);transition:border-color 280ms var(--ease-out),background 280ms var(--ease-out),transform 280ms var(--spring),box-shadow 280ms ease;}
.btn-outline:hover{border-color:rgba(240,194,123,0.5);background:var(--glass-2);transform:translateY(-2px);box-shadow:0 8px 24px rgba(240,194,123,0.12);color:var(--text);}
.btn-outline:active{transform:scale(0.96);transition:transform 120ms var(--press);}

/* ---------- section headers ---------- */
.sec-head{text-align:center;max-width:640px;margin:0 auto 56px;}
.sec-head h2{margin:0;font-size:clamp(28px,3.6vw,40px);font-weight:800;letter-spacing:-0.02em;line-height:1.15;text-wrap:balance;}
.chip{display:inline-flex;align-items:center;gap:8px;font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--muted);border:1px solid var(--line);border-radius:999px;padding:6px 14px;background:var(--glass);backdrop-filter:blur(8px);}
.chip .dot{width:6px;height:6px;border-radius:50%;background:var(--grad);display:inline-block;box-shadow:0 0 8px rgba(232,163,61,0.8);}

/* ---------- glass card base ---------- */
.glass-card{position:relative;background:linear-gradient(160deg,rgba(245,235,215,0.05),rgba(245,235,215,0.015));border:1px solid var(--line);border-radius:20px;backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);}
.glass-card::before{content:'';position:absolute;inset:0;border-radius:inherit;padding:1px;background:linear-gradient(135deg,rgba(232,163,61,0.35),transparent 40%,transparent 60%,rgba(240,194,123,0.25));-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;opacity:0;transition:opacity 350ms var(--ease-out);pointer-events:none;}
.glass-card:hover::before{opacity:1;}

/* ---------- features ---------- */
.features{padding:96px 0;}
.features-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:22px;}
.feature{padding:38px 30px;display:flex;flex-direction:column;align-items:center;text-align:center;gap:14px;transition:transform 320ms var(--spring),box-shadow 320ms ease,border-color 320ms ease;}
.feature:hover{transform:translateY(-8px);box-shadow:0 24px 56px rgba(0,0,0,0.45),0 0 40px rgba(232,163,61,0.1);border-color:var(--line-strong);}
.feature .arrow{font-size:26px;width:58px;height:58px;border-radius:16px;display:flex;align-items:center;justify-content:center;background:var(--a1-soft);border:1px solid rgba(232,163,61,0.3);transition:transform 320ms var(--spring),box-shadow 320ms ease;}
.feature:hover .arrow{transform:scale(1.12) rotate(-4deg);box-shadow:0 0 28px rgba(232,163,61,0.3);}
.feature h3{margin:6px 0 0;font-size:19px;font-weight:700;letter-spacing:-0.01em;}
.feature p{margin:0;font-size:15px;line-height:1.65;color:var(--muted);}
.preview-box{margin:14px auto 0;width:100%;border:1px solid var(--line);border-radius:14px;background:rgba(5,6,11,0.6);overflow:hidden;text-align:left;}
.preview-dots{display:flex;gap:6px;padding:10px 12px;border-bottom:1px solid var(--line);}
.preview-dots span{width:9px;height:9px;border-radius:50%;display:inline-block;opacity:.8;}
.preview-body{padding:16px;min-height:118px;}
.chat-row{display:flex;margin-bottom:8px;}
.chat-row.mine{justify-content:flex-end;}
.chat-bubble{max-width:85%;font-size:11.5px;line-height:1.45;padding:7px 11px;border-radius:11px;background:rgba(245,235,215,0.06);color:#c6cad6;transition:opacity 380ms var(--ease-out),transform 380ms var(--ease-out);
  @starting-style{opacity:0;transform:translateX(-16px) scale(0.92);}}
.chat-row.mine .chat-bubble{background:var(--grad);color:#1a1305;}
.voice-bars{display:flex;align-items:flex-end;gap:3px;height:44px;}
.voice-bars i{width:5px;border-radius:2px;background:rgba(245,235,215,0.12);display:block;}
.voice-bars i.on{background:var(--a2);box-shadow:0 0 8px rgba(240,194,123,0.6);animation:nodepulse 1.8s ease-in-out infinite;}
.voice-meta{font-family:'JetBrains Mono',monospace;font-size:10.5px;color:var(--muted2);display:flex;gap:8px;align-items:center;margin-top:10px;}
.voice-meta .live{width:6px;height:6px;border-radius:50%;background:var(--confirm);display:inline-block;box-shadow:0 0 8px rgba(79,157,140,0.7);}
.cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin-bottom:10px;}
.cal-grid .h{font-family:'JetBrains Mono',monospace;font-size:9px;color:var(--muted2);text-align:center;}
.cal-grid .c{height:16px;border-radius:4px;background:rgba(245,235,215,0.04);border:1px solid transparent;}
.cal-grid .c.on{background:var(--a1-soft);border:1px solid rgba(232,163,61,0.45);box-shadow:0 0 10px rgba(232,163,61,0.2);}
.cal-meta{font-family:'JetBrains Mono',monospace;font-size:10.5px;color:var(--muted2);}

/* ---------- canales ---------- */
.canales{padding:80px 0;display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:48px;align-items:center;}
.canales-diagram{display:flex;align-items:center;justify-content:center;padding:32px;border-radius:24px;}
.canales-text{display:flex;flex-direction:column;gap:20px;}
.canales-text h2{margin:0;font-size:clamp(24px,2.8vw,31px);line-height:1.32;letter-spacing:-0.01em;font-weight:700;}
.canales-text h2 span{color:var(--muted);font-weight:500;}
.canales-text p{margin:0;font-size:16.5px;line-height:1.75;color:var(--muted);max-width:480px;}
.chip-inline{align-self:flex-start;}

/* ---------- banner ---------- */
.scale-banner{padding:90px 0;text-align:center;}
.scale-banner .row{font-family:'Plus Jakarta Sans',sans-serif;font-size:clamp(21px,3.4vw,30px);font-weight:700;letter-spacing:-0.01em;line-height:1.6;display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:12px;max-width:780px;margin:0 auto;}
.pill{display:inline-flex;align-items:center;gap:8px;background:var(--glass);border:1px solid var(--line-strong);border-radius:999px;padding:8px 20px;font-family:'Inter',sans-serif;font-size:.58em;font-weight:600;backdrop-filter:blur(8px);transition:border-color 250ms var(--ease-out),box-shadow 250ms ease,transform 250ms var(--spring);}
.pill:hover{border-color:rgba(232,163,61,0.55);box-shadow:0 0 24px rgba(232,163,61,0.18);transform:translateY(-2px);}
.pill em{font-style:normal;background:var(--grad);-webkit-background-clip:text;background-clip:text;color:transparent;}

/* ---------- 24/7 ---------- */
.always{padding:80px 0;display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:48px;align-items:center;}
.always-text{display:flex;flex-direction:column;gap:20px;}
.always-text h2{margin:0;font-size:clamp(28px,3.4vw,36px);line-height:1.18;letter-spacing:-0.02em;font-weight:800;max-width:400px;}
.always-text p{margin:0;font-size:16.5px;line-height:1.75;color:var(--muted);max-width:440px;}
.activity-card{width:100%;padding:26px 24px;display:flex;flex-direction:column;gap:16px;}
.activity-head{display:flex;justify-content:space-between;font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--muted2);}
.activity-head .on{color:var(--confirm);}
.activity-row{display:flex;align-items:center;gap:14px;}
.activity-row .label{font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--muted2);width:96px;flex-shrink:0;}
.activity-bar{flex:1;height:8px;border-radius:4px;overflow:hidden;background-size:48px 8px;opacity:.45;animation:barmove 5.6s linear infinite;}
.activity-bar.active{opacity:1;animation:barmove 2.8s linear infinite;}
.activity-row .tag{font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--muted2);width:70px;text-align:right;flex-shrink:0;}
.activity-row .tag.on{color:var(--a2);}

/* ---------- conversación + resultados ---------- */
.convo-section{padding:80px 0;display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:48px;align-items:start;}
.convo-left{display:flex;flex-direction:column;gap:20px;}
.convo-left h2{margin:0;font-size:clamp(23px,2.7vw,29px);line-height:1.3;letter-spacing:-0.01em;font-weight:700;}
.convo-left h2 span{color:var(--muted);font-weight:500;}
.convo-box{overflow:hidden;border-radius:18px;}
.tab-row{display:flex;align-items:center;border-bottom:1px solid var(--line);padding:0 8px;position:relative;}
.tab-btn{background:none;border:none;font-family:'JetBrains Mono',monospace;font-size:12px;padding:14px 16px;color:var(--muted2);border-bottom:2px solid transparent;margin-bottom:-1px;transition:color 300ms var(--ease-out),border-bottom-color 320ms var(--ease-out);}
.tab-btn:hover{color:var(--muted);}
.tab-btn:active{transform:scale(0.96);transition:transform 120ms var(--press);}
.tab-btn.active{color:var(--a2);border-bottom-color:var(--a2);font-weight:500;text-shadow:0 0 12px rgba(240,194,123,0.4);}
.convo-body{padding:22px;display:flex;flex-direction:column;gap:10px;min-height:200px;}
.convo-msg-row{display:flex;}
.convo-msg-row.b{justify-content:flex-end;}
.convo-bubble{max-width:82%;font-size:13.5px;line-height:1.55;padding:10px 14px;border-radius:14px;background:rgba(245,235,215,0.06);color:#c6cad6;transition:opacity 250ms var(--ease-out),transform 250ms var(--ease-out);
  @starting-style{opacity:0;transform:scale(0.92);}}
.convo-msg-row.b .convo-bubble{background:var(--grad);color:#1a1305;box-shadow:0 4px 16px rgba(232,163,61,0.25);}
.channels-row{display:flex;align-items:center;flex-wrap:wrap;gap:10px;font-size:13px;color:var(--muted2);}
.chan-pill{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--line);border-radius:999px;padding:5px 13px;font-size:12px;color:#c6cad6;background:var(--glass);transition:border-color 250ms ease,transform 250ms var(--spring);}
.chan-pill:hover{border-color:var(--line-strong);transform:translateY(-2px);}
.chan-pill i{width:7px;height:7px;border-radius:50%;display:inline-block;}
.convo-right{display:flex;flex-direction:column;gap:16px;padding:32px 28px;}
.results-label{font-family:'JetBrains Mono',monospace;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted2);}
.results-list{display:flex;flex-direction:column;}
.result-row{display:flex;align-items:center;gap:14px;padding:14px 4px;border-bottom:1px solid var(--line);font-size:14px;transition:background 250ms ease,padding-left 250ms var(--ease-out);}
.result-row:hover{background:rgba(245,235,215,0.025);padding-left:10px;border-radius:8px;}
.result-row .pos{font-family:'JetBrains Mono',monospace;color:var(--muted2);width:20px;}
.result-row .dot{width:8px;height:8px;border-radius:50%;display:inline-block;}
.result-row .name{color:#d5d8e2;}
.result-row .metric{margin-left:auto;font-family:'JetBrains Mono',monospace;color:var(--muted);font-size:13px;}
.stat-row{display:flex;gap:36px;margin-top:14px;}
.stat-num{font-family:'Plus Jakarta Sans',sans-serif;font-size:30px;font-weight:800;letter-spacing:-0.01em;background:var(--grad);-webkit-background-clip:text;background-clip:text;color:transparent;}
.stat-label{font-size:13px;color:var(--muted2);margin-top:2px;}

/* ---------- precios ---------- */
.pricing{padding:96px 0;}
.pricing-head{text-align:center;margin-bottom:54px;}
.pricing-head h2{margin:0 0 12px;font-size:clamp(30px,3.8vw,40px);font-weight:800;letter-spacing:-0.02em;}
.pricing-head p{margin:0;color:var(--muted);font-size:15.5px;}
.plans{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:24px;max-width:840px;margin:0 auto;}
.plan-card{padding:36px 32px;display:flex;flex-direction:column;transition:transform 320ms var(--spring),box-shadow 320ms ease,border-color 320ms ease;}
.plan-card:hover{transform:translateY(-8px);box-shadow:0 28px 64px rgba(0,0,0,0.5),0 0 44px rgba(232,163,61,0.12);}
.plan-card.highlight{border-color:rgba(232,163,61,0.45);box-shadow:0 0 54px rgba(232,163,61,0.16);}
.plan-card.highlight::before{opacity:1;}
.plan-card.highlight:hover{box-shadow:0 28px 72px rgba(0,0,0,0.5),0 0 64px rgba(232,163,61,0.25);}
.plan-tag{font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:.1em;color:var(--muted2);}
.plan-badge{position:absolute;top:-12px;right:24px;font-family:'JetBrains Mono',monospace;font-size:10px;letter-spacing:.08em;padding:5px 12px;border-radius:999px;background:var(--grad);color:#1a1305;box-shadow:0 4px 16px rgba(232,163,61,0.4);}
.plan-price{display:flex;align-items:baseline;gap:8px;margin-top:16px;}
.plan-price .num{font-family:'Plus Jakarta Sans',sans-serif;font-size:38px;font-weight:800;letter-spacing:-0.02em;}
.plan-price .period{font-size:14px;color:var(--muted2);}
.plan-items{display:flex;flex-direction:column;gap:11px;margin-top:24px;margin-bottom:28px;}
.plan-item{display:flex;gap:10px;font-size:14px;color:var(--muted);line-height:1.5;}
.plan-item .check{background:var(--grad);-webkit-background-clip:text;background-clip:text;color:transparent;font-weight:700;}
.plan-btn{margin-top:auto;text-align:center;border:1px solid var(--line-strong);color:var(--text);font-size:14px;font-weight:600;padding:13px 18px;border-radius:12px;background:transparent;transition:border-color 300ms var(--ease-out),background 300ms var(--ease-out),transform 300ms var(--spring),box-shadow 300ms ease;}
.plan-btn:hover{border-color:rgba(232,163,61,0.5);background:var(--glass);transform:translateY(-2px);box-shadow:0 6px 20px rgba(232,163,61,0.15);color:var(--text);}
.plan-btn:active{transform:scale(0.96);transition:transform 120ms var(--press);}
.plan-btn.solid{background:var(--grad);color:#1a1305;border:none;box-shadow:0 8px 24px rgba(232,163,61,0.3);}
.plan-btn.solid:hover{box-shadow:0 12px 36px rgba(232,163,61,0.45);transform:translateY(-3px);filter:brightness(1.08);}
.plan-btn.solid:active{transform:scale(0.96);}

/* ---------- faq ---------- */
.faq{padding:96px 0;max-width:760px;margin:0 auto;}
.faq h2{margin:0 0 36px;font-size:clamp(26px,3.4vw,34px);font-weight:800;letter-spacing:-0.02em;}
.faq-item{border:1px solid var(--line);border-radius:14px;margin-bottom:12px;background:var(--glass);backdrop-filter:blur(8px);transition:border-color 300ms ease,background 300ms ease;overflow:hidden;}
.faq-item:hover{border-color:var(--line-strong);}
.faq-item.open{border-color:rgba(232,163,61,0.4);background:var(--glass-2);}
.faq-q{width:100%;display:flex;justify-content:space-between;align-items:center;gap:16px;background:none;border:none;color:var(--text);font-size:15.5px;font-weight:500;text-align:left;padding:19px 22px;transition:color 200ms var(--ease-out);}
.faq-q:hover{color:var(--a2);}
.faq-q .chev{font-size:20px;background:var(--grad);-webkit-background-clip:text;background-clip:text;color:transparent;transition:transform 380ms var(--spring);transform-origin:center;}
.faq-item.open .faq-q .chev{transform:rotate(45deg) scale(1.15);}
.faq-a{display:none;padding:0 22px 20px;font-size:14px;line-height:1.75;color:var(--muted);max-width:620px;transition:opacity 250ms var(--ease-out),transform 250ms var(--ease-out);
  @starting-style{opacity:0;transform:translateY(-8px);}}
.faq-item.open .faq-a{display:block;}

/* ---------- cta final ---------- */
.cta{padding:96px 0 80px;display:grid;grid-template-columns:1.2fr 1fr 1fr;gap:24px;align-items:stretch;}
.cta-left{padding:44px 40px;display:flex;flex-direction:column;justify-content:center;gap:18px;background:linear-gradient(150deg,rgba(232,163,61,0.12),rgba(240,194,123,0.05));}
.cta-left h2{margin:0;font-size:clamp(28px,3.4vw,38px);line-height:1.12;letter-spacing:-0.02em;font-weight:800;}
.cta-left p{margin:0;font-size:14.5px;color:var(--muted);line-height:1.6;}
.cta-card{padding:44px 28px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:16px;cursor:pointer;transition:transform 300ms var(--spring),box-shadow 300ms ease,border-color 300ms ease;}
.cta-card:hover{transform:translateY(-6px);box-shadow:0 20px 48px rgba(0,0,0,0.45),0 0 32px rgba(240,194,123,0.1);}
.cta-card:active{transform:scale(0.98);transition:transform 120ms var(--press);}
.cta-icon{width:58px;height:58px;border-radius:16px;border:1px solid rgba(232,163,61,0.3);background:var(--a1-soft);display:flex;align-items:center;justify-content:center;color:var(--a2);transition:transform 300ms var(--spring),box-shadow 300ms ease;}
.cta-card:hover .cta-icon{transform:scale(1.12) translateY(-2px);box-shadow:0 8px 28px rgba(232,163,61,0.3);}
.cta-card .label{font-family:'Plus Jakarta Sans',sans-serif;font-size:15.5px;font-weight:700;}
.cta-card .sub{font-size:13px;color:var(--muted2);max-width:220px;line-height:1.55;}

/* ---------- footer ---------- */
footer{border-top:1px solid var(--line);padding:34px 0 40px;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:16px;font-size:13px;color:var(--muted2);}
footer .links{display:flex;gap:26px;}
footer a{color:var(--muted2);transition:color 300ms var(--ease-out);}
footer a:hover{color:var(--a2);}

/* ---------- responsive ---------- */
@media (max-width:1024px){
  .cta{grid-template-columns:1fr 1fr;}
  .cta-left{grid-column:1/-1;}
  .menu-list a{font-size:2rem;}
}
@media (max-width:768px){
  .hero{padding:140px 0 70px;}
  .features{padding:64px 0;}
  .features-grid{grid-template-columns:1fr;}
  .canales,.always,.convo-section{padding:56px 0;gap:36px;}
  .pricing,.faq{padding:64px 0;}
  .cta{padding:64px 0 56px;grid-template-columns:1fr;}
  .menu-list a{font-size:1.8rem;}
  #atp-chat-btn{bottom:16px;right:16px;width:50px;height:50px;}
  #atp-chat-panel{width:calc(100vw - 32px);max-width:90vw;bottom:76px;right:16px;height:55vh;max-height:70vh;}
}
@media (max-width:480px){
  html{scroll-padding-top:72px;}
  .nav-header{top:10px;padding:8px 8px 8px 16px;}
  .nav-logo{font-size:13px;}
  .hero{padding:120px 0 56px;}
  .hero p{font-size:15px;}
  .btn-row{flex-direction:column;gap:10px;}
  .btn-primary,.btn-outline{width:100%;}
  .sec-head{margin-bottom:36px;}
  .feature{padding:28px 20px;}
  .convo-right{padding:24px 18px;}
  .cta-left,.cta-card{padding:32px 22px;}
  .stat-row{gap:24px;}
  .menu-panel{width:min(100vw - 16px,320px);padding:5.5em 1.5em 1.5em;}
  .menu-list a{font-size:1.5rem;}
  #atp-chat-panel{position:fixed;bottom:70px;right:12px;width:calc(100vw - 24px);max-width:none;height:58vh;max-height:75vh;border-radius:18px;}
  #atp-chat-btn{bottom:12px;right:12px;width:48px;height:48px;}
}
@media (max-height:600px) and (orientation:landscape){
  .hero{padding:110px 0 48px;}
  #atp-chat-panel{bottom:56px;}
}

/* ---------- ATP CHAT WIDGET ---------- */
#atp-chat-btn{position:fixed;bottom:24px;right:24px;z-index:9999;width:56px;height:56px;border-radius:18px;border:1px solid rgba(232,163,61,0.4);background:linear-gradient(150deg,#12142080,#0a0c15cc);backdrop-filter:blur(12px);color:white;box-shadow:0 8px 28px rgba(0,0,0,0.45),0 0 24px rgba(232,163,61,0.2);display:flex;align-items:center;justify-content:center;transition:transform 280ms var(--spring),box-shadow 280ms ease;}
#atp-chat-btn:hover{transform:translateY(-3px) scale(1.05);box-shadow:0 12px 36px rgba(0,0,0,0.5),0 0 36px rgba(232,163,61,0.35);}
#atp-chat-btn:active{transform:scale(0.94);}
#atp-chat-btn::after{content:'';position:absolute;top:-3px;right:-3px;width:13px;height:13px;border-radius:50%;background:var(--a2);border:2px solid var(--bg);box-shadow:0 0 10px rgba(240,194,123,0.8);}
#atp-chat-panel{position:fixed;bottom:96px;right:24px;z-index:9999;width:clamp(300px,95vw - 48px,420px);max-width:90vw;height:clamp(400px,60vh,600px);max-height:80vh;background:rgba(10,12,21,0.92);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border:1px solid var(--line-strong);border-radius:24px;box-shadow:0 20px 60px rgba(0,0,0,0.6),0 0 40px rgba(232,163,61,0.1);display:none;flex-direction:column;overflow:hidden;font-family:'Inter',system-ui,sans-serif;}
#atp-chat-panel.open{display:flex;animation:panelIn 320ms var(--spring);transform-origin:bottom right;}
@keyframes panelIn{from{opacity:0;transform:translateY(12px) scale(0.96);}to{opacity:1;transform:translateY(0) scale(1);}}
#atp-chat-header{display:flex;align-items:center;gap:12px;padding:20px 18px 16px;border-bottom:1px solid var(--line);}
#atp-chat-avatar{width:38px;height:38px;border-radius:12px;background:var(--grad);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;box-shadow:0 0 18px rgba(232,163,61,0.35);}
#atp-chat-title{color:var(--text);font-family:'Plus Jakarta Sans',sans-serif;font-weight:700;font-size:15px;line-height:1.2;}
#atp-chat-subtitle{color:var(--muted2);font-size:12.5px;margin-top:2px;}
#atp-chat-close{margin-left:auto;background:none;border:none;color:var(--muted2);font-size:18px;padding:4px;transition:color 200ms ease,transform 200ms var(--spring);}
#atp-chat-close:hover{color:var(--text);transform:scale(1.15);}
#atp-chat-messages{flex:1;overflow-y:auto;padding:18px;display:flex;flex-direction:column;gap:12px;}
.atp-msg{max-width:85%;padding:12px 14px;border-radius:16px;font-size:14px;line-height:1.5;white-space:pre-line;animation:atpPop 0.28s var(--ease-out);}
@keyframes atpPop{from{opacity:0;transform:translateY(8px) scale(0.97);}to{opacity:1;transform:translateY(0) scale(1);}}
.atp-msg.user{align-self:flex-end;background:var(--grad);color:#1a1305;border-bottom-right-radius:5px;box-shadow:0 4px 14px rgba(232,163,61,0.3);}
.atp-msg.bot{align-self:flex-start;background:rgba(245,235,215,0.06);color:#dfe2ea;border-bottom-left-radius:5px;}
#atp-chat-input-wrap{padding:12px 14px 16px;}
#atp-chat-input-row{display:flex;align-items:center;gap:8px;border:1px solid rgba(232,163,61,0.5);border-radius:26px;padding:6px 8px 6px 16px;background:rgba(5,6,11,0.6);transition:border-color 250ms ease,box-shadow 250ms ease;}
#atp-chat-input-row:focus-within{border-color:var(--a1);box-shadow:0 0 18px rgba(232,163,61,0.25);}
#atp-chat-input{flex:1;border:none;background:transparent;color:white;padding:8px 0;font-size:16px;outline:none;font-family:'Inter',sans-serif;}
#atp-chat-input::placeholder{color:var(--muted2);}
#atp-chat-send{width:34px;height:34px;border-radius:50%;border:none;background:var(--grad);color:#1a1305;font-size:15px;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:transform 250ms var(--spring),box-shadow 250ms ease;}
#atp-chat-send:hover{transform:scale(1.1);box-shadow:0 4px 16px rgba(232,163,61,0.4);}
#atp-chat-send:active{transform:scale(0.92);}
#atp-chat-send:disabled{opacity:0.5;cursor:not-allowed;}
</style>
</head>
<body>

<div class="aurora"></div>
<div class="grid-overlay"></div>
<div class="vignette"></div>

<!-- NAV -->
<header class="nav-header">
  <div class="nav-logo">Atiéndeme la Pyme</div>
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
      <a href="mailto:contacto@atiendemelapyme.cl">Correo</a>
    </div>
  </div>
</nav>

<main class="wrap">

  <!-- HERO -->
  <section class="hero" data-screen-label="Hero">
    <span class="sign-badge">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="color:var(--a2)"><circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/></svg>
      Implementación en 2–3 semanas
    </span>
    <h1>Tu negocio despierto, <em>siempre.</em></h1>
    <p>Agentes de IA que venden, atienden y agendan citas por ti, las 24 horas del día. Sin contratar más gente.</p>
    <div class="btn-row">
      <a href="#contacto" class="btn-primary">Agendar demo</a>
      <a href="#solucion" class="btn-outline">Ver cómo funciona</a>
    </div>
  </section>

  <!-- FEATURES -->
  <section id="solucion" class="features reveal" data-screen-label="Solución">
    <div class="sec-head">
      <h2>Tu asistente de IA responde por ti en tres canales</h2>
    </div>
    <div class="features-grid">
      <div class="feature glass-card">
        <div class="arrow">💬</div>
        <h3>Chatbots inteligentes</h3>
        <p>Tus redes — WhatsApp, Instagram, Facebook — responden consultas, califican leads y agendan citas por ti.</p>
        <div class="preview-box">
          <div class="preview-dots"><span style="background:#FF5F57"></span><span style="background:#FEBC2E"></span><span style="background:#28C840"></span></div>
          <div class="preview-body">
            <div class="chat-row"><div class="chat-bubble">Hola, ¿tienen hora para mañana?</div></div>
            <div class="chat-row mine"><div class="chat-bubble">¡Sí! Tengo a las 10:30 o 16:00. ¿Cuál te acomoda?</div></div>
            <div class="chat-row"><div class="chat-bubble">La de 10:30 ✓</div></div>
          </div>
        </div>
      </div>
      <div class="feature glass-card">
        <div class="arrow">📞</div>
        <h3>Asistentes de voz</h3>
        <p>Contestan llamadas, explican servicios y agendan citas automáticamente, con acento chileno neutro. Transfieren a humanos si hace falta.</p>
        <div class="preview-box">
          <div class="preview-dots"><span style="background:#FF5F57"></span><span style="background:#FEBC2E"></span><span style="background:#28C840"></span></div>
          <div class="preview-body">
            <div class="voice-bars" id="voiceBars"></div>
            <div class="voice-meta"><span class="live"></span>Duración de llamada: 3:45</div>
          </div>
        </div>
      </div>
      <div class="feature glass-card">
        <div class="arrow">📅</div>
        <h3>Calendario integrado</h3>
        <p>Google Calendar o Calendly sincronizado: sin dobles reservas y con recordatorios automáticos.</p>
        <div class="preview-box">
          <div class="preview-dots"><span style="background:#FF5F57"></span><span style="background:#FEBC2E"></span><span style="background:#28C840"></span></div>
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
    <div class="canales-diagram glass-card" id="diagramHost"></div>
    <div class="canales-text">
      <span class="chip chip-inline"><span class="dot"></span>Todos tus canales, conectados</span>
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
    <div class="always-text">
      <span class="chip chip-inline"><span class="dot" style="background:var(--confirm);box-shadow:0 0 8px rgba(79,157,140,0.7)"></span>Siempre activo</span>
      <h2>Tu equipo descansa. Tu atención, no.</h2>
      <p>Las consultas de noche y fin de semana ya no se pierden: tu asistente responde, califica y agenda mientras duermes.</p>
      <a href="#contacto" class="btn-outline" style="align-self:flex-start;margin-top:6px;padding:10px 20px;font-size:14px;">Saber más</a>
    </div>
    <div class="always-viz">
      <div class="activity-card glass-card">
        <div class="activity-head"><span>ACTIVIDAD · ÚLTIMAS 24H</span><span class="on">● en línea</span></div>
        <div class="activity-row">
          <span class="label">09:00 – 18:00</span>
          <div class="activity-bar" style="background-image:repeating-linear-gradient(90deg, rgba(245,235,215,0.3) 0 14px, transparent 14px 24px)"></div>
          <span class="tag">Tu equipo</span>
        </div>
        <div class="activity-row">
          <span class="label">18:00 – 00:00</span>
          <div class="activity-bar active" style="background-image:repeating-linear-gradient(90deg, var(--a2) 0 14px, transparent 14px 24px)"></div>
          <span class="tag on">IA activa</span>
        </div>
        <div class="activity-row">
          <span class="label">00:00 – 09:00</span>
          <div class="activity-bar active" style="background-image:repeating-linear-gradient(90deg, var(--a2) 0 14px, transparent 14px 24px)"></div>
          <span class="tag on">IA activa</span>
        </div>
        <div class="activity-row">
          <span class="label">Fin de semana</span>
          <div class="activity-bar active" style="background-image:repeating-linear-gradient(90deg, var(--a2) 0 14px, transparent 14px 24px)"></div>
          <span class="tag on">IA activa</span>
        </div>
      </div>
    </div>
  </section>

  <!-- CONVERSACIÓN + RESULTADOS -->
  <section class="convo-section reveal" data-screen-label="Conversaciones">
    <div class="convo-left">
      <span class="chip chip-inline"><span style="color:var(--a2)">✦</span> Conversaciones reales</span>
      <h2>Así atiende tu asistente. <span>Del primer mensaje a la cita confirmada.</span></h2>
      <div class="convo-box glass-card">
        <div class="tab-row" id="tabRow" role="tablist" aria-label="Ejemplos de conversación">
          <button class="tab-btn active" data-tab="0" role="tab" aria-selected="true">WhatsApp</button>
          <button class="tab-btn" data-tab="1" role="tab" aria-selected="false">Llamada</button>
          <button class="tab-btn" data-tab="2" role="tab" aria-selected="false">Instagram</button>
        </div>
        <div class="convo-body" id="convoBody"></div>
      </div>
      <div class="channels-row">
        <span>Funciona con</span>
        <span class="chan-pill"><i style="background:#25D366"></i>WhatsApp</span>
        <span class="chan-pill"><i style="background:#E1306C"></i>Instagram</span>
        <span class="chan-pill"><i style="background:#1877F2"></i>Facebook</span>
        <span class="chan-pill"><i style="background:#F59E0B"></i>Correo</span>
        <span class="chan-pill"><i style="background:var(--a1)"></i>Google Calendar</span>
      </div>
    </div>
    <div class="convo-right glass-card">
      <div class="results-label">Resultados de clientes</div>
      <div class="results-list">
        <div class="result-row"><span class="pos">1</span><span class="dot" style="background:#25D366"></span><span class="name">Consultorio dental</span><span class="metric">0 inasistencias</span></div>
        <div class="result-row"><span class="pos">2</span><span class="dot" style="background:var(--a1)"></span><span class="name">Peluquería</span><span class="metric">24/7 atendida</span></div>
        <div class="result-row"><span class="pos">3</span><span class="dot" style="background:#E1306C"></span><span class="name">Taller mecánico</span><span class="metric">+38% servicios</span></div>
        <div class="result-row"><span class="pos">4</span><span class="dot" style="background:#F59E0B"></span><span class="name">Centro estético</span><span class="metric">−50% tareas manuales</span></div>
        <div class="result-row"><span class="pos">5</span><span class="dot" style="background:#1877F2"></span><span class="name">Clínica veterinaria</span><span class="metric">+120 citas/mes</span></div>
      </div>
      <div class="stat-row">
        <div><div class="stat-num">+400</div><div class="stat-label">citas agendadas en automático</div></div>
        <div><div class="stat-num">+100</div><div class="stat-label">pymes creciendo con nosotros</div></div>
      </div>
    </div>
  </section>

  <!-- PRECIOS -->
  <section id="precios" class="pricing reveal" data-screen-label="Precios">
    <div class="pricing-head">
      <h2>Precios transparentes</h2>
      <p>Sin sorpresas. Sin contratos largos.</p>
    </div>
    <div class="plans">
      <div class="plan-card glass-card">
        <div class="plan-tag">IMPLEMENTACIÓN</div>
        <div class="plan-price"><span class="num">$199.990</span><span class="period">pago único</span></div>
        <div class="plan-items">
          <div class="plan-item"><span class="check">✓</span><span>Configuración completa del sistema</span></div>
          <div class="plan-item"><span class="check">✓</span><span>Entrenamiento de IA con tus datos</span></div>
          <div class="plan-item"><span class="check">✓</span><span>Integración con tu calendario</span></div>
          <div class="plan-item"><span class="check">✓</span><span>Conexión WhatsApp / Instagram / Llamadas</span></div>
          <div class="plan-item"><span class="check">✓</span><span>Capacitación de tu equipo</span></div>
          <div class="plan-item"><span class="check">✓</span><span>Primeros 30 días de soporte</span></div>
        </div>
        <a href="#contacto" class="plan-btn">Comenzar ahora</a>
      </div>
      <div class="plan-card glass-card highlight">
        <div class="plan-badge">RECOMENDADO</div>
        <div class="plan-tag">SUSCRIPCIÓN MENSUAL</div>
        <div class="plan-price"><span class="num">$99.990</span><span class="period">/mes</span></div>
        <div class="plan-items">
          <div class="plan-item"><span class="check">✓</span><span>Monitoreo 24/7 del sistema</span></div>
          <div class="plan-item"><span class="check">✓</span><span>Soporte técnico prioritario</span></div>
          <div class="plan-item"><span class="check">✓</span><span>Actualizaciones de IA</span></div>
          <div class="plan-item"><span class="check">✓</span><span>Mejoras continuas basadas en datos</span></div>
          <div class="plan-item"><span class="check">✓</span><span>Mantenimiento de servidores</span></div>
          <div class="plan-item"><span class="check">✓</span><span>Reportes mensuales de resultados</span></div>
        </div>
        <a href="#contacto" class="plan-btn solid">Comenzar ahora</a>
      </div>
    </div>
  </section>

  <!-- FAQ -->
  <section id="faq" class="faq reveal" data-screen-label="FAQ">
    <h2>Preguntas frecuentes</h2>
    <div id="faqList">
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
    <div class="cta-left glass-card">
      <h2>¿Listo para automatizar tu atención?</h2>
      <p>Sin compromiso. Sin costo. Solo conversamos.</p>
      <a href="mailto:contacto@atiendemelapyme.cl?subject=Quiero%20agendar%20una%20demo" class="btn-primary" style="align-self:flex-start;margin-top:6px;">Agendar consulta gratuita</a>
    </div>
    <div class="cta-card glass-card">
      <div class="cta-icon"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/></svg></div>
      <div class="label">Agenda una demo</div>
      <div class="sub">20 minutos, sin compromiso. Vemos tu caso en vivo.</div>
    </div>
    <div class="cta-card glass-card">
      <div class="cta-icon"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22z"/></svg></div>
      <div class="label">Escríbenos</div>
      <div class="sub">contacto@atiendemelapyme.cl — respondemos el mismo día.</div>
    </div>
  </section>

  <footer>
    <span>© 2026 Atiéndeme la Pyme. Todos los derechos reservados.</span>
    <div class="links">
      <a href="#">Términos</a>
      <a href="#">Privacidad</a>
      <a href="mailto:contacto@atiendemelapyme.cl">Contacto</a>
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
const A1 = '#E8A33D', A2 = '#F0C27B';
const chans = [
  {name:'WhatsApp', color:'#25D366', y:30},
  {name:'Instagram', color:'#E1306C', y:85},
  {name:'Facebook', color:'#1877F2', y:140},
  {name:'Correo', color:'#F59E0B', y:195},
  {name:'Calendario', color:A1, y:250},
];
let svg = `<svg width="420" height="280" viewBox="0 0 420 280" style="max-width:100%;height:auto;">`;
chans.forEach((c)=>{
  svg += `<path d="M 78 140 C 170 140, 190 ${c.y+14}, 268 ${c.y+14}" stroke="${c.color}" stroke-width="1.5" fill="none" opacity="0.75" stroke-dasharray="6 6" style="animation:flowdash 1.6s linear infinite"/>`;
});
svg += `<rect x="30" y="116" width="48" height="48" rx="14" fill="#161007" stroke="${A1}" stroke-opacity="0.5"/>`;
svg += `<path d="M46 150 L54 135 L62 150" stroke="${A2}" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
svg += `<circle cx="54" cy="146.5" r="2.2" fill="${A2}"/>`;
chans.forEach((c,i)=>{
  svg += `<g><rect x="268" y="${c.y}" width="132" height="30" rx="9" fill="#161007" stroke="rgba(245,235,215,0.1)"/>`;
  svg += `<circle cx="284" cy="${c.y+15}" r="4" fill="${c.color}" style="transform-origin:284px ${c.y+15}px;animation:nodepulse 2.4s ease-in-out ${i*0.35}s infinite"/>`;
  svg += `<text x="298" y="${c.y+19.5}" fill="#d6cfc0" font-size="12" font-family="Inter,sans-serif">${c.name}</text></g>`;
});
svg += `</svg>`;
document.getElementById('diagramHost').innerHTML = svg;

/* ---------- conversaciones por tab ---------- */
const convos = [
  [
    {who:'c', text:'Hola! ¿Cuánto sale un corte y me pueden atender hoy?'},
    {who:'b', text:'¡Hola! El corte cuesta $12.000. Hoy tengo disponible a las 17:30 y 18:45. ¿Te reservo una?'},
    {who:'c', text:'La de 17:30 porfa'},
    {who:'b', text:'Listo ✓ Te agendé hoy a las 17:30. Te llegará un recordatorio 1 hora antes.'},
  ],
  [
    {who:'c', text:'🔊 «Hola, llamo para pedir hora al dentista…»'},
    {who:'b', text:'«¡Hola! Claro que sí. Tengo disponibilidad mañana a las 9:00 o el jueves a las 15:30. ¿Cuál prefiere?»'},
    {who:'c', text:'«Mañana a las 9 está perfecto.»'},
    {who:'b', text:'«Agendado. Le enviaré la confirmación por WhatsApp. ¡Hasta mañana!»'},
  ],
  [
    {who:'c', text:'Vi sus historias 😍 ¿hacen mantención de frenos?'},
    {who:'b', text:'¡Sí! La mantención parte en $45.000 según el vehículo. ¿Quieres que te agende una revisión sin costo?'},
    {who:'c', text:'Sí, el sábado si se puede'},
    {who:'b', text:'Perfecto ✓ Sábado 10:00 confirmado. Te esperamos.'},
  ],
];
const convoBody = document.getElementById('convoBody');
function renderConvo(i){
  convoBody.innerHTML = convos[i].map((m)=>`
    <div class="convo-msg-row ${m.who==='b'?'b':''}"><div class="convo-bubble">${m.text}</div></div>
  `).join('');
}
document.getElementById('tabRow').addEventListener('click', (e)=>{
  const btn = e.target.closest('.tab-btn');
  if(!btn) return;
  document.querySelectorAll('.tab-btn').forEach(b=>{ b.classList.remove('active'); b.setAttribute('aria-selected','false'); });
  btn.classList.add('active'); btn.setAttribute('aria-selected','true');
  renderConvo(Number(btn.dataset.tab));
});
renderConvo(0);

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
},{threshold:0.15});
document.querySelectorAll('.reveal').forEach(el=>io.observe(el));
</script>

<!-- ATP CHAT WIDGET -->
<button id="atp-chat-btn" aria-label="Abrir chat">
  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <path d="M4 5.5C4 4.7 4.7 4 5.5 4h13c.8 0 1.5.7 1.5 1.5v10c0 .8-.7 1.5-1.5 1.5H9l-4 3.5v-3.5H5.5C4.7 17 4 16.3 4 15.5v-10z"/>
    <line x1="8" y1="9" x2="16" y2="9"/>
    <line x1="8" y1="12.5" x2="13" y2="12.5"/>
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
      <input id="atp-chat-input" type="text" placeholder="Haz una pregunta..." autocomplete="off" />
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
    setTimeout(()=>atpInput.focus(), 350);
    if (!opened) {
      opened = true;
      addBubble('¡Hola! Qué gusto saludarte, soy Dominga.\n\nSé que soy un bot, pero en Atiéndeme la Pyme justamente nos dedicamos a que la tecnología no se note tan robótica ni aburrida.', 'bot');
      setTimeout(() => {
        addBubble('Cuéntame un poco, ¿qué tienes en mente para tu negocio o en qué te puedo ayudar hoy?', 'bot');
      }, 700);
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
          const jsonMatch = botReply.match(/\{[\s\S]*"action"\s*:\s*"schedule"[\s\S]*\}/);
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
              addBubble(`✅ ${scheduleResult.message}\n\nTe enviaremos un correo de confirmación a ${scheduleData.email}`, 'bot');
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
</body>
</html>
