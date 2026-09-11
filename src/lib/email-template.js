// src/lib/email-template.js
// Shell compartido para TODOS los correos de la app (clientes e internos a
// Germán) — versión oscura del estilo "brutalista" que ya tenía el correo
// de confirmación de cita, con el logo real del sitio (mismo SVG que usa
// el nav de atiendemelapyme.cl, ver src/index.js .nav-logo) y la paleta del
// design system de Dominga (bg #0C0D10, text #ECE8DF, accent #E8A33D).
//
// Uso: cada función de src/lib/email.js y src/lib/email-inbound.js arma su
// propio "cuerpo" (details card, quote blocks, botón, etc.) y se lo pasa a
// renderEmailShell() junto con un tag corto para el header. Así los 4
// correos comparten exactamente el mismo look sin duplicar CSS.

export function escapeHtml(str = '') {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export const COLORS = {
  bg: '#0C0D10',
  bgCard: '#16181D',
  border: '#2A2D33',
  borderStrong: '#3A3D44',
  text: '#ECE8DF',
  textMuted: '#8E9096',
  accent: '#E8A33D',
  accentDark: '#0C0D10',
  confirm: '#4F9D8C'
};

// Mismo brandmark que el nav del sitio (src/index.js), con los colores del
// design system fijos en vez de var(--...) porque los clientes de correo no
// resuelven custom properties de forma confiable.
export function logoSvg(size = 36) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 64 64" role="img" aria-label="Atiéndeme la Pyme" style="display:block;">
<rect width="64" height="64" fill="${COLORS.bg}"/>
<text x="10" y="48" font-family="'Space Grotesk','Arial Black',sans-serif" font-weight="700" font-size="42" fill="${COLORS.text}">a</text>
<rect x="40" y="16" width="13" height="34" fill="${COLORS.accent}"/>
</svg>`;
}

/**
 * Arma el HTML completo de un correo con el header (logo + wordmark + tag),
 * el cuerpo que le pasa cada caller, y el footer estándar.
 *
 * @param {string} tag - etiqueta corta tipo "[CITA CONFIRMADA ✓]" bajo el logo.
 * @param {string} bodyHtml - HTML del contenido específico de ese correo.
 * @param {string} [footerNote] - línea chica opcional al final del footer (ej. session_id).
 */
export function renderEmailShell({ tag, bodyHtml, footerNote = '' }) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: ${COLORS.text}; background: ${COLORS.bg}; margin: 0; padding: 0; }
.wrapper { background: ${COLORS.bg}; padding: 24px; }
.container { max-width: 600px; margin: 0 auto; background: ${COLORS.bg}; border: 1px solid ${COLORS.border}; }
.header { padding: 28px 30px; border-bottom: 4px solid ${COLORS.accent}; }
.header-row { display: flex; align-items: center; gap: 12px; }
.header h1 { margin: 0; color: ${COLORS.text}; font-size: 16px; font-family: 'Courier New', monospace; letter-spacing: 2px; font-weight: bold; }
.header .tag { font-size: 11px; color: ${COLORS.accent}; font-family: 'Courier New', monospace; margin-top: 6px; letter-spacing: 1px; }
.content { padding: 36px 30px; }
.greeting { font-size: 15px; margin-bottom: 20px; color: ${COLORS.text}; }
.greeting strong { color: ${COLORS.accent}; }
.title { font-size: 18px; font-weight: bold; color: ${COLORS.text}; text-transform: uppercase; margin: 28px 0 18px 0; border-bottom: 2px solid ${COLORS.accent}; padding-bottom: 10px; font-family: 'Courier New', monospace; }
.details { border: 1px solid ${COLORS.borderStrong}; background: ${COLORS.bgCard}; margin: 20px 0; }
.detail-header { background: ${COLORS.bgCard}; color: ${COLORS.accent}; padding: 12px 20px; font-family: 'Courier New', monospace; font-size: 11px; letter-spacing: 2px; border-bottom: 1px solid ${COLORS.border}; }
.detail-row { display: flex; padding: 14px 20px; border-bottom: 1px solid ${COLORS.border}; }
.detail-row:last-child { border-bottom: none; }
.detail-label { font-family: 'Courier New', monospace; font-size: 12px; color: ${COLORS.textMuted}; width: 140px; font-weight: 600; }
.detail-value { flex: 1; color: ${COLORS.text}; font-weight: 600; }
.quote { border-left: 3px solid ${COLORS.borderStrong}; background: ${COLORS.bgCard}; padding: 14px 18px; white-space: pre-wrap; color: ${COLORS.textMuted}; margin-bottom: 22px; }
.quote-title { margin: 0 0 8px; color: ${COLORS.textMuted}; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-family: 'Courier New', monospace; }
.highlight { border: 1px solid ${COLORS.accent}; border-radius: 6px; background: ${COLORS.bgCard}; padding: 16px 18px; white-space: pre-wrap; color: ${COLORS.text}; margin-bottom: 22px; }
.highlight-title { margin: 0 0 8px; color: ${COLORS.accent}; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-family: 'Courier New', monospace; }
.button { display: inline-block; background: ${COLORS.accent}; color: ${COLORS.accentDark} !important; padding: 12px 28px; text-decoration: none; font-weight: bold; border: 2px solid ${COLORS.accent}; margin: 20px 0; font-size: 13px; letter-spacing: .5px; }
.button-center { text-align: center; }
.fallback { font-family: 'Courier New', monospace; font-size: 11px; color: ${COLORS.textMuted}; text-align: center; margin: 14px 0; word-break: break-all; }
.fallback a { color: ${COLORS.accent}; text-decoration: underline; }
.note { border-left: 4px solid ${COLORS.accent}; background: ${COLORS.bgCard}; padding: 14px 18px; margin: 24px 0; font-size: 13px; line-height: 1.6; color: ${COLORS.textMuted}; }
.note strong { color: ${COLORS.text}; }
.section { margin-top: 28px; }
.section p { color: ${COLORS.textMuted}; line-height: 1.8; margin: 12px 0; }
.section ul { color: ${COLORS.textMuted}; margin: 14px 0; padding-left: 20px; }
.section li { margin: 8px 0; }
.footer { background: ${COLORS.bg}; padding: 26px 30px; border-top: 1px solid ${COLORS.border}; text-align: center; font-size: 12px; color: ${COLORS.textMuted}; }
.footer a { color: ${COLORS.accent}; text-decoration: none; }
.signature { margin-top: 18px; font-family: 'Courier New', monospace; font-size: 11px; color: ${COLORS.textMuted}; }
@media (max-width: 620px) {
  .content { padding: 22px 16px; }
  .detail-row { flex-direction: column; }
  .detail-label { width: 100%; margin-bottom: 4px; }
}
</style>
</head>
<body>
<div class="wrapper">
<div class="container">

  <div class="header">
    <div class="header-row">
      ${logoSvg(32)}
      <div>
        <h1>ATIÉNDEME_LA_PYME<span style="color:${COLORS.accent};">_</span></h1>
        ${tag ? `<div class="tag">${tag}</div>` : ''}
      </div>
    </div>
  </div>

  <div class="content">
${bodyHtml}
  </div>

  <div class="footer">
    <strong style="color:${COLORS.text};">Atiéndeme la Pyme</strong><br>
    Santiago, Chile<br><br>
    <a href="mailto:contacto@atiendemelapyme.cl">Contáctanos</a> ·
    <a href="https://atiendemelapyme.cl">Visita nuestro sitio</a>
    ${footerNote ? `<br><br><span style="color:${COLORS.border};">${footerNote}</span>` : ''}
  </div>

</div>
</div>
</body>
</html>`;
}
