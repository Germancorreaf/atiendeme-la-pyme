import { describe, it, expect } from 'vitest';
import { SELF } from 'cloudflare:test';

describe('static/public routes', () => {
  it('serves the landing page at /', async () => {
    const res = await SELF.fetch('https://example.com/');
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('text/html');
    const html = await res.text();
    expect(html).toContain('Atiéndeme la Pyme');
  });

  it('todos los saludos del chat web se identifican como asistente de IA', async () => {
    const html = await (await SELF.fetch('https://example.com/')).text();
    const greetings = [...html.matchAll(/first: '([^']+)'/g)].map((m) => m[1]);
    expect(greetings.length).toBeGreaterThan(0);
    for (const greeting of greetings) {
      expect(greeting).toMatch(/asistente de IA/);
    }
  });

  it('los saludos del chat web usan un tono chileno neutro (ni modismos ni fórmulas formales)', async () => {
    const html = await (await SELF.fetch('https://example.com/')).text();
    const lines = [...html.matchAll(/(?:first|second): '([^']+)'/g)].map((m) => JSON.parse(`"${m[1]}"`));
    expect(lines.length).toBeGreaterThan(0);
    for (const line of lines) {
      expect(line).not.toMatch(/al toque|altiro|al tiro|no más|estimado|usted|24\/7/i);
    }
  });

  it('carga Microsoft Clarity, la CSP lo permite y el chat queda enmascarado en las grabaciones', async () => {
    for (const path of ['/', '/chatbot-ia-para-veterinarias']) {
      const res = await SELF.fetch('https://example.com' + path);
      const csp = res.headers.get('Content-Security-Policy');
      expect(csp).toMatch(/script-src [^;]*https:\/\/\*\.clarity\.ms/);
      expect(csp).toMatch(/connect-src [^;]*https:\/\/\*\.clarity\.ms/);
      expect(await res.text()).toContain('https://www.clarity.ms/tag/yu5gw10tb4');
    }
    const html = await (await SELF.fetch('https://example.com/')).text();
    expect(html).toContain('id="atp-chat-panel" data-clarity-mask="true"');
    const privacy = await (await SELF.fetch('https://example.com/privacidad')).text();
    expect(privacy).toContain('Microsoft Clarity');
  });

  it('serves /terminos with the design-system nav and footer', async () => {
    const res = await SELF.fetch('https://example.com/terminos');
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('Términos y condiciones');
    expect(html).toContain('nav-header');
    expect(html).toContain('<footer>');
  });

  it('serves /privacidad with the design-system nav and footer', async () => {
    const res = await SELF.fetch('https://example.com/privacidad');
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('Política de privacidad');
    expect(html).toContain('nav-header');
    expect(html).toContain('<footer>');
  });

  it('serves robots.txt as plain text', async () => {
    const res = await SELF.fetch('https://example.com/robots.txt');
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('text/plain');
  });

  it('serves sitemap.xml', async () => {
    const res = await SELF.fetch('https://example.com/sitemap.xml');
    expect(res.status).toBe(200);
    const xml = await res.text();
    expect(xml).toContain('<?xml');
  });

  it('returns the 404 page for an unknown route', async () => {
    const res = await SELF.fetch('https://example.com/esto-no-existe');
    expect(res.status).toBe(404);
    const html = await res.text();
    expect(html).toContain('404');
  });

  it('redirects www to the apex domain', async () => {
    const res = await SELF.fetch('https://www.atiendemelapyme.cl/', { redirect: 'manual' });
    expect(res.status).toBe(301);
    expect(res.headers.get('Location')).toBe('https://atiendemelapyme.cl/');
  });
});

describe('SEO y conversión de la landing', () => {
  const home = () => SELF.fetch('https://example.com/').then((r) => r.text());

  it('los botones de agendar abren el chat antes de que los capture la regla genérica', async () => {
    const html = await home();
    const openChat = html.indexOf("el.id === 'cta-final-agendar' || el.id === 'cta-card-demo'");
    const generic = html.indexOf("el.classList.contains('btn-primary') && href === '#contacto'");
    expect(openChat).toBeGreaterThan(-1);
    expect(openChat).toBeLessThan(generic);
  });

  it('las tarjetas de contacto son enlaces', async () => {
    const html = await home();
    expect(html).toContain('<a href="#contacto" id="cta-card-demo" class="cta-card">');
    expect(html).toContain('<a href="mailto:hola@atiendemelapyme.cl" class="cta-card">');
    expect(html).not.toContain('<div class="cta-card">');
  });

  it('la analítica solo se carga desde el banner de consentimiento', async () => {
    for (const path of ['/', '/chatbot-ia-para-veterinarias']) {
      const html = await (await SELF.fetch('https://example.com' + path)).text();
      expect(html.split('googletagmanager.com/gtag/js').length).toBe(2);
      expect(html.indexOf('id="cookie-banner"')).toBeLessThan(html.indexOf('googletagmanager.com/gtag/js'));
      expect(html).toContain('class="cookie-settings"');
    }
  });

  it('la landing y los rubros declaran los mismos precios en JSON-LD', async () => {
    const offers = async (path) => {
      const html = await (await SELF.fetch('https://example.com' + path)).text();
      const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].flatMap((m) => JSON.parse(m[1]));
      return blocks.find((b) => b['@type'] === 'Service').offers.map((o) => [o.price, o.priceSpecification.map((s) => s.price)]);
    };
    const expected = [['149990', ['149990', '49990']], ['249990', ['249990', '99990']], ['449990', ['449990', '179990']]];
    expect(await offers('/')).toEqual(expected);
    expect(await offers('/chatbot-ia-para-veterinarias')).toEqual(expected);
  });

  it.each([
    ['/chatbot-ia-para-veterinarias/?a=1', 'https://example.com/chatbot-ia-para-veterinarias?a=1'],
    ['/privacidad/', 'https://example.com/privacidad'],
    ['/terminos/', 'https://example.com/terminos'],
    ['/index.html', 'https://example.com/']
  ])('%s redirige con 301 a su URL canónica', async (path, location) => {
    const res = await SELF.fetch('https://example.com' + path, { redirect: 'manual' });
    expect(res.status).toBe(301);
    expect(res.headers.get('Location')).toBe(location);
  });
});

describe('limpieza', () => {
  it('el webhook legado /webhook/instagram ya no existe (los mensajes llegan por /webhook/meta)', async () => {
    expect((await SELF.fetch('https://example.com/webhook/instagram')).status).toBe(404);
    expect((await SELF.fetch('https://example.com/webhook/instagram', { method: 'POST', body: '{}' })).status).toBe(404);
  });

  it('/og-image.png se sirve igual en requests repetidas (decodificada una vez)', async () => {
    for (let i = 0; i < 2; i++) {
      const res = await SELF.fetch('https://example.com/og-image.png');
      expect(res.status).toBe(200);
      const bytes = new Uint8Array(await res.arrayBuffer());
      expect([...bytes.slice(1, 4)].map((c) => String.fromCharCode(c)).join('')).toBe('PNG');
    }
  });
});

describe('/ws/chat and /ws/admin-chat routing', () => {
  it('requires a websocket upgrade for /ws/chat/:sessionId', async () => {
    const res = await SELF.fetch('https://example.com/ws/chat/' + 'a'.repeat(32));
    expect(res.status).toBe(426);
  });

  it('rejects /ws/chat/ with a sessionId that is not hex/dashes 32-64', async () => {
    const res = await SELF.fetch('https://example.com/ws/chat/some-session', {
      headers: { Upgrade: 'websocket' },
    });
    expect(res.status).toBe(400);
  });

  it('rejects /ws/chat/ with no sessionId', async () => {
    const res = await SELF.fetch('https://example.com/ws/chat/', {
      headers: { Upgrade: 'websocket' },
    });
    expect(res.status).toBe(400);
  });

  it('rejects /ws/admin-chat/:sessionId without a valid admin session cookie', async () => {
    const res = await SELF.fetch('https://example.com/ws/admin-chat/some-session', {
      headers: { Upgrade: 'websocket' },
    });
    expect(res.status).toBe(401);
  });
});

describe('/admin', () => {
  it('shows the login page instead of the dashboard without a session cookie', async () => {
    const res = await SELF.fetch('https://example.com/admin');
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('action="/admin/login"');
    expect(html).not.toContain('id="st-conv"');
  });
});
