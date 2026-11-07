import crypto from 'node:crypto';
import { validateKazakhstanPhone } from '@india-trikotaj/shared';
import type {
  IPaymentGateway,
  CreateInvoiceParams,
  PaymentInvoiceResult,
} from '../../../use-cases/ports/payment-gateway.port.js';
import { AppError } from '../../../infrastructure/http/middlewares/error-handler.middleware.js';

export interface ApiPayConfig {
  baseUrl?: string;
  apiKey?: string;
  merchantId?: string;
  webhookSecret?: string;
}

export class ApiPayKzPaymentAdapter implements IPaymentGateway {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly merchantId: string;
  private readonly webhookSecret: string;

  constructor(config?: ApiPayConfig) {
    this.baseUrl = config?.baseUrl ?? process.env.APIPAY_BASE_URL ?? 'https://api.apipay.kz';
    this.apiKey = config?.apiKey ?? process.env.APIPAY_API_KEY ?? '';
    this.merchantId = config?.merchantId ?? process.env.APIPAY_MERCHANT_ID ?? '';
    this.webhookSecret =
      config?.webhookSecret ??
      process.env.KASPI_WEBHOOK_SECRET ??
      'test_kaspi_webhook_secret_key_12345';
  }

  public async createInvoice(params: CreateInvoiceParams): Promise<PaymentInvoiceResult> {
    // 1. Whole tenge validation
    if (!Number.isInteger(params.amountKzt) || params.amountKzt <= 0) {
      throw new AppError(422, 'amount_must_be_whole_tenge', 'Kaspi Pay only accepts whole tenge amounts');
    }

    const isExplicitQr = params.paymentMode === 'QR';
    const mode = params.paymentMode || 'QR';
    const isPush = mode !== 'QR';

    // 2. Description length check
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

    const endpoint = isPush ? `${this.baseUrl}/invoices` : `${this.baseUrl}/invoices/qr`;
    const payload = {
      order_id: params.orderId,
      amount: params.amountKzt,
      description: params.description,
      payment_mode: mode,
      phone: params.phone,
      return_url: params.returnUrl,
      merchant_id: this.merchantId || undefined,
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
    };
    if (params.idempotencyKey) {
      headers['Idempotency-Key'] = params.idempotencyKey;
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000),
      });

      const data = (await response.json()) as any;

      if (!response.ok) {
        if (response.status === 409) {
          throw new AppError(409, data?.error || 'duplicate_idempotency_key', data?.message || 'Invoice conflict');
        }
        if (response.status === 422) {
          throw new AppError(422, data?.error || 'VALIDATION_FAILED', data?.message || 'ApiPay validation error');
        }
        throw new AppError(response.status, data?.error || 'PAYMENT_GATEWAY_ERROR', data?.message || 'ApiPay request failed');
      }

      const invoiceData = data.data || data;
      return {
        statusCode: 201,
        paymentId: invoiceData.id || invoiceData.paymentId,
        orderId: params.orderId,
        providerInvoiceId: invoiceData.id || invoiceData.providerInvoiceId,
        status: invoiceData.status || (isPush ? 'processing' : 'pending'),
        qrTokenUrl: invoiceData.qrTokenUrl || invoiceData.qr_token_url,
        qrImageUrl: invoiceData.qrImageUrl || invoiceData.qr_image_url,
        paymentUrl: invoiceData.paymentUrl || invoiceData.payment_url,
        phone: params.phone,
        paymentMode: mode,
        isMock: false,
        expiresAt: invoiceData.expiresAt || invoiceData.expires_at || new Date(Date.now() + 300000).toISOString(),
      };
    } catch (err: any) {
      if (err instanceof AppError) throw err;
      throw new AppError(502, 'GATEWAY_UNAVAILABLE', `ApiPay.kz communication failed: ${err.message || 'Unknown network error'}`);
    }
  }

  public async cancelInvoice(invoiceId: string): Promise<void> {
    const endpoint = `${this.baseUrl}/invoices/${encodeURIComponent(invoiceId)}/cancel`;
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as any;
        if (response.status === 409) {
          throw new AppError(409, 'qr_cancel_unsupported', data?.message || 'QR invoices cannot be cancelled');
        }
        throw new AppError(response.status, data?.error || 'CANCEL_FAILED', data?.message || 'Cancel failed');
      }
    } catch (err: any) {
      if (err instanceof AppError) throw err;
      throw new AppError(502, 'GATEWAY_UNAVAILABLE', `ApiPay.kz cancellation failed: ${err.message}`);
    }
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
}
