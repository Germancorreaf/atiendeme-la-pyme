// src/lib/timingSafe.js
// Comparación de tiempo constante para secretos (contraseñas, firmas HMAC):
// evita que un atacante infiera el valor correcto carácter por carácter
// midiendo cuánto tarda cada intento (un "===" normal corta apenas
// encuentra la primera diferencia).
export function timingSafeEqual(a, b) {
  const aBytes = new TextEncoder().encode(a);
  const bBytes = new TextEncoder().encode(b);
  if (aBytes.length !== bBytes.length) {
    // Igual recorremos "a" completo contra sí mismo para no filtrar el
    // largo a través de un timing todavía más corto que el caso normal.
    let dummy = 0;
    for (let i = 0; i < aBytes.length; i++) dummy |= aBytes[i] ^ aBytes[i];
    return false;
  }
  let diff = 0;
  for (let i = 0; i < aBytes.length; i++) diff |= aBytes[i] ^ bBytes[i];
  return diff === 0;
}
