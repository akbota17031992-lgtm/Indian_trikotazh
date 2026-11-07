import type { StoreSummary } from './store.js';

export type DeliveryType = 'pickup_from_store' | 'courier';

export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'processing'
  | 'ready_for_pickup'
  | 'shipping'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type PaymentStatus = 'pending' | 'authorized' | 'paid' | 'failed' | 'refunded';

export type PaymentMethod =
  | 'kaspi_gold'
  | 'kaspi_red'
  | 'kaspi_kredit'
  | 'cash_on_delivery'
  | 'card_on_delivery'
  | 'kaspi_qr';

export interface DeliveryAddress {
  city: 'Алматы';
  districtRu: string;
  districtKz: string;
  street: string;
  building: string;
  apartment?: string | null;
  floor?: string | null;
  entrance?: string | null;
  intercom?: string | null;
  deliveryNotes?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface OrderItemSnapshot {
  titleRu: string;
  titleKz: string;
  sku: string;
  size: string;
  colorRu: string;
  colorKz: string;
  imageUrl?: string | null;
}

export interface OrderItem {
  id: string;
  orderId: string;
  variantId: string;
  productSnapshot: OrderItemSnapshot;
  unitPriceKzt: number;
  quantity: number;
  totalKzt: number;
  reservedFromStoreId: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId?: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  status: OrderStatus;
  deliveryType: DeliveryType;
  storeId?: string | null;
  pickupStore?: StoreSummary | null;
  shippingAddress?: DeliveryAddress | null;
  items: OrderItem[];
  subtotalKzt: number;
  discountKzt: number;
  deliveryFeeKzt: number;
  totalKzt: number;
  promotionId?: string | null;
  promotionCode?: string | null;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  kaspiInvoiceId?: string | null;
  kaspiTransactionId?: string | null;
  kaspiPaymentData: Record<string, unknown>;
  customerComment?: string | null;
  adminNotes?: string | null;
  createdAt: string;
  updatedAt: string;
}
