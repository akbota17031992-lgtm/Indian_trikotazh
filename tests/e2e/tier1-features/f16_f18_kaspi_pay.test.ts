/**
 * Tier 1: Feature Coverage — Features 16 to 18
 * Feature 16: Kaspi Pay Invoicing API (M5, R5)
 * Feature 17: Kaspi Webhook Handler & Security (M5, R5)
 * Feature 18: Mock Kaspi Payment Adapter (M5, R5)
 */

import { describe, it, expect, setTestTier } from '../helpers/test-framework.ts';
import { MockKaspiService } from '../helpers/kaspi-mock.ts';

setTestTier(1);

export async function run() {
  const kaspi = new MockKaspiService('test_webhook_secret_key_almaty_retail');

  await describe('Feature 16: Kaspi Pay Invoicing API', () => {
    it('16.1 should generate dynamic QR invoice (POST /invoices/qr) with 5-minute expiry', () => {
      const res = kaspi.createQrInvoice({
        orderId: 'ord-1001',
        amount: 14990,
        description: 'Заказ #1001 Индийский Трикотаж'
      });
      expect(res.statusCode).toBe(201);
      expect(res.data).toBeDefined();
      expect(res.data?.status).toBe('pending');
      expect(res.data?.qrTokenUrl).toContain('kaspi.kz/pay?qr=');
      expect(res.data?.expiresAt).toBeDefined();
    });

    it('16.2 should issue push invoice to customer phone (POST /invoices)', () => {
      const res = kaspi.createPhoneInvoice({
        orderId: 'ord-1002',
        amount: 4990,
        phone: '+7 (701) 234-56-78',
        description: 'Заказ #1002'
      });
      expect(res.statusCode).toBe(201);
      expect(res.data?.status).toBe('processing');
      expect(res.data?.phone).toBe('+7 (701) 234-56-78');
    });

    it('16.3 should support Kaspi payment modes: KaspiGold, KaspiRed, KaspiKredit', () => {
      const modes = ['KaspiGold', 'KaspiRed', 'KaspiKredit', 'QR'];
      for (const mode of modes) {
        const res = kaspi.createQrInvoice({
          orderId: `ord-mode-${mode}`,
          amount: 8990,
          description: `Оплата ${mode}`,
          paymentMode: mode as any
        });
        expect(res.statusCode).toBe(201);
        expect(res.data?.paymentMode).toBe(mode);
      }
    });

    it('16.4 should reject non-integer / decimal tenge amounts with 422 amount_must_be_whole_tenge', () => {
      const res = kaspi.createPhoneInvoice({
        orderId: 'ord-1003',
        amount: 14990.50, // fractional tenge rejected by Kaspi
        phone: '+7 (701) 123-45-67',
        description: 'Некорректная сумма'
      });
      expect(res.statusCode).toBe(422);
      expect(res.error).toBe('amount_must_be_whole_tenge');
    });

    it('16.5 should reject QR invoice cancellation requests with 409 qr_cancel_unsupported', () => {
      const qrRes = kaspi.createQrInvoice({
        orderId: 'ord-qr-cancel',
        amount: 6990,
        description: 'QR счет'
      });
      expect(qrRes.statusCode).toBe(201);
      const cancelRes = kaspi.cancelInvoice(qrRes.data!.id);
      expect(cancelRes.statusCode).toBe(409);
      expect(cancelRes.error).toBe('qr_cancel_unsupported');
    });
  });

  await describe('Feature 17: Kaspi Webhook Handler & Security', () => {
    it('17.1 should compute valid HMAC-SHA256 signature for webhook payload', () => {
      const payload = {
        invoiceId: 'inv-test-01',
        orderId: 'ord-1001',
        amount: 14990,
        status: 'SUCCESS' as const,
        transactionId: 'txn-kaspi-998877',
        paymentMethod: 'KASPI_GOLD'
      };
      const signed = kaspi.createSignedWebhook(payload);
      expect(signed.signatureHeader.startsWith('sha256=')).toBe(true);
      expect(signed.signatureHeader.length).toBe(7 + 64); // "sha256=" + 64 hex chars
    });

    it('17.2 should verify authentic webhook signature with constant-time equality', () => {
      const payload = {
        invoiceId: 'inv-test-02',
        orderId: 'ord-1002',
        amount: 4990,
        status: 'SUCCESS' as const,
        transactionId: 'txn-kaspi-554433',
        paymentMethod: 'KASPI_RED',
        kaspiSourceType: 'RED' as const
      };
      const signed = kaspi.createSignedWebhook(payload);
      const isValid = kaspi.verifyWebhookSignature(signed.rawBody, signed.signatureHeader);
      expect(isValid).toBe(true);
    });

    it('17.3 should reject tampered webhook body or altered signature', () => {
      const payload = {
        invoiceId: 'inv-test-03',
        orderId: 'ord-1003',
        amount: 4990,
        status: 'SUCCESS' as const,
        transactionId: 'txn-kaspi-112233',
        paymentMethod: 'KASPI_GOLD'
      };
      const signed = kaspi.createSignedWebhook(payload);
      const tamperedBody = signed.rawBody.replace('4990', '100'); // attacker altered amount
      const isValid = kaspi.verifyWebhookSignature(tamperedBody, signed.signatureHeader);
      expect(isValid).toBe(false);
    });

    it('17.4 should reject webhook signature signed with wrong merchant secret', () => {
      const payload = {
        invoiceId: 'inv-test-04',
        orderId: 'ord-1004',
        amount: 8990,
        status: 'SUCCESS' as const,
        transactionId: 'txn-kaspi-334455',
        paymentMethod: 'KASPI_GOLD'
      };
      const signedWrongSecret = kaspi.createSignedWebhook(payload, 'wrong_secret_attacker');
      const isValid = kaspi.verifyWebhookSignature(signedWrongSecret.rawBody, signedWrongSecret.signatureHeader);
      expect(isValid).toBe(false);
    });

    it('17.5 should provide idempotent deduplication for repeated webhook callbacks (invoiceId:status)', () => {
      const invoiceRes = kaspi.createQrInvoice({
        orderId: 'ord-dedupe',
        amount: 14990,
        description: 'Dedupe test'
      });
      const invoiceId = invoiceRes.data!.id;

      const payload = {
        invoiceId,
        orderId: 'ord-dedupe',
        amount: 14990,
        status: 'SUCCESS' as const,
        transactionId: 'txn-first-delivery',
        paymentMethod: 'KASPI_GOLD'
      };

      const firstDelivery = kaspi.processWebhook(payload);
      expect(firstDelivery.statusCode).toBe(200);
      expect(firstDelivery.idempotent).toBe(false);

      const secondDelivery = kaspi.processWebhook(payload);
      expect(secondDelivery.statusCode).toBe(200);
      expect(secondDelivery.idempotent).toBe(true); // acknowledged without re-processing
    });
  });

  await describe('Feature 18: Mock Kaspi Payment Adapter', () => {
    it('18.1 should provide offline unified checkout creator POST /api/payments/kaspi/create', () => {
      const checkout = kaspi.createCheckout({
        orderId: 'ord-offline-01',
        amountKzt: 4990,
        phone: '+77011234567',
        paymentMode: 'KaspiGold',
        description: 'Offline test checkout',
        returnUrl: 'http://localhost:3000/orders/ord-offline-01'
      });
      expect(checkout.isMock).toBe(true);
      expect(checkout.providerInvoiceId).toBeDefined();
      expect(checkout.qrTokenUrl).toBeDefined();
    });

    it('18.2 should update invoice status upon successful webhook callback', () => {
      const checkout = kaspi.createCheckout({
        orderId: 'ord-status-update',
        amountKzt: 6990,
        phone: '+77011234567',
        paymentMode: 'KaspiRed',
        description: 'Status update test',
        returnUrl: 'http://localhost:3000/orders'
      });

      kaspi.processWebhook({
        invoiceId: checkout.providerInvoiceId,
        orderId: checkout.orderId,
        amount: 6990,
        status: 'SUCCESS',
        transactionId: 'txn-simulated-12345',
        paymentMethod: 'KASPI_RED',
        kaspiSourceType: 'RED'
      });

      const inv = kaspi.getInvoice(checkout.providerInvoiceId);
      expect(inv?.status).toBe('paid');
      expect(inv?.kaspiSourceType).toBe('RED');
      expect(inv?.transactionId).toBe('txn-simulated-12345');
    });

    it('18.3 should handle failed payment callback and update state to "failed"', () => {
      const checkout = kaspi.createCheckout({
        orderId: 'ord-failed',
        amountKzt: 9990,
        phone: '+77011234567',
        paymentMode: 'KaspiGold',
        description: 'Failed test',
        returnUrl: 'http://localhost:3000/orders'
      });

      kaspi.processWebhook({
        invoiceId: checkout.providerInvoiceId,
        orderId: checkout.orderId,
        amount: 9990,
        status: 'FAILED',
        transactionId: 'txn-failed-000',
        paymentMethod: 'KASPI_GOLD'
      });

      const inv = kaspi.getInvoice(checkout.providerInvoiceId);
      expect(inv?.status).toBe('failed');
    });

    it('18.4 should handle refund webhook and update state to "refunded"', () => {
      const checkout = kaspi.createCheckout({
        orderId: 'ord-refund',
        amountKzt: 12990,
        phone: '+77011234567',
        paymentMode: 'KaspiGold',
        description: 'Refund test',
        returnUrl: 'http://localhost:3000/orders'
      });

      kaspi.processWebhook({
        invoiceId: checkout.providerInvoiceId,
        orderId: checkout.orderId,
        amount: 12990,
        status: 'SUCCESS',
        transactionId: 'txn-pay',
        paymentMethod: 'KASPI_GOLD'
      });

      kaspi.processWebhook({
        invoiceId: checkout.providerInvoiceId,
        orderId: checkout.orderId,
        amount: 12990,
        status: 'REFUNDED',
        transactionId: 'txn-ref',
        paymentMethod: 'KASPI_GOLD'
      });

      const inv = kaspi.getInvoice(checkout.providerInvoiceId);
      expect(inv?.status).toBe('refunded');
    });

    it('18.5 should handle sandbox test flag (is_sandbox: true) cleanly in local environment', () => {
      const checkout = kaspi.createCheckout({
        orderId: 'ord-sandbox',
        amountKzt: 4990,
        phone: '+77011234567',
        paymentMode: 'KaspiGold',
        description: 'Sandbox flag test',
        returnUrl: 'http://localhost:3000'
      });

      const res = kaspi.processWebhook({
        invoiceId: checkout.providerInvoiceId,
        orderId: checkout.orderId,
        amount: 4990,
        status: 'SUCCESS',
        transactionId: 'txn-sandbox-1',
        paymentMethod: 'KASPI_GOLD',
        isSandbox: true
      });
      expect(res.statusCode).toBe(200);
    });
  });
}
