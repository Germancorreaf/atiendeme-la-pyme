import { describe, it, expect } from 'vitest';
import { SELF } from 'cloudflare:test';
import { VERTICAL_SLUGS } from '../src/lib/vertical-pages.js';
import { buildSystemPrompt } from '../src/lib/dominga-prompt.js';

const page = async (path) => (await SELF.fetch(`https://example.com${path}`)).text();
const visibleText = (html) => html
  .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/\s+/g, ' ');

const HEALTH = ['clinicas-dentales', 'veterinarias', 'centros-medicos', 'kinesiologos', 'psicologos'];

describe('páginas por rubro (SEO)', () => {
  it('hay 8 rubros', () => {
    expect(VERTICAL_SLUGS).toHaveLength(8);
  });

  it.each(VERTICAL_SLUGS)('%s: título con la búsqueda, contenido suficiente y datos estructurados', async (slug) => {
    const res = await SELF.fetch(`https://example.com/${slug}`);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toMatch(/<h1>Chatbot con IA para [^<]+<\/h1>/);
    expect(html).toContain(`<link rel="canonical" href="https://atiendemelapyme.cl/${slug}">`);
    expect(visibleText(html).split(' ').length).toBeGreaterThan(700);

    const ld = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
    expect(ld.map((x) => x['@type'])).toEqual(['Service', 'FAQPage', 'BreadcrumbList']);
    expect(ld[1].mainEntity.length).toBeGreaterThanOrEqual(6);
  });

  it.each(VERTICAL_SLUGS)('%s: honesta y con el tono de la marca', async (slug) => {
    const text = visibleText(await page(`/${slug}`));
    // La conversación de muestra se declara como ejemplo, no como un cliente real.
    expect(text).toMatch(/Ejemplo ilustrativo: no es un cliente real/);
    // Tono chileno neutro, sin modismos ni fórmulas formales.
    expect(text).not.toMatch(/al tiro|altiro|al toque|cachai|estimado|usted/i);
    // Nada de clientes ni resultados inventados.
    expect(text).not.toMatch(/clientes satisfechos|casos de éxito|\d+\s?% (más|menos)/i);
  });

  it.each(HEALTH)('chatbot-ia-para-%s: aclara que no da indicaciones clínicas', async (rubro) => {
    const text = visibleText(await page(`/chatbot-ia-para-${rubro}`));
    expect(text).toMatch(/no (da|entrega) indicaciones clínicas|no diagnostica|no da apoyo psicológico|no da indicaciones médicas/i);
  });

  it('los precios coinciden con los de Dominga (y la landing)', async () => {
    const prompt = buildSystemPrompt();
    for (const slug of VERTICAL_SLUGS) {
      const text = visibleText(await page(`/${slug}`));
      for (const price of ['$149.990', '$49.990', '$249.990', '$99.990', '$449.990', '$179.990']) {
        expect(text).toContain(price);
        expect(prompt).toContain(price);
      }
    }
  });

  it('el sitemap, el pie de la landing y llms.txt incluyen todos los rubros', async () => {
    const sitemap = await page('/sitemap.xml');
    const home = await page('/');
    const llms = await page('/llms.txt');
    for (const slug of VERTICAL_SLUGS) {
      expect(sitemap).toContain(`<loc>https://atiendemelapyme.cl/${slug}</loc>`);
      expect(home).toContain(`href="/${slug}"`);
      expect(llms).toContain(`https://atiendemelapyme.cl/${slug}`);
    }
  });

  it('cada página enlaza a los demás rubros', async () => {
    const html = await page(`/${VERTICAL_SLUGS[0]}`);
    for (const slug of VERTICAL_SLUGS.slice(1)) expect(html).toContain(`href="/${slug}"`);
  });
});
