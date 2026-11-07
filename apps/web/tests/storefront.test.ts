import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatKZT,
  validateKazakhstanPhone,
  normalizeKazakhstanPhone,
  MVP_CATEGORIES_SEED,
} from '@india-trikotaj/shared';
import {
  ALL_BRANCHES,
  DEFAULT_BRANCH,
  resolveBranch,
  formatBranchCookieHeader,
  formatTelLink,
  formatGoogleMapsUrl,
} from '../src/lib/branch-constants.ts';
import {
  formatStockBadge,
  getStockBadgeVariant,
  sortBranchesByStock,
} from '../src/lib/stock-formatters.ts';
import {
  validateQuantity,
  calculateCartTotals,
  addCartItem,
  updateCartItemQuantity,
} from '../src/lib/cart-helpers.ts';
import {
  formatCountdown,
  calculateKaspiRedInstallment,
  calculateKaspiKreditMonthly,
  truncateKaspiDescription,
  createDebounceGuard,
} from '../src/lib/kaspi-helpers.ts';
import {
  normalizeLocale,
  getBilingual,
  getBilingualText,
} from '../src/lib/locale-helpers.ts';
import { ru } from '../src/dictionaries/ru.ts';
import { kz } from '../src/dictionaries/kz.ts';
import { CATALOG_PRODUCTS, normalizeSlug } from '../src/lib/catalog-data.ts';

describe('Milestone 6: Web Storefront Catalog & Checkout Test Suite', () => {
  // =========================================================================
  // 1. Branch Selector & Persistence Invariants (Feature 20 & Boundaries B20)
  // =========================================================================
  describe('1. 16 Almaty Store Branches & Persistence', () => {
    it('1.1 should include all 16 Almaty branches with canonical IDs store-almaty-001 through 016', () => {
      assert.equal(ALL_BRANCHES.length, 16);
      assert.equal(ALL_BRANCHES[0]?.id, 'store-almaty-001');
      assert.equal(ALL_BRANCHES[0]?.slug, 'mega-alma-ata');
      assert.equal(ALL_BRANCHES[15]?.id, 'store-almaty-016');
      assert.equal(ALL_BRANCHES[15]?.slug, 'forum-almaty');
    });

    it('1.2 should fallback to MEGA Alma-Ata (store-almaty-001) if cookie is missing or corrupted', () => {
      // Direct assertion against real exported resolveBranch from branch-constants
      assert.equal(resolveBranch(undefined).id, DEFAULT_BRANCH.id);
      assert.equal(resolveBranch(null).id, 'store-almaty-001');
      assert.equal(resolveBranch('corrupted-branch-id').id, 'store-almaty-001');
      assert.equal(resolveBranch('store-almaty-002').id, 'store-almaty-002');
      assert.equal(resolveBranch('grand-park').id, 'store-almaty-003');
    });

    it('1.3 should format cookie with 30-day Max-Age (2592000 seconds)', () => {
      const cookieHeader = formatBranchCookieHeader('store-almaty-002');
      assert.ok(cookieHeader.includes('indiatrikotaj_branch_id=store-almaty-002'));
      assert.ok(cookieHeader.includes('Max-Age=2592000'));
      assert.ok(cookieHeader.includes('SameSite=Lax'));
    });

    it('1.4 should generate tel: link stripping non-digit characters except plus', () => {
      const branch = ALL_BRANCHES[0]!;
      const telLink = formatTelLink(branch.phone);
      assert.equal(telLink, 'tel:+77272321515');
    });

    it('1.5 should format Google Maps URL with latitude and longitude', () => {
      const branch = ALL_BRANCHES[0]!;
      const mapsUrl = formatGoogleMapsUrl(branch.latitude, branch.longitude);
      assert.ok(mapsUrl.includes('43.2035'));
      assert.ok(mapsUrl.includes('76.8925'));
    });
  });

  // =========================================================================
  // 2. Real-Time Stock Availability Indicator (Features 20.2, 20.3, B20.2)
  // =========================================================================
  describe('2. Real-Time Stock Badge Thresholds & Formatting', () => {
    it('2.1 should render "В наличии в [Store]: X шт." when qty > 3', () => {
      const badge = formatStockBadge(13, 'ТРЦ MEGA Alma-Ata', 3, 'ru');
      assert.equal(badge, 'В наличии в ТРЦ MEGA Alma-Ata: 13 шт.');
      assert.equal(getStockBadgeVariant(13, 3), 'stockIn');
    });

    it('2.2 should render "Осталось мало: 1 шт." when available stock equals exactly 1', () => {
      const badgeRu = formatStockBadge(1, 'ТРЦ Dostyk Plaza', 3, 'ru');
      const badgeKz = formatStockBadge(1, 'Dostyk Plaza СОО', 3, 'kz');
      assert.equal(badgeRu, 'Осталось мало: 1 шт.');
      assert.equal(badgeKz, 'Аз қалды: 1 дана');
      assert.equal(getStockBadgeVariant(1, 3), 'stockLow');
    });

    it('2.3 should render "Осталось мало в [Store]: X шт." when qty <= 3 and > 1', () => {
      const badgeRu = formatStockBadge(2, 'ТРЦ Dostyk Plaza', 3, 'ru');
      const badgeKz = formatStockBadge(2, 'Dostyk Plaza СОО', 3, 'kz');
      assert.equal(badgeRu, 'Осталось мало в ТРЦ Dostyk Plaza: 2 шт.');
      assert.equal(badgeKz, 'Dostyk Plaza СОО дүкенінде аз қалды: 2 дана');
      assert.equal(getStockBadgeVariant(2, 3), 'stockLow');
    });

    it('2.4 should render "Нет в наличии" when qty <= 0 or NaN', () => {
      const badgeRu = formatStockBadge(0, 'ТРК Grand Park', 3, 'ru');
      const badgeKz = formatStockBadge(0, 'Grand Park СОК', 3, 'kz');
      assert.equal(badgeRu, 'Нет в наличии');
      assert.equal(badgeKz, 'Қолда жоқ');
      assert.equal(getStockBadgeVariant(0, 3), 'stockOut');

      // Defensive handling of negative and NaN
      assert.equal(formatStockBadge(-3, 'ТРК Grand Park', 3, 'ru'), 'Нет в наличии');
      assert.equal(formatStockBadge(Number.NaN, 'ТРК Grand Park', 3, 'ru'), 'Нет в наличии');
      assert.equal(getStockBadgeVariant(Number.NaN, 3), 'stockOut');
    });

    it('2.5 should sort branches by stock descending in cross-branch availability modal', () => {
      const stockMap: Record<string, number> = {
        'store-almaty-001': 4,
        'store-almaty-002': 10,
        'store-almaty-003': 0,
        'store-almaty-004': 7,
      };
      const sorted = sortBranchesByStock(ALL_BRANCHES.slice(0, 4), stockMap);
      assert.equal(sorted[0]?.id, 'store-almaty-002');
      assert.equal(stockMap[sorted[0]?.id], 10);
      assert.equal(sorted[1]?.id, 'store-almaty-004');
      assert.equal(stockMap[sorted[1]?.id], 7);
      assert.equal(sorted[3]?.id, 'store-almaty-003');
      assert.equal(stockMap[sorted[3]?.id], 0);
    });
  });

  // =========================================================================
  // 3. Bilingual Localization (RU / KZ) (Feature 21 & Boundaries B21)
  // =========================================================================
  describe('3. Bilingual Localization & Cyrillic-Ext Glyphs', () => {
    it('3.1 should support both ru and kz dictionaries with all required keys', () => {
      const ruKeys = Object.keys(ru);
      const kzKeys = Object.keys(kz);
      assert.equal(ruKeys.length, kzKeys.length);
      for (const key of ruKeys) {
        assert.ok(key in kz, `Key ${key} missing from kz dictionary`);
      }
    });

    it('3.2 should preserve all 9 extended Kazakh Cyrillic glyphs without distortion', () => {
      const kazakhSpecialChars = ['Ә', 'І', 'Ң', 'Ғ', 'Ү', 'Ұ', 'Қ', 'Ө', 'Һ'];
      const sampleKz = 'Премиум мақта базалық футболкасы. Өндіруші: Үндістан. Бағасы: 4 990 ₸.';
      assert.ok(sampleKz.includes('Ө'));
      assert.ok(sampleKz.includes('Ү'));

      for (const char of kazakhSpecialChars) {
        const encoded = Buffer.from(char, 'utf8');
        assert.equal(encoded.toString('utf8'), char);
      }
    });

    it('3.3 should translate core UI labels between Russian and Kazakh', () => {
      assert.equal(ru.cart, 'Корзина');
      assert.equal(kz.cart, 'Себет');
      assert.equal(ru.checkout, 'Оформить заказ');
      assert.equal(kz.checkout, 'Тапсырыс беру');
      assert.equal(ru.stores, 'Магазины в Алматы');
      assert.equal(kz.stores, 'Алматыдағы дүкендер');
    });

    it('3.4 should fallback cleanly to Russian when Kazakh string is empty', () => {
      assert.equal(getBilingual('kz', '', '100% хлопок'), '100% хлопок');
      assert.equal(getBilingual('kz', '100% мақта', '100% хлопок'), '100% мақта');
      assert.equal(getBilingual('ru', '100% мақта', '100% хлопок'), '100% хлопок');
      assert.equal(getBilingualText(kz as Record<string, string>, 'nonExistentKey', ru as Record<string, string>), 'nonExistentKey');
    });

    it('3.5 should fallback unsupported locale (e.g. "fr", "de") to "ru"', () => {
      assert.equal(normalizeLocale('fr'), 'ru');
      assert.equal(normalizeLocale('de'), 'ru');
      assert.equal(normalizeLocale(undefined), 'ru');
      assert.equal(normalizeLocale('kz'), 'kz');
      assert.equal(normalizeLocale('KZ'), 'kz');
      assert.equal(normalizeLocale('kk'), 'kz');
    });
  });

  // =========================================================================
  // 4. Shopping Cart & Boundaries (Feature 22 & Boundaries B22)
  // =========================================================================
  describe('4. Shopping Cart State, Pricing & Boundaries', () => {
    it('4.1 should reject adding quantity <= 0 with invalid_quantity', () => {
      assert.throws(() => validateQuantity(0), /invalid_quantity/);
      assert.throws(() => validateQuantity(-1), /invalid_quantity/);
      assert.throws(() => validateQuantity(1.5), /invalid_quantity/);
      assert.doesNotThrow(() => validateQuantity(1));
      assert.doesNotThrow(() => validateQuantity(5));
    });

    it('4.2 should calculate subtotal, delivery fee and total in KZT correctly', () => {
      const items = [
        { priceKzt: 4990, quantity: 2 },
        { priceKzt: 14990, quantity: 1 },
      ];
      const pickupTotals = calculateCartTotals(items, 'pickup');
      assert.equal(pickupTotals.subtotalKzt, 24970);
      assert.equal(pickupTotals.deliveryFeeKzt, 0);
      assert.equal(pickupTotals.totalKzt, 24970);

      const courierTotals = calculateCartTotals(items, 'courier');
      assert.equal(courierTotals.subtotalKzt, 24970);
      assert.equal(courierTotals.deliveryFeeKzt, 1500);
      assert.equal(courierTotals.totalKzt, 26470);
    });

    it('4.3 should format all totals strictly ending in ₸ with non-breaking space', () => {
      assert.equal(formatKZT(24970), '24\u00A0970\u00A0₸');
      assert.equal(formatKZT(1500), '1\u00A0500\u00A0₸');
      assert.equal(formatKZT(0), '0\u00A0₸');
    });

    it('4.4 should correctly increment quantity when adding duplicate variant', () => {
      let cart = addCartItem([], { variantId: 'var-001', priceKzt: 4990 }, 1);
      cart = addCartItem(cart, { variantId: 'var-001', priceKzt: 4990 }, 2);
      assert.equal(cart.length, 1);
      assert.equal(cart[0]?.quantity, 3);
    });

    it('4.5 should remove variant when quantity is set to 0', () => {
      const initialCart = [
        { variantId: 'var-1', quantity: 2 },
        { variantId: 'var-2', quantity: 1 },
      ];
      const updatedCart = updateCartItemQuantity(initialCart, 'var-2', 0);
      assert.equal(updatedCart.length, 1);
      assert.equal(updatedCart[0]?.variantId, 'var-1');
    });
  });

  // =========================================================================
  // 5. Kaspi Pay Modal, Countdown & Installments (Feature 22 & Boundaries B22)
  // =========================================================================
  describe('5. Kaspi Pay Modal & Invoicing Contracts', () => {
    it('5.1 should accurately format countdown timer in mm:ss strictly', () => {
      assert.equal(formatCountdown(300), '05:00');
      assert.equal(formatCountdown(65), '01:05');
      assert.equal(formatCountdown(1), '00:01');
      assert.equal(formatCountdown(0), '00:00');
      assert.equal(formatCountdown(-5), '00:00');
    });

    it('5.2 should calculate Kaspi Red 0-0-3 installment breakdown without tiyn', () => {
      const totalKzt = 21480;
      const monthly = calculateKaspiRedInstallment(totalKzt);
      assert.equal(monthly, 7160);
      assert.equal(formatKZT(monthly), '7\u00A0160\u00A0₸');
    });

    it('5.3 should calculate Kaspi Kredit 0-0-12 monthly payment breakdown', () => {
      const totalKzt = 12990;
      const monthly = calculateKaspiKreditMonthly(totalKzt);
      assert.equal(monthly, 1083);
      assert.equal(formatKZT(monthly), '1\u00A0083\u00A0₸');
    });

    it('5.4 should validate Kazakhstan phone numbers (+7 7xx) for push invoices', () => {
      assert.equal(validateKazakhstanPhone('+7 (701) 234-56-78'), true);
      assert.equal(validateKazakhstanPhone('+77772223344'), true);
      assert.equal(validateKazakhstanPhone('87019876543'), true);
      assert.equal(validateKazakhstanPhone('12345'), false);
      assert.equal(validateKazakhstanPhone('+7 (900) 123-45-67'), false); // Russian prefix rejected
    });

    it('5.5 should normalize phone to E.164 +77XXXXXXXXX format', () => {
      assert.equal(normalizeKazakhstanPhone('8 (701) 234-56-78'), '+77012345678');
      assert.equal(normalizeKazakhstanPhone('+7 777 999 88 77'), '+77779998877');
    });

    it('5.6 should truncate push invoice descriptions to <= 60 chars', () => {
      const longDesc = 'Заказ #KZ-998877-very-long-order-identifier-which-must-be-truncated-to-60';
      const truncated = truncateKaspiDescription(longDesc);
      assert.ok(truncated.length <= 60);
      assert.equal(truncated, longDesc.slice(0, 60));
    });

    it('5.7 should debounce rapid double-clicks on payment submit (idempotent submission)', () => {
      const guard = createDebounceGuard();
      let executionCount = 0;

      const clickSubmit = () => guard.execute(() => {
        executionCount++;
        return 'success';
      });

      const res1 = clickSubmit();
      const res2 = clickSubmit(); // blocked by debounce guard
      const res3 = clickSubmit(); // blocked by debounce guard

      assert.equal(res1, 'success');
      assert.equal(res2, undefined);
      assert.equal(res3, undefined);
      assert.equal(executionCount, 1);
      assert.equal(guard.isLocked(), true);
    });
  });

  // =========================================================================
  // 6. Catalog Taxonomy & Product Data
  // =========================================================================
  describe('6. Catalog Taxonomy & Product Details', () => {
    it('6.1 should provide all 7 MVP clothing categories', () => {
      assert.equal(MVP_CATEGORIES_SEED.length, 7);
      const slugs = MVP_CATEGORIES_SEED.map(c => c.slug);
      assert.ok(slugs.includes('t-shirts'));
      assert.ok(slugs.includes('long-sleeves'));
      assert.ok(slugs.includes('robes'));
      assert.ok(slugs.includes('pajamas'));
      assert.ok(slugs.includes('thermal-underwear'));
      assert.ok(slugs.includes('kids'));
      assert.ok(slugs.includes('home-textiles'));
    });

    it('6.2 should contain products across categories with variants and prices in KZT', () => {
      assert.ok(CATALOG_PRODUCTS.length >= 7);
      for (const p of CATALOG_PRODUCTS) {
        assert.ok(p.id.length > 0);
        assert.ok(p.slug.length > 0);
        assert.ok(p.basePriceKzt > 0);
        assert.ok(Number.isInteger(p.basePriceKzt));
        assert.ok(p.variants.length > 0);
      }
    });

    it('6.3 should normalize product slugs with mixed casing', () => {
      assert.equal(normalizeSlug('FUTBOLKA-BAZOVAYA'), 'futbolka-bazovaya');
      assert.equal(normalizeSlug('  KHALAT-DLYA-DOMA  '), 'khalat-dlya-doma');
    });
  });
});
