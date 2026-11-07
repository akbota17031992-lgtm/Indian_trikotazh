/**
 * Pure domain logic for product stock availability and badge formatting.
 */

export type StockBadgeVariant = 'stockIn' | 'stockLow' | 'stockOut';

/**
 * Determine the visual badge variant based on stock quantity and threshold.
 */
export function getStockBadgeVariant(
  qty: number,
  lowStockThreshold = 3
): StockBadgeVariant {
  if (!Number.isFinite(qty) || qty <= 0) {
    return 'stockOut';
  }
  if (qty <= lowStockThreshold) {
    return 'stockLow';
  }
  return 'stockIn';
}

/**
 * Formats stock availability badge text in Russian or Kazakh.
 * Handles:
 * - qty <= 0 (or NaN, null, undefined, negative) -> "Нет в наличии" / "Қолда жоқ"
 * - qty === 1 -> "Осталось мало: 1 шт." / "Аз қалды: 1 дана" (store name omitted)
 * - 1 < qty <= lowStockThreshold (default 3) -> "Осталось мало в [Store]: X шт." / "[Store] дүкенінде аз қалды: X дана"
 * - qty > lowStockThreshold -> "В наличии в [Store]: X шт." / "[Store] дүкенінде қолжетімді: X дана"
 */
export function formatStockBadge(
  qty: number,
  storeName: string,
  thresholdOrLocale?: number | string,
  localeParam?: string
): string {
  let lowStockThreshold = 3;
  let locale = 'ru';

  if (typeof thresholdOrLocale === 'number') {
    lowStockThreshold = thresholdOrLocale;
    if (typeof localeParam === 'string') {
      locale = localeParam.toLowerCase() === 'kz' ? 'kz' : 'ru';
    }
  } else if (typeof thresholdOrLocale === 'string') {
    locale = thresholdOrLocale.toLowerCase() === 'kz' ? 'kz' : 'ru';
  }

  // Defensively guard against NaN, non-finite, null, undefined, negative
  if (!Number.isFinite(qty) || qty <= 0) {
    return locale === 'kz' ? 'Қолда жоқ' : 'Нет в наличии';
  }

  if (qty === 1) {
    return locale === 'kz' ? 'Аз қалды: 1 дана' : 'Осталось мало: 1 шт.';
  }

  if (qty <= lowStockThreshold) {
    return locale === 'kz'
      ? `${storeName} дүкенінде аз қалды: ${qty} дана`
      : `Осталось мало в ${storeName}: ${qty} шт.`;
  }

  return locale === 'kz'
    ? `${storeName} дүкенінде қолжетімді: ${qty} дана`
    : `В наличии в ${storeName}: ${qty} шт.`;
}

/**
 * Sorts store branches by available stock in descending order (highest stock first).
 */
export function sortBranchesByStock<T extends { id: string }>(
  branches: T[],
  stockByStore: Record<string, number>
): T[] {
  return [...branches].sort((a, b) => {
    const rawA = stockByStore[a.id];
    const rawB = stockByStore[b.id];
    const qtyA = Number.isFinite(rawA) ? (rawA ?? 0) : 0;
    const qtyB = Number.isFinite(rawB) ? (rawB ?? 0) : 0;
    return qtyB - qtyA;
  });
}
