// src/index.js - Cloudflare Workers main entry point

import chatHandler from './api/chat.js';
import scheduleHandler from './api/schedule.js';

// Read landing page
let landingPage = null;

async function getLandingPage() {
  if (landingPage) return landingPage;
  
  try {
    const response = await fetch(new URL('../public/index.html', import.meta.url));
    landingPage = await response.text();
  } catch (err) {
    landingPage = '<html><body>Landing page not found</body></html>';
  }
  
  return landingPage;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // API Routes
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

    // Serve landing page for all other requests
    if (pathname === '/' || pathname === '' || !pathname.includes('.')) {
      const page = await getLandingPage();
      return new Response(page, {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }

    // 404
    return new Response('Not found', { status: 404 });
  }
};
