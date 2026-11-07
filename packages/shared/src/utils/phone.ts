/**
 * Valid Kazakhstan mobile operator prefixes and Almaty landline code:
 * - Kcell / Activ: 701, 702, 775, 778
 * - Beeline: 705, 771, 776, 777
 * - Tele2 / Altel: 700, 707, 708, 747
 * - Almaty city landline: 727
 */
export const KZ_OPERATOR_PREFIXES = new Set([
  '700',
  '701',
  '702',
  '705',
  '706',
  '707',
  '708',
  '747',
  '771',
  '775',
  '776',
  '777',
  '778',
  '727',
]);

/**
 * Validates whether the given string is a valid Kazakhstan telephone number.
 *
 * Strict sanitization rules:
 * - Rejects any characters other than digits, whitespace, parentheses '()', hyphens '-', dots '.', and an optional leading '+'.
 * - Rejects repeated '+' signs (e.g. '++7...').
 * - Rejects non-phone characters (letters, SQL metacharacters, control characters).
 * - Must correspond to an 11-digit Kazakhstan E.164 number (+77XXXXXXXXX, 87XXXXXXXXX)
 *   or 10-digit national format (7XXXXXXXXX) with a valid operator/landline prefix.
 */
export function validateKazakhstanPhone(phone: string | null | undefined): boolean {
  if (!phone || typeof phone !== 'string') return false;

  const trimmed = phone.trim();
  // Allowed telephone formatting: optional single leading '+', then digits, spaces, (), -, .
  if (!/^\+?[\d\s().-]+$/.test(trimmed)) {
    return false;
  }

  const digits = trimmed.replace(/\D/g, '');

  // If prefixed with '+', must be international 11 digits starting with Kazakhstan country code '7'
  if (trimmed.startsWith('+')) {
    if (digits.length !== 11 || digits[0] !== '7') {
      return false;
    }
    const operatorPrefix = digits.slice(1, 4);
    return KZ_OPERATOR_PREFIXES.has(operatorPrefix);
  }

  // 11 digits starting with trunk prefix '8' or country code '7'
  if (digits.length === 11) {
    const countryCode = digits[0];
    if (countryCode !== '7' && countryCode !== '8') {
      return false;
    }
    const operatorPrefix = digits.slice(1, 4);
    return KZ_OPERATOR_PREFIXES.has(operatorPrefix);
  }

  // 10 digits starting with operator prefix (e.g. 7011234567)
  if (digits.length === 10) {
    const operatorPrefix = digits.slice(0, 3);
    return KZ_OPERATOR_PREFIXES.has(operatorPrefix);
  }

  return false;
}

/**
 * Normalizes any valid Kazakhstan phone format into canonical E.164: "+77XXXXXXXXX".
 * Validates operator prefix against KZ_OPERATOR_PREFIXES before normalizing.
 *
 * Returns null for foreign numbers (e.g. Russian +79..., 89...), invalid prefixes,
 * dirty strings, or malformed numbers. If options.throwOnError is true, throws an Error instead.
 */
export function normalizeKazakhstanPhone(
  phone: string | null | undefined,
  options?: { throwOnError?: boolean }
): string | null {
  if (!phone || typeof phone !== 'string') {
    if (options?.throwOnError) {
      throw new Error('Invalid phone number: input must be a non-empty string');
    }
    return null;
  }

  const trimmed = phone.trim();
  if (!/^\+?[\d\s().-]+$/.test(trimmed)) {
    if (options?.throwOnError) {
      throw new Error(`Invalid phone characters in: "${phone}"`);
    }
    return null;
  }

  const digits = trimmed.replace(/\D/g, '');

  // 11 digits starting with 7 or 8
  if (digits.length === 11) {
    if (trimmed.startsWith('+') && digits[0] !== '7') {
      if (options?.throwOnError) {
        throw new Error(`Invalid international country code in: "${phone}"`);
      }
      return null;
    }
    if (digits[0] !== '7' && digits[0] !== '8') {
      if (options?.throwOnError) {
        throw new Error(`Invalid trunk/country code in: "${phone}"`);
      }
      return null;
    }
    const operator = digits.slice(1, 4);
    if (!KZ_OPERATOR_PREFIXES.has(operator)) {
      if (options?.throwOnError) {
        throw new Error(
          `Foreign or invalid Kazakhstan operator prefix "${operator}" in: "${phone}"`
        );
      }
      return null;
    }
    return `+7${digits.slice(1)}`;
  }

  // 10 digits starting with operator prefix (without leading +)
  if (digits.length === 10 && !trimmed.startsWith('+')) {
    const operator = digits.slice(0, 3);
    if (!KZ_OPERATOR_PREFIXES.has(operator)) {
      if (options?.throwOnError) {
        throw new Error(
          `Foreign or invalid Kazakhstan operator prefix "${operator}" in: "${phone}"`
        );
      }
      return null;
    }
    return `+7${digits}`;
  }

  if (options?.throwOnError) {
    throw new Error(`Invalid phone length or format in: "${phone}"`);
  }
  return null;
}

/**
 * Formats a raw phone string into a friendly mask: "+7 (701) 123-45-67"
 * If the input cannot be normalized to a valid Kazakhstan phone, returns the original input string.
 */
export function formatKazakhstanPhone(phone: string): string {
  if (!phone || typeof phone !== 'string') return '';
  const normalized = normalizeKazakhstanPhone(phone);
  if (!normalized) return phone;
  const digits = normalized.replace(/\D/g, '');
  if (digits.length !== 11) return phone;

  const p1 = digits.slice(1, 4);
  const p2 = digits.slice(4, 7);
  const p3 = digits.slice(7, 9);
  const p4 = digits.slice(9, 11);

  return `+7 (${p1}) ${p2}-${p3}-${p4}`;
}
