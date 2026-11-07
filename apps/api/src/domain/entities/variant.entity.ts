import { Sku } from '../value-objects/sku.vo.js';
import { Money } from '../value-objects/money.vo.js';
import type { ClothingSize } from '@india-trikotaj/shared';

export class ProductVariant {
  readonly id: string;
  readonly productId: string;
  readonly sku: Sku;
  readonly barcode: string;
  readonly size: ClothingSize;
  readonly colorRu: string;
  readonly colorKz: string;
  readonly colorHex: string;
  readonly price: Money;
  readonly oldPrice: Money | null;
  readonly weightGrams: number | null;
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(
    id: string,
    productId: string,
    sku: Sku,
    barcode: string,
    size: ClothingSize,
    colorRu: string,
    colorKz: string,
    colorHex: string,
    price: Money,
    oldPrice: Money | null = null,
    weightGrams: number | null = null,
    isActive: boolean = true,
    createdAt: Date = new Date(),
    updatedAt: Date = new Date()
  ) {
    if (!/^#[0-9a-fA-F]{6}$/.test(colorHex)) {
      throw new Error(`Invalid colorHex format: ${colorHex}`);
    }
    this.id = id;
    this.productId = productId;
    this.sku = sku;
    this.barcode = barcode;
    this.size = size;
    this.colorRu = colorRu;
    this.colorKz = colorKz;
    this.colorHex = colorHex;
    this.price = price;
    this.oldPrice = oldPrice;
    this.weightGrams = weightGrams;
    this.isActive = isActive;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}
