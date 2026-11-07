/**
 * India Trikotaj E2E Testing Suite — Interface Contracts
 * Strictly derived from PROJECT.md § Interface Contracts (1-4) & ORIGINAL_REQUEST.md
 */

export interface Store {
  id: string;
  name_ru: string;
  name_kz: string;
  slug: string;
  address_ru: string;
  address_kz: string;
  district: string;
  latitude: number;
  longitude: number;
  phone: string;
  schedule_ru: string;
  schedule_kz: string;
  is_active: boolean;
}

export interface Category {
  id: string;
  name_ru: string;
  name_kz: string;
  slug: string;
  parent_id?: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface Product {
  id: string;
  category_id: string;
  name_ru: string;
  name_kz: string;
  slug: string;
  description_ru: string;
  description_kz: string;
  material_ru: string;
  material_kz: string;
  season: 'all-season' | 'summer' | 'winter' | 'demi-season';
  gender: 'unisex' | 'men' | 'women' | 'kids';
  base_price_kzt: number;
  is_published: boolean;
  tags: string[];
}

export interface ProductVariant {
  id: string;
  product_id: string;
  sku: string;
  size: string;
  color_ru: string;
  color_kz: string;
  color_hex: string;
  price_kzt: number;
  is_active: boolean;
}

export interface ProductImage {
  id: string;
  product_id: string;
  url_thumbnail: string;
  url_card: string;
  url_full: string;
  is_primary: boolean;
  sort_order: number;
}

export interface StoreInventory {
  store_id: string;
  variant_id: string;
  quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  low_stock_threshold: number;
}

export interface DeliveryAddress {
  city: string;
  district: string;
  street: string;
  building: string;
  apartment?: string;
  postal_code?: string;
}

export type OrderFulfillmentType = 'pickup' | 'courier';
export type OrderStatus = 'pending_payment' | 'paid' | 'processing' | 'ready_for_pickup' | 'in_transit' | 'delivered' | 'cancelled' | 'refunded';
export type PaymentStatus = 'pending' | 'authorized' | 'captured' | 'failed' | 'refunded';

export interface OrderItem {
  variant_id: string;
  sku: string;
  product_name: string;
  size: string;
  color: string;
  quantity: number;
  unit_price_kzt: number;
  total_price_kzt: number;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id?: string;
  customer_phone: string;
  customer_name: string;
  fulfillment_type: OrderFulfillmentType;
  pickup_store_id?: string;
  delivery_address?: DeliveryAddress;
  items: OrderItem[];
  subtotal_kzt: number;
  delivery_fee_kzt: number;
  total_kzt: number;
  status: OrderStatus;
  payment_status: PaymentStatus;
  kaspi_invoice_id?: string;
  kaspi_payment_mode?: KaspiPaymentMode;
  created_at: string;
  updated_at: string;
}

export type KaspiPaymentMode = 'KaspiGold' | 'KaspiRed' | 'KaspiKredit' | 'QR';

export interface KaspiCreateInvoiceInput {
  orderId: string;
  amountKzt: number;
  phone: string;
  paymentMode: KaspiPaymentMode;
  description: string;
  returnUrl: string;
}

export interface KaspiCreateInvoiceOutput {
  paymentId: string;
  orderId: string;
  providerInvoiceId: string;
  status: 'processing' | 'pending';
  qrTokenUrl?: string;
  qrImageUrl?: string;
  paymentUrl?: string;
  isMock: boolean;
  expiresAt: string;
}

export interface KaspiWebhookCallback {
  invoiceId: string;
  orderId: string;
  amount: number;
  status: 'SUCCESS' | 'FAILED' | 'REFUNDED';
  transactionId: string;
  paymentMethod: string;
  kaspiSourceType?: 'GOLD' | 'RED' | 'LOAN' | 'BUSINESSACCOUNT';
  isSandbox?: boolean;
}

export interface ProcessedProductDraft {
  metadata: {
    name_ru: string;
    name_kz: string;
    description_ru: string;
    description_kz: string;
    category: string;
    subcategory: string;
    colors: string[];
    material: string;
    season: string;
    gender: string;
    tags: string[];
    suggestedPriceKzt: number;
  };
  images: {
    thumbnail: Buffer | Uint8Array;
    card: Buffer | Uint8Array;
    full: Buffer | Uint8Array;
  };
  variants: Array<{
    size: string;
    color: string;
    sku: string;
    priceKzt: number;
  }>;
}

/**
 * Format currency strictly in Kazakhstani Tenge (KZT, ₸).
 * Rules:
 * - Integer numbers only (no fractional tiyns in modern Kazakhstan retail)
 * - Space as thousands separator
 * - Symbol ₸ (\u20B8) at the end
 * - Example: 14990 -> "14 990 ₸", 0 -> "0 ₸"
 */
export function formatKZT(amount: number): string {
  if (!Number.isFinite(amount) || amount === null || amount === undefined) {
    return '0 ₸';
  }
  const rounded = Math.round(amount);
  const formatted = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${formatted} ₸`;
}

/**
 * Validate Kazakhstan phone numbers.
 * Supported formats:
 * - +7 (701) 123-45-67
 * - +77011234567
 * - 87011234567
 * - +7 777 000 00 00
 * Area/carrier code must start with 7 (mobile prefixes: 700-709, 747, 771, 775, 776, 777, 778, etc.)
 */
export function validateKazakhstanPhone(phone: string): boolean {
  if (!phone || typeof phone !== 'string') return false;
  const digits = phone.replace(/\D/g, '');
  if (digits.length !== 11) return false;
  if (digits[0] !== '7' && digits[0] !== '8') return false;
  // Carrier prefix check: Kazakhstan mobile / landline codes
  const prefix = digits.substring(1, 4);
  const validPrefixes = [
    '700', '701', '702', '705', '706', '707', '708', '709',
    '747', '750', '751', '760', '761', '762', '763', '764',
    '771', '775', '776', '777', '778',
    '717', '727' // Astana & Almaty landlines
  ];
  return validPrefixes.includes(prefix);
}

/**
 * Standard Result / Either type for robust domain error handling
 */
export type Result<T, E = Error> =
  | { success: true; value: T; error?: never }
  | { success: false; error: E; value?: never };

export function ok<T>(value: T): Result<T, never> {
  return { success: true, value };
}

export function fail<E>(error: E): Result<never, E> {
  return { success: false, error };
}
