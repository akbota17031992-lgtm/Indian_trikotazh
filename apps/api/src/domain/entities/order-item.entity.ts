import { Money } from '../value-objects/money.vo.js';

export interface OrderItemProductSnapshot {
  titleRu: string;
  titleKz: string;
  sku: string;
  size: string;
  colorRu: string;
  colorKz: string;
  imageUrl?: string | null;
}

export class OrderItem {
  readonly id: string;
  readonly orderId: string;
  readonly variantId: string;
  readonly productSnapshot: OrderItemProductSnapshot;
  readonly unitPrice: Money;
  readonly quantity: number;
  readonly reservedFromStoreId: string;
  readonly totalPrice: Money;

  constructor(
    id: string,
    orderId: string,
    variantId: string,
    productSnapshot: OrderItemProductSnapshot,
    unitPrice: Money,
    quantity: number,
    reservedFromStoreId: string
  ) {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new Error('Quantity must be positive integer');
    }
    if (quantity > 100) {
      throw new Error('Exceeded single order item maximum limit (100)');
    }
    this.id = id;
    this.orderId = orderId;
    this.variantId = variantId;
    this.productSnapshot = productSnapshot;
    this.unitPrice = unitPrice;
    this.quantity = quantity;
    this.reservedFromStoreId = reservedFromStoreId;
    this.totalPrice = unitPrice.multiply(quantity);
  }
}
