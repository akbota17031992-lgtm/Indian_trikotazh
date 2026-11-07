import { describe, it, expect } from 'vitest';
import { CreateOrderInputSchema } from '../schemas/order.js';
import { KaspiCreateInvoiceInputSchema } from '../schemas/payment.js';
import { StoreSchema } from '../schemas/store.js';
import { ALMATY_STORES_SEED } from '../constants/stores.js';
import { MVP_CATEGORIES_SEED } from '../constants/categories.js';

describe('schemas and constants', () => {
  it('contains exactly 16 official Almaty store branches in seed data', () => {
    expect(ALMATY_STORES_SEED.length).toBe(16);
    expect(ALMATY_STORES_SEED.map((s) => s.slug)).toContain('mega-alma-ata');
    expect(ALMATY_STORES_SEED.map((s) => s.slug)).toContain('dostyk-plaza');
    expect(ALMATY_STORES_SEED.map((s) => s.slug)).toContain('grand-park');
  });

  it('contains exactly 7 MVP categories in seed data', () => {
    expect(MVP_CATEGORIES_SEED.length).toBe(7);
    const slugs = MVP_CATEGORIES_SEED.map((c) => c.slug);
    expect(slugs).toEqual([
      't-shirts',
      'long-sleeves',
      'robes',
      'pajamas',
      'thermal-underwear',
      'kids',
      'home-textiles',
    ]);
  });

  it('validates store pickup order requiring storeId', () => {
    const validPickup = {
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

    const parseResult = CreateOrderInputSchema.safeParse(validPickup);
    expect(parseResult.success).toBe(true);

    const invalidPickup = {
      ...validPickup,
      storeId: null,
    };
    const invalidResult = CreateOrderInputSchema.safeParse(invalidPickup);
    expect(invalidResult.success).toBe(false);
  });

  it('validates courier order requiring shippingAddress', () => {
    const validCourier = {
      customerName: 'Алия Серикова',
      customerPhone: '87771234567',
      deliveryType: 'courier' as const,
      shippingAddress: {
        city: 'Алматы' as const,
        districtRu: 'Бостандыкский район',
        districtKz: 'Бостандық ауданы',
        street: 'Абая',
        building: '10',
        apartment: '45',
      },
      items: [
        {
          variantId: '00000000-0000-0000-0000-000000000002',
          quantity: 1,
          reservedFromStoreId: '00000000-0000-0000-0000-000000000001',
        },
      ],
      paymentMethod: 'kaspi_gold' as const,
    };

    const parseResult = CreateOrderInputSchema.safeParse(validCourier);
    expect(parseResult.success).toBe(true);

    const missingAddress = {
      ...validCourier,
      shippingAddress: null,
    };
    expect(CreateOrderInputSchema.safeParse(missingAddress).success).toBe(false);
  });

  it('enforces Kaspi push invoice description max length <= 60 chars', () => {
    const validPush = {
      orderId: '00000000-0000-0000-0000-000000000001',
      amountKzt: 14990,
      customerPhone: '+7 (701) 234-56-78',
      paymentMode: 'KaspiGold' as const,
      description: 'Оплата заказа №1001 в Индия Трикотаж', // length 36 <= 60
      returnUrl: 'https://india-trikotaj.kz/checkout/success',
    };
    expect(KaspiCreateInvoiceInputSchema.safeParse(validPush).success).toBe(true);

    const longDescriptionPush = {
      ...validPush,
      description:
        'Очень длинное подробное описание заказа клиента которое превышает лимит шестьдесят символов API Kaspi',
    };
    const res = KaspiCreateInvoiceInputSchema.safeParse(longDescriptionPush);
    expect(res.success).toBe(false);
  });
});
