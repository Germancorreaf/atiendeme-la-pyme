// src/lib/whatsappStatus.js
// Webhooks de estado de WhatsApp (`value.statuses`): qué pasó con cada mensaje
// que mandó el bot. Hasta ahora se descartaban; sirven para dos cosas:
//
// 1) Costos. Desde el 1-oct-2026 Meta cobra los mensajes de servicio (las
//    respuestas del bot dentro de la ventana de 24 h) a partir del 1.001 de
//    cada mes por número de negocio, y si el WABA no tiene medio de pago deja
//    de entregarlos. Cada estado trae `pricing` ({ billable, category, type });
//    acá se cuentan los de categoría "service" por número y mes, y se avisa por
//    correo al llegar al 80 % del tramo gratis y cuando aparece el primer
//    mensaje cobrado del mes.
// 2) Fallos. Un mensaje `failed` (sin medio de pago, número bloqueado, límite
//    de calidad…) no llegó a la persona y el bot "se calla" sin que nadie lo
//    sepa. Se avisa por correo con el error que devolvió Meta.
//
// Los contadores viven en KV (aproximados: sirven para alertar, no para
// facturar; la fuente de verdad del cobro es Meta). Si KV o el correo fallan,
// no pasa nada: el bot sigue respondiendo.
// Doc: https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing

import { sendViaResend } from './email.js';
import { renderEmailShell, escapeHtml } from './email-template.js';
import { getConnectionByPhoneNumberId } from './whatsappConnections.js';

// Meta da 1.000 mensajes de servicio gratis al mes por número de negocio.
export const FREE_SERVICE_MESSAGES_PER_MONTH = 1000;
export const SERVICE_WARN_AT = 800;

const FAILED_ALERT_SECONDS = 6 * 60 * 60;
const COUNTER_SECONDS = 40 * 24 * 60 * 60;
const SEEN_SECONDS = 2 * 24 * 60 * 60;

// Mes calendario en hora de Chile (Meta reinicia el tramo a las 00:00 de la
// zona horaria de la cuenta de mensajería; aprox. igual para clientes chilenos).
export function serviceMonth(now = new Date()) {
  return now.toLocaleDateString('en-CA', { timeZone: 'America/Santiago' }).slice(0, 7);
}

export const serviceCounterKey = (phoneNumberId, now = new Date()) => `wasvc:${phoneNumberId}:${serviceMonth(now)}`;

export async function handleStatus(status, phoneNumberId, env, now = new Date()) {
  if (!status || !phoneNumberId) return;
  if (status.status === 'failed') {
    await handleFailed(status, phoneNumberId, env);
  } else if (status.pricing?.category === 'service') {
    await countServiceMessage(status, phoneNumberId, env, now);
  }
}

async function handleFailed(status, phoneNumberId, env) {
  const error = status.errors?.[0] || {};
  const code = error.code ?? 'desconocido';
  const detail = error.error_data?.details || error.message || error.title || '(sin detalle)';
  // No se registra recipient_id: es el teléfono de la persona.
  console.error(`WhatsApp mensaje no entregado (número ${phoneNumberId}, error ${code}): ${String(detail).slice(0, 200)}`);

  await alertOnce(env, `wafail:${phoneNumberId}:${code}`, FAILED_ALERT_SECONDS, async () => {
    const who = await describeNumber(phoneNumberId, env);
    return {
      subject: `[WhatsApp] Mensajes sin entregar en ${who.label} (error ${code})`,
      tag: '[WHATSAPP NO ENTREGADO]',
      body: `
        <div class="greeting">⚠️ <strong>WhatsApp no pudo entregar un mensaje del bot</strong></div>
        <p>Número: <strong>${escapeHtml(who.label)}</strong> (phone_number_id ${escapeHtml(phoneNumberId)}).</p>
        <div class="quote-title">Error que devolvió Meta (código ${escapeHtml(String(code))})</div>
        <div class="quote">${escapeHtml(String(detail).slice(0, 500))}</div>
        <p>Si el error habla de pago o facturación, revisa el medio de pago del WhatsApp Business Account en
        <a href="https://business.facebook.com/latest/billing_hub/payment_methods/">Billing Hub</a>.
        Este aviso no se repite por 6 horas para el mismo error.</p>`
    };
  });
}

async function countServiceMessage(status, phoneNumberId, env, now) {
  const kv = env.RATE_LIMIT_KV;
  if (!kv || !status.id) return;
  try {
    // Un mismo mensaje puede traer pricing en varios estados (sent, delivered…):
    // se cuenta una sola vez.
    const seenKey = `wasvc-seen:${status.id}`;
    if (await kv.get(seenKey)) return;
    await kv.put(seenKey, '1', { expirationTtl: SEEN_SECONDS });

    const key = serviceCounterKey(phoneNumberId, now);
    const count = (parseInt(await kv.get(key), 10) || 0) + 1;
    await kv.put(key, String(count), { expirationTtl: COUNTER_SECONDS });

    const month = serviceMonth(now);
    if (status.pricing.billable === true) {
      await alertOnce(env, `wasvc-billable:${phoneNumberId}:${month}`, COUNTER_SECONDS, async () => {
        const who = await describeNumber(phoneNumberId, env);
        return {
          subject: `[WhatsApp] ${who.label} ya paga mensajes de servicio este mes`,
          tag: '[WHATSAPP COBRO]',
          body: `
            <div class="greeting">💸 <strong>Pasó el tramo gratis de mensajes de servicio</strong></div>
            <p>Número: <strong>${escapeHtml(who.label)}</strong>. Meta ya está cobrando las respuestas del bot
            de este número (mes ${escapeHtml(month)}). Asegúrate de que el WABA tenga medio de pago: sin él, Meta deja de
            entregar los mensajes.</p>
            <p>Por ahora se han contado unos <strong>${count}</strong> mensajes de servicio este mes (aproximado).</p>`
        };
      });
    } else if (count >= SERVICE_WARN_AT) {
      await alertOnce(env, `wasvc-warn:${phoneNumberId}:${month}`, COUNTER_SECONDS, async () => {
        const who = await describeNumber(phoneNumberId, env);
        return {
          subject: `[WhatsApp] ${who.label} va en ${count} de ${FREE_SERVICE_MESSAGES_PER_MONTH} mensajes gratis`,
          tag: '[WHATSAPP TRAMO GRATIS]',
          body: `
            <div class="greeting">📈 <strong>Se acerca el límite de mensajes de servicio gratis</strong></div>
            <p>Número: <strong>${escapeHtml(who.label)}</strong>. Lleva unos <strong>${count}</strong> de
            ${FREE_SERVICE_MESSAGES_PER_MONTH} mensajes de servicio gratis este mes (aproximado, mes ${escapeHtml(month)}).
            Desde el siguiente, Meta cobra por mensaje y, sin medio de pago en el WABA, deja de entregarlos.</p>`
        };
      });
    }
  } catch (err) {
    console.error('WhatsApp pricing KV error:', err.message);
  }
}

async function describeNumber(phoneNumberId, env) {
  const connection = await getConnectionByPhoneNumberId(phoneNumberId, env);
  const name = connection?.business_name;
  const phone = connection?.display_phone_number;
  const label = [name, phone].filter(Boolean).join(' ') || `número ${phoneNumberId}`;
  return { label };
}

// Manda el aviso solo si no se mandó antes (`flagKey`). Si el correo no está
// configurado o falla, no deja la marca: se reintenta con el próximo evento.
async function alertOnce(env, flagKey, ttl, build) {
  const kv = env.RATE_LIMIT_KV;
  if (!env.RESEND_API_KEY || !env.DRAFT_NOTIFICATION_EMAIL) {
    console.error('[WHATSAPP-ALERT] Falta RESEND_API_KEY o DRAFT_NOTIFICATION_EMAIL, no se pudo avisar');
    return;
  }
  try {
    if (kv && (await kv.get(flagKey))) return;
    const { subject, tag, body } = await build();
    const result = await sendViaResend(
      { to: env.DRAFT_NOTIFICATION_EMAIL, subject, html: renderEmailShell({ tag, bodyHtml: body }) },
      env,
      '[WHATSAPP-ALERT]'
    );
    if (result.success && kv) await kv.put(flagKey, '1', { expirationTtl: ttl });
  } catch (err) {
    console.error('[WHATSAPP-ALERT] error:', err.message);
  }
}
