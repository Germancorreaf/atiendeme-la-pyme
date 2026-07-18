import { onRequestPost as chatPost, onRequestGet as chatGet } from './api/chat.js';
import { onRequestPost as schedulePost, onRequestGet as scheduleGet } from './api/schedule.js';
import { processReminders } from './lib/reminder-cron.js';

const HTML_CONTENT = "<!DOCTYPE html><html><head><meta charset='UTF-8'><meta name='viewport' content='width=device-width,initial-scale=1'><title>Atiéndeme la Pyme</title><link href='https://fonts.googleapis.com/css2?family=Geist:wght@400;700&display=swap' rel='stylesheet'><style>body{margin:0;background:#0C0D10;color:#ECE8DF;font-family:Geist,sans-serif}#atp-chat-btn{position:fixed;bottom:24px;right:24px;width:56px;height:56px;border-radius:14px;background:#131419;border:1px solid rgba(236,232,223,0.12);color:#ECE8DF;cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:10000;box-shadow:0 8px 28px rgba(0,0,0,0.3)}#atp-chat-btn:hover{transform:translateY(-4px)scale(1.05)}#atp-chat-panel{position:fixed;bottom:96px;right:24px;width:380px;height:560px;background:linear-gradient(135deg,#0C0D10,#0F1015);border:1px solid rgba(236,232,223,0.09);border-radius:16px;display:none;flex-direction:column;z-index:9999;box-shadow:0 20px 64px rgba(0,0,0,0.4)}#atp-chat-panel.open{display:flex}#atp-chat-messages{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px}.atp-bubble{max-width:85%;padding:12px 14px;border-radius:12px;font-size:14px}.atp-bubble.user{align-self:flex-end;background:#E8A33D;color:#1a1305}.atp-bubble.bot{align-self:flex-start;background:rgba(236,232,223,0.06);border:1px solid rgba(236,232,223,0.09)}</style></head><body><button id='atp-chat-btn'>💬</button><div id='atp-chat-panel'><div style='padding:18px 16px;border-bottom:1px solid rgba(236,232,223,0.09)'><div style='color:#ECE8DF;font-weight:700'>Dominga</div><div style='color:#8B8983;font-size:11px'>Tu agente IA disponible 24/7</div></div><div id='atp-chat-messages'></div><div style='padding:14px'><div style='display:flex;gap:8px'><input id='atp-chat-input' type='text' placeholder='Escribe...' style='flex:1;border:1px solid rgba(236,232,223,0.09);background:transparent;color:#ECE8DF;padding:8px;border-radius:8px'><button id='atp-chat-send' style='background:#E8A33D;color:#1a1305;border:none;width:32px;height:32px;border-radius:8px;cursor:pointer'>→</button></div></div></div><script>(function(){const btn=document.getElementById('atp-chat-btn');const panel=document.getElementById('atp-chat-panel');const input=document.getElementById('atp-chat-input');const sendBtn=document.getElementById('atp-chat-send');const container=document.getElementById('atp-chat-messages');let history=[],opened=false,sending=false;function uuid(){return crypto.randomUUID?crypto.randomUUID():'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=Math.random()*16|0;return(c==='x'?r:r&0x3|0x8).toString(16);})}let sid=localStorage.getItem('atp_sid')||(localStorage.setItem('atp_sid',uuid()),localStorage.getItem('atp_sid'));btn.onclick=()=>{panel.classList.add('open');if(!opened){opened=true;setTimeout(()=>{const b=document.createElement('div');b.className='atp-bubble bot';b.textContent='¡Hola! Soy Dominga. 🚀';container.appendChild(b);container.scrollTop=container.scrollHeight;},300)}input.focus()};function send(){if(sending||!input.value.trim())return;sending=true;sendBtn.disabled=true;const text=input.value;input.value='';const ub=document.createElement('div');ub.className='atp-bubble user';ub.textContent=text;container.appendChild(ub);history.push({role:'user',content:text});fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:history,sessionId:sid})}).then(r=>r.json()).then(d=>{const reply=d.reply||d.message||'';if(reply){const bb=document.createElement('div');bb.className='atp-bubble bot';bb.textContent=reply;container.appendChild(bb);history.push({role:'assistant',content:reply})}container.scrollTop=container.scrollHeight;sending=false;sendBtn.disabled=false}).catch(()=>{const eb=document.createElement('div');eb.className='atp-bubble bot';eb.textContent='Error';container.appendChild(eb);sending=false;sendBtn.disabled=false})}sendBtn.onclick=send;input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();send()}})})();</script></body></html>";

export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        const pathname = url.pathname;
        try {
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
