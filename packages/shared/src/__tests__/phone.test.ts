import { describe, it, expect } from 'vitest';
import {
  validateKazakhstanPhone,
  normalizeKazakhstanPhone,
  formatKazakhstanPhone,
} from '../utils/phone.js';

describe('phone utils', () => {
  it('validates Kazakhstan mobile phone numbers with various formats', () => {
    expect(validateKazakhstanPhone('+7 (701) 234-56-78')).toBe(true);
    expect(validateKazakhstanPhone('87771234567')).toBe(true);
    expect(validateKazakhstanPhone('+77051112233')).toBe(true);
    expect(validateKazakhstanPhone('7471234567')).toBe(true);
    expect(validateKazakhstanPhone('+7 (727) 232-15-15')).toBe(true); // Almaty landline
  });

  it('rejects foreign and invalid phone numbers', () => {
    expect(validateKazakhstanPhone('+7 (495) 123-45-67')).toBe(false); // Moscow code
    expect(validateKazakhstanPhone('+1 415 555 2671')).toBe(false);
    expect(validateKazakhstanPhone('12345')).toBe(false);
    expect(validateKazakhstanPhone('')).toBe(false);
    expect(validateKazakhstanPhone(null)).toBe(false);
    expect(validateKazakhstanPhone(undefined)).toBe(false);
    // Injection and dirty string rejections
    expect(validateKazakhstanPhone('+7 (701) 123-45-67 hello world')).toBe(false);
    expect(validateKazakhstanPhone('+7 (701) 123-45-67; DROP TABLE orders;')).toBe(false);
    expect(validateKazakhstanPhone('++7 (701) 123-45-67')).toBe(false);
    expect(validateKazakhstanPhone('+77011234567\x1B')).toBe(false);
    expect(validateKazakhstanPhone('+87011234567')).toBe(false);
  });

  it('normalizes phone number to canonical E.164 (+77XXXXXXXXX)', () => {
    expect(normalizeKazakhstanPhone('8 (701) 234-56-78')).toBe('+77012345678');
    expect(normalizeKazakhstanPhone('+7 777 123 45 67')).toBe('+77771234567');
    expect(normalizeKazakhstanPhone('7051234567')).toBe('+77051234567');
    expect(normalizeKazakhstanPhone('8 (727) 232-15-15')).toBe('+77272321515');
  });

  it('rejects foreign or malformed numbers in normalizeKazakhstanPhone', () => {
    expect(normalizeKazakhstanPhone('89161234567')).toBeNull();
    expect(normalizeKazakhstanPhone('+7 (999) 123-45-67')).toBeNull();
    expect(normalizeKazakhstanPhone('+1 (415) 555-2671')).toBeNull();
    expect(normalizeKazakhstanPhone('12345')).toBeNull();
    expect(normalizeKazakhstanPhone('')).toBeNull();
    expect(() => normalizeKazakhstanPhone('89161234567', { throwOnError: true })).toThrow();
  });

  it('formats raw phone to human-readable mask', () => {
    expect(formatKazakhstanPhone('77012345678')).toBe('+7 (701) 234-56-78');
    expect(formatKazakhstanPhone('+77771234567')).toBe('+7 (777) 123-45-67');
  });
});
