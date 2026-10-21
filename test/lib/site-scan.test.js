import { describe, it, expect, afterEach, vi } from 'vitest';
import { normalizeSiteUrl, htmlToText, scanWebsite, scanInstagram } from '../../src/lib/siteScan.js';

afterEach(() => vi.unstubAllGlobals());

const html = (body, title = 'Peluquería Ejemplo') => new Response(`<html><head><title>${title}</title><meta name="description" content="Cortes en Ñuñoa"><style>.x{}</style></head><body>${body}<script>var secreto=1</script></body></html>`, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });

describe('barrido del sitio web del cliente', () => {
  it('solo acepta sitios públicos', () => {
    expect(normalizeSiteUrl('peluqueria.cl').href).toBe('https://peluqueria.cl/');
    expect(normalizeSiteUrl('http://www.peluqueria.cl/inicio').href).toBe('http://www.peluqueria.cl/inicio');
    for (const bad of ['no tengo', '', 'localhost', '127.0.0.1', 'http://10.0.0.1', 'ftp://x.cl', 'instagram.com/peluqueria', 'algo']) {
      expect(normalizeSiteUrl(bad)).toBeNull();
    }
  });

  it('saca el texto sin scripts ni estilos', () => {
    const text = htmlToText('<title>Hola &amp; chao</title><style>a{}</style><p>Corte: $12.000</p><div>Lun&nbsp;a vie</div><script>x()</script>');
    expect(text).toBe('Hola & chao\nCorte: $12.000\nLun a vie');
  });

  it('lee el inicio y las páginas útiles del mismo sitio, no las externas', async () => {
    const fetched = [];
    vi.stubGlobal('fetch', vi.fn(async (url) => {
      const u = String(url);
      fetched.push(u);
      if (u === 'https://peluqueria.cl/') return html('<a href="/servicios">Servicios</a><a href="/contacto">Contacto</a><a href="/blog/post-1">Blog</a><a href="https://otro.cl/precios">Precios</a><p>Bienvenidos</p>');
      if (u === 'https://peluqueria.cl/servicios') return html('<li>Corte hombre $12.000</li>');
      if (u === 'https://peluqueria.cl/contacto') return new Response('no', { status: 404 });
      return html('no debería leerse');
    }));
    const { text, pages } = await scanWebsite('peluqueria.cl');
    expect(pages).toBe(2);
    expect(text).toContain('Bienvenidos');
    expect(text).toContain('Corte hombre $12.000');
    expect(text).not.toContain('secreto');
    expect(fetched).not.toContain('https://otro.cl/precios');
    expect(fetched).not.toContain('https://peluqueria.cl/blog/post-1');
  });

  it('un sitio caído no rompe nada', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('DNS'); }));
    expect(await scanWebsite('caido.cl')).toEqual({ text: '', pages: 0 });
  });
});

describe('barrido del Instagram conectado', () => {
  it('bio y publicaciones con texto; si los campos de bio no están, usa el perfil básico', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url) => {
      const u = String(url);
      const json = (d, status = 200) => new Response(JSON.stringify(d), { status, headers: { 'Content-Type': 'application/json' } });
      if (u.includes('/me/media')) return json({ data: [{ caption: 'Nuevo: alisado $45.000', timestamp: '2026-10-01T10:00:00+0000' }, { timestamp: '2026-09-01' }] });
      if (u.includes('biography')) return json({ error: { message: 'unsupported' } }, 400);
      return json({ username: 'peluqueria', name: 'Peluquería Ejemplo' });
    }));
    const ig = await scanInstagram('tok');
    expect(ig.posts).toBe(1);
    expect(ig.text).toContain('@peluqueria Peluquería Ejemplo');
    expect(ig.text).toContain('[2026-10-01] Nuevo: alisado $45.000');
  });
});
