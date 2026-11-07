import crypto from 'node:crypto';
import type { KaspiPaymentMode } from '@india-trikotaj/shared';
import { validateKazakhstanPhone } from '@india-trikotaj/shared';
import type {
  IPaymentGateway,
  CreateInvoiceParams,
  PaymentInvoiceResult,
} from '../../../use-cases/ports/payment-gateway.port.js';
import { AppError } from '../../../infrastructure/http/middlewares/error-handler.middleware.js';

export interface MockInvoiceRecord {
  id: string;
  orderId: string;
  amount: number;
  phone?: string;
  paymentMode: KaspiPaymentMode;
  description: string;
  status: 'processing' | 'pending' | 'paid' | 'failed' | 'expired' | 'cancelled' | 'refunded';
  qrTokenUrl: string;
  qrImageUrl: string;
  paymentUrl?: string;
  idempotencyKey?: string;
  createdAt: string;
  expiresAt: string;
  transactionId?: string;
}

export class MockKaspiPaymentAdapter implements IPaymentGateway {
  private readonly invoices = new Map<string, MockInvoiceRecord>();
  private readonly idempotencyKeys = new Map<string, string>();
  private readonly webhookSecret: string;

  constructor(webhookSecret?: string) {
    this.webhookSecret =
      webhookSecret ??
      process.env.KASPI_WEBHOOK_SECRET ??
      'test_kaspi_webhook_secret_key_12345';
  }

  public getSecret(): string {
    return this.webhookSecret;
  }

  public async createInvoice(params: CreateInvoiceParams): Promise<PaymentInvoiceResult> {
    // 1. Whole tenge validation (reject fractional tiyn and non-positive)
    if (!Number.isInteger(params.amountKzt) || params.amountKzt <= 0) {
      throw new AppError(422, 'amount_must_be_whole_tenge', 'Kaspi Pay only accepts whole tenge amounts');
    }

    const isExplicitQr = params.paymentMode === 'QR';
    const mode = params.paymentMode || 'QR';
    const isPush = mode !== 'QR';

    // 2. Description length check: QR max 100 chars, push/default max 60 chars
    if (isExplicitQr) {
      if (params.description && params.description.length > 100) {
        throw new AppError(422, 'description_too_long', 'Payment description exceeds maximum of 100 characters for QR');
      }
    } else {
      if (params.description && params.description.length > 60) {
        throw new AppError(422, 'description_too_long', 'Payment description exceeds maximum of 60 characters for Kaspi Pay');
      }
    }

    // 3. Phone validation
    if (isPush) {
      if (!params.phone || !validateKazakhstanPhone(params.phone)) {
        throw new AppError(422, 'invalid_kazakhstan_phone', 'Valid Kazakhstan phone number is required for phone push invoices');
      }
    } else if (params.phone && params.phone.trim() !== '') {
      if (!validateKazakhstanPhone(params.phone)) {
        throw new AppError(422, 'invalid_kazakhstan_phone', 'Invalid Kazakhstan phone number format');
      }
    }

    // 4. External Idempotency Key check
    if (params.idempotencyKey) {
      if (this.idempotencyKeys.has(params.idempotencyKey)) {
        throw new AppError(409, 'duplicate_idempotency_key', 'Duplicate idempotency key detected');
      }
    }

    const id = isPush
      ? `inv_push_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
      : `inv_qr_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const now = new Date();
    const expiryMinutes = isPush ? 15 : 5;
    const expiresAt = new Date(now.getTime() + expiryMinutes * 60 * 1000).toISOString();
    const qrToken = `kaspi.kz/pay?qr=${id}`;
    const qrImageUrl = `https://api.apipay.kz/qr/${id}.png`;

    const record: MockInvoiceRecord = {
      id,
      orderId: params.orderId,
      amount: params.amountKzt,
      phone: params.phone,
      paymentMode: mode,
      description: params.description,
      status: isPush ? 'processing' : 'pending',
      qrTokenUrl: qrToken,
      qrImageUrl,
      paymentUrl: qrToken,
      idempotencyKey: params.idempotencyKey,
      createdAt: now.toISOString(),
      expiresAt,
    };

    this.invoices.set(id, record);
    if (params.idempotencyKey) {
      this.idempotencyKeys.set(params.idempotencyKey, id);
    }

    return {
      statusCode: 201,
      paymentId: id,
      orderId: params.orderId,
      providerInvoiceId: id,
      status: record.status,
      qrTokenUrl: qrToken,
      qrImageUrl,
      paymentUrl: qrToken,
      phone: params.phone,
      paymentMode: mode,
      isMock: true,
      expiresAt,
    };
  }

  public async cancelInvoice(invoiceId: string): Promise<void> {
    const inv = this.invoices.get(invoiceId);
    if (!inv) {
      throw new AppError(404, 'invoice_not_found', 'Invoice not found');
    }
    if (inv.id.startsWith('inv_qr_') || inv.paymentMode === 'QR') {
      throw new AppError(409, 'qr_cancel_unsupported', 'QR invoices cannot be cancelled');
    }
    if (inv.status !== 'processing' && inv.status !== 'pending') {
      throw new AppError(400, 'invalid_status_for_cancel', 'Invoice status cannot be cancelled');
    }
    inv.status = 'cancelled';
  }

  public verifyWebhookSignature(
    rawBody: Buffer | string | undefined | null,
    signatureHeader: string | undefined | null
  ): boolean {
    if (!signatureHeader || !rawBody) return false;

    const signature = signatureHeader.startsWith('sha256=')
      ? signatureHeader.slice(7)
      : signatureHeader;

    if (!/^[0-9a-fA-F]{64}$/.test(signature)) {
      return false;
    }

    const bodyBuffer = typeof rawBody === 'string' ? Buffer.from(rawBody, 'utf8') : rawBody;
    if (bodyBuffer.length === 0) {
      return false;
    }

    const expectedHmacHex = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(bodyBuffer)
      .digest('hex');

    try {
      const sigBuf = Buffer.from(signature, 'hex');
      const expBuf = Buffer.from(expectedHmacHex, 'hex');

      if (sigBuf.length !== 32 || expBuf.length !== 32) {
        return false;
      }

      return crypto.timingSafeEqual(sigBuf, expBuf);
    } catch {
      return false;
    }
  }

  public createSignedWebhook(
    payload: Record<string, unknown> | string,
    customSecret?: string
  ): { signatureHeader: string; rawBody: string } {
    const rawBody = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const secret = customSecret ?? this.webhookSecret;
    const hmac = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    return {
      signatureHeader: `sha256=${hmac}`,
      rawBody,
    };
  }

  public getInvoice(id: string): MockInvoiceRecord | undefined {
    return this.invoices.get(id);
  }
}
