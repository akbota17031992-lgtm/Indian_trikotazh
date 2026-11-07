/**
 * Formats integer amounts into Kazakhstani Tenge (KZT, ₸) string representation.
 * Standard Kazakhstan retail format: "14 990 ₸" using non-breaking space (\u00A0)
 * and the national tenge symbol (\u20B8).
 */
export function formatKZT(
  amount: number | null | undefined,
  options?: { showCurrency?: boolean; useThinSpace?: boolean }
): string {
  const spaceChar = options?.useThinSpace ? '\u202F' : '\u00A0';

  if (typeof amount !== 'number' || !Number.isFinite(amount)) {
    return options?.showCurrency === false ? '0' : `0${spaceChar}₸`;
  }

  // Kazakhstan consumer retail rounds to whole tenge
  const integerAmount = Math.round(amount);

  const formattedNumber = integerAmount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, spaceChar);

  if (options?.showCurrency === false) {
    return formattedNumber;
  }

  return `${formattedNumber}${spaceChar}₸`;
}

/**
 * Parses a formatted KZT currency string back to an integer amount.
 * Example: "14 990 ₸" -> 14990
 */
export function parseKZT(formatted: string): number {
  if (!formatted) return 0;
  const cleaned = formatted.replace(/[^\d-]/g, '');
  const parsed = parseInt(cleaned, 10);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Calculates discount percentage between base and discounted prices.
 * Example: 20000, 16000 -> "-20%"
 */
export function formatDiscountPercent(basePrice: number, discountPrice: number): string {
  if (!basePrice || !discountPrice || discountPrice >= basePrice) {
    return '';
  }
  const pct = Math.round(((basePrice - discountPrice) / basePrice) * 100);
  return `-${pct}%`;
}
