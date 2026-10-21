import { describe, it, expect } from 'vitest';
import { splitReply } from '../../src/lib/chatSessions.js';

describe('splitReply', () => {
  it('separa globos por línea en blanco y saca las opciones', () => {
    expect(splitReply('Hola.\n\nTengo horas.\nOPCIONES: 10:00 | 11:00')).toEqual({ bubbles: ['Hola.', 'Tengo horas.'], options: ['10:00', '11:00'] });
  });
  it('máximo 4 globos y 3 opciones', () => {
    const r = splitReply('a\n\nb\n\nc\n\nd\n\ne\nOPCIONES: 1 | 2 | 3 | 4');
    expect(r.bubbles).toEqual(['a', 'b', 'c', 'd\n\ne']);
    expect(r.options).toEqual(['1', '2', '3']);
  });
  it('una opción de más de 20 caracteres no va como botón', () => {
    expect(splitReply('¿Cuál?\nOPCIONES: Limpieza dental completa | Control')).toEqual({ bubbles: ['¿Cuál?', 'Opciones: Limpieza dental completa · Control'], options: [] });
  });
  it('solo opciones: igual hay un texto', () => {
    expect(splitReply('OPCIONES: Sí | No')).toEqual({ bubbles: ['¿Cuál prefieres?'], options: ['Sí', 'No'] });
  });
});
