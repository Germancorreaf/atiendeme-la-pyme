import { onRequestPost as chatPost, onRequestGet as chatGet } from './api/chat.js';
import { onRequestPost as schedulePost, onRequestGet as scheduleGet } from './api/schedule.js';
import { processReminders } from './lib/reminder-cron.js';

const HTML_CONTENT = `
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Atiéndeme la Pyme — Tu negocio despierto, siempre</title>
<meta name="description" content="Agentes de IA que venden, atienden y agendan citas por ti, las 24 horas del día.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700;800&family=Geist+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
:root{
  --accent:#E8A33D;
  --accent-soft:rgba(232,163,61,0.14);
  --accent-line:rgba(232,163,61,0.4);
  --confirm:#4F9D8C;
  --bg:#0C0D10;
  --bg-raised:#131419;
  --text:#ECE8DF;
  --muted:#8B8983;
  --muted2:#A6A39A;
  --border:rgba(236,232,223,0.09);
  
  /* Emil's easing system: premium spring physics */
  --ease-out-strong:cubic-bezier(0.23, 1, 0.32, 1);
  --ease-in-out-strong:cubic-bezier(0.77, 0, 0.175, 1);
  --ease-drawer:cubic-bezier(0.32, 0.72, 0, 1);
  
  /* Spring curves with subtle bounce (premium feel) */
  --spring-bounce:cubic-bezier(0.34, 1.56, 0.64, 1);
  --spring-elastic:cubic-bezier(0.6, 1.2, 0.2, 1);
  --spring-gentle:cubic-bezier(0.25, 1.46, 0.35, 0.8);
  
  /* Active state (press feedback) */
  --active-feedback:cubic-bezier(0.16, 0.8, 0.7, 1);
}
*{box-sizing:border-box;}
html{scroll-behavior:smooth;}
body{margin:0;background:linear-gradient(135deg, #0C0D10 0%, #0F1015 50%, #0C0D10 100%);color:var(--text);font-family:'Geist',system-ui,-apple-system,'Segoe UI',sans-serif;-webkit-font-smoothing:antialiased;overflow-x:hidden;}
a{color:var(--text);text-decoration:none;}
.mono{font-family:'Geist Mono',monospace;}
.display{font-family:'Geist',sans-serif;}
button{font-family:inherit;cursor:pointer;}
:focus-visible{outline:2px solid var(--accent);outline-offset:3px;border-radius:4px;}

/* Accessibility: prefers-reduced-motion */
@media (prefers-reduced-motion: reduce){
  *,*::before,*::after{
    animation-duration:0.01ms !important;
    animation-iteration-count:1 !important;
    transition-duration:0.01ms !important;
    scroll-behavior:auto !important;
  }
}

/* ---------- layout ---------- */
.wrap{max-width:1160px;margin:0 auto;border-left:1px solid var(--border);border-right:1px solid var(--border);position:relative;z-index:1;background:transparent;}
section{border-top:1px solid var(--border);}

/* ---------- reveal on scroll (occasional: .45s) ---------- */
@keyframes revealFade{
  from{opacity:0;transform:translateY(20px);}
  to{opacity:1;transform:translateY(0);}
}
.reveal{opacity:0;}
.reveal.in{animation:revealFade .45s var(--ease-out-strong) both;}

/* ---------- otras animaciones ---------- */
@keyframes flowdash{to{stroke-dashoffset:-24;}}
@keyframes nodepulse{0%,100%{opacity:.4;transform:scale(1);}50%{opacity:1;transform:scale(1.25);}}
@keyframes barmove{to{background-position:48px 0;}}

/* ---------- nav / staggered menu ---------- */
.nav-header{position:fixed;top:0;left:0;width:100%;display:flex;align-items:center;justify-content:space-between;padding:1.1em 1.6em;background:linear-gradient(180deg,rgba(12,13,16,0.88) 0%,rgba(12,13,16,0.45) 60%,rgba(12,13,16,0) 100%);z-index:50;}
.nav-logo{color:var(--text);font-weight:700;font-size:15px;letter-spacing:-0.01em;font-family:'Geist',sans-serif;}
.nav-toggle{display:inline-flex;align-items:center;gap:8px;background:rgba(19,20,25,0.6);border:1px solid rgba(236,232,223,0.16);border-radius:999px;padding:9px 16px;backdrop-filter:blur(8px);cursor:pointer;color:var(--muted2);font-weight:500;font-size:13px;transition:border-color 300ms var(--ease-out-strong),background 300ms var(--ease-out-strong),color 300ms var(--ease-out-strong),transform 300ms var(--spring-bounce);}
.nav-toggle:hover{border-color:var(--accent-line);background:rgba(19,20,25,0.85);}
.nav-toggle:active{transform:scale(0.94);transition:transform 120ms var(--active-feedback);}
body.menu-open .nav-toggle{background:var(--text);border-color:rgba(12,13,16,0.2);color:#111;}
.nav-toggle .bars{position:relative;width:14px;height:10px;flex:0 0 14px;}
.nav-toggle .bars span{position:absolute;left:0;width:100%;height:2px;background:currentColor;border-radius:2px;transition:transform 250ms var(--ease-out-strong);}
.nav-toggle .bars span:nth-child(1){top:0;}
.nav-toggle .bars span:nth-child(2){bottom:0;}
body.menu-open .nav-toggle .bars span:nth-child(1){transform:translateY(4px) rotate(45deg);}
body.menu-open .nav-toggle .bars span:nth-child(2){transform:translateY(-4px) rotate(-45deg);}

.menu-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.5);opacity:0;pointer-events:none;transition:opacity 250ms var(--ease-out-strong);z-index:39;}
body.menu-open .menu-overlay{opacity:1;pointer-events:auto;}

.menu-panel{position:fixed;top:0;right:0;height:100%;width:clamp(280px,38vw,420px);background:#F5F1E8;display:flex;flex-direction:column;padding:6em 2em 2em;overflow-y:auto;z-index:40;transform:translateX(105%);transition:transform 350ms var(--ease-drawer);}
body.menu-open .menu-panel{transform:translateX(0);}
.menu-list{list-style:none;margin:0 0 auto;padding:0;display:flex;flex-direction:column;gap:.4rem;counter-reset:mi;}
.menu-list li{counter-increment:mi;position:relative;}
.menu-list a{display:inline-block;font-family:'Geist',sans-serif;color:#181712;font-weight:700;font-size:2.4rem;line-height:1.08;letter-spacing:-0.02em;padding:8px 0 8px 2px;opacity:0;transform:translateY(16px);transition:opacity 300ms var(--ease-out-strong),transform 300ms var(--ease-out-strong),color 200ms var(--ease-out-strong);}
body.menu-open .menu-list a{opacity:1;transform:translateY(0);}
.menu-list li:nth-child(1) a{transition-delay:60ms;}
.menu-list li:nth-child(2) a{transition-delay:120ms;}
.menu-list li:nth-child(3) a{transition-delay:180ms;}
.menu-list li:nth-child(4) a{transition-delay:240ms;}
.menu-list li:nth-child(5) a{transition-delay:300ms;}
.menu-list a:hover{color:#B5761E;transform:translateX(8px);}
.menu-list a:active{transform:scale(0.96);}
.menu-list a::after{content:counter(mi,decimal-leading-zero);position:absolute;top:.3em;right:0;font-family:'Geist Mono',monospace;font-size:12px;font-weight:400;color:#B5761E;}
.menu-list a{padding-right:2.2em;}
.menu-socials{margin-top:2.5rem;padding-top:2rem;border-top:1px solid rgba(24,23,18,0.12);display:flex;flex-direction:column;gap:.75rem;}
.menu-socials-title{margin:0;font-family:'Geist Mono',monospace;font-size:.75rem;letter-spacing:.06em;text-transform:uppercase;font-weight:500;color:#B5761E;}
.menu-socials-list{list-style:none;margin:0;padding:0;display:flex;gap:1rem;flex-wrap:wrap;}
.menu-socials-list a{font-size:1.05rem;font-weight:500;color:#181712;}
.menu-socials-list a:hover{color:#B5761E;}

/* ---------- hero ---------- */
.hero{padding:158px 24px 96px;text-align:center;}
.sign-badge{display:inline-flex;align-items:center;gap:9px;font-family:'Geist Mono',monospace;font-size:12px;letter-spacing:.03em;color:var(--muted2);border:1px solid var(--accent-line);border-radius:999px;padding:7px 16px 7px 12px;background:rgba(232,163,61,0.05);cursor:pointer;opacity:1;transform:translateY(0) scale(1);transition:opacity 380ms var(--spring-gentle),transform 380ms var(--spring-gentle),border-color 300ms ease,background 300ms ease;
  @starting-style{opacity:0;transform:translateY(12px) scale(0.94);}
}
.sign-badge:hover{border-color:var(--accent);background:rgba(232,163,61,0.1);}
.sign-badge:active{transform:scale(0.96);}
.hero h1{margin:28px auto 0;font-family:'Geist',sans-serif;font-weight:800;font-size:clamp(40px,6.4vw,68px);line-height:1.04;letter-spacing:-0.02em;max-width:840px;text-wrap:balance;opacity:0;transform:translateY(16px);animation:heroIn 0.7s var(--spring-bounce) forwards 0.2s;}
@keyframes heroIn{
  to{opacity:1;transform:translateY(0);}
}
.hero h1 em{font-style:italic;font-weight:450;color:var(--accent);}
.hero p{margin:22px auto 0;max-width:540px;font-size:17px;line-height:1.65;color:var(--muted2);opacity:0;animation:heroIn 0.7s var(--spring-bounce) forwards 0.35s;}
.btn-row{display:flex;gap:12px;margin-top:32px;justify-content:center;flex-wrap:wrap;}
.btn-primary{background:var(--text);color:#0C0D10;font-size:15px;font-weight:600;padding:13px 26px;border-radius:9px;border:none;cursor:pointer;transition:background 280ms var(--ease-out-strong),transform 280ms var(--spring-bounce),box-shadow 280ms ease;}
.btn-primary:hover{background:var(--accent);transform:translateY(-2px);box-shadow:0 12px 28px rgba(232,163,61,0.18);}
.btn-primary:active{transform:scale(0.96) translateY(0);transition:transform 120ms var(--active-feedback);background:#E8A33D;}
.btn-outline{border:1px solid rgba(236,232,223,0.18);color:var(--text);font-size:15px;font-weight:500;padding:13px 26px;border-radius:9px;background:transparent;cursor:pointer;transition:border-color 280ms var(--ease-out-strong),background 280ms var(--ease-out-strong),transform 280ms var(--spring-bounce),box-shadow 280ms ease;}
.btn-outline:hover{border-color:var(--accent-line);background:rgba(236,232,223,0.06);transform:translateY(-2px);box-shadow:0 8px 20px rgba(232,163,61,0.08);}
.btn-outline:active{transform:scale(0.96);transition:transform 120ms var(--active-feedback);background:rgba(236,232,223,0.09);}

/* ---------- features (stagger entrance + hover depth) ---------- */
.features{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));}
.feature{padding:44px 34px;border-right:1px solid var(--border);border-top:1px solid transparent;display:flex;flex-direction:column;gap:13px;opacity:0;transform:translateY(24px) scale(0.96);animation:featureIn 0.6s var(--spring-bounce) forwards;transition:background 300ms var(--ease-out-strong),transform 300ms var(--spring-bounce),box-shadow 300ms ease,border-color 300ms ease;}
.feature:nth-child(1){animation-delay:0ms;}
.feature:nth-child(2){animation-delay:60ms;}
.feature:nth-child(3){animation-delay:120ms;}
@keyframes featureIn{
  to{opacity:1;transform:translateY(0) scale(1);}
}
.feature:last-child{border-right:none;}
.feature:hover{background:rgba(236,232,223,0.04);box-shadow:0 12px 32px rgba(232,163,61,0.08),inset 0 1px 0 rgba(236,232,223,0.12);transform:translateY(-6px) scale(1.01);border-color:rgba(236,232,223,0.18);}
.feature .arrow{color:var(--accent);font-size:17px;font-family:'Geist Mono',monospace;font-weight:600;transition:transform 300ms var(--spring-bounce);}
.feature:hover .arrow{transform:translateX(4px) scale(1.15);}
.feature h3{margin:2px 0 0;font-family:'Geist',sans-serif;font-size:19px;font-weight:700;letter-spacing:-0.01em;}
.feature p{margin:0;font-size:14px;line-height:1.65;color:#8f8d86;}
.preview-box{margin-top:14px;border:1px solid rgba(236,232,223,0.09);border-radius:10px;background:var(--bg-raised);overflow:hidden;}
.preview-dots{display:flex;gap:6px;padding:10px 12px;border-bottom:1px solid rgba(236,232,223,0.06);}
.preview-dots span{width:9px;height:9px;border-radius:50%;display:inline-block;}
.preview-body{padding:16px;min-height:118px;}

/* chat preview with spring entrance */
.chat-row{display:flex;margin-bottom:8px;}
.chat-row.mine{justify-content:flex-end;}
.chat-bubble{max-width:85%;font-size:11.5px;line-height:1.45;padding:7px 10px;border-radius:10px;background:rgba(236,232,223,0.06);color:#c9c6bd;opacity:1;transform:translateX(0) scale(1);transition:opacity 380ms var(--spring-gentle),transform 380ms var(--spring-gentle);
  @starting-style{opacity:0;transform:translateX(-16px) scale(0.92);}}
.chat-row.mine .chat-bubble{background:var(--accent);color:#1a1305;}

/* voice preview */
.voice-bars{display:flex;align-items:flex-end;gap:3px;height:44px;}
.voice-bars i{width:5px;border-radius:2px;background:rgba(236,232,223,0.16);display:block;}
.voice-bars i.on{background:var(--accent);animation:nodepulse 1.8s ease-in-out infinite;}
.voice-meta{font-family:'Geist Mono',monospace;font-size:10.5px;color:#82807a;display:flex;gap:8px;align-items:center;margin-top:10px;}
.voice-meta .live{width:6px;height:6px;border-radius:50%;background:var(--confirm);display:inline-block;}

/* calendar preview */
.cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin-bottom:10px;}
.cal-grid .h{font-family:'Geist Mono',monospace;font-size:9px;color:#65635d;text-align:center;}
.cal-grid .c{height:16px;border-radius:3px;background:rgba(236,232,223,0.045);border:1px solid transparent;}
.cal-grid .c.on{background:var(--accent-soft);border:1px solid var(--accent-line);}
.cal-meta{font-family:'Geist Mono',monospace;font-size:10.5px;color:#82807a;}

/* ---------- canales / diagrama ---------- */
.canales{display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));}
.canales-diagram{padding:56px 32px;border-right:1px solid var(--border);display:flex;align-items:center;justify-content:center;}
.canales-text{padding:56px 40px;display:flex;flex-direction:column;justify-content:center;gap:18px;}
.chip{display:inline-flex;align-items:center;gap:8px;align-self:flex-start;font-family:'Geist Mono',monospace;font-size:12px;color:var(--muted2);border:1px solid rgba(236,232,223,0.12);border-radius:6px;padding:5px 10px;}
.chip .dot{width:6px;height:6px;border-radius:2px;background:var(--accent);display:inline-block;}
.canales-text h2{margin:0;font-family:'Geist',sans-serif;font-size:29px;line-height:1.3;letter-spacing:-0.01em;font-weight:700;}
.canales-text h2 span{color:#83817a;font-weight:500;}
.canales-text p{margin:0;font-size:15px;line-height:1.7;color:#8a887f;max-width:460px;}

/* ---------- banner (no eyebrow) ---------- */
.scale-banner{padding:76px 24px;text-align:center;}
.scale-banner .row{font-family:'Geist',sans-serif;font-size:clamp(20px,3.4vw,29px);font-weight:600;letter-spacing:-0.01em;line-height:1.6;display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:10px;max-width:760px;margin:0 auto;}
.pill{display:inline-flex;align-items:center;gap:8px;background:var(--bg-raised);border:1px solid rgba(236,232,223,0.12);border-radius:999px;padding:7px 18px;font-family:'Inter',sans-serif;font-size:.58em;font-weight:600;transition:border-color 200ms var(--ease-out-strong);}
.pill:hover{border-color:var(--accent-line);}
.pill em{color:var(--accent);font-style:normal;}

/* ---------- 24/7 ---------- */
.always{display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));}
.always-text{padding:64px 40px;border-right:1px solid var(--border);display:flex;flex-direction:column;justify-content:center;gap:18px;}
.always-text h2{margin:0;font-family:'Geist',sans-serif;font-size:32px;line-height:1.2;letter-spacing:-0.01em;font-weight:700;max-width:380px;}
.always-text p{margin:0;font-size:15px;line-height:1.7;color:#8a887f;max-width:420px;}
.always-viz{padding:64px 40px;display:flex;align-items:center;}
.activity-card{width:100%;border:1px solid rgba(236,232,223,0.09);border-radius:12px;background:var(--bg-raised);padding:22px 20px;display:flex;flex-direction:column;gap:16px;}
.activity-head{display:flex;justify-content:space-between;font-family:'Geist Mono',monospace;font-size:11px;color:#77756f;}
.activity-head .on{color:var(--confirm);}
.activity-row{display:flex;align-items:center;gap:14px;}
.activity-row .label{font-family:'Geist Mono',monospace;font-size:11px;color:#82807a;width:96px;flex-shrink:0;}
.activity-bar{flex:1;height:8px;border-radius:4px;overflow:hidden;background-size:48px 8px;opacity:.5;}
.activity-bar.active{opacity:1;animation:barmove 2.8s linear infinite;}
.activity-row .tag{font-family:'Geist Mono',monospace;font-size:11px;color:#77756f;width:70px;text-align:right;flex-shrink:0;}
.activity-row .tag.on{color:var(--accent);}

/* ---------- conversación + resultados ---------- */
.convo-section{display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));}
.convo-left{padding:64px 40px;border-right:1px solid var(--border);display:flex;flex-direction:column;gap:18px;}
.convo-left h2{margin:0;font-family:'Geist',sans-serif;font-size:27px;line-height:1.3;letter-spacing:-0.01em;font-weight:700;}
.convo-left h2 span{color:#83817a;font-weight:500;}
.convo-box{border:1px solid rgba(236,232,223,0.09);border-radius:12px;background:var(--bg-raised);overflow:hidden;}
.tab-row{display:flex;align-items:center;border-bottom:1px solid rgba(236,232,223,0.07);padding:0 8px;}
.tab-btn{background:none;border:none;cursor:pointer;font-family:'Geist Mono',monospace;font-size:12px;padding:12px 14px;color:#77756f;border-bottom:2px solid transparent;margin-bottom:-1px;transition:color 300ms var(--ease-out-strong),border-bottom-color 320ms var(--spring-gentle);}
.tab-btn:hover{color:var(--muted);}
.tab-btn:active{transform:scale(0.96);transition:transform 120ms var(--active-feedback);}
.tab-btn.active{color:var(--accent);border-bottom-color:var(--accent);font-weight:600;}
.convo-body{padding:20px;display:flex;flex-direction:column;gap:10px;min-height:200px;}
.convo-msg-row{display:flex;}
.convo-msg-row.b{justify-content:flex-end;}
.convo-bubble{max-width:82%;font-size:13px;line-height:1.5;padding:9px 13px;border-radius:12px;background:rgba(236,232,223,0.06);color:#c9c6bd;opacity:1;transform:scale(0.95);transition:opacity 250ms var(--ease-out-strong),transform 250ms var(--ease-out-strong);
  @starting-style{opacity:0;transform:scale(0.92);}}
.convo-msg-row.b .convo-bubble{background:var(--accent);color:#1a1305;}
.channels-row{display:flex;align-items:center;flex-wrap:wrap;gap:10px;font-size:13px;color:#8a887f;}
.chan-pill{display:inline-flex;align-items:center;gap:6px;border:1px solid rgba(236,232,223,0.12);border-radius:999px;padding:4px 12px;font-size:12px;color:#c9c6bd;}
.chan-pill i{width:7px;height:7px;border-radius:50%;display:inline-block;}
.convo-right{padding:64px 40px;display:flex;flex-direction:column;justify-content:center;gap:16px;}
.results-label{font-family:'Geist Mono',monospace;font-size:12px;color:#82807a;}
.results-list{display:flex;flex-direction:column;}
.result-row{display:flex;align-items:center;gap:14px;padding:13px 4px;border-bottom:1px solid rgba(236,232,223,0.06);font-size:14px;opacity:0;transform:translateX(-12px);animation:slideInResult 0.5s var(--spring-gentle) forwards;}
.result-row:nth-child(1){animation-delay:100ms;}
.result-row:nth-child(2){animation-delay:150ms;}
.result-row:nth-child(3){animation-delay:200ms;}
.result-row:nth-child(4){animation-delay:250ms;}
.result-row:nth-child(5){animation-delay:300ms;}
@keyframes slideInResult{
  to{opacity:1;transform:translateX(0);}
}
.result-row .pos{font-family:'Geist Mono',monospace;color:#5f5d58;width:20px;}
.result-row .dot{width:8px;height:8px;border-radius:50%;display:inline-block;}
.result-row .name{color:#d8d5cc;}
.result-row .metric{margin-left:auto;font-family:'Geist Mono',monospace;color:#a09e96;font-size:13px;}
.stat-row{display:flex;gap:32px;margin-top:12px;}
.stat-num{font-family:'Geist',sans-serif;font-size:27px;font-weight:800;letter-spacing:-0.01em;}
.stat-label{font-size:13px;color:#8a887f;}

/* ---------- precios (no eyebrow, solo heading) ---------- */
.pricing{padding:84px 24px;}
.pricing-head{text-align:center;margin-bottom:50px;}
.pricing-head h2{margin:0 0 12px;font-family:'Geist',sans-serif;font-size:36px;font-weight:700;letter-spacing:-0.01em;}
.pricing-head p{margin:0;color:#8a887f;font-size:15px;}
.plans{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:20px;max-width:820px;margin:0 auto;}
.plan-card{border:1px solid rgba(236,232,223,0.09);border-radius:14px;padding:32px 28px;background:var(--bg-raised);display:flex;flex-direction:column;opacity:0;transform:translateY(20px) scale(0.98);animation:cardIn 0.65s var(--spring-gentle) forwards;transition:transform 320ms var(--spring-bounce),border-color 320ms var(--ease-out-strong),box-shadow 320ms ease,background 320ms ease;}
@keyframes cardIn{
  to{opacity:1;transform:translateY(0) scale(1);}
}
.plan-card:nth-child(1){animation-delay:80ms;}
.plan-card:nth-child(2){animation-delay:140ms;}
.plan-card:hover{transform:translateY(-8px) scale(1.01);border-color:rgba(236,232,223,0.28);box-shadow:0 20px 48px rgba(232,163,61,0.12);}
.plan-card.highlight{border:1px solid var(--accent-line);box-shadow:0 0 44px rgba(232,163,61,0.15);}
.plan-card.highlight:hover{box-shadow:0 24px 56px rgba(232,163,61,0.22);}
.plan-tag{font-family:'Geist Mono',monospace;font-size:11px;letter-spacing:.08em;color:#a09e96;}
.plan-price{display:flex;align-items:baseline;gap:8px;margin-top:14px;}
.plan-price .num{font-family:'Geist',sans-serif;font-size:36px;font-weight:700;letter-spacing:-0.01em;}
.plan-price .period{font-size:14px;color:#8a887f;}
.plan-items{display:flex;flex-direction:column;gap:10px;margin-top:22px;margin-bottom:26px;}
.plan-item{display:flex;gap:10px;font-size:14px;color:#b8b6ac;line-height:1.45;}
.plan-item .check{color:var(--accent);}
.plan-btn{margin-top:auto;text-align:center;border:1px solid rgba(236,232,223,0.16);color:var(--text);font-size:14px;font-weight:500;padding:11px 18px;border-radius:8px;background:transparent;cursor:pointer;transition:border-color 300ms var(--spring-gentle),background 300ms var(--spring-gentle),transform 300ms var(--spring-bounce),box-shadow 300ms ease;}
.plan-btn:hover{border-color:var(--accent-line);background:rgba(236,232,223,0.03);transform:translateY(-2px);box-shadow:0 6px 16px rgba(232,163,61,0.08);}
.plan-btn:active{transform:scale(0.96);transition:transform 120ms var(--active-feedback);}
.plan-btn.solid{background:var(--text);color:#0C0D10;border:none;}
.plan-btn.solid:hover{background:var(--accent);box-shadow:0 8px 24px rgba(232,163,61,0.2);transform:translateY(-3px);}
.plan-btn.solid:active{transform:scale(0.96);background:var(--accent);}

/* ---------- faq (no eyebrow, solo heading) ---------- */
.faq{padding:84px 24px;max-width:760px;margin:0 auto;}
.faq h2{margin:0 0 32px;font-family:'Geist',sans-serif;font-size:32px;font-weight:700;letter-spacing:-0.01em;}
.faq-item{border-bottom:1px solid var(--border);}
.faq-q{width:100%;display:flex;justify-content:space-between;align-items:center;gap:16px;background:none;border:none;color:var(--text);font-size:16px;font-weight:500;text-align:left;padding:20px 4px;cursor:pointer;transition:color 200ms var(--ease-out-strong);}
.faq-q:hover{color:var(--accent);}
.faq-q:active{transform:scale(0.97);transition:transform 160ms var(--ease-out-strong);}
.faq-q .chev{color:var(--accent);font-size:20px;transition:transform 380ms var(--spring-elastic),color 280ms ease;transform-origin:center;opacity:0.7;}
.faq-q:hover .chev{opacity:1;transform:scale(1.2);}
.faq-item.open .faq-q .chev{transform:rotate(90deg) scale(1.1);color:var(--accent);}
.faq-a{display:none;padding:0 4px 20px;font-size:14px;line-height:1.7;color:#a09e96;max-width:620px;opacity:1;transform:translateY(0);transition:opacity 250ms var(--ease-out-strong),transform 250ms var(--ease-out-strong);
  @starting-style{opacity:0;transform:translateY(-8px);}}
.faq-item.open .faq-a{display:block;}

/* ---------- cta final ---------- */
.cta{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));background:linear-gradient(180deg,rgba(12,13,16,0) 0%,rgba(232,163,61,0.06) 160%);}
.cta-left{padding:72px 40px;border-right:1px solid var(--border);display:flex;flex-direction:column;justify-content:center;gap:16px;}
.cta-left h2{margin:0;font-family:'Geist',sans-serif;font-size:37px;line-height:1.15;letter-spacing:-0.02em;font-weight:700;}
.cta-left p{margin:0;font-size:14px;color:#8a887f;line-height:1.6;}
.cta-card{padding:72px 32px;border-right:1px solid var(--border);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;cursor:pointer;transition:background 300ms var(--ease-out-strong),transform 300ms var(--spring-bounce);}
.cta-card:last-child{border-right:none;}
.cta-card:hover{background:rgba(236,232,223,0.04);transform:translateY(-4px);}
.cta-card:active{transform:scale(0.98);transition:transform 120ms var(--active-feedback);}
.cta-icon{width:56px;height:56px;border-radius:14px;border:1px solid rgba(236,232,223,0.12);display:flex;align-items:center;justify-content:center;color:var(--accent);transition:border-color 300ms var(--ease-out-strong),transform 300ms var(--spring-bounce),box-shadow 300ms ease;}
.cta-card:hover .cta-icon{border-color:var(--accent-line);transform:scale(1.12) translateY(-2px);box-shadow:0 8px 24px rgba(232,163,61,0.15);}
.cta-card:active .cta-icon{transform:scale(0.94);transition:transform 120ms var(--active-feedback);}
.cta-card .label{font-size:15px;font-weight:600;}
.cta-card .sub{font-size:13px;color:#8a887f;max-width:200px;}

/* ---------- footer ---------- */
footer{border-top:1px solid var(--border);padding:32px 24px;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:16px;font-size:13px;color:#77756f;}
footer .links{display:flex;gap:24px;}
footer a{color:#77756f;transition:color 300ms var(--ease-out-strong),transform 300ms var(--spring-bounce);}
footer a:hover{color:var(--accent);transform:translateY(-2px);}
footer a:active{transform:scale(0.96);}

@media (max-width:640px){
  .hero{padding:130px 20px 72px;}
  .feature,.always-text,.always-viz,.convo-left,.convo-right,.canales-diagram,.canales-text,.cta-left,.cta-card{border-right:none;}
}

  /* ATP CHAT WIDGET - Preservado del diseño anterior */
  /* ATP CHAT WIDGET */
  #atp-chat-btn {
    position: fixed; bottom: 24px; right: 24px; z-index: 9999;
    width: 56px; height: 56px; border-radius: 16px; border: none;
    background: #17181c; color: white; cursor: pointer;
    box-shadow: 0 6px 20px rgba(0,0,0,0.35);
    display: flex; align-items: center; justify-content: center;
  }
  #atp-chat-btn::after {
    content: ''; position: absolute; top: -3px; right: -3px;
    width: 13px; height: 13px; border-radius: 50%; background: #ef4444;
    border: 2px solid #fafafa;
  }
  #atp-chat-panel {
    position: fixed; bottom: 96px; right: 24px; z-index: 9999;
    width: 370px; max-width: 90vw; height: 560px; max-height: 75vh;
    background: #0d0e12; border: 1px solid #1f2128; border-radius: 22px;
    box-shadow: 0 10px 50px rgba(0,0,0,0.5);
    display: none; flex-direction: column; overflow: hidden;
    font-family: -apple-system, system-ui, sans-serif;
  }
  #atp-chat-panel.open { display: flex; }
  #atp-chat-header {
    display: flex; align-items: center; gap: 12px;
    padding: 20px 18px 16px; border-bottom: 1px solid #1f2128;
  }
  #atp-chat-avatar {
    width: 36px; height: 36px; border-radius: 10px; background: #2563eb;
    display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0;
  }
  #atp-chat-title { color: #f4f4f5; font-weight: 700; font-size: 15px; line-height: 1.2; }
  #atp-chat-subtitle { color: #8b8d94; font-size: 12.5px; margin-top: 2px; }
  #atp-chat-close {
    margin-left: auto; background: none; border: none; color: #8b8d94;
    font-size: 18px; cursor: pointer; padding: 4px;
  }
  #atp-chat-messages {
    flex: 1; overflow-y: auto; padding: 18px; display: flex; flex-direction: column; gap: 12px;
  }
  .atp-msg {
    max-width: 85%; padding: 12px 14px; border-radius: 16px; font-size: 14px; line-height: 1.45;
    white-space: pre-line;
    animation: atpPop 0.25s ease-out;
  }
  @keyframes atpPop {
    from { opacity: 0; transform: translateY(8px) scale(0.97); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
  .atp-msg.user {
    align-self: flex-end; background: #2563eb; color: white; border-bottom-right-radius: 4px;
  }
  .atp-msg.bot {
    align-self: flex-start; background: #1a1c22; color: #e4e4e7; border-bottom-left-radius: 4px;
  }
  #atp-chat-input-wrap { padding: 12px 14px 16px; }
  #atp-chat-input-row {
    display: flex; align-items: center; gap: 8px;
    border: 1.5px solid #2563eb; border-radius: 24px; padding: 6px 8px 6px 16px;
    background: #0d0e12;
  }
  #atp-chat-input {
    flex: 1; border: none; background: transparent; color: white;
    padding: 8px 0; font-size: 14px; outline: none;
  }
  #atp-chat-input::placeholder { color: #6b6d74; }
  #atp-chat-send {
    width: 34px; height: 34px; border-radius: 50%; border: none;
    background: #2563eb; color: white; cursor: pointer; font-size: 15px;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  #atp-chat-send:hover { background: #1d4ed8; }
  #atp-chat-send:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
</head>
<body>

<!-- NAV -->
<div class="nav-header">
  <div class="nav-logo">Atiéndeme la Pyme</div>
  <button class="nav-toggle" id="menuToggle" aria-label="Abrir menú">
    <span class="bars"><span></span><span></span></span>
    Menú
  </button>
</div>
<div class="menu-overlay" id="menuOverlay"></div>
<nav class="menu-panel" id="menuPanel">
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

<div class="wrap">

  <!-- HERO -->
  <section class="hero">
    <span class="sign-badge">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="color:var(--accent)"><circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/></svg>
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
  <section id="solucion" class="features reveal">
    <div class="feature">
      <div class="arrow">01</div>
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
    <div class="feature">
      <div class="arrow">02</div>
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
    <div class="feature">
      <div class="arrow">03</div>
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
  </section>

  <!-- CANALES -->
  <section id="canales" class="canales reveal">
    <div class="canales-diagram" id="diagramHost"></div>
    <div class="canales-text">
      <span class="chip"><span class="dot"></span>Todos tus canales, conectados</span>
      <h2>De la consulta a la cita agendada, sin que muevas un dedo. <span>Tu asistente responde en WhatsApp, Instagram, Facebook y correo. Agenda directo en tu calendario.</span></h2>
      <p>Entrenado con la información de tu negocio: tus servicios, tus precios, tus horarios. Responde en segundos y con tu tono.</p>
    </div>
  </section>

  <!-- SCALE BANNER -->
  <section class="scale-banner reveal">
    <div class="row">
      <span>Atiende a</span>
      <span class="pill"><em>↗</em> más clientes</span>
      <span>sin contratar</span>
      <span class="pill"><em>＋</em> más gente</span>
    </div>
  </section>

  <!-- 24/7 -->
  <section class="always reveal">
    <div class="always-text">
      <span class="chip"><span class="dot" style="background:var(--confirm)"></span>Siempre activo</span>
      <h2>Tu equipo descansa. Tu atención, no.</h2>
      <p>Las consultas de noche y fin de semana ya no se pierden: tu asistente responde, califica y agenda mientras duermes.</p>
      <a href="#contacto" class="btn-outline" style="align-self:flex-start;margin-top:6px;padding:9px 18px;font-size:14px;">Saber más</a>
    </div>
    <div class="always-viz">
      <div class="activity-card">
        <div class="activity-head"><span>ACTIVIDAD · ÚLTIMAS 24H</span><span class="on">● en línea</span></div>
        <div class="activity-row">
          <span class="label">09:00 – 18:00</span>
          <div class="activity-bar" style="background-image:repeating-linear-gradient(90deg, rgba(236,232,223,0.3) 0 14px, transparent 14px 24px)"></div>
          <span class="tag">Tu equipo</span>
        </div>
        <div class="activity-row">
          <span class="label">18:00 – 00:00</span>
          <div class="activity-bar active" style="background-image:repeating-linear-gradient(90deg, var(--accent) 0 14px, transparent 14px 24px)"></div>
          <span class="tag on">IA activa</span>
        </div>
        <div class="activity-row">
          <span class="label">00:00 – 09:00</span>
          <div class="activity-bar active" style="background-image:repeating-linear-gradient(90deg, var(--accent) 0 14px, transparent 14px 24px)"></div>
          <span class="tag on">IA activa</span>
        </div>
        <div class="activity-row">
          <span class="label">Fin de semana</span>
          <div class="activity-bar active" style="background-image:repeating-linear-gradient(90deg, var(--accent) 0 14px, transparent 14px 24px)"></div>
          <span class="tag on">IA activa</span>
        </div>
      </div>
    </div>
  </section>

  <!-- CONVERSACIÓN + RESULTADOS -->
  <section class="convo-section reveal">
    <div class="convo-left">
      <span class="chip"><span style="color:var(--accent)">✦</span> Conversaciones reales</span>
      <h2>Así atiende tu asistente. <span>Del primer mensaje a la cita confirmada.</span></h2>
      <div class="convo-box">
        <div class="tab-row" id="tabRow">
          <button class="tab-btn active" data-tab="0">WhatsApp</button>
          <button class="tab-btn" data-tab="1">Llamada</button>
          <button class="tab-btn" data-tab="2">Instagram</button>
        </div>
        <div class="convo-body" id="convoBody"></div>
      </div>
      <div class="channels-row">
        <span>Funciona con</span>
        <span class="chan-pill"><i style="background:#25D366"></i>WhatsApp</span>
        <span class="chan-pill"><i style="background:#E1306C"></i>Instagram</span>
        <span class="chan-pill"><i style="background:#1877F2"></i>Facebook</span>
        <span class="chan-pill"><i style="background:#F59E0B"></i>Correo</span>
        <span class="chan-pill"><i style="background:var(--accent)"></i>Google Calendar</span>
      </div>
    </div>
    <div class="convo-right">
      <div class="results-label">Resultados de clientes</div>
      <div class="results-list">
        <div class="result-row"><span class="pos">1</span><span class="dot" style="background:#25D366"></span><span class="name">Consultorio dental</span><span class="metric">0 inasistencias</span></div>
        <div class="result-row"><span class="pos">2</span><span class="dot" style="background:var(--accent)"></span><span class="name">Peluquería</span><span class="metric">24/7 atendida</span></div>
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
  <section id="precios" class="pricing reveal">
    <div class="pricing-head">
      <h2>Precios transparentes</h2>
      <p>Sin sorpresas. Sin contratos largos.</p>
    </div>
    <div class="plans">
      <div class="plan-card">
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
      <div class="plan-card highlight">
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
  <section id="faq" class="faq reveal">
    <h2>Preguntas frecuentes</h2>
    <div id="faqList">
      <div class="faq-item">
        <button class="faq-q"><span>¿Necesito conocimientos técnicos?</span><span class="chev">+</span></button>
        <div class="faq-a">No. Nosotros hacemos toda la configuración técnica. Tú solo nos das información sobre tu negocio.</div>
      </div>
      <div class="faq-item">
        <button class="faq-q"><span>¿Cuánto tarda la implementación?</span><span class="chev">+</span></button>
        <div class="faq-a">Entre 2 y 3 semanas desde que contratas hasta que está 100% operativo.</div>
      </div>
      <div class="faq-item">
        <button class="faq-q"><span>¿Funciona con mi calendario actual?</span><span class="chev">+</span></button>
        <div class="faq-a">Sí. Se integra con Google Calendar, Calendly, o casi cualquier sistema.</div>
      </div>
      <div class="faq-item">
        <button class="faq-q"><span>¿Puedo cancelar cuando quiera?</span><span class="chev">+</span></button>
        <div class="faq-a">Sí. Sin penalizaciones, sin contratos largos. Cancela cuando quieras.</div>
      </div>
      <div class="faq-item">
        <button class="faq-q"><span>¿Qué pasa con los datos de mis clientes?</span><span class="chev">+</span></button>
        <div class="faq-a">Máxima seguridad. Encriptación de nivel empresarial. Cumplimos con la Ley de Protección de Datos Personales de Chile.</div>
      </div>
    </div>
  </section>

  <!-- CTA FINAL -->
  <section id="contacto" class="cta reveal">
    <div class="cta-left">
      <h2>¿Listo para automatizar tu atención?</h2>
      <p>Sin compromiso. Sin costo. Solo conversamos.</p>
      <a href="mailto:contacto@atiendemelapyme.cl?subject=Quiero%20agendar%20una%20demo" class="btn-primary" style="align-self:flex-start;margin-top:6px;">Agendar consulta gratuita</a>
    </div>
    <div class="cta-card">
      <div class="cta-icon"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/></svg></div>
      <div class="label">Agenda una demo</div>
      <div class="sub">20 minutos, sin compromiso. Vemos tu caso en vivo.</div>
    </div>
    <div class="cta-card">
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

</div>

<script>
/* ---------- menú lateral ---------- */
const menuToggle = document.getElementById('menuToggle');
const menuOverlay = document.getElementById('menuOverlay');
document.addEventListener('click', (e) => {
  if (e.target.closest('#menuToggle')) { document.body.classList.toggle('menu-open'); return; }
  if (e.target === menuOverlay || e.target.closest('.menu-link')) { document.body.classList.remove('menu-open'); }
});

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
const chans = [
  {name:'WhatsApp', color:'#25D366', y:30},
  {name:'Instagram', color:'#E1306C', y:85},
  {name:'Facebook', color:'#1877F2', y:140},
  {name:'Correo', color:'#F59E0B', y:195},
  {name:'Calendario', color:getComputedStyle(document.documentElement).getPropertyValue('--accent').trim(), y:250},
];
let svg = \`<svg width="420" height="280" viewBox="0 0 420 280" style="max-width:100%;height:auto;">\`;
chans.forEach((c,i)=>{
  svg += \`<path d="M 78 140 C 170 140, 190 \${c.y+14}, 268 \${c.y+14}" stroke="\${c.color}" stroke-width="1.5" fill="none" opacity="0.75" stroke-dasharray="6 6" style="animation:flowdash 1.6s linear infinite"/>\`;
});
svg += \`<rect x="30" y="116" width="48" height="48" rx="12" fill="#131419" stroke="rgba(236,232,223,0.18)"/>\`;
svg += \`<path d="M46 150 L54 135 L62 150" stroke="#ECE8DF" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>\`;
svg += \`<circle cx="54" cy="146.5" r="2.2" fill="#ECE8DF"/>\`;
chans.forEach((c,i)=>{
  svg += \`<g><rect x="268" y="\${c.y}" width="132" height="30" rx="8" fill="#131419" stroke="rgba(236,232,223,0.1)"/>\`;
  svg += \`<circle cx="284" cy="\${c.y+15}" r="4" fill="\${c.color}" style="transform-origin:284px \${c.y+15}px;animation:nodepulse 2.4s ease-in-out \${i*0.35}s infinite"/>\`;
  svg += \`<text x="298" y="\${c.y+19.5}" fill="#c9c6bd" font-size="12" font-family="Inter,sans-serif">\${c.name}</text></g>\`;
});
svg += \`</svg>\`;
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
  convoBody.innerHTML = convos[i].map((m,idx)=>\`
    <div class="convo-msg-row \${m.who==='b'?'b':''}"><div class="convo-bubble" style="--delay:\${idx*60}ms">\${m.text}</div></div>
  \`).join('');
}
document.getElementById('tabRow').addEventListener('click', (e)=>{
  const btn = e.target.closest('.tab-btn');
  if(!btn) return;
  document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  renderConvo(Number(btn.dataset.tab));
});
renderConvo(0);

/* ---------- FAQ acordeón ---------- */
document.getElementById('faqList').addEventListener('click', (e)=>{
  const q = e.target.closest('.faq-q');
  if(!q) return;
  const item = q.closest('.faq-item');
  const wasOpen = item.classList.contains('open');
  document.querySelectorAll('.faq-item').forEach(el=>{ el.classList.remove('open'); });
  if(!wasOpen){ item.classList.add('open'); }
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

<div id="atp-chat-panel">
  <div id="atp-chat-header">
    <div id="atp-chat-avatar">👩‍💻</div>
    <div>
      <div id="atp-chat-title">Dominga</div>
      <div id="atp-chat-subtitle">El equipo también puede ayudar</div>
    </div>
    <button id="atp-chat-close" aria-label="Cerrar chat">✕</button>
  </div>
  <div id="atp-chat-messages"></div>
  <div id="atp-chat-input-wrap">
    <div id="atp-chat-input-row">
      <input id="atp-chat-input" type="text" placeholder="Haz una pregunta..." autocomplete="off" />
      <button id="atp-chat-send" aria-label="Enviar mensaje">➤</button>
    </div>
  </div>
</div>

<script>
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

  // Fallback por si el navegador no soporta crypto.randomUUID (o no hay HTTPS)
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
    if (!opened) {
      opened = true;
      addBubble('¡Hola! Qué gusto saludarte, soy Dominga.

Sé que soy un bot, pero en Atiéndeme la Pyme justamente nos dedicamos a que la tecnología no se note tan robótica ni aburrida.', 'bot');
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
        // Check if reply contains scheduling JSON
        let scheduleData = null;
        let displayText = botReply;
        
        // Try to parse as pure JSON first
        try {
          scheduleData = JSON.parse(botReply);
        } catch (e) {
          // If pure JSON fails, try to extract JSON from text
          const jsonMatch = botReply.match(/\{[\s\S]*"action"\s*:\s*"schedule"[\s\S]*\}/);
          if (jsonMatch) {
            try {
              scheduleData = JSON.parse(jsonMatch[0]);
              // Remove JSON from display text
              displayText = botReply.replace(jsonMatch[0], '').trim();
            } catch (parseErr) {
              // Could not parse extracted JSON
            }
          }
        }

        if (scheduleData && scheduleData.action === 'schedule') {
          // Handle scheduling - show processing message
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
              // Show success message
              addBubble(\`✅ \${scheduleResult.message}

Te enviaremos un correo de confirmación a \${scheduleData.email}\`, 'bot');
              history.push({ role: 'assistant', content: \`Cita agendada exitosamente para \${scheduleData.date} a las \${scheduleData.time}\` });
            } else {
              addBubble(\`❌ No pude agendar la cita: \${scheduleResult.error || 'Error desconocido'}\`, 'bot');
            }
          } catch (scheduleErr) {
            addBubble('❌ Error al procesar tu cita. Intenta de nuevo.', 'bot');
            console.error('Scheduling error:', scheduleErr);
          }
        } else {
          // Normal chat response - show the display text (without JSON)
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
`;

export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        const pathname = url.pathname;

        try {
            // API Routes
            if (pathname === '/api/chat' && request.method === 'POST') {
                return await chatPost({ request, env });
            }
            
            if (pathname === '/api/chat' && request.method === 'GET') {
                return await chatGet({ request, env });
            }

            if (pathname === '/api/schedule' && request.method === 'POST') {
                return await schedulePost({ request, env });
            }

            if (pathname === '/api/schedule' && request.method === 'GET') {
                return await scheduleGet({ request, env });
            }

            // Serve HTML for all other requests
            return new Response(HTML_CONTENT, {
                status: 200,
                headers: { 'Content-Type': 'text/html; charset=utf-8' }
            });
        } catch (err) {
            console.error('Worker error:', err);
            return new Response(JSON.stringify({ error: err.message }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }
   },
    async scheduled(event, env, ctx) {
        ctx.waitUntil(processReminders(env));
    }
};
