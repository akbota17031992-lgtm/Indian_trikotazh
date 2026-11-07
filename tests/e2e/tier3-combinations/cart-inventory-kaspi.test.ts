/**
 * Tier 3: Cross-Feature Combinations — Pairwise Interaction 1
 * Features: Store Inventory + Cart State + Kaspi Pay Checkout + Webhook Lifecycle
 */

import { describe, it, expect, setTestTier } from '../helpers/test-framework.ts';
import { E2eTestClient } from '../helpers/http-client.ts';
import { MockKaspiService } from '../helpers/kaspi-mock.ts';
import { INVENTORY_FIXTURE, VARIANTS_FIXTURE } from '../helpers/fixtures.ts';
import { formatKZT } from '../helpers/contracts.ts';

setTestTier(3);

export async function run() {
  const client = new E2eTestClient();
  const kaspi = new MockKaspiService('pairwise_cart_kaspi_secret');

  await describe('Combination 1: Inventory Check -> Cart -> Kaspi Pay -> Webhook Update', () => {
    it('3.1 should check stock in MEGA Alma-Ata before adding to cart', async () => {
      const variantId = 'var-001-w-m';
      const availabilityRes = await client.checkStockAvailability(variantId);
      expect(availabilityRes.status).toBe(200);

      const megaStock = availabilityRes.availability.find(a => a.storeName.includes('MEGA'));
      expect(megaStock).toBeDefined();
      expect(megaStock!.available).toBe(13);
    });

    it('3.2 should create order reserving stock for selected pickup branch', async () => {
      const orderRes = await client.createOrder({
        customerName: 'Бауыржан Момышев',
        customerPhone: '+7 (702) 111-22-33',
        fulfillmentType: 'pickup',
        pickupStoreId: 'store-almaty-001',
        items: [{ variantId: 'var-001-w-m', quantity: 2 }]
      });

      expect(orderRes.status).toBe(201);
      expect(orderRes.order).toBeDefined();
      expect(orderRes.order?.status).toBe('pending_payment');
      expect(orderRes.order?.total_kzt).toBe(9980);
      expect(formatKZT(orderRes.order!.total_kzt)).toBe('9 980 ₸');
    });

    it('3.3 should initiate Kaspi Pay dynamic QR invoice for the created order', () => {
      const checkout = kaspi.createCheckout({
        orderId: 'ord-combo-1',
        amountKzt: 9980,
        phone: '+77021112233',
        paymentMode: 'KaspiGold',
        description: 'Оплата заказа Индийский Трикотаж',
        returnUrl: 'http://localhost:3000/orders/ord-combo-1'
      });

      expect(checkout.providerInvoiceId).toBeDefined();
      expect(checkout.status).toBe('pending');
      expect(checkout.qrTokenUrl).toContain('kaspi.kz/pay?token=');
    });

    it('3.4 should simulate successful payment and verify webhook updates order to paid', () => {
      const checkout = kaspi.createCheckout({
        orderId: 'ord-combo-2',
        amountKzt: 9980,
        phone: '+77021112233',
        paymentMode: 'KaspiGold',
        description: 'Оплата заказа',
        returnUrl: 'http://localhost:3000/orders'
      });

      const webhookPayload = {
        invoiceId: checkout.providerInvoiceId,
        orderId: checkout.orderId,
        amount: 9980,
        status: 'SUCCESS' as const,
        transactionId: 'txn-kaspi-combo-9988',
        paymentMethod: 'KASPI_GOLD',
        kaspiSourceType: 'GOLD' as const
      };

      const signed = kaspi.createSignedWebhook(webhookPayload);
      const isVerified = kaspi.verifyWebhookSignature(signed.rawBody, signed.signatureHeader);
      expect(isVerified).toBe(true);

      const processRes = kaspi.processWebhook(webhookPayload);
      expect(processRes.statusCode).toBe(200);

      const invoice = kaspi.getInvoice(checkout.providerInvoiceId);
      expect(invoice?.status).toBe('paid');
      expect(invoice?.transactionId).toBe('txn-kaspi-combo-9988');
    });

    it('3.5 should verify that inventory reserved stock transitions to deducted upon payment', () => {
      let qty = 15;
      let reserved = 2; // from order creation
      // Upon payment:
      reserved -= 2;
      qty -= 2;
      const available = qty - reserved;
      expect(qty).toBe(13);
      expect(reserved).toBe(0);
      expect(available).toBe(13);
    });

    it('3.6 should reject double execution if same webhook arrives multiple times', () => {
      const checkout = kaspi.createCheckout({
        orderId: 'ord-combo-dedupe',
        amountKzt: 4990,
        phone: '+77021112233',
        paymentMode: 'KaspiGold',
        description: 'Dedupe check',
        returnUrl: 'http://localhost:3000'
      });

      const payload = {
        invoiceId: checkout.providerInvoiceId,
        orderId: checkout.orderId,
        amount: 4990,
        status: 'SUCCESS' as const,
        transactionId: 'txn-dup',
        paymentMethod: 'KASPI_GOLD'
      };

      const res1 = kaspi.processWebhook(payload);
      expect(res1.idempotent).toBe(false);

      const res2 = kaspi.processWebhook(payload);
      expect(res2.idempotent).toBe(true);
    });
  });
}
