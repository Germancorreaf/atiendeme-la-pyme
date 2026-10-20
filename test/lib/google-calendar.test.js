import { describe, it, expect } from 'vitest';
import { freeSlots } from '../../src/lib/google-calendar.js';

const horario = {
  lun: [['09:00', '13:00'], ['15:00', '18:00']], // con colación
  sab: ['10:00', '13:00'],
};

describe('freeSlots (horas libres de un día)', () => {
  it('respeta el horario con colación y la duración de cada hora', () => {
    // 2026-10-26 es lunes
    expect(freeSlots({ horario, slotMinutes: 60, date: '2026-10-26' }))
      .toEqual(['09:00', '10:00', '11:00', '12:00', '15:00', '16:00', '17:00']);
  });

  it('un día sin horario está cerrado', () => {
    expect(freeSlots({ horario, slotMinutes: 60, date: '2026-10-25' })).toEqual([]); // domingo
  });

  it('acepta un solo rango y horas de 45 minutos', () => {
    expect(freeSlots({ horario, slotMinutes: 45, date: '2026-10-31' })).toEqual(['10:00', '10:45', '11:30', '12:15']); // sábado (la última termina justo a las 13:00)
  });

  it('descarta las horas que chocan con algo ocupado', () => {
    const busy = [[10 * 60 + 30, 11 * 60 + 30], [16 * 60, 16 * 60 + 15]];
    expect(freeSlots({ horario, slotMinutes: 60, date: '2026-10-26', busy }))
      .toEqual(['09:00', '12:00', '15:00', '17:00']);
  });

  it('hoy no ofrece horas que ya pasaron; un día pasado no ofrece nada', () => {
    expect(freeSlots({ horario, slotMinutes: 60, date: '2026-10-26', nowDate: '2026-10-26', nowMinutes: 12 * 60 + 5 }))
      .toEqual(['15:00', '16:00', '17:00']);
    expect(freeSlots({ horario, slotMinutes: 60, date: '2026-10-26', nowDate: '2026-10-27' })).toEqual([]);
  });

  it('un evento de día completo deja el día sin horas', () => {
    expect(freeSlots({ horario, slotMinutes: 60, date: '2026-10-26', busy: [[0, 1440]] })).toEqual([]);
  });
});
