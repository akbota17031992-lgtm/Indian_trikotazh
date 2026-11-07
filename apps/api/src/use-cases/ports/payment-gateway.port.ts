import type { KaspiPaymentMode } from '@india-trikotaj/shared';

export interface CreateInvoiceParams {
  orderId: string;
  amountKzt: number;
  phone?: string;
  paymentMode: KaspiPaymentMode;
  description: string;
  returnUrl?: string;
  idempotencyKey?: string;
}

export interface PaymentInvoiceResult {
  statusCode?: number;
  paymentId: string;
  orderId: string;
  providerInvoiceId: string;
  status: string;
  qrTokenUrl?: string;
  qrImageUrl?: string;
  paymentUrl?: string;
  phone?: string;
  paymentMode?: KaspiPaymentMode;
  isMock: boolean;
  expiresAt: string;
}

export interface IPaymentGateway {
  createInvoice(params: CreateInvoiceParams): Promise<PaymentInvoiceResult>;
  verifyWebhookSignature(rawBody: Buffer | string, signatureHeader: string): boolean;
  cancelInvoice?(invoiceId: string): Promise<void>;
}
