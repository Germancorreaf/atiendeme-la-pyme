// src/api/onboarding.js
// Link personal de onboarding de cada cliente: /onboarding/<token> (el mismo
// token firmado de clientInvite.js). Es el manual de /onboarding, pero:
// - las respuestas se envían a Atiéndeme la Pyme con un botón (quedan en
//   clientes.onboarding y llega un aviso por correo), en vez de copiarlas;
// - en "Tus redes" el cliente conecta él mismo su Instagram o Página de
//   Facebook (flujo de meta-connect.js con ?invite=) y ve si quedó conectado;
// - ve si ya compartió bien su Google Calendar con la cuenta del sistema.

import { verifyInvite } from '../lib/clientInvite.js';
import { saveCliente } from '../lib/clients.js';
import { calendarAccess, googleAccountEmail } from '../lib/google-calendar.js';
import { sendViaResend } from '../lib/email.js';
import { checkRateLimit } from '../lib/rateLimit.js';
import { draftFromOnboarding } from '../lib/onboardingDraft.js';

const MAX_BODY = 100_000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NO_STORE = { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow', 'X-Content-Type-Options': 'nosniff' };

const tokenFrom = (request) => decodeURIComponent(new URL(request.url).pathname.split('/')[2] || '');
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', ...NO_STORE } });
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** GET /onboarding/<token>: el manual, con los datos del cliente para el script de la página. */
export async function onRequestGetOnboardingPersonal({ request, env }, onboardingHtml) {
  const token = tokenFrom(request);
  const invite = await verifyInvite(env, token);
  if (!invite) {
    return new Response('<!DOCTYPE html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><body style="font-family:system-ui;background:#0A0A0A;color:#EDEDE8;padding:32px;"><h1>Link no válido</h1><p>Este link no existe o ya no está activo. Escríbenos a hola@atiendemelapyme.cl y te mandamos uno nuevo.</p></body>', { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8', ...NO_STORE } });
  }
  let google = null;
  try { google = await googleAccountEmail(env); } catch (err) { console.error('onboarding: cuenta de Google:', err.message); }
  const data = { id: invite.cliente.id, token, nombre: invite.cliente.nombre, google };
  // JSON dentro de <script>: sin "<" para que nada cierre la etiqueta.
  const tag = `<script>window.__CLIENTE__=${JSON.stringify(data).replace(/</g, '\\u003c')};</script>\n`;
  const html = onboardingHtml.replace('</head>', `${tag}</head>`);
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'X-Frame-Options': 'DENY', ...NO_STORE } });
}

/** GET /onboarding/<token>/estado[?cal=correo]: cuentas conectadas, calendario y envío. */
export async function onRequestGetOnboardingStatus({ request, env }) {
  const invite = await verifyInvite(env, tokenFrom(request));
  if (!invite) return json({ error: 'Link no válido' }, 404);
  const { cliente } = invite;

  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/meta_connections?cliente_id=eq.${encodeURIComponent(cliente.id)}&select=page_name,ig_username`, {
    headers: { apikey: env.SUPABASE_SERVICE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}` }
  });
  const rows = res.ok ? await res.json() : [];
  const cuentas = [...new Set(rows.map((r) => (r.ig_username ? `@${r.ig_username}` : r.page_name)).filter(Boolean))];

  const cal = new URL(request.url).searchParams.get('cal')?.trim() || cliente.calendar_id;
  let calendario = null;
  if (cal && EMAIL_RE.test(cal)) {
    try {
      const role = await calendarAccess(env, cal);
      calendario = role === 'owner' || role === 'writer' ? 'ok' : role ? 'lectura' : 'pendiente';
    } catch (err) {
      console.error('onboarding: revisar calendario:', err.message);
    }
  }
  return json({ cuentas, calendario, enviado: cliente.onboarding?.sent_at || null });
}

/** POST /onboarding/<token>/enviar { text, answers }: guarda las respuestas y avisa a Germán. */
export async function onRequestPostOnboardingSend({ request, env }) {
  const token = tokenFrom(request);
  const invite = await verifyInvite(env, token);
  if (!invite) return json({ error: 'Link no válido' }, 404);
  const quota = await checkRateLimit(`onboarding:${invite.cliente.id}`, env.RATE_LIMIT_KV, 10, 3600);
  if (!quota.allowed) return json({ error: 'Demasiados envíos seguidos. Intenta en un rato.' }, 429);

  const raw = await request.text();
  if (raw.length > MAX_BODY) return json({ error: 'Las respuestas son demasiado largas.' }, 413);
  let body;
  try { body = JSON.parse(raw); } catch { return json({ error: 'Formato inválido' }, 400); }
  const text = String(body.text || '').slice(0, MAX_BODY);
  const answers = body.answers && typeof body.answers === 'object' && !Array.isArray(body.answers) ? body.answers : {};
  if (!text.trim()) return json({ error: 'No hay respuestas para enviar.' }, 400);

  const { cliente } = invite;
  const calendar = String(answers['s4-calendar'] || '').trim();
  const sentAt = new Date().toISOString();
  await saveCliente(env, {
    id: cliente.id,
    onboarding: { text, answers, sent_at: sentAt },
    // El Gmail de su agenda: solo si todavía no hay uno puesto en el panel.
    ...(!cliente.calendar_id && EMAIL_RE.test(calendar) && { calendar_id: calendar })
  });

  // Con las respuestas, Claude arma el borrador del bot. Solo se usa en lo que
  // todavía está vacío: lo que Germán ya escribió en el panel no se pisa.
  let applied = [];
  try {
    const draft = await draftFromOnboarding(text, { env });
    const fields = {};
    if (!cliente.bot_prompt?.trim() && draft.bot_prompt) fields.bot_prompt = draft.bot_prompt;
    if (!cliente.horario && Object.keys(draft.horario).length) {
      fields.horario = draft.horario;
      if (draft.slot_minutes) fields.slot_minutes = draft.slot_minutes;
    }
    if (Object.keys(fields).length) {
      await saveCliente(env, { id: cliente.id, ...fields });
      applied = Object.keys(fields);
    }
  } catch (err) {
    console.error('onboarding: borrador del bot:', err.message);
  }

  if (env.RESEND_API_KEY && env.DRAFT_NOTIFICATION_EMAIL) {
    const draftNote = applied.length
      ? `<p>Con sus respuestas se armó un borrador de ${applied.includes('bot_prompt') ? 'la información del bot' : ''}${applied.includes('bot_prompt') && applied.includes('horario') ? ' y ' : ''}${applied.includes('horario') ? 'el horario' : ''}: revísalo en el panel antes de conectar sus cuentas.</p>`
      : '<p>El cliente ya tenía configuración: no se cambió nada. En el panel puedes generar un borrador nuevo desde sus respuestas.</p>';
    await sendViaResend({
      to: env.DRAFT_NOTIFICATION_EMAIL,
      subject: `Onboarding recibido: ${cliente.nombre}`,
      html: `<p><b>${esc(cliente.nombre)}</b> envió sus respuestas del manual de onboarding. Están en el panel → Sistema → Clientes.</p>${draftNote}<pre style="white-space:pre-wrap;font-family:inherit;">${esc(text)}</pre>`
    }, env, '[ONBOARDING]');
  }
  return json({ ok: true, enviado: sentAt });
}
