import { describe, it, expect } from 'vitest';
import { formatKZT, parseKZT, formatDiscountPercent } from '../utils/currency.js';

describe('currency utils', () => {
  it('formats regular tenge amount with non-breaking space and tenge symbol', () => {
    const formatted = formatKZT(14990);
    expect(formatted).toBe('14\u00A0990\u00A0₸');
  });

  it('formats zero tenge', () => {
    expect(formatKZT(0)).toBe('0\u00A0₸');
  });

  it('handles null and undefined gracefully', () => {
    expect(formatKZT(null)).toBe('0\u00A0₸');
    expect(formatKZT(undefined)).toBe('0\u00A0₸');
    expect(formatKZT(NaN)).toBe('0\u00A0₸');
    expect(formatKZT(Infinity)).toBe('0\u00A0₸');
    expect(formatKZT(-Infinity)).toBe('0\u00A0₸');
  });

  it('supports hiding the currency symbol', () => {
    expect(formatKZT(14990, { showCurrency: false })).toBe('14\u00A0990');
    expect(formatKZT(null, { showCurrency: false })).toBe('0');
  });

  it('rounds decimal amounts to whole tenge in Kazakhstan retail', () => {
    expect(formatKZT(14990.4)).toBe('14\u00A0990\u00A0₸');
    expect(formatKZT(14990.7)).toBe('14\u00A0991\u00A0₸');
  });

  it('parses formatted KZT strings back to integer', () => {
    expect(parseKZT('14\u00A0990\u00A0₸')).toBe(14990);
    expect(parseKZT('14 990 ₸')).toBe(14990);
    expect(parseKZT('0 ₸')).toBe(0);
    expect(parseKZT('')).toBe(0);
  });

  it('calculates discount percentage correctly', () => {
    expect(formatDiscountPercent(20000, 16000)).toBe('-20%');
    expect(formatDiscountPercent(10000, 5000)).toBe('-50%');
    expect(formatDiscountPercent(10000, 10000)).toBe('');
    expect(formatDiscountPercent(10000, 12000)).toBe('');
  });
});
