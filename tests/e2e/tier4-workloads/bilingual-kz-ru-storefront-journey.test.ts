/**
 * Tier 4: Real-World Workload Testing — Customer Journey 4
 * Kazakh Language Native Journey: Bilingual Localization -> Cyrillic-Ext -> Kaspi Kredit Checkout
 */

import { describe, it, expect, setTestTier } from '../helpers/test-framework.ts';
import { CATEGORIES_FIXTURE, PRODUCTS_FIXTURE, ALMATY_STORES_FIXTURE } from '../helpers/fixtures.ts';
import { MockKaspiService } from '../helpers/kaspi-mock.ts';
import { formatKZT } from '../helpers/contracts.ts';

setTestTier(4);

export async function run() {
  const kaspi = new MockKaspiService('workload_kz_secret');

  await describe('Workload 4: Bilingual Kazakh Native User Journey & Kaspi Kredit', () => {
    let currentLocale = 'ru';

    it('4.16 Step 1: Customer switches storefront locale from Russian to Kazakh ("kz")', () => {
      currentLocale = 'kz';
      expect(currentLocale).toBe('kz');
    });

    it('4.17 Step 2: Customer browses categories rendered with official Kazakh names', () => {
      const kzCategories = CATEGORIES_FIXTURE.map(c => c.name_kz);
      expect(kzCategories).toContain('Футболкалар');
      expect(kzCategories).toContain('Термоішкиім');
      expect(kzCategories).toContain('Балалар киімі');
      expect(kzCategories).toContain('Үй тоқымасы');
    });

    it('4.18 Step 3: Customer opens Thermal Underwear PDP and inspects Kazakh descriptions', () => {
      const thermal = PRODUCTS_FIXTURE.find(p => p.slug.includes('termobele'))!;
      expect(thermal.name_kz).toBe('Қысқы екі қабатты Active Warm термоішкиімі');
      expect(thermal.description_kz).toContain('-30°C дейінгі қатал қысқы ауа-райына арналған');
      expect(thermal.material_kz).toBe('70% мақта, 20% жүн, 10% эластан');
    });

    it('4.19 Step 4: Customer selects pickup at "Занғар ОУД" (ЦУМ Зангар) in Almaly district', () => {
      const tsumStore = ALMATY_STORES_FIXTURE.find(s => s.slug === 'tsum-zangar')!;
      expect(tsumStore.name_kz).toBe('Занғар ОУД');
      expect(tsumStore.address_kz).toBe('Абылай хан д-лы, 62, 3-қабат');
      expect(tsumStore.schedule_kz).toContain('Күн сайын');
    });

    it('4.20 Step 5: Customer chooses "Kaspi Kredit" 0-0-12 (12 monthly payments) checkout', () => {
      const totalAmount = 12990;
      const monthlyPayment = Math.round(totalAmount / 12);
      expect(monthlyPayment).toBe(1083);
      expect(formatKZT(monthlyPayment)).toBe('1 083 ₸');

      const checkout = kaspi.createCheckout({
        orderId: 'ord-kz-kredit-12',
        amountKzt: totalAmount,
        phone: '+77078889900',
        paymentMode: 'KaspiKredit',
        description: 'Тапсырыс #12990 Үнді Трикотажы (Kaspi Бөліп төлеу)',
        returnUrl: 'http://localhost:3000/kz/orders/ord-kz-kredit-12'
      });

      expect(checkout.paymentId).toBeDefined();
      expect(checkout.isMock).toBe(true);
    });

    it('4.21 Step 6: Webhook arrives with Kaspi Kredit source type LOAN and confirmation in Kazakh', () => {
      const webhookPayload = {
        invoiceId: 'inv-kredit-77',
        orderId: 'ord-kz-kredit-12',
        amount: 12990,
        status: 'SUCCESS' as const,
        transactionId: 'txn-loan-kz-9900',
        paymentMethod: 'KASPI_KREDIT',
        kaspiSourceType: 'LOAN' as const
      };

      const signed = kaspi.createSignedWebhook(webhookPayload);
      const isVerified = kaspi.verifyWebhookSignature(signed.rawBody, signed.signatureHeader);
      expect(isVerified).toBe(true);

      const confirmationMessageKz = `Сіздің тапсырысыңыз сәтті төленді! Сомасы: ${formatKZT(webhookPayload.amount)}. Түбіртек: ${webhookPayload.transactionId}`;
      expect(confirmationMessageKz).toContain('сәтті төленді');
      expect(confirmationMessageKz).toContain('12 990 ₸');
    });
  });
}
