import { describe, it, expect } from 'vitest';
import { formatKZT, parseKZT, formatDiscountPercent } from '../utils/currency.js';
import {
  validateKazakhstanPhone,
  normalizeKazakhstanPhone,
  formatKazakhstanPhone,
  KZ_OPERATOR_PREFIXES,
} from '../utils/phone.js';
import { CreateOrderInputSchema, DeliveryAddressSchema } from '../schemas/order.js';
import { KaspiCreateInvoiceInputSchema, KaspiWebhookPayloadSchema } from '../schemas/payment.js';
import { ProductFilterQuerySchema, ProductSchema } from '../schemas/product.js';
import { StoreSchema } from '../schemas/store.js';
import { StoreInventorySchema } from '../schemas/inventory.js';
import { ok, err, isOk, isErr, unwrap, unwrapOr, mapResult } from '../utils/result.js';

describe('CHALLENGER STRESS SUITE: Milestone 1 Empirical Verification', () => {
  // =========================================================================
  // SECTION 1: formatKZT & Currency Utilities Boundary Testing
  // =========================================================================
  describe('formatKZT Boundaries & Extremes', () => {
    it('1.1 should format 0 tenge correctly with non-breaking space', () => {
      expect(formatKZT(0)).toBe('0\u00A0₸');
      expect(formatKZT(0, { showCurrency: false })).toBe('0');
    });

    it('1.2 should format negative zero as "0 ₸"', () => {
      expect(formatKZT(-0)).toBe('0\u00A0₸');
    });

    it('1.3 should correctly round floating point amounts to whole tenge', () => {
      expect(formatKZT(14990.49)).toBe('14\u00A0990\u00A0₸');
      expect(formatKZT(14990.5)).toBe('14\u00A0991\u00A0₸');
      expect(formatKZT(0.4)).toBe('0\u00A0₸');
      expect(formatKZT(0.5)).toBe('1\u00A0₸');
    });

    it('1.4 should format negative amounts with minus sign and grouped digits', () => {
      expect(formatKZT(-14990)).toBe('-14\u00A0990\u00A0₸');
      expect(formatKZT(-1000000)).toBe('-1\u00A0000\u00A0000\u00A0₸');
      expect(formatKZT(-1)).toBe('-1\u00A0₸');
    });

    it('1.5 should format huge amounts up to MAX_SAFE_INTEGER', () => {
      expect(formatKZT(1500000000)).toBe('1\u00A0500\u00A0000\u00A0000\u00A0₸');
      expect(formatKZT(Number.MAX_SAFE_INTEGER)).toBe(
        '9\u00A0007\u00A0199\u00A0254\u00A0740\u00A0991\u00A0₸'
      );
    });

    it('1.6 should handle null, undefined, and NaN safely returning "0 ₸"', () => {
      expect(formatKZT(null as any)).toBe('0\u00A0₸');
      expect(formatKZT(undefined as any)).toBe('0\u00A0₸');
      expect(formatKZT(NaN)).toBe('0\u00A0₸');
    });

    it('1.7 [REMEDIATED] tests Infinity and -Infinity handling', () => {
      const infinityResult = formatKZT(Infinity);
      const negInfinityResult = formatKZT(-Infinity);
      expect(infinityResult).toBe('0\u00A0₸');
      expect(negInfinityResult).toBe('0\u00A0₸');
    });

    it('1.8 should respect formatting options (showCurrency and useThinSpace)', () => {
      expect(formatKZT(14990, { showCurrency: false })).toBe('14\u00A0990');
      expect(formatKZT(14990, { useThinSpace: true })).toBe('14\u202F990\u202F₸');
      expect(formatKZT(14990, { showCurrency: false, useThinSpace: true })).toBe('14\u202F990');
    });
  });

  describe('parseKZT & formatDiscountPercent Edge Cases', () => {
    it('2.1 should parse various formatted strings back to numbers', () => {
      expect(parseKZT('14 990 ₸')).toBe(14990);
      expect(parseKZT('14\u00A0990\u00A0₸')).toBe(14990);
      expect(parseKZT('-14 990 ₸')).toBe(-14990);
      expect(parseKZT('0 ₸')).toBe(0);
      expect(parseKZT('')).toBe(0);
      expect(parseKZT('garbage')).toBe(0);
      expect(parseKZT(null as any)).toBe(0);
    });

    it('2.2 [CHALLENGE FINDING] formatDiscountPercent with 0 discount price', () => {
      // 20000 -> 16000 gives -20%
      expect(formatDiscountPercent(20000, 16000)).toBe('-20%');
      // Equal prices give empty string
      expect(formatDiscountPercent(20000, 20000)).toBe('');
      // Negative discount (price increase) gives empty string
      expect(formatDiscountPercent(20000, 25000)).toBe('');
      // When discountPrice is 0 (100% free promo item), current code returns '' because of !discountPrice falsy check
      const zeroPriceDiscount = formatDiscountPercent(10000, 0);
      expect(zeroPriceDiscount).toBe(''); // Documents the edge-case behavior
    });
  });

  // =========================================================================
  // SECTION 2: Kazakhstan Phone Validation & Normalization Stress
  // =========================================================================
  describe('validateKazakhstanPhone Stress Testing', () => {
    it('3.1 should accept all valid Kazakhstan operator codes', () => {
      for (const prefix of KZ_OPERATOR_PREFIXES) {
        expect(validateKazakhstanPhone(`+7 (${prefix}) 123-45-67`)).toBe(true);
        expect(validateKazakhstanPhone(`8${prefix}1234567`)).toBe(true);
        expect(validateKazakhstanPhone(`${prefix}1234567`)).toBe(true);
      }
    });

    it('3.2 should accept standard formatting variations', () => {
      expect(validateKazakhstanPhone('+7 (701) 123-45-67')).toBe(true);
      expect(validateKazakhstanPhone('8 (701) 123-45-67')).toBe(true);
      expect(validateKazakhstanPhone('+7-701-123-45-67')).toBe(true);
      expect(validateKazakhstanPhone('+7.701.123.45.67')).toBe(true);
      expect(validateKazakhstanPhone('   +7 (701) 123-45-67   ')).toBe(true);
      expect(validateKazakhstanPhone('+77011234567')).toBe(true);
    });

    it('3.3 should reject foreign and invalid prefixes', () => {
      // Russian mobile codes (900-999)
      expect(validateKazakhstanPhone('+7 (999) 123-45-67')).toBe(false);
      expect(validateKazakhstanPhone('+7 (900) 123-45-67')).toBe(false);
      expect(validateKazakhstanPhone('+7 (495) 123-45-67')).toBe(false);
      expect(validateKazakhstanPhone('89161234567')).toBe(false);

      // Other countries
      expect(validateKazakhstanPhone('+1 (415) 555-2671')).toBe(false);
      expect(validateKazakhstanPhone('+996 555 123 456')).toBe(false);
      expect(validateKazakhstanPhone('+998 90 123 45 67')).toBe(false);
    });

    it('3.4 should reject wrong digit lengths and empty inputs', () => {
      expect(validateKazakhstanPhone('+770112345678')).toBe(false); // 12 digits
      expect(validateKazakhstanPhone('701123456')).toBe(false); // 9 digits
      expect(validateKazakhstanPhone('12345')).toBe(false);
      expect(validateKazakhstanPhone('')).toBe(false);
      expect(validateKazakhstanPhone(null as any)).toBe(false);
      expect(validateKazakhstanPhone(undefined as any)).toBe(false);
      expect(validateKazakhstanPhone(12345678901 as any)).toBe(false);
    });

    it('3.5 [REMEDIATED] input injection & dirty character rejection in validateKazakhstanPhone', () => {
      const dirtyPhoneWithLetters = '+7 (701) 123-45-67 hello world';
      const dirtyPhoneWithSqli = '+7 (701) 123-45-67; DROP TABLE orders;';
      const dirtyPhoneMultiplePlus = '++7 (701) 123-45-67';
      const dirtyPhoneControlChar = '+77011234567\x1B';

      expect(validateKazakhstanPhone(dirtyPhoneWithLetters)).toBe(false);
      expect(validateKazakhstanPhone(dirtyPhoneWithSqli)).toBe(false);
      expect(validateKazakhstanPhone(dirtyPhoneMultiplePlus)).toBe(false);
      expect(validateKazakhstanPhone(dirtyPhoneControlChar)).toBe(false);
    });
  });

  describe('normalizeKazakhstanPhone Stress Testing', () => {
    it('4.1 should normalize valid Kazakhstan numbers to E.164 (+77XXXXXXXXX)', () => {
      expect(normalizeKazakhstanPhone('+7 (701) 123-45-67')).toBe('+77011234567');
      expect(normalizeKazakhstanPhone('8 (701) 123-45-67')).toBe('+77011234567');
      expect(normalizeKazakhstanPhone('7011234567')).toBe('+77011234567');
      expect(normalizeKazakhstanPhone('8 (727) 232-15-15')).toBe('+77272321515');
      expect(normalizeKazakhstanPhone('7272321515')).toBe('+77272321515');
    });

    it('4.2 should return null for invalid or foreign formats', () => {
      expect(normalizeKazakhstanPhone('12345')).toBeNull();
      expect(normalizeKazakhstanPhone('+1 (415) 555-2671')).toBeNull();
      expect(normalizeKazakhstanPhone('')).toBeNull();
    });

    it('4.3 [REMEDIATED] normalizeKazakhstanPhone validates operator prefix for 11-digit numbers', () => {
      const russianNumber = '89161234567';
      const normalizedRussian = normalizeKazakhstanPhone(russianNumber);
      expect(normalizedRussian).toBeNull();
    });
  });

  // =========================================================================
  // SECTION 3: Zod Schemas Adversarial Stress Testing
  // =========================================================================
  describe('CreateOrderInputSchema Stress Testing', () => {
    const validPickupOrder = {
      customerName: 'Айдос Нурланов',
      customerPhone: '+7 (701) 234-56-78',
      deliveryType: 'pickup_from_store' as const,
      storeId: '00000000-0000-0000-0000-000000000001',
      items: [
        {
          variantId: '00000000-0000-0000-0000-000000000002',
          quantity: 2,
          reservedFromStoreId: '00000000-0000-0000-0000-000000000001',
        },
      ],
      paymentMethod: 'kaspi_qr' as const,
    };

    it('5.1 should pass valid order', () => {
      expect(CreateOrderInputSchema.safeParse(validPickupOrder).success).toBe(true);
    });

    it('5.2 should reject empty cart (items length 0)', () => {
      const res = CreateOrderInputSchema.safeParse({ ...validPickupOrder, items: [] });
      expect(res.success).toBe(false);
    });

    it('5.3 should reject non-positive or non-integer item quantities', () => {
      expect(
        CreateOrderInputSchema.safeParse({
          ...validPickupOrder,
          items: [{ ...validPickupOrder.items[0], quantity: 0 }],
        }).success
      ).toBe(false);

      expect(
        CreateOrderInputSchema.safeParse({
          ...validPickupOrder,
          items: [{ ...validPickupOrder.items[0], quantity: -1 }],
        }).success
      ).toBe(false);

      expect(
        CreateOrderInputSchema.safeParse({
          ...validPickupOrder,
          items: [{ ...validPickupOrder.items[0], quantity: 1.5 }],
        }).success
      ).toBe(false);
    });

    it('5.4 should reject invalid UUIDs for storeId and variantId', () => {
      expect(
        CreateOrderInputSchema.safeParse({
          ...validPickupOrder,
          storeId: 'not-a-uuid',
        }).success
      ).toBe(false);

      expect(
        CreateOrderInputSchema.safeParse({
          ...validPickupOrder,
          items: [{ ...validPickupOrder.items[0], variantId: 'not-a-uuid' }],
        }).success
      ).toBe(false);
    });

    it('5.5 should reject invalid payment methods', () => {
      expect(
        CreateOrderInputSchema.safeParse({
          ...validPickupOrder,
          paymentMethod: 'crypto' as any,
        }).success
      ).toBe(false);
    });

    it('5.6 [CHALLENGE FINDING] whitespace-only customerName passes min(2) check', () => {
      const whitespaceOrder = {
        ...validPickupOrder,
        customerName: '   ', // 3 whitespace characters >= min(2)
      };
      // Shows that name is not trimmed before length validation
      expect(CreateOrderInputSchema.safeParse(whitespaceOrder).success).toBe(true);
    });

    it('5.7 should reject deliveryType "pickup_from_store" without storeId', () => {
      expect(
        CreateOrderInputSchema.safeParse({
          ...validPickupOrder,
          storeId: null,
        }).success
      ).toBe(false);
    });

    it('5.8 should reject deliveryType "courier" without shippingAddress', () => {
      const courierNoAddress = {
        ...validPickupOrder,
        deliveryType: 'courier' as const,
        shippingAddress: null,
      };
      expect(CreateOrderInputSchema.safeParse(courierNoAddress).success).toBe(false);
    });

    it('5.9 should enforce DeliveryAddressSchema strict city "Алматы"', () => {
      const courierValidAddress = {
        city: 'Алматы' as const,
        districtRu: 'Бостандыкский',
        districtKz: 'Бостандық',
        street: 'Абая',
        building: '10',
      };
      expect(DeliveryAddressSchema.safeParse(courierValidAddress).success).toBe(true);

      const invalidCityAddress = {
        ...courierValidAddress,
        city: 'Астана' as any,
      };
      expect(DeliveryAddressSchema.safeParse(invalidCityAddress).success).toBe(false);
    });
  });

  describe('KaspiCreateInvoiceInputSchema Stress Testing', () => {
    const validInvoice = {
      orderId: '00000000-0000-0000-0000-000000000001',
      amountKzt: 14990,
      customerPhone: '+7 (701) 234-56-78',
      paymentMode: 'KaspiGold' as const,
      description: 'Оплата заказа №1001',
      returnUrl: 'https://india-trikotaj.kz/checkout/success',
    };

    it('6.1 should pass valid Kaspi invoice input', () => {
      expect(KaspiCreateInvoiceInputSchema.safeParse(validInvoice).success).toBe(true);
    });

    it('6.2 should reject zero or negative amount', () => {
      expect(
        KaspiCreateInvoiceInputSchema.safeParse({ ...validInvoice, amountKzt: 0 }).success
      ).toBe(false);
      expect(
        KaspiCreateInvoiceInputSchema.safeParse({ ...validInvoice, amountKzt: -100 }).success
      ).toBe(false);
    });

    it('6.3 should reject floating-point amounts (tiyns prohibited)', () => {
      expect(
        KaspiCreateInvoiceInputSchema.safeParse({ ...validInvoice, amountKzt: 14990.5 }).success
      ).toBe(false);
    });

    it('6.4 should enforce 60 character limit on push invoice descriptions (KaspiGold/Red/Kredit)', () => {
      expect(
        KaspiCreateInvoiceInputSchema.safeParse({
          ...validInvoice,
          paymentMode: 'KaspiGold' as const,
          description: 'A'.repeat(60),
        }).success
      ).toBe(true);

      expect(
        KaspiCreateInvoiceInputSchema.safeParse({
          ...validInvoice,
          paymentMode: 'KaspiGold' as const,
          description: 'A'.repeat(61),
        }).success
      ).toBe(false);
    });

    it('6.5 should allow QR invoices up to 100 characters', () => {
      expect(
        KaspiCreateInvoiceInputSchema.safeParse({
          ...validInvoice,
          paymentMode: 'QR' as const,
          description: 'A'.repeat(100),
        }).success
      ).toBe(true);

      expect(
        KaspiCreateInvoiceInputSchema.safeParse({
          ...validInvoice,
          paymentMode: 'QR' as const,
          description: 'A'.repeat(101),
        }).success
      ).toBe(false);
    });

    it('6.6 [REMEDIATED] returnUrl rejects javascript: and unsafe URI protocols', () => {
      const xssInvoice = {
        ...validInvoice,
        returnUrl: 'javascript:alert(1)',
      };
      expect(KaspiCreateInvoiceInputSchema.safeParse(xssInvoice).success).toBe(false);
      expect(
        KaspiCreateInvoiceInputSchema.safeParse({ ...validInvoice, returnUrl: 'ftp://evil.com' })
          .success
      ).toBe(false);
    });
  });

  describe('ProductFilterQuerySchema Stress Testing', () => {
    it('7.1 [REMEDIATED] inStock correctly parses "false" and "0" as boolean false', () => {
      expect(ProductFilterQuerySchema.parse({ inStock: 'false' }).inStock).toBe(false);
      expect(ProductFilterQuerySchema.parse({ inStock: '0' }).inStock).toBe(false);
      expect(ProductFilterQuerySchema.parse({ inStock: 'true' }).inStock).toBe(true);
      expect(ProductFilterQuerySchema.parse({ inStock: '1' }).inStock).toBe(true);
      expect(ProductFilterQuerySchema.parse({}).inStock).toBeUndefined();
    });

    it('7.2 should allow valid query pagination defaults', () => {
      const parsed = ProductFilterQuerySchema.parse({});
      expect(parsed.page).toBe(1);
      expect(parsed.limit).toBe(20);
      expect(parsed.sort).toBe('newest');
    });

    it('7.3 should reject pagination limit > 100', () => {
      expect(ProductFilterQuerySchema.safeParse({ limit: '101' }).success).toBe(false);
    });

    it('7.4 [CHALLENGE FINDING] minPrice > maxPrice and negative minPrice are accepted', () => {
      // minPrice and maxPrice have no cross-field refinement and minPrice is not .nonnegative()
      const invertedPrices = ProductFilterQuerySchema.safeParse({
        minPrice: 50000,
        maxPrice: 1000,
      });
      expect(invertedPrices.success).toBe(true);

      const negativeMinPrice = ProductFilterQuerySchema.safeParse({
        minPrice: -500,
      });
      expect(negativeMinPrice.success).toBe(true);
    });
  });

  describe('StoreSchema & InventorySchema Stress Testing', () => {
    it('8.1 [CHALLENGE FINDING] StoreSchema coordinates lack GeoCoordinates bounds', () => {
      const storeWithExtremeCoords = {
        id: '00000000-0000-0000-0000-000000000001',
        slug: 'mega-alma-ata',
        nameRu: 'ТРЦ MEGA',
        nameKz: 'MEGA СОО',
        districtRu: 'Бостандыкский',
        districtKz: 'Бостандық',
        addressRu: 'Розыбакиева 247А',
        addressKz: 'Розыбакиев 247А',
        latitude: 99999, // Outside [-90, 90]
        longitude: -88888, // Outside [-180, 180]
        phone: '+7 (727) 232-15-15',
        openHoursRu: '10:00-22:00',
        openHoursKz: '10:00-22:00',
        schedule: {
          days: [],
          displayTextRu: 'Каждый день',
          displayTextKz: 'Күн сайын',
        },
        features: {
          hasFittingRooms: true,
          hasParking: true,
          acceptsKaspiQr: true,
          hasWheelchairAccess: false,
        },
        isActive: true,
        createdAt: '2026-11-02T00:00:00.000Z',
        updatedAt: '2026-11-02T00:00:00.000Z',
      };
      // GeoCoordinatesSchema enforces -90..90, but StoreSchema uses unbounded z.number()
      expect(StoreSchema.safeParse(storeWithExtremeCoords).success).toBe(true);
    });

    it('8.2 [CHALLENGE FINDING] StoreInventorySchema permits reservedQuantity > quantity', () => {
      const invalidInventory = {
        id: '00000000-0000-0000-0000-000000000001',
        storeId: '00000000-0000-0000-0000-000000000002',
        variantId: '00000000-0000-0000-0000-000000000003',
        quantity: 2,
        reservedQuantity: 10, // 10 > 2
        availableQuantity: 999, // Invariant available = quantity - reserved violated
        lowStockThreshold: 3,
        updatedAt: '2026-11-02T00:00:00.000Z',
      };
      // StoreInventorySchema does not enforce the business invariant
      expect(StoreInventorySchema.safeParse(invalidInventory).success).toBe(true);
    });
  });

  // =========================================================================
  // SECTION 4: Result<T, E> Monad Empirical Verification
  // =========================================================================
  describe('Result<T, E> Monad Implementation', () => {
    it('9.1 should construct ok result with data property', () => {
      const res = ok({ id: 123 });
      expect(isOk(res)).toBe(true);
      expect(isErr(res)).toBe(false);
      expect(res.data.id).toBe(123);
      expect(unwrap(res)).toEqual({ id: 123 });
      expect(unwrapOr(res, { id: 999 })).toEqual({ id: 123 });
    });

    it('9.2 should construct err result with error property and throw on unwrap', () => {
      const res = err(new Error('Domain failure'));
      expect(isOk(res)).toBe(false);
      expect(isErr(res)).toBe(true);
      expect(res.error.message).toBe('Domain failure');
      expect(unwrapOr(res, { id: 999 })).toEqual({ id: 999 });
      expect(() => unwrap(res)).toThrow('Domain failure');
    });

    it('9.3 should map Ok results and pass Err results untouched', () => {
      const mappedOk = mapResult(ok(10), (n) => n * 2);
      expect(isOk(mappedOk)).toBe(true);
      if (mappedOk.success) {
        expect(mappedOk.data).toBe(20);
      }

      const customErr = err(new Error('fail'));
      const mappedErr = mapResult(customErr, (n: number) => n * 2);
      expect(isErr(mappedErr)).toBe(true);
    });
  });
});
