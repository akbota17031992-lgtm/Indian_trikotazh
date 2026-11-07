/**
 * Pure domain logic for locale normalization and bilingual text resolution.
 */

export type SupportedLocale = 'ru' | 'kz';

/**
 * Normalizes locale code: supports 'kz' and 'kk' as Kazakh, defaults everything else to 'ru'.
 */
export function normalizeLocale(locale: string | undefined | null): SupportedLocale {
  if (!locale) return 'ru';
  const lower = locale.toLowerCase().trim();
  return lower === 'kz' || lower === 'kk' ? 'kz' : 'ru';
}

/**
 * Resolves bilingual text based on active locale with fallback.
 * If locale is 'kz' and Kazakh text is non-empty, returns kzString.
 * Otherwise falls back to ruString, then kzString, then empty string.
 */
export function getBilingual(
  locale: string | undefined | null,
  kzString?: string | null,
  ruString?: string | null
): string {
  const norm = normalizeLocale(locale);
  if (norm === 'kz' && kzString && kzString.trim().length > 0) {
    return kzString;
  }
  return ruString || kzString || '';
}

/**
 * Resolves localized dictionary text with optional fallback dictionary and key fallback.
 */
export function getBilingualText(
  dict: Record<string, string>,
  key: string,
  fallbackDict?: Record<string, string>
): string {
  if (dict && typeof dict[key] === 'string' && dict[key].length > 0) {
    return dict[key];
  }
  if (fallbackDict && typeof fallbackDict[key] === 'string' && fallbackDict[key].length > 0) {
    return fallbackDict[key];
  }
  return key;
}
