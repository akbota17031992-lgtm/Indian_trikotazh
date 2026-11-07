export type KaspiPaymentMode = 'KaspiGold' | 'KaspiRed' | 'KaspiKredit' | 'QR';

export interface CheckoutFormState {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  fulfillmentType: 'pickup' | 'courier';
  pickupStoreId: string;
  deliveryAddress?: {
    city: 'Алматы';
    districtRu: string;
    districtKz: string;
    street: string;
    building: string;
    apartment?: string;
  };
  customerComment?: string;
  paymentMode: KaspiPaymentMode;
}

export interface KaspiInvoiceState {
  paymentId: string;
  orderId: string;
  providerInvoiceId: string;
  status: 'pending' | 'processing' | 'paid' | 'expired' | 'cancelled' | 'failed';
  paymentMode: KaspiPaymentMode;
  amountKzt: number;
  phone?: string;
  qrTokenUrl?: string;
  qrImageUrl?: string;
  paymentUrl?: string;
  expiresAt: string;
  remainingSeconds: number;
  isExpired: boolean;
}

export interface OrderCreationResult {
  id: string;
  orderNumber: string;
  totalKzt: number;
  deliveryFeeKzt: number;
  subtotalKzt: number;
  status: string;
  paymentStatus: string;
}
