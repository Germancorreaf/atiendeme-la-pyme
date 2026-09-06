import { describe, it, expect } from 'vitest';
import {
  ValidationError,
  validateMessages,
  validateRole,
  validateContent,
  validateSessionId,
  validateEmail,
  validateDate,
  validateTime,
  validateName,
  validateNotes,
} from '../../src/lib/validator.js';

describe('validateMessages', () => {
  it('accepts a well-formed messages array and trims content', () => {
    const result = validateMessages([
      { role: 'user', content: '  hola  ' },
      { role: 'assistant', content: 'hola, en qué te ayudo?' },
    ]);
    expect(result).toEqual([
      { role: 'user', content: 'hola' },
      { role: 'assistant', content: 'hola, en qué te ayudo?' },
    ]);
  });

  it('rejects a non-array payload', () => {
    expect(() => validateMessages('not-an-array')).toThrow(ValidationError);
  });

  it('rejects an empty array', () => {
    expect(() => validateMessages([])).toThrow(ValidationError);
  });

  it('rejects more than 50 messages', () => {
    const many = Array.from({ length: 51 }, () => ({ role: 'user', content: 'hola' }));
    expect(() => validateMessages(many)).toThrow(/too long/);
  });

  it('rejects a message that is not an object', () => {
    expect(() => validateMessages(['hola'])).toThrow(/not an object/);
  });
});

describe('validateRole', () => {
  it('accepts user and assistant', () => {
    expect(validateRole('user')).toBe('user');
    expect(validateRole('assistant')).toBe('assistant');
  });

  it('rejects any other role (e.g. system, spoofed)', () => {
    expect(() => validateRole('system')).toThrow(ValidationError);
    expect(() => validateRole('admin')).toThrow(ValidationError);
  });
});

describe('validateContent', () => {
  it('trims and returns valid content', () => {
    expect(validateContent('  hola  ')).toBe('hola');
  });

  it('rejects non-string content', () => {
    expect(() => validateContent(123)).toThrow(/must be a string/);
  });

  it('rejects empty (or whitespace-only) content', () => {
    expect(() => validateContent('   ')).toThrow(/cannot be empty/);
  });

  it('rejects content over 5000 chars', () => {
    expect(() => validateContent('a'.repeat(5001))).toThrow(/too long/);
  });

  it('accepts content at exactly the 5000 char boundary', () => {
    expect(validateContent('a'.repeat(5000))).toHaveLength(5000);
  });
});

describe('validateSessionId', () => {
  it('accepts a UUID-shaped id', () => {
    const id = '123e4567-e89b-12d3-a456-426614174000';
    expect(validateSessionId(id)).toBe(id);
  });

  it('rejects an empty string', () => {
    expect(() => validateSessionId('')).toThrow(ValidationError);
  });

  it('rejects a non-string', () => {
    expect(() => validateSessionId(null)).toThrow(ValidationError);
  });

  it('rejects a clearly invalid format', () => {
    expect(() => validateSessionId('not-a-uuid!!')).toThrow(/format invalid/);
  });
});

describe('validateEmail', () => {
  it('accepts a normal email', () => {
    expect(validateEmail('hola@atiendemelapyme.cl')).toBe('hola@atiendemelapyme.cl');
  });

  it('trims surrounding whitespace', () => {
    expect(validateEmail('  hola@atiendemelapyme.cl  ')).toBe('hola@atiendemelapyme.cl');
  });

  it('rejects a malformed email', () => {
    expect(() => validateEmail('no-arroba.cl')).toThrow(/invalid email format/);
  });

  it('rejects a non-string', () => {
    expect(() => validateEmail(42)).toThrow(/must be a string/);
  });

  it('rejects an email over 254 chars', () => {
    const long = `${'a'.repeat(250)}@x.cl`;
    expect(() => validateEmail(long)).toThrow(/too long/);
  });
});

describe('validateDate', () => {
  it('accepts a well-formed date', () => {
    expect(validateDate('2026-09-10')).toBe('2026-09-10');
  });

  it('rejects a wrong-format date', () => {
    expect(() => validateDate('10-09-2026')).toThrow(/invalid date format/);
  });

  it('rejects an impossible calendar date', () => {
    expect(() => validateDate('2026-13-40')).toThrow(/invalid date/);
  });
});

describe('validateTime', () => {
  it('accepts a well-formed time', () => {
    expect(validateTime('14:30')).toBe('14:30');
  });

  it('rejects a wrong-format time', () => {
    expect(() => validateTime('2:30 pm')).toThrow(/invalid time format/);
  });

  it('rejects out-of-range hours/minutes', () => {
    expect(() => validateTime('25:00')).toThrow(/invalid time values/);
    expect(() => validateTime('12:75')).toThrow(/invalid time values/);
  });
});

describe('validateName', () => {
  it('trims and returns a valid name', () => {
    expect(validateName('  Ana Pérez  ')).toBe('Ana Pérez');
  });

  it('rejects an empty name', () => {
    expect(() => validateName('   ')).toThrow(/cannot be empty/);
  });

  it('rejects a name over 100 chars', () => {
    expect(() => validateName('a'.repeat(101))).toThrow(/too long/);
  });
});

describe('validateNotes', () => {
  it('trims and returns valid notes', () => {
    expect(validateNotes('  necesita llamar antes  ')).toBe('necesita llamar antes');
  });

  it('allows empty notes', () => {
    expect(validateNotes('   ')).toBe('');
  });

  it('rejects notes over 1000 chars', () => {
    expect(() => validateNotes('a'.repeat(1001))).toThrow(/too long/);
  });
});
