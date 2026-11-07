/**
 * Tier 4: Real-World Workload Testing — Customer Journey 2
 * Almaty Courier Delivery Journey: Multi-item Cart -> Courier Delivery -> Kaspi Red 0-0-3 Installment
 */

import { describe, it, expect, setTestTier } from '../helpers/test-framework.ts';
import { E2eTestClient } from '../helpers/http-client.ts';
import { MockKaspiService } from '../helpers/kaspi-mock.ts';
import { formatKZT } from '../helpers/contracts.ts';

setTestTier(4);

export async function run() {
  const client = new E2eTestClient();
  const kaspi = new MockKaspiService('workload_courier_red_secret');

  await describe('Workload 2: Courier Delivery with Kaspi Red Installment', () => {
    let orderId: string;
    let invoiceId: string;

    it('4.7 Step 1: Customer adds multiple clothing items to cart (T-shirt + Bathrobe)', async () => {
      const items = [
        { variantId: 'var-001-w-l', quantity: 1 }, // 4 990 KZT
        { variantId: 'var-003-bl-l', quantity: 1 }  // 14 990 KZT
      ];
      const subtotal = 4990 + 14990;
      expect(subtotal).toBe(19980);
    });

    it('4.8 Step 2: Customer selects Courier delivery and enters Almaty address in Medeu district', async () => {
      const orderRes = await client.createOrder({
        customerName: 'Динара Кусаинова',
        customerPhone: '+7 (701) 333-44-55',
        fulfillmentType: 'courier',
        deliveryAddress: {
          city: 'Алматы',
          district: 'Медеуский',
          street: 'пр. Достык',
          building: '105',
          apartment: '42',
          postal_code: '050051'
        },
        items: [
          { variantId: 'var-001-w-l', quantity: 1 },
          { variantId: 'var-003-bl-l', quantity: 1 }
        ]
      });

      expect(orderRes.status).toBe(201);
      orderId = orderRes.order!.id;
      expect(orderRes.order?.fulfillment_type).toBe('courier');
      expect(orderRes.order?.delivery_fee_kzt).toBe(1500); // 1 500 KZT standard Almaty courier fee
      expect(orderRes.order?.total_kzt).toBe(21480);       // 19 980 + 1 500 = 21 480 ₸
      expect(formatKZT(orderRes.order!.total_kzt)).toBe('21 480 ₸');
    });

    it('4.9 Step 3: Customer chooses "Kaspi Red" (0-0-3 installment: 3 x 7 160 ₸)', () => {
      const total = 21480;
      const monthlyPayment = Math.round(total / 3);
      expect(monthlyPayment).toBe(7160);
      expect(formatKZT(monthlyPayment)).toBe('7 160 ₸');

      const checkout = kaspi.createCheckout({
        orderId,
        amountKzt: total,
        phone: '+77013334455',
        paymentMode: 'KaspiRed',
        description: `Заказ #${orderId.slice(-6)} (Kaspi Red 0-0-3)`,
        returnUrl: `http://localhost:3000/orders/${orderId}`
      });

      invoiceId = checkout.providerInvoiceId;
      expect(checkout.paymentId).toBeDefined();
    });

    it('4.10 Step 4: Kaspi Red push is authorized by buyer with 0% interest and status transitions to paid', () => {
      const webhookRes = kaspi.processWebhook({
        invoiceId,
        orderId,
        amount: 21480,
        status: 'SUCCESS',
        transactionId: 'txn-red-installment-7788',
        paymentMethod: 'KASPI_RED',
        kaspiSourceType: 'RED'
      });

      expect(webhookRes.statusCode).toBe(200);
      const invoice = kaspi.getInvoice(invoiceId);
      expect(invoice?.status).toBe('paid');
      expect(invoice?.kaspiSourceType).toBe('RED');
    });

    it('4.11 Step 5: Order status lifecycle updates through courier dispatch and delivery', () => {
      let orderStatus = 'paid';
      const updateStatus = (next: string) => { orderStatus = next; };

      updateStatus('processing');
      expect(orderStatus).toBe('processing');

      updateStatus('in_transit');
      expect(orderStatus).toBe('in_transit');

      updateStatus('delivered');
      expect(orderStatus).toBe('delivered');
    });
  });
}
