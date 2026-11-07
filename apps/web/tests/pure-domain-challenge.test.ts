import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { formatKZT } from '@india-trikotaj/shared';
import { ALL_BRANCHES } from '../src/lib/branch-constants.ts';
import {
  formatStockBadge,
  getStockBadgeVariant,
  sortBranchesByStock,
} from '../src/lib/stock-formatters.ts';
import {
  validateQuantity,
  calculateCartTotals,
  updateCartItemQuantity,
  addCartItem,
  removeCartItem,
  type CartCalculationItem,
} from '../src/lib/cart-helpers.ts';
import {
  normalizeLocale,
  getBilingual,
  getBilingualText,
} from '../src/lib/locale-helpers.ts';
import { ru } from '../src/dictionaries/ru.ts';
import { kz } from '../src/dictionaries/kz.ts';

describe('CHALLENGER M6 R2: Pure Domain Logic & Stock Badge Stress Harness', () => {
  // =========================================================================
  // 1. stock-formatters.ts Empirical Stress Matrix
  // =========================================================================
  describe('1. stock-formatters.ts: formatStockBadge, getStockBadgeVariant & sortBranchesByStock', () => {
    const storeRu = 'ТРЦ MEGA Alma-Ata';
    const storeKz = 'MEGA Alma-Ata СОО';

    it('1.1 should handle NaN, Infinity, -Infinity and -0 strictly as out of stock', () => {
      // NaN
      assert.equal(formatStockBadge(Number.NaN, storeRu, 3, 'ru'), 'Нет в наличии');
      assert.equal(formatStockBadge(Number.NaN, storeKz, 3, 'kz'), 'Қолда жоқ');
      assert.equal(getStockBadgeVariant(Number.NaN), 'stockOut');

      // +Infinity and -Infinity
      assert.equal(formatStockBadge(Number.POSITIVE_INFINITY, storeRu, 3, 'ru'), 'Нет в наличии');
      assert.equal(formatStockBadge(Number.NEGATIVE_INFINITY, storeRu, 3, 'ru'), 'Нет в наличии');
      assert.equal(getStockBadgeVariant(Number.POSITIVE_INFINITY), 'stockOut');
      assert.equal(getStockBadgeVariant(Number.NEGATIVE_INFINITY), 'stockOut');

      // -0
      assert.equal(formatStockBadge(-0, storeRu, 3, 'ru'), 'Нет в наличии');
      assert.equal(formatStockBadge(-0, storeKz, 3, 'kz'), 'Қолда жоқ');
      assert.equal(getStockBadgeVariant(-0), 'stockOut');
    });

    it('1.2 should handle negative numbers (-1, -10, -999, -0.001) as out of stock', () => {
      const negatives = [-1, -5, -10, -999, -0.001, -1e6];
      for (const neg of negatives) {
        assert.equal(formatStockBadge(neg, storeRu, 3, 'ru'), 'Нет в наличии', `Failed for ${neg} in RU`);
        assert.equal(formatStockBadge(neg, storeKz, 3, 'kz'), 'Қолда жоқ', `Failed for ${neg} in KZ`);
        assert.equal(getStockBadgeVariant(neg), 'stockOut', `Failed variant for ${neg}`);
      }
    });

    it('1.3 should handle exactly 0, null, and undefined as out of stock', () => {
      assert.equal(formatStockBadge(0, storeRu, 3, 'ru'), 'Нет в наличии');
      assert.equal(formatStockBadge(0, storeKz, 3, 'kz'), 'Қолда жоқ');
      assert.equal(getStockBadgeVariant(0), 'stockOut');

      // null as any
      assert.equal(formatStockBadge(null as any, storeRu, 3, 'ru'), 'Нет в наличии');
      assert.equal(formatStockBadge(null as any, storeKz, 3, 'kz'), 'Қолда жоқ');
      assert.equal(getStockBadgeVariant(null as any), 'stockOut');

      // undefined as any
      assert.equal(formatStockBadge(undefined as any, storeRu, 3, 'ru'), 'Нет в наличии');
      assert.equal(formatStockBadge(undefined as any, storeKz, 3, 'kz'), 'Қолда жоқ');
      assert.equal(getStockBadgeVariant(undefined as any), 'stockOut');
    });

    it('1.4 should render exactly 1 stock by suppressing store name in both RU and KZ', () => {
      // In Russian: "Осталось мало: 1 шт." (no store name)
      const resRu = formatStockBadge(1, storeRu, 3, 'ru');
      assert.equal(resRu, 'Осталось мало: 1 шт.');
      assert.ok(!resRu.includes(storeRu), 'Store name must be omitted for qty === 1');

      // In Kazakh: "Аз қалды: 1 дана" (no store name)
      const resKz = formatStockBadge(1, storeKz, 3, 'kz');
      assert.equal(resKz, 'Аз қалды: 1 дана');
      assert.ok(!resKz.includes(storeKz), 'Store name must be omitted for qty === 1');

      assert.equal(getStockBadgeVariant(1), 'stockLow');
    });

    it('1.5 should render low stock with store name when 1 < qty <= 3 (default threshold)', () => {
      // qty === 2
      assert.equal(
        formatStockBadge(2, storeRu, 3, 'ru'),
        `Осталось мало в ${storeRu}: 2 шт.`
      );
      assert.equal(
        formatStockBadge(2, storeKz, 3, 'kz'),
        `${storeKz} дүкенінде аз қалды: 2 дана`
      );
      assert.equal(getStockBadgeVariant(2), 'stockLow');

      // qty === 3
      assert.equal(
        formatStockBadge(3, storeRu, 3, 'ru'),
        `Осталось мало в ${storeRu}: 3 шт.`
      );
      assert.equal(
        formatStockBadge(3, storeKz, 3, 'kz'),
        `${storeKz} дүкенінде аз қалды: 3 дана`
      );
      assert.equal(getStockBadgeVariant(3), 'stockLow');
    });

    it('1.6 should render available in stock with store name when qty > 3 (e.g. 4, 10, 100, 10000)', () => {
      const highQuantities = [4, 5, 10, 50, 100, 10000];
      for (const q of highQuantities) {
        assert.equal(
          formatStockBadge(q, storeRu, 3, 'ru'),
          `В наличии в ${storeRu}: ${q} шт.`,
          `Failed for qty=${q} in RU`
        );
        assert.equal(
          formatStockBadge(q, storeKz, 3, 'kz'),
          `${storeKz} дүкенінде қолжетімді: ${q} дана`,
          `Failed for qty=${q} in KZ`
        );
        assert.equal(getStockBadgeVariant(q), 'stockIn', `Failed variant for qty=${q}`);
      }
    });

    it('1.7 should support custom lowStockThreshold parameter', () => {
      // Custom threshold = 5:
      // qty 4 is low stock
      assert.equal(
        formatStockBadge(4, storeRu, 5, 'ru'),
        `Осталось мало в ${storeRu}: 4 шт.`
      );
      assert.equal(
        formatStockBadge(4, storeKz, 5, 'kz'),
        `${storeKz} дүкенінде аз қалды: 4 дана`
      );
      assert.equal(getStockBadgeVariant(4, 5), 'stockLow');

      // qty 5 is low stock
      assert.equal(
        formatStockBadge(5, storeRu, 5, 'ru'),
        `Осталось мало в ${storeRu}: 5 шт.`
      );
      assert.equal(getStockBadgeVariant(5, 5), 'stockLow');

      // qty 6 is in stock
      assert.equal(
        formatStockBadge(6, storeRu, 5, 'ru'),
        `В наличии в ${storeRu}: 6 шт.`
      );
      assert.equal(getStockBadgeVariant(6, 5), 'stockIn');

      // Custom threshold = 1:
      // qty 2 is in stock
      assert.equal(
        formatStockBadge(2, storeRu, 1, 'ru'),
        `В наличии в ${storeRu}: 2 шт.`
      );
      assert.equal(getStockBadgeVariant(2, 1), 'stockIn');
    });

    it('1.8 should handle polymorphic arguments (2, 3, or 4 args) cleanly', () => {
      // 2 args: default threshold 3, default locale ru
      assert.equal(formatStockBadge(10, storeRu), `В наличии в ${storeRu}: 10 шт.`);
      assert.equal(formatStockBadge(2, storeRu), `Осталось мало в ${storeRu}: 2 шт.`);
      assert.equal(formatStockBadge(0, storeRu), 'Нет в наличии');

      // 3 args: thresholdOrLocale is string locale
      assert.equal(formatStockBadge(10, storeKz, 'kz'), `${storeKz} дүкенінде қолжетімді: 10 дана`);
      assert.equal(formatStockBadge(2, storeKz, 'kz'), `${storeKz} дүкенінде аз қалды: 2 дана`);
      assert.equal(formatStockBadge(0, storeKz, 'kz'), 'Қолда жоқ');
      assert.equal(formatStockBadge(10, storeRu, 'ru'), `В наличии в ${storeRu}: 10 шт.`);

      // 3 args: thresholdOrLocale is number threshold (defaults locale to ru)
      assert.equal(formatStockBadge(4, storeRu, 5), `Осталось мало в ${storeRu}: 4 шт.`);

      // 4 args: number threshold + string locale
      assert.equal(formatStockBadge(4, storeKz, 5, 'kz'), `${storeKz} дүкенінде аз қалды: 4 дана`);
      assert.equal(formatStockBadge(6, storeKz, 5, 'kz'), `${storeKz} дүкенінде қолжетімді: 6 дана`);
    });

    it('1.9 should normalize locale casing and fallback unsupported locales to ru in formatStockBadge', () => {
      assert.equal(formatStockBadge(0, storeRu, 3, 'KZ'), 'Қолда жоқ');
      assert.equal(formatStockBadge(0, storeRu, 3, 'Kz'), 'Қолда жоқ');
      assert.equal(formatStockBadge(0, storeRu, 'KZ'), 'Қолда жоқ');
      assert.equal(formatStockBadge(0, storeRu, 3, 'en'), 'Нет в наличии');
      assert.equal(formatStockBadge(0, storeRu, 3, 'de'), 'Нет в наличии');
      assert.equal(formatStockBadge(0, storeRu, 'unknown'), 'Нет в наличии');
    });

    it('1.10 should sort branches by stock descending and handle missing/invalid stocks immutably', () => {
      const branches = [
        { id: 'b1', name: 'Branch 1' },
        { id: 'b2', name: 'Branch 2' },
        { id: 'b3', name: 'Branch 3' },
        { id: 'b4', name: 'Branch 4' },
        { id: 'b5', name: 'Branch 5' },
        { id: 'b6', name: 'Branch 6' },
      ];

      const stockMap: Record<string, number> = {
        b1: 5,
        b2: 12,
        b3: -3, // negative treated as 0
        b4: Number.NaN, // NaN treated as 0
        // b5 missing entirely
        b6: 8,
      };

      const sorted = sortBranchesByStock(branches, stockMap);

      // Verify descending order: b2 (12), b6 (8), b1 (5), then 0-stock (b3, b4, b5)
      assert.equal(sorted[0]?.id, 'b2');
      assert.equal(sorted[1]?.id, 'b6');
      assert.equal(sorted[2]?.id, 'b1');

      // The remaining three should all be treated as 0
      const tailIds = sorted.slice(3).map(b => b.id);
      assert.ok(tailIds.includes('b3'));
      assert.ok(tailIds.includes('b4'));
      assert.ok(tailIds.includes('b5'));

      // Verify original array was NOT mutated
      assert.equal(branches[0]?.id, 'b1');
      assert.notEqual(branches, sorted);
    });
  });

  // =========================================================================
  // 2. cart-helpers.ts Empirical Stress Matrix
  // =========================================================================
  describe('2. cart-helpers.ts: validateQuantity, calculateCartTotals, mutations & boundaries', () => {
    it('2.1 validateQuantity should accept strictly positive integers', () => {
      const validIntegers = [1, 2, 5, 10, 100, 1000, 999999, Number.MAX_SAFE_INTEGER];
      for (const val of validIntegers) {
        assert.doesNotThrow(() => validateQuantity(val), `Failed on valid integer: ${val}`);
      }
    });

    it('2.2 validateQuantity should reject 0, negative integers, floats, NaN, Infinity, and non-numbers', () => {
      const invalidQuantities = [
        0,
        -0,
        -1,
        -5,
        -100,
        -9999,
        0.1,
        0.5,
        0.99,
        1.0001,
        1.5,
        2.7,
        99.99,
        Number.NaN,
        Number.POSITIVE_INFINITY,
        Number.NEGATIVE_INFINITY,
        null as any,
        undefined as any,
        '1' as any,
        '1.0' as any,
        true as any,
        false as any,
        {} as any,
        [] as any,
      ];

      for (const invalid of invalidQuantities) {
        assert.throws(
          () => validateQuantity(invalid),
          /invalid_quantity/,
          `Expected invalid_quantity error for input: ${String(invalid)}`
        );
      }
    });

    it('2.3 calculateCartTotals should compute subtotal, delivery fee, and grand total across fulfillment types', () => {
      // Empty cart
      const emptyPickup = calculateCartTotals([], 'pickup');
      assert.equal(emptyPickup.subtotalKzt, 0);
      assert.equal(emptyPickup.deliveryFeeKzt, 0);
      assert.equal(emptyPickup.totalKzt, 0);

      const emptyCourier = calculateCartTotals([], 'courier');
      assert.equal(emptyCourier.subtotalKzt, 0);
      assert.equal(emptyCourier.deliveryFeeKzt, 1500);
      assert.equal(emptyCourier.totalKzt, 1500);

      // Single item
      const singleItem: CartCalculationItem[] = [{ priceKzt: 4990, quantity: 2 }];
      const singlePickup = calculateCartTotals(singleItem, 'pickup');
      assert.equal(singlePickup.subtotalKzt, 9980);
      assert.equal(singlePickup.deliveryFeeKzt, 0);
      assert.equal(singlePickup.totalKzt, 9980);

      const singleCourier = calculateCartTotals(singleItem, 'courier');
      assert.equal(singleCourier.subtotalKzt, 9980);
      assert.equal(singleCourier.deliveryFeeKzt, 1500);
      assert.equal(singleCourier.totalKzt, 11480);

      // Multiple items with varied prices
      const multiItems: CartCalculationItem[] = [
        { priceKzt: 4990, quantity: 3 },  // 14970
        { priceKzt: 8990, quantity: 2 },  // 17980
        { priceKzt: 14990, quantity: 1 }, // 14990
        { priceKzt: 0, quantity: 5 },     // 0 (free promotional gift)
      ];
      // Total subtotal: 14970 + 17980 + 14990 + 0 = 47940
      const multiPickup = calculateCartTotals(multiItems, 'pickup');
      assert.equal(multiPickup.subtotalKzt, 47940);
      assert.equal(multiPickup.deliveryFeeKzt, 0);
      assert.equal(multiPickup.totalKzt, 47940);

      const multiCourier = calculateCartTotals(multiItems, 'courier');
      assert.equal(multiCourier.subtotalKzt, 47940);
      assert.equal(multiCourier.deliveryFeeKzt, 1500);
      assert.equal(multiCourier.totalKzt, 49440);
    });

    it('2.4 calculateCartTotals should accurately handle large bulk order totals without precision loss', () => {
      // 100 distinct items with large prices
      const largeItems: CartCalculationItem[] = Array.from({ length: 100 }, (_, i) => ({
        priceKzt: 99990,
        quantity: 50,
      }));
      // 100 * (99990 * 50) = 100 * 4,999,500 = 499,950,000 KZT
      const totals = calculateCartTotals(largeItems, 'courier');
      assert.equal(totals.subtotalKzt, 499950000);
      assert.equal(totals.deliveryFeeKzt, 1500);
      assert.equal(totals.totalKzt, 499951500);
      assert.equal(formatKZT(totals.totalKzt), '499\u00A0951\u00A0500\u00A0₸');
    });

    it('2.5 addCartItem should append new items or accumulate quantity for duplicate variants', () => {
      interface MockItem {
        variantId: string;
        priceKzt: number;
        quantity: number;
      }

      let cart: MockItem[] = [];

      // Add first item
      cart = addCartItem(cart, { variantId: 'var-1', priceKzt: 4990 }, 1);
      assert.equal(cart.length, 1);
      assert.equal(cart[0]?.variantId, 'var-1');
      assert.equal(cart[0]?.quantity, 1);

      // Add second different item with default quantity (omitted, defaults to 1)
      cart = addCartItem(cart, { variantId: 'var-2', priceKzt: 8990 });
      assert.equal(cart.length, 2);
      assert.equal(cart[1]?.variantId, 'var-2');
      assert.equal(cart[1]?.quantity, 1);

      // Add duplicate variant 'var-1' with quantity 3
      cart = addCartItem(cart, { variantId: 'var-1', priceKzt: 4990 }, 3);
      assert.equal(cart.length, 2);
      assert.equal(cart[0]?.variantId, 'var-1');
      assert.equal(cart[0]?.quantity, 4); // 1 + 3 = 4

      // Add duplicate variant 'var-2' with quantity 5
      cart = addCartItem(cart, { variantId: 'var-2', priceKzt: 8990 }, 5);
      assert.equal(cart.length, 2);
      assert.equal(cart[1]?.variantId, 'var-2');
      assert.equal(cart[1]?.quantity, 6); // 1 + 5 = 6

      // Attempting to add with invalid quantity throws and does not mutate cart
      assert.throws(() => addCartItem(cart, { variantId: 'var-1', priceKzt: 4990 }, 0), /invalid_quantity/);
      assert.throws(() => addCartItem(cart, { variantId: 'var-1', priceKzt: 4990 }, -2), /invalid_quantity/);
      assert.throws(() => addCartItem(cart, { variantId: 'var-1', priceKzt: 4990 }, 1.5), /invalid_quantity/);
      assert.throws(() => addCartItem(cart, { variantId: 'var-1', priceKzt: 4990 }, Number.NaN), /invalid_quantity/);
      assert.equal(cart[0]?.quantity, 4);
    });

    it('2.6 updateCartItemQuantity should update quantity or remove item when quantity <= 0', () => {
      const initial = [
        { variantId: 'var-a', quantity: 3 },
        { variantId: 'var-b', quantity: 2 },
        { variantId: 'var-c', quantity: 1 },
      ];

      // Update valid positive quantity
      const updated1 = updateCartItemQuantity(initial, 'var-a', 5);
      assert.equal(updated1.find(i => i.variantId === 'var-a')?.quantity, 5);
      assert.equal(updated1.length, 3);

      // Update to 0 removes the item
      const updated2 = updateCartItemQuantity(updated1, 'var-b', 0);
      assert.equal(updated2.length, 2);
      assert.equal(updated2.find(i => i.variantId === 'var-b'), undefined);

      // Update to negative (-1, -10) removes the item
      const updated3 = updateCartItemQuantity(updated2, 'var-c', -5);
      assert.equal(updated3.length, 1);
      assert.equal(updated3[0]?.variantId, 'var-a');

      // Update non-existent item returns copy of array unchanged
      const updated4 = updateCartItemQuantity(updated3, 'non-existent', 10);
      assert.equal(updated4.length, 1);
      assert.equal(updated4[0]?.variantId, 'var-a');

      // Verify immutability of initial array
      assert.equal(initial.length, 3);
      assert.equal(initial[0]?.quantity, 3);
    });

    it('2.7 removeCartItem should filter out target variant and return new array', () => {
      const items = [
        { variantId: 'v1', name: 'Item 1' },
        { variantId: 'v2', name: 'Item 2' },
        { variantId: 'v3', name: 'Item 3' },
      ];

      const removed = removeCartItem(items, 'v2');
      assert.equal(removed.length, 2);
      assert.equal(removed.some(i => i.variantId === 'v2'), false);
      assert.equal(items.length, 3, 'Original array must remain unchanged');

      // Removing non-existent variant
      const removedNone = removeCartItem(removed, 'v999');
      assert.equal(removedNone.length, 2);
    });
  });

  // =========================================================================
  // 3. locale-helpers.ts Empirical Stress Matrix
  // =========================================================================
  describe('3. locale-helpers.ts: normalizeLocale, getBilingual, getBilingualText', () => {
    it('3.1 normalizeLocale should map kz and kk (case-insensitive) to kz, and everything else to ru', () => {
      // Kazakh variations
      assert.equal(normalizeLocale('kz'), 'kz');
      assert.equal(normalizeLocale('KZ'), 'kz');
      assert.equal(normalizeLocale('Kz'), 'kz');
      assert.equal(normalizeLocale('  kz  '), 'kz');
      assert.equal(normalizeLocale('kk'), 'kz'); // ISO 639-1 code for Kazakh
      assert.equal(normalizeLocale('KK'), 'kz');
      assert.equal(normalizeLocale('  kk  '), 'kz');

      // Russian variations
      assert.equal(normalizeLocale('ru'), 'ru');
      assert.equal(normalizeLocale('RU'), 'ru');
      assert.equal(normalizeLocale('  ru  '), 'ru');

      // Empty, whitespace, null, undefined
      assert.equal(normalizeLocale(null), 'ru');
      assert.equal(normalizeLocale(undefined), 'ru');
      assert.equal(normalizeLocale(''), 'ru');
      assert.equal(normalizeLocale('   '), 'ru');
      assert.equal(normalizeLocale('\t\n'), 'ru');

      // Unsupported languages fallback to ru
      const unsupported = ['en', 'fr', 'de', 'es', 'zh', 'tr', 'ar', '123', 'kazakh', 'russian', '<script>'];
      for (const lang of unsupported) {
        assert.equal(normalizeLocale(lang), 'ru', `Expected ru for unsupported: ${lang}`);
      }
    });

    it('3.2 getBilingual should return active language with rigorous fallback hierarchy', () => {
      const kzText = '100% Үнді мақтасы';
      const ruText = '100% Индийский хлопок';

      // Locale 'kz' with valid text
      assert.equal(getBilingual('kz', kzText, ruText), kzText);
      assert.equal(getBilingual('KZ', kzText, ruText), kzText);
      assert.equal(getBilingual('kk', kzText, ruText), kzText);

      // Locale 'kz' with empty kzText falls back to ruText
      assert.equal(getBilingual('kz', '', ruText), ruText);
      assert.equal(getBilingual('kz', '   ', ruText), ruText); // whitespace trimmed
      assert.equal(getBilingual('kz', null, ruText), ruText);
      assert.equal(getBilingual('kz', undefined, ruText), ruText);

      // Locale 'ru' with valid text
      assert.equal(getBilingual('ru', kzText, ruText), ruText);
      assert.equal(getBilingual('RU', kzText, ruText), ruText);

      // Locale 'ru' with empty ruText falls back to kzText
      assert.equal(getBilingual('ru', kzText, ''), kzText);
      assert.equal(getBilingual('ru', kzText, null), kzText);
      assert.equal(getBilingual('ru', kzText, undefined), kzText);

      // Both strings empty/null/undefined returns empty string
      assert.equal(getBilingual('kz', '', ''), '');
      assert.equal(getBilingual('ru', null, null), '');
      assert.equal(getBilingual('kz', undefined, undefined), '');

      // Unsupported locale 'en' defaults to ru, then falls back to kz
      assert.equal(getBilingual('en', kzText, ruText), ruText);
      assert.equal(getBilingual('en', kzText, ''), kzText);
    });

    it('3.3 getBilingualText should resolve dictionary keys with fallback hierarchy', () => {
      const dictA = {
        title: 'Заголовок',
        emptyVal: '',
        hello: 'Привет',
      };
      const dictB = {
        title: 'Fallback Заголовок',
        emptyVal: 'Fallback Non-Empty',
        onlyInB: 'Только в B',
      };

      // Key exists and is non-empty in dictA
      assert.equal(getBilingualText(dictA, 'title', dictB), 'Заголовок');
      assert.equal(getBilingualText(dictA, 'hello', dictB), 'Привет');

      // Key is empty string in dictA: falls back to dictB
      assert.equal(getBilingualText(dictA, 'emptyVal', dictB), 'Fallback Non-Empty');

      // Key missing in dictA, present in dictB
      assert.equal(getBilingualText(dictA, 'onlyInB', dictB), 'Только в B');

      // Key missing in both dictA and dictB: returns the key itself as fallback
      assert.equal(getBilingualText(dictA, 'totallyMissingKey', dictB), 'totallyMissingKey');

      // Fallback dict omitted
      assert.equal(getBilingualText(dictA, 'title'), 'Заголовок');
      assert.equal(getBilingualText(dictA, 'missingKey'), 'missingKey');

      // Edge case: empty or null dictionary objects
      assert.equal(getBilingualText({} as any, 'missingKey', dictB), 'missingKey');
      assert.equal(getBilingualText(null as any, 'onlyInB', dictB), 'Только в B');
      assert.equal(getBilingualText(null as any, 'missing', null as any), 'missing');
    });

    it('3.4 should verify dictionary key parity between real ru and kz dictionaries', () => {
      const ruKeys = Object.keys(ru);
      const kzKeys = Object.keys(kz);

      assert.equal(ruKeys.length, kzKeys.length, 'ru and kz dictionaries must have equal key counts');
      for (const key of ruKeys) {
        assert.ok(key in kz, `Key "${key}" present in ru dictionary but missing from kz`);
        const valRu = (ru as Record<string, string>)[key];
        const valKz = (kz as Record<string, string>)[key];
        assert.ok(typeof valRu === 'string' && valRu.length > 0, `Key "${key}" in ru is empty`);
        assert.ok(typeof valKz === 'string' && valKz.length > 0, `Key "${key}" in kz is empty`);
      }
    });
  });

  // =========================================================================
  // 4. End-to-End Formatting Matrix Across 16 Almaty Store Branches
  // =========================================================================
  describe('4. Storefront Real-World Stock Formatting Across All 16 Almaty Branches', () => {
    it('4.1 should format stock badge properly for all 16 canonical Almaty branches', () => {
      assert.equal(ALL_BRANCHES.length, 16);

      for (const branch of ALL_BRANCHES) {
        // Test Out of stock (0, negative)
        assert.equal(formatStockBadge(0, branch.nameRu, 3, 'ru'), 'Нет в наличии');
        assert.equal(formatStockBadge(0, branch.nameKz, 3, 'kz'), 'Қолда жоқ');

        // Test Exactly 1 (store name suppressed)
        assert.equal(formatStockBadge(1, branch.nameRu, 3, 'ru'), 'Осталось мало: 1 шт.');
        assert.equal(formatStockBadge(1, branch.nameKz, 3, 'kz'), 'Аз қалды: 1 дана');

        // Test Low stock (qty = 2)
        assert.equal(
          formatStockBadge(2, branch.nameRu, 3, 'ru'),
          `Осталось мало в ${branch.nameRu}: 2 шт.`
        );
        assert.equal(
          formatStockBadge(2, branch.nameKz, 3, 'kz'),
          `${branch.nameKz} дүкенінде аз қалды: 2 дана`
        );

        // Test In stock (qty = 7)
        assert.equal(
          formatStockBadge(7, branch.nameRu, 3, 'ru'),
          `В наличии в ${branch.nameRu}: 7 шт.`
        );
        assert.equal(
          formatStockBadge(7, branch.nameKz, 3, 'kz'),
          `${branch.nameKz} дүкенінде қолжетімді: 7 дана`
        );
      }
    });

    it('4.2 should verify cross-branch store count logic with edge values', () => {
      // All 16 branches in stock
      const allStockMap: Record<string, number> = {};
      for (const b of ALL_BRANCHES) {
        allStockMap[b.id] = 5;
      }
      const count16 = Object.values(allStockMap).filter(q => q > 0).length;
      assert.equal(count16, 16);

      // Mixed stock with 0, NaN, negative, positive
      const mixedStockMap: Record<string, number> = {
        'store-almaty-001': 5,
        'store-almaty-002': 0,
        'store-almaty-003': -1,
        'store-almaty-004': Number.NaN,
        'store-almaty-005': 2,
        'store-almaty-006': 10,
      };
      // Only 001 (5), 005 (2), 006 (10) have q > 0
      const positiveCount = Object.values(mixedStockMap).filter(q => Number.isFinite(q) && q > 0).length;
      assert.equal(positiveCount, 3);
    });
  });
});
