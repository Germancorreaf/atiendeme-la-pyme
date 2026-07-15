// src/index.js - Cloudflare Workers with inline landing page

import chatHandler from './api/chat.js';
import scheduleHandler from './api/schedule.js';

// Inline landing page HTML
const LANDING_PAGE = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Atiéndeme la Pyme - Agendamiento de Citas con IA</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; padding: 40px 20px; }
        h1 { color: #333; margin-bottom: 20px; }
        .chat-widget { position: fixed; bottom: 20px; right: 20px; width: 400px; height: 600px; border-radius: 12px; box-shadow: 0 5px 40px rgba(0,0,0,0.16); background: white; display: flex; flex-direction: column; z-index: 9999; }
        .chat-header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 12px 12px 0 0; font-weight: bold; }
        .chat-messages { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 10px; }
        .message { padding: 10px 15px; border-radius: 8px; max-width: 80%; }
        .message.user { background: #667eea; color: white; align-self: flex-end; }
        .message.bot { background: #f0f0f0; color: #333; align-self: flex-start; }
        .chat-input { padding: 15px; border-top: 1px solid #eee; display: flex; gap: 10px; }
        .chat-input input { flex: 1; border: 1px solid #ddd; padding: 10px; border-radius: 6px; }
        .chat-input button { background: #667eea; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; }
        @media (max-width: 768px) { .chat-widget { width: 100%; height: 100%; bottom: 0; right: 0; border-radius: 0; } }
    </style>
</head>
<body>
    <div class="container">
        <h1>Atiéndeme la Pyme</h1>
        <p>Automatiza el agendamiento de citas con IA. Prueba a la derecha →</p>
    </div>

    <div class="chat-widget">
        <div class="chat-header">Dominga - Asistente IA</div>
        <div class="chat-messages" id="messages"></div>
        <div class="chat-input">
            <input type="text" id="input" placeholder="Escribe aquí..." />
            <button onclick="sendMessage()">Enviar</button>
        </div>
    </div>

    <script>
        const messagesDiv = document.getElementById('messages');
        const inputField = document.getElementById('input');
        let sessionId = localStorage.getItem('atp_session_id') || crypto.randomUUID();
        localStorage.setItem('atp_session_id', sessionId);
        let history = [];

        function addMessage(text, isUser) {
            const msg = document.createElement('div');
            msg.className = 'message ' + (isUser ? 'user' : 'bot');
            msg.textContent = text;
            messagesDiv.appendChild(msg);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }

        async function sendMessage() {
            const text = inputField.value.trim();
            if (!text) return;

            addMessage(text, true);
            inputField.value = '';

            try {
                const res = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: text, sessionId, history })
                });

                const data = await res.json();
                const reply = data.reply || data.message || '';

                if (reply) {
                    let scheduleData = null;
                    try {
                        scheduleData = JSON.parse(reply);
                    } catch (e) {
                        const jsonMatch = reply.match(/\\{[\\s\\S]*"action"\\s*:\\s*"schedule"[\\s\\S]*\\}/);
                        if (jsonMatch) {
                            try {
                                scheduleData = JSON.parse(jsonMatch[0]);
                            } catch (parseErr) {}
                        }
                    }

                    if (scheduleData && scheduleData.action === 'schedule') {
                        addMessage('Procesando tu cita...', false);
                        
                        try {
                            const schedRes = await fetch('/api/schedule', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    date: scheduleData.date,
                                    time: scheduleData.time,
                                    name: scheduleData.name,
                                    email: scheduleData.email,
                                    sessionId
                                })
                            });

                            const schedResult = await schedRes.json();
                            if (schedRes.ok && schedResult.success) {
                                const msg = '[OK] ' + schedResult.message + ' Te enviaremos un correo a ' + scheduleData.email;
                                addMessage(msg, false);
                            } else {
                                addMessage('[ERROR] No pude agendar: ' + (schedResult.error || 'Desconocido'), false);
                            }
                        } catch (err) {
                            addMessage('[ERROR] Error al procesar la cita', false);
                        }
                    } else {
                        addMessage(reply, false);
                        history.push({ role: 'assistant', content: reply });
                    }
                }
            } catch (err) {
                addMessage('Error de conexión', false);
            }
        }

        setTimeout(() => addMessage('Hola! Soy Dominga. Que puedo ayudarte?', false), 500);
    </script>
</body>
</html>`;

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const pathname = url.pathname;

        if (pathname === '/api/chat' && request.method === 'POST') {
            return chatHandler.onRequestPost({ request, env, ...ctx });
        }
        
        if (pathname === '/api/chat' && request.method === 'GET') {
            return chatHandler.onRequestGet({ request, env, ...ctx });
        }

        if (pathname === '/api/schedule' && request.method === 'POST') {
            return scheduleHandler.onRequestPost({ request, env, ...ctx });
        }

        if (pathname === '/api/schedule' && request.method === 'GET') {
            return scheduleHandler.onRequestGet({ request, env, ...ctx });
        }

        if (pathname === '/' || pathname === '') {
            return new Response(LANDING_PAGE, {
                status: 200,
                headers: { 'Content-Type': 'text/html; charset=utf-8' }
            });
        }

        return new Response('Not found', { status: 404 });
    }
};
