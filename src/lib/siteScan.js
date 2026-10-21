// src/lib/siteScan.js
// "Barrido" de las fuentes públicas de un cliente para armar su bot: el texto
// de su sitio web (inicio + páginas como servicios, precios, contacto) y, si
// ya conectó su Instagram, su bio y sus últimas publicaciones. Es materia
// prima para onboardingDraft.js: las respuestas del cliente mandan.

const MAX_PAGES = 6;
const MAX_CHARS_PER_PAGE = 6000;
// Muchas pymes tienen todo en una sola página: el inicio puede ser más largo.
const MAX_CHARS_HOME = 15000;
const MAX_HTML_BYTES = 1_500_000;
const TIMEOUT_MS = 8000;
const USEFUL_LINK = /contact|servicio|precio|tarifa|valor|nosotros|quienes|about|faq|pregunta|horario|carta|menu|tratamiento|producto|agenda|reserva|ubicacion|local/i;
const GRAPH_API_VERSION = 'v21.0';

import { usesInstagramToken } from './metaConnections.js';

/** "tuempresa.cl" -> URL https; null si no es un sitio público razonable. */
export function normalizeSiteUrl(raw) {
  const s = String(raw || '').trim();
  if (!s || /^no( tengo)?\b/i.test(s)) return null;
  let url;
  try { url = new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`); } catch { return null; }
  const host = url.hostname.toLowerCase();
  if (!/^https?:$/.test(url.protocol) || !host.includes('.')) return null;
  // Sin IPs ni nombres internos: solo dominios públicos.
  if (/^[\d.]+$/.test(host) || host.includes(':') || /(^|\.)(localhost|local|internal)$/.test(host)) return null;
  // Las redes sociales no se leen como sitio (piden iniciar sesión).
  if (/(^|\.)(instagram|facebook|fb|tiktok|wa)\.(com|me)$/.test(host)) return null;
  return url;
}

/** Texto legible de un HTML (sin scripts, estilos ni etiquetas). */
export function htmlToText(html) {
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '';
  const desc = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)?.[1] || '';
  const body = html
    .replace(/<(head|title|script|style|noscript|svg|template|iframe)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<\/(p|div|li|h[1-6]|tr|section|article|br)>|<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ');
  const decode = (s) => s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));
  const text = decode(body).split('\n').map((l) => l.replace(/\s+/g, ' ').trim()).filter(Boolean).join('\n');
  return [decode(title).trim(), decode(desc).trim(), text].filter(Boolean).join('\n');
}

async function fetchHtml(url) {
  const res = await fetch(url.toString(), {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AtiendemeLaPymeBot/1.0; +https://atiendemelapyme.cl)', Accept: 'text/html' },
    redirect: 'follow',
    signal: AbortSignal.timeout(TIMEOUT_MS)
  });
  if (!res.ok || !(res.headers.get('Content-Type') || '').includes('text/html')) return null;
  const html = await res.text();
  return html.length > MAX_HTML_BYTES ? html.slice(0, MAX_HTML_BYTES) : html;
}

/** Inicio del sitio + hasta 5 páginas internas útiles. @returns {Promise<{ text: string, pages: number }>} */
export async function scanWebsite(raw) {
  const start = normalizeSiteUrl(raw);
  if (!start) return { text: '', pages: 0 };
  const home = await fetchHtml(start).catch(() => null);
  if (!home) return { text: '', pages: 0 };

  const links = [...home.matchAll(/<a[^>]+href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi)]
    .map(([, href, label]) => { try { return { url: new URL(href, start), label: label.replace(/<[^>]+>/g, ' ') }; } catch { return null; } })
    .filter((l) => l && l.url.hostname === start.hostname && USEFUL_LINK.test(l.url.pathname + ' ' + l.label))
    .map((l) => l.url.origin + l.url.pathname);
  const others = [...new Set(links)].filter((u) => u !== start.origin + start.pathname).slice(0, MAX_PAGES - 1);

  const fetched = await Promise.all(others.map((u) => fetchHtml(new URL(u)).catch(() => null)));
  const pages = [{ url: start.toString(), html: home }, ...others.map((url, i) => ({ url, html: fetched[i] })).filter((p) => p.html)];
  const text = pages.map((p, i) => `--- ${p.url}\n${htmlToText(p.html).slice(0, i ? MAX_CHARS_PER_PAGE : MAX_CHARS_HOME)}`).join('\n\n');
  return { text, pages: pages.length };
}

/** Bio y últimas publicaciones del Instagram conectado (token de Instagram). */
export async function scanInstagram(accessToken) {
  const base = `https://graph.instagram.com/${GRAPH_API_VERSION}/me`;
  const get = async (url) => { const r = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) }); return r.ok ? r.json() : null; };
  const t = encodeURIComponent(accessToken);
  const profile = await get(`${base}?fields=username,name,biography,website&access_token=${t}`)
    || await get(`${base}?fields=username,name&access_token=${t}`);
  const media = await get(`${base}/media?fields=caption,timestamp&limit=15&access_token=${t}`);
  const posts = (media?.data || []).filter((m) => m.caption).map((m) => `[${String(m.timestamp).slice(0, 10)}] ${m.caption.slice(0, 600)}`);
  if (!profile && !posts.length) return { text: '', posts: 0 };
  const head = profile ? [`@${profile.username || ''} ${profile.name || ''}`.trim(), profile.biography, profile.website].filter(Boolean).join('\n') : '';
  return { text: [head, posts.length ? `Publicaciones recientes:\n${posts.join('\n')}` : ''].filter(Boolean).join('\n\n'), posts: posts.length };
}

/**
 * Todas las fuentes de un cliente: su sitio (respuesta "¿Cuál es tu página
 * web?" del onboarding) y su Instagram si ya lo conectó. Nunca falla: lo que
 * no se puede leer queda vacío.
 * @returns {Promise<{ web: string, instagram: string, fuentes: string[] }>}
 */
export async function gatherSources(env, cliente, answers = {}) {
  const fuentes = [];
  const site = await scanWebsite(answers['s1-dom']).catch(() => ({ text: '', pages: 0 }));
  if (site.pages) fuentes.push(`sitio web (${site.pages} ${site.pages === 1 ? 'página' : 'páginas'})`);

  let instagram = '';
  try {
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/meta_connections?cliente_id=eq.${encodeURIComponent(cliente.id)}&select=page_id,ig_business_account_id,ig_username,page_access_token`, {
      headers: { apikey: env.SUPABASE_SERVICE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}` }
    });
    const conn = (res.ok ? await res.json() : []).find(usesInstagramToken);
    if (conn) {
      const ig = await scanInstagram(conn.page_access_token);
      instagram = ig.text;
      if (ig.text) fuentes.push(`Instagram @${conn.ig_username || ''} (bio${ig.posts ? ` y ${ig.posts} publicaciones` : ''})`);
    }
  } catch (err) {
    console.error('Barrido de Instagram:', err.message);
  }
  return { web: site.text, instagram, fuentes };
}
