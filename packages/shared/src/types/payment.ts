export type KaspiPaymentMode = 'KaspiGold' | 'KaspiRed' | 'KaspiKredit' | 'QR';

export type KaspiSourceType =
  'GOLD' | 'RED' | 'LOAN' | 'BUSINESSACCOUNT' | 'BANKINTEGRATIONACCOUNT';

export type KaspiInvoiceStatus =
  'pending' | 'processing' | 'paid' | 'cancelled' | 'expired' | 'refunded' | 'failed';

export interface KaspiCreateInvoiceInput {
  orderId: string;
  amountKzt: number;
  /** Primary phone number according to PROJECT.md line 58 contract */
  phone?: string;
  /** Legacy / alias phone field used in existing codebase */
  customerPhone?: string;
  /** Normalized phone field / getter helper */
  readonly normalizedPhone?: string;
  paymentMode: KaspiPaymentMode;
  description: string;
  returnUrl: string;
  simulate?: boolean;
}

export function getKaspiInvoicePhone(input: KaspiCreateInvoiceInput): string {
  return input.normalizedPhone || input.phone || input.customerPhone || '';
}

export interface KaspiCreateInvoiceOutput {
  paymentId: string;
  orderId: string;
  providerInvoiceId: string;
  status: KaspiInvoiceStatus;
  paymentUrl: string;
  qrTokenUrl: string;
  qrImageUrl: string;
  qrExpiresAt: string;
  isMock: boolean;
}

export interface KaspiWebhookInvoicePayload {
  id: string;
  external_order_id: string;
  amount: number;
  status: 'processing' | 'paid' | 'cancelled' | 'expired' | 'refunded' | 'failed';
  phone_number?: string;
  kaspi_source_type?: KaspiSourceType;
  paid_at?: string;
  created_at: string;
  is_sandbox?: boolean;
}

export interface KaspiWebhookPayload {
  event: 'invoice.status_changed' | 'invoice.qr_scanned' | 'invoice.refunded';
  invoice: KaspiWebhookInvoicePayload;
  signature: string;
  timestamp: string;
}

/**
 * Direct webhook callback payload matching ApiPay.kz contract in PROJECT.md line 60.
 */
export interface KaspiDirectWebhookPayload {
  invoiceId: string;
  orderId: string;
  amount: number;
  status:
    | 'SUCCESS'
    | 'FAILED'
    | 'REFUNDED'
    | 'processing'
    | 'paid'
    | 'cancelled'
    | 'expired'
    | 'refunded'
    | 'failed';
  transactionId?: string;
  paymentMethod?: string;
  kaspiSourceType?: KaspiSourceType;
  isSandbox?: boolean;
}

/**
 * Kaspi webhook payload interface alias to satisfy PROJECT.md interface contract line 52.
 */
export type KaspiWebhookCallback = KaspiWebhookPayload;

export interface KaspiMockActionInput {
  invoiceId: string;
  action: 'complete' | 'cancel' | 'expire' | 'refund';
  paymentMode?: KaspiPaymentMode;
}
