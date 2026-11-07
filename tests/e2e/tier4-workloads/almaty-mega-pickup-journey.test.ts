/**
 * Tier 4: Real-World Workload Testing — Customer Journey 1
 * Almaty MEGA Store Pickup Journey: Browse -> Variant Select -> Branch Stock -> Order -> Kaspi QR
 */

import { describe, it, expect, setTestTier } from '../helpers/test-framework.ts';
import { E2eTestClient } from '../helpers/http-client.ts';
import { MockKaspiService } from '../helpers/kaspi-mock.ts';
import { formatKZT } from '../helpers/contracts.ts';

setTestTier(4);

export async function run() {
  const client = new E2eTestClient();
  const kaspi = new MockKaspiService('workload_mega_journey_secret');

  await describe('Workload 1: Almaty MEGA Alma-Ata Store Pickup Journey', () => {
    let orderId: string;
    let invoiceId: string;

    it('4.1 Step 1: Customer visits web storefront and selects "ТРЦ MEGA Alma-Ata"', async () => {
      const storesRes = await client.getStores();
      expect(storesRes.status).toBe(200);

      const mega = storesRes.data.find(s => s.slug === 'mega-alma-ata');
      expect(mega).toBeDefined();
      expect(mega?.district).toBe('Бостандыкский');
      expect(mega?.schedule_ru).toBe('Ежедневно с 10:00 до 22:00');
    });

    it('4.2 Step 2: Customer navigates to "Футболки" category and opens basic cotton T-shirt PDP', async () => {
      const pdpRes = await client.getProductBySlug('futbolka-bazovaya-hlopkovaya-premium');
      expect(pdpRes.status).toBe(200);
      expect(pdpRes.data?.name_ru).toContain('Футболка базовая хлопковая');
      expect(pdpRes.variants?.length).toBeGreaterThan(0);
    });

    it('4.3 Step 3: Customer selects White Size M and verifies stock badge ("13 шт. в наличии")', async () => {
      const stockRes = await client.checkStockAvailability('var-001-w-m');
      expect(stockRes.status).toBe(200);
      const megaStock = stockRes.availability.find(a => a.storeId === 'store-almaty-001');
      expect(megaStock?.available).toBe(13);
    });

    it('4.4 Step 4: Customer creates pickup order and receives summary with 0 ₸ delivery fee', async () => {
      const orderRes = await client.createOrder({
        customerName: 'Санжар Муратов',
        customerPhone: '+7 (777) 222-33-44',
        fulfillmentType: 'pickup',
        pickupStoreId: 'store-almaty-001',
        items: [{ variantId: 'var-001-w-m', quantity: 2 }]
      });

      expect(orderRes.status).toBe(201);
      orderId = orderRes.order!.id;
      expect(orderRes.order?.delivery_fee_kzt).toBe(0);
      expect(orderRes.order?.total_kzt).toBe(9980);
      expect(formatKZT(orderRes.order!.total_kzt)).toBe('9 980 ₸');
    });

    it('4.5 Step 5: Customer opens Kaspi Pay QR modal and scans dynamic QR code', () => {
      const checkout = kaspi.createCheckout({
        orderId,
        amountKzt: 9980,
        phone: '+77772223344',
        paymentMode: 'QR',
        description: `Заказ #${orderId.slice(-6)} в ТРЦ MEGA`,
        returnUrl: `http://localhost:3000/orders/${orderId}`
      });

      invoiceId = checkout.providerInvoiceId;
      expect(checkout.qrTokenUrl).toBeDefined();
      expect(checkout.status).toBe('pending');
    });

    it('4.6 Step 6: Customer scans QR in Kaspi app, webhook confirms payment, order ready for pickup', () => {
      const callbackPayload = {
        invoiceId,
        orderId,
        amount: 9980,
        status: 'SUCCESS' as const,
        transactionId: 'txn-mega-pickup-4455',
        paymentMethod: 'KASPI_QR'
      };

      const res = kaspi.processWebhook(callbackPayload);
      expect(res.statusCode).toBe(200);

      const invoice = kaspi.getInvoice(invoiceId);
      expect(invoice?.status).toBe('paid');
      expect(invoice?.transactionId).toBe('txn-mega-pickup-4455');
    });
  });
}
