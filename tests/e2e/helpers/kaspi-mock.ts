/**
 * India Trikotaj E2E Testing Suite — Kaspi Pay & ApiPay.kz Mock Adapter
 * Strictly implements the ApiPay.kz REST API contract (R5, PROJECT.md)
 */

import crypto from 'node:crypto';
import type { KaspiCreateInvoiceInput, KaspiCreateInvoiceOutput, KaspiWebhookCallback } from './contracts.ts';
import { validateKazakhstanPhone } from './contracts.ts';

export interface KaspiInvoiceRecord {
  id: string;
  orderId: string;
  amount: number;
  phone?: string;
  paymentMode: string;
  description: string;
  status: 'processing' | 'pending' | 'paid' | 'failed' | 'expired' | 'cancelled' | 'refunded';
  qrTokenUrl?: string;
  qrImageUrl?: string;
  paymentUrl?: string;
  idempotencyKey?: string;
  createdAt: string;
  expiresAt: string;
  kaspiSourceType?: 'GOLD' | 'RED' | 'LOAN';
  transactionId?: string;
}

export class MockKaspiService {
  private invoices = new Map<string, KaspiInvoiceRecord>();
  private idempotencyKeys = new Map<string, string>(); // idempotencyKey -> invoiceId
  private processedWebhookEvents = new Set<string>(); // deduplication set: `${invoiceId}:${status}`
  private webhookSecret: string;

  constructor(webhookSecret: string = 'test_kaspi_webhook_secret_key_12345') {
    this.webhookSecret = webhookSecret;
  }

  getSecret(): string {
    return this.webhookSecret;
  }

  /**
   * ApiPay.kz POST /invoices (Phone Push Invoice)
   */
  createPhoneInvoice(params: {
    orderId: string;
    amount: number;
    phone: string;
    description: string;
    idempotencyKey?: string;
  }): { statusCode: number; data?: KaspiInvoiceRecord; error?: string } {
    // 1. Whole tenge check (Spec edge case #1)
    if (!Number.isInteger(params.amount) || params.amount <= 0) {
      return { statusCode: 422, error: 'amount_must_be_whole_tenge' };
    }

    // 2. Description length check (Spec edge case #2: max 60 chars)
    if (params.description && params.description.length > 60) {
      return { statusCode: 422, error: 'description_too_long' };
    }

    // 3. Phone validation
    if (!validateKazakhstanPhone(params.phone)) {
      return { statusCode: 422, error: 'invalid_kazakhstan_phone' };
    }

    // 4. Idempotency check
    if (params.idempotencyKey) {
      const existingId = this.idempotencyKeys.get(params.idempotencyKey);
      if (existingId) {
        return { statusCode: 409, error: 'duplicate_idempotency_key' };
      }
    }

    const id = `inv_push_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 15 * 60 * 1000); // 15 min for push

    const invoice: KaspiInvoiceRecord = {
      id,
      orderId: params.orderId,
      amount: params.amount,
      phone: params.phone,
      paymentMode: 'KaspiGold',
      description: params.description,
      status: 'processing',
      idempotencyKey: params.idempotencyKey,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString()
    };

    this.invoices.set(id, invoice);
    if (params.idempotencyKey) {
      this.idempotencyKeys.set(params.idempotencyKey, id);
    }

    return { statusCode: 201, data: invoice };
  }

  /**
   * ApiPay.kz POST /invoices/qr (Dynamic QR Invoice)
   */
  createQrInvoice(params: {
    orderId: string;
    amount: number;
    description: string;
    paymentMode?: 'KaspiGold' | 'KaspiRed' | 'KaspiKredit' | 'QR';
    staticUrl?: boolean;
    returnUrl?: string;
  }): { statusCode: number; data?: KaspiInvoiceRecord; error?: string } {
    // 1. Whole tenge check
    if (!Number.isInteger(params.amount) || params.amount <= 0) {
      return { statusCode: 422, error: 'amount_must_be_whole_tenge' };
    }

    // 2. Description length (QR max 100 chars)
    if (params.description && params.description.length > 100) {
      return { statusCode: 422, error: 'description_too_long' };
    }

    const id = `inv_qr_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes validity
    const qrToken = `kaspi-qr-${id}-${Math.random().toString(36).substring(2, 10)}`;

    const invoice: KaspiInvoiceRecord = {
      id,
      orderId: params.orderId,
      amount: params.amount,
      paymentMode: params.paymentMode || 'QR',
      description: params.description,
      status: 'pending',
      qrTokenUrl: `https://kaspi.kz/pay?qr=${qrToken}`,
      qrImageUrl: `https://api.apipay.kz/qr/${id}.png`,
      paymentUrl: params.staticUrl ? `https://pay.apipay.kz/checkout/${id}` : undefined,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString()
    };

    this.invoices.set(id, invoice);
    return { statusCode: 201, data: invoice };
  }

  /**
   * ApiPay.kz POST /invoices/{id}/cancel
   * Note: QR invoices CANNOT be cancelled! Returns 409 qr_cancel_unsupported (Spec edge case #3)
   */
  cancelInvoice(id: string): { statusCode: number; error?: string } {
    const inv = this.invoices.get(id);
    if (!inv) {
      return { statusCode: 404, error: 'invoice_not_found' };
    }
    if (inv.id.startsWith('inv_qr_')) {
      return { statusCode: 409, error: 'qr_cancel_unsupported' };
    }
    if (inv.status !== 'processing' && inv.status !== 'pending') {
      return { statusCode: 400, error: 'invalid_status_for_cancel' };
    }
    inv.status = 'cancelled';
    return { statusCode: 200 };
  }

  /**
   * Internal unified adapter: POST /api/payments/kaspi/create
   */
  createCheckout(input: KaspiCreateInvoiceInput): KaspiCreateInvoiceOutput {
    if (!Number.isInteger(input.amountKzt) || input.amountKzt <= 0) {
      throw new Error('amount_must_be_whole_tenge');
    }
    const id = `inv_chk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 5 * 60 * 1000).toISOString();

    const record: KaspiInvoiceRecord = {
      id,
      orderId: input.orderId,
      amount: input.amountKzt,
      phone: input.phone,
      paymentMode: input.paymentMode,
      description: input.description.slice(0, 60),
      status: 'pending',
      qrTokenUrl: `https://kaspi.kz/pay?token=${id}`,
      qrImageUrl: `https://api.apipay.kz/qr/${id}.png`,
      paymentUrl: `https://pay.apipay.kz/c/${id}`,
      createdAt: now.toISOString(),
      expiresAt
    };
    this.invoices.set(id, record);

    return {
      paymentId: `pay_${id}`,
      orderId: input.orderId,
      providerInvoiceId: id,
      status: 'pending',
      qrTokenUrl: record.qrTokenUrl,
      qrImageUrl: record.qrImageUrl,
      paymentUrl: record.paymentUrl,
      isMock: true,
      expiresAt
    };
  }

  /**
   * Generate signed webhook payload with HMAC-SHA256
   */
  createSignedWebhook(payload: KaspiWebhookCallback, customSecret?: string): { signatureHeader: string; rawBody: string } {
    const rawBody = JSON.stringify(payload);
    const secret = customSecret ?? this.webhookSecret;
    const hmac = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    return {
      signatureHeader: `sha256=${hmac}`,
      rawBody
    };
  }

  /**
   * Verify webhook signature strictly using crypto.timingSafeEqual on raw Buffer
   */
  verifyWebhookSignature(rawBody: string | Buffer, signatureHeader: string, customSecret?: string): boolean {
    if (!signatureHeader || !rawBody) return false;

    const signature = signatureHeader.startsWith('sha256=')
      ? signatureHeader.slice(7)
      : signatureHeader;

    if (!/^[0-9a-fA-F]{64}$/.test(signature)) {
      return false;
    }

    const secret = customSecret ?? this.webhookSecret;
    const bodyBuffer = typeof rawBody === 'string' ? Buffer.from(rawBody, 'utf8') : rawBody;
    const expectedHmac = crypto.createHmac('sha256', secret).update(bodyBuffer).digest('hex');

    try {
      const sigBuf = Buffer.from(signature, 'hex');
      const expBuf = Buffer.from(expectedHmac, 'hex');
      if (sigBuf.length !== expBuf.length) return false;
      return crypto.timingSafeEqual(sigBuf, expBuf);
    } catch {
      return false;
    }
  }

  /**
   * Process webhook with idempotent deduplication (invoiceId:status)
   */
  processWebhook(payload: KaspiWebhookCallback): { statusCode: number; idempotent: boolean; error?: string } {
    const dedupeKey = `${payload.invoiceId}:${payload.status}`;
    if (this.processedWebhookEvents.has(dedupeKey)) {
      return { statusCode: 200, idempotent: true };
    }

    const invoice = this.invoices.get(payload.invoiceId);
    if (!invoice) {
      return { statusCode: 404, idempotent: false, error: 'invoice_not_found' };
    }

    if (payload.status === 'SUCCESS') {
      invoice.status = 'paid';
      invoice.transactionId = payload.transactionId;
      invoice.kaspiSourceType = payload.kaspiSourceType as 'GOLD' | 'RED' | 'LOAN';
    } else if (payload.status === 'FAILED') {
      invoice.status = 'failed';
    } else if (payload.status === 'REFUNDED') {
      invoice.status = 'refunded';
    }

    this.processedWebhookEvents.add(dedupeKey);
    return { statusCode: 200, idempotent: false };
  }

  getInvoice(id: string): KaspiInvoiceRecord | undefined {
    return this.invoices.get(id);
  }
}
