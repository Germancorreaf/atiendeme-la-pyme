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

describe('/admin', () => {
  it('shows the login page instead of the dashboard without a session cookie', async () => {
    const res = await SELF.fetch('https://example.com/admin');
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('action="/admin/login"');
    expect(html).not.toContain('id="st-conv"');
  });
});
