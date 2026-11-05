import { describe, it, expect } from 'vitest';
import { timingSafeEqual } from '../../src/lib/timingSafe.js';

describe('timingSafeEqual', () => {
  it('iguales -> true', () => {
    expect(timingSafeEqual('secreto', 'secreto')).toBe(true);
    expect(timingSafeEqual('', '')).toBe(true);
  });

  it('distintos del mismo largo -> false, también si solo difiere el último carácter', () => {
    expect(timingSafeEqual('secreto', 'secretO')).toBe(false);
    expect(timingSafeEqual('abc', 'xyz')).toBe(false);
  });

  it('distinto largo -> false (prefijo incluido)', () => {
    expect(timingSafeEqual('secreto', 'secret')).toBe(false);
    expect(timingSafeEqual('secret', 'secreto')).toBe(false);
    expect(timingSafeEqual('', 'a')).toBe(false);
  });

  it('compara bytes UTF-8: acentos y emojis', () => {
    expect(timingSafeEqual('contraseña', 'contraseña')).toBe(true);
    expect(timingSafeEqual('contraseña', 'contrasena')).toBe(false);
    expect(timingSafeEqual('🔒', '🔒')).toBe(true);
  });
});
