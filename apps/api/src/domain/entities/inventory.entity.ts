import { Result, ok, err } from '../types/result.js';
import { InsufficientStockError, ValidationError } from '../errors/domain-errors.js';

export class StoreInventory {
  readonly id: string;
  readonly storeId: string;
  readonly variantId: string;
  quantity: number;
  reservedQuantity: number;
  readonly lowStockThreshold: number;
  readonly updatedAt: Date;

  constructor(
    id: string,
    storeId: string,
    variantId: string,
    quantity: number,
    reservedQuantity: number,
    lowStockThreshold: number = 3,
    updatedAt: Date = new Date()
  ) {
    if (quantity < 0) throw new Error('Quantity cannot be negative');
    if (reservedQuantity < 0) throw new Error('Reserved quantity cannot be negative');
    if (reservedQuantity > quantity) {
      throw new Error(`Reserved quantity (${reservedQuantity}) cannot exceed total quantity (${quantity})`);
    }
    this.id = id;
    this.storeId = storeId;
    this.variantId = variantId;
    this.quantity = quantity;
    this.reservedQuantity = reservedQuantity;
    this.lowStockThreshold = lowStockThreshold;
    this.updatedAt = updatedAt;
  }

  get availableQuantity(): number {
    return this.quantity - this.reservedQuantity;
  }

  canReserve(qty: number): boolean {
    return qty > 0 && this.availableQuantity >= qty;
  }

  reserve(qty: number): Result<StoreInventory, InsufficientStockError> {
    if (!this.canReserve(qty)) {
      return err(new InsufficientStockError(this.storeId, this.variantId, qty, this.availableQuantity));
    }
    this.reservedQuantity += qty;
    return ok(this);
  }

  release(qty: number): Result<StoreInventory, ValidationError> {
    if (qty <= 0) {
      return err(new ValidationError('Release quantity must be positive', 'quantity'));
    }
    this.reservedQuantity = Math.max(0, this.reservedQuantity - qty);
    return ok(this);
  }

  commitDeduction(qty: number): Result<StoreInventory, InsufficientStockError> {
    if (qty > this.reservedQuantity || qty > this.quantity) {
      return err(new InsufficientStockError(this.storeId, this.variantId, qty, this.availableQuantity));
    }
    this.quantity -= qty;
    this.reservedQuantity -= qty;
    return ok(this);
  }

  isLowStock(): boolean {
    return this.availableQuantity <= this.lowStockThreshold;
  }
}
