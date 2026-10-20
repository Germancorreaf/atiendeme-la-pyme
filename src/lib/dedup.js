// src/lib/dedup.js
// Meta puede entregar el mismo webhook más de una vez (reintentos, entregas
// duplicadas). Se recuerda el ID de cada mensaje 5 minutos para responderlo
// una sola vez.
//
// Si KV falla (cuota agotada, error puntual) se procesa igual: es preferible
// una respuesta duplicada a dejar a un cliente sin respuesta.

export async function alreadyProcessed(messageId, kv) {
  if (!messageId || !kv) return false;
  const key = `metamsg:${messageId}`;
  try {
    if (await kv.get(key)) return true;
    await kv.put(key, '1', { expirationTtl: 300 });
  } catch (err) {
    console.error('Dedup KV error (se procesa igual):', err.message);
  }
  return false;
}
