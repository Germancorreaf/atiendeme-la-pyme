import { onRequestPost as chatPost, onRequestGet as chatGet } from './api/chat.js';
import { onRequestPost as schedulePost, onRequestGet as scheduleGet } from './api/schedule.js';
import { processReminders } from './lib/reminder-cron.js';

const HTML_CONTENT = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Atiéndeme la Pyme</title>
  <link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 20px; background: #0C0D10; color: #ECE8DF; font-family: Geist, sans-serif; }
    
    .container { max-width: 1200px; margin: 0 auto; text-align: center; padding: 60px 20px; }
    h1 { font-size: 48px; margin: 0; font-weight: 800; }
    p { font-size: 18px; color: #8B8983; max-width: 600px; margin: 20px auto; }
    .btn { background: #E8A33D; color: #1a1305; border: none; padding: 12px 24px; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; }
    .btn:hover { background: #D47E1F; }
    
    #atp-chat-btn {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 56px;
      height: 56px;
      border-radius: 14px;
      background: linear-gradient(135deg, #131419, #0F1015);
      border: 1px solid rgba(236, 232, 223, 0.12);
      color: #ECE8DF;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      z-index: 10000;
      box-shadow: 0 8px 28px rgba(0, 0, 0, 0.3);
      transition: all 280ms cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    
    #atp-chat-btn:hover {
      transform: translateY(-4px) scale(1.05);
      box-shadow: 0 16px 48px rgba(232, 163, 61, 0.18);
    }
    
    #atp-chat-panel {
      position: fixed;
      bottom: 96px;
      right: 24px;
      width: 380px;
      max-width: 90vw;
      height: 560px;
      background: linear-gradient(135deg, #0C0D10, #0F1015);
      border: 1px solid rgba(236, 232, 223, 0.09);
      border-radius: 16px;
      display: none;
      flex-direction: column;
      z-index: 9999;
      box-shadow: 0 20px 64px rgba(0, 0, 0, 0.4);
      overflow: hidden;
    }
    
    #atp-chat-panel.open {
      display: flex;
    }
    
    .atp-header {
      padding: 18px 16px;
      border-bottom: 1px solid rgba(236, 232, 223, 0.09);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    
    .atp-header-title {
      font-weight: 700;
      font-size: 14px;
    }
    
    .atp-header-subtitle {
      color: #8B8983;
      font-size: 11px;
      margin-top: 2px;
    }
    
    #atp-chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .atp-bubble {
      max-width: 85%;
      padding: 12px 14px;
      border-radius: 12px;
      font-size: 14px;
      line-height: 1.5;
      word-wrap: break-word;
      white-space: pre-wrap;
    }
    
    .atp-bubble.user {
      align-self: flex-end;
      background: #E8A33D;
      color: #1a1305;
      border-bottom-right-radius: 4px;
    }
    
    .atp-bubble.bot {
      align-self: flex-start;
      background: rgba(236, 232, 223, 0.06);
      color: #ECE8DF;
      border: 1px solid rgba(236, 232, 223, 0.09);
      border-bottom-left-radius: 4px;
    }
    
    .atp-input-section {
      padding: 14px;
      border-top: 1px solid rgba(236, 232, 223, 0.09);
      display: flex;
      gap: 8px;
    }
    
    #atp-chat-input {
      flex: 1;
      border: 1px solid rgba(236, 232, 223, 0.09);
      background: transparent;
      color: #ECE8DF;
      padding: 8px 12px;
      border-radius: 8px;
      font-size: 14px;
      font-family: Geist, sans-serif;
    }
    
    #atp-chat-input::placeholder {
      color: #8B8983;
    }
    
    #atp-chat-send {
      width: 32px;
      height: 32px;
      background: #E8A33D;
      color: #1a1305;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      transition: all 240ms cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    
    #atp-chat-send:hover {
      transform: translateY(-2px) scale(1.08);
    }
    
    #atp-chat-send:active {
      transform: scale(0.94);
    }
  </style>
</head>
<body>

<div class="container">
  <h1>Atiéndeme la Pyme</h1>
  <p>Agentes de IA que venden, atienden y agendan citas por ti, las 24 horas del día.</p>
  <button class="btn">Agendar Demo</button>
</div>

<!-- Chat Widget -->
<button id="atp-chat-btn" title="Abrir chat">💬</button>

<div id="atp-chat-panel">
  <div class="atp-header">
    <div>
      <div class="atp-header-title">Dominga</div>
      <div class="atp-header-subtitle">Tu agente IA disponible 24/7</div>
    </div>
    <button id="atp-chat-close" style="background: none; border: none; color: #8B8983; cursor: pointer; font-size: 18px;">✕</button>
  </div>
  
  <div id="atp-chat-messages"></div>
  
  <div class="atp-input-section">
    <input id="atp-chat-input" type="text" placeholder="Escribe un mensaje...">
    <button id="atp-chat-send">→</button>
  </div>
</div>

<script>
(function() {
  const btn = document.getElementById('atp-chat-btn');
  const panel = document.getElementById('atp-chat-panel');
  const closeBtn = document.getElementById('atp-chat-close');
  const input = document.getElementById('atp-chat-input');
  const sendBtn = document.getElementById('atp-chat-send');
  const container = document.getElementById('atp-chat-messages');

  let history = [];
  let opened = false;
  let sending = false;

  function generateSessionId() {
    return 'session-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  let sessionId = localStorage.getItem('atp_session_id') || 
                  (localStorage.setItem('atp_session_id', generateSessionId()), 
                   localStorage.getItem('atp_session_id'));

  btn.addEventListener('click', () => {
    panel.classList.add('open');
    if (!opened) {
      opened = true;
      setTimeout(() => {
        const bubble = document.createElement('div');
        bubble.className = 'atp-bubble bot';
        bubble.textContent = '¡Hola! Soy Dominga. 👋\\n\\n¿Qué necesita tu empresa para crecer hoy? 🚀';
        container.appendChild(bubble);
        container.scrollTop = container.scrollHeight;
      }, 300);
    }
    input.focus();
  });

  closeBtn.addEventListener('click', () => {
    panel.classList.remove('open');
  });

  function addMessage(text, role) {
    const bubble = document.createElement('div');
    bubble.className = 'atp-bubble ' + role;
    bubble.textContent = text;
    container.appendChild(bubble);
    container.scrollTop = container.scrollHeight;
  }

  function sendMessage() {
    if (sending) return;
    const text = input.value.trim();
    if (!text) return;

    sending = true;
    sendBtn.disabled = true;
    input.value = '';

    addMessage(text, 'user');
    history.push({ role: 'user', content: text });

    fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        messages: history, 
        sessionId: sessionId 
      })
    })
    .then(response => response.json())
    .then(data => {
      const reply = data.reply || data.message || data.response || data.text || 'Sin respuesta';
      addMessage(reply, 'bot');
      history.push({ role: 'assistant', content: reply });
      
      sending = false;
      sendBtn.disabled = false;
      input.focus();
    })
    .catch(error => {
      console.error('Error:', error);
      addMessage('Error de conexión. Intenta de nuevo.', 'bot');
      sending = false;
      sendBtn.disabled = false;
    });
  }

  sendBtn.addEventListener('click', sendMessage);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendMessage();
    }
  });
})();
</script>

</body>
</html>`;

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
