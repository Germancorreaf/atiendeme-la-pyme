// Verificación de la firma X-Hub-Signature-256 que Meta agrega a cada webhook.
// Compartido por Messenger/Instagram (meta-webhook.js) y WhatsApp (whatsapp.js).
//
// Se prueban todos los secrets dados: el flujo "Instagram Login" firma con
// INSTAGRAM_APP_SECRET y el de Página/WhatsApp con META_APP_SECRET (son dos
// apps/secrets distintos dentro del mismo panel de Meta).

import { timingSafeEqual } from './timingSafe.js';

export async function computeHmacSha256Hex(secret, rawBody) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody));
  return [...new Uint8Array(signatureBuffer)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyMetaSignature(request, rawBody, secrets) {
  const signatureHeader = request.headers.get('X-Hub-Signature-256') || '';
  if (!signatureHeader.startsWith('sha256=')) return false;
  const receivedHex = signatureHeader.slice('sha256='.length);

  for (const secret of (secrets || []).filter(Boolean)) {
    const expectedHex = await computeHmacSha256Hex(secret, rawBody);
    if (timingSafeEqual(receivedHex, expectedHex)) return true;
  }
  return false;
}
