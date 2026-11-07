import { Money } from '../value-objects/money.vo.js';

export class Promotion {
  readonly id: string;
  readonly code: string;
  readonly titleRu: string;
  readonly titleKz: string;
  readonly discountType: 'percentage' | 'fixed_amount';
  readonly discountValue: number;
  readonly minOrder: Money;
  readonly maxDiscount: Money | null;
  readonly validFrom: Date;
  readonly validTo: Date;
  readonly usageLimit: number | null;
  usageCount: number;
  isActive: boolean;

  constructor(
    id: string,
    code: string,
    titleRu: string,
    titleKz: string,
    discountType: 'percentage' | 'fixed_amount',
    discountValue: number,
    minOrder: Money,
    maxDiscount: Money | null = null,
    validFrom: Date = new Date(),
    validTo: Date = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    usageLimit: number | null = null,
    usageCount: number = 0,
    isActive: boolean = true
  ) {
    if (code !== code.toUpperCase()) {
      throw new Error('Promotion code must be uppercase');
    }
    this.id = id;
    this.code = code;
    this.titleRu = titleRu;
    this.titleKz = titleKz;
    this.discountType = discountType;
    this.discountValue = discountValue;
    this.minOrder = minOrder;
    this.maxDiscount = maxDiscount;
    this.validFrom = validFrom;
    this.validTo = validTo;
    this.usageLimit = usageLimit;
    this.usageCount = usageCount;
    this.isActive = isActive;
  }

  isValidNow(now = new Date()): boolean {
    if (!this.isActive) return false;
    if (now < this.validFrom || now > this.validTo) return false;
    if (this.usageLimit !== null && this.usageCount >= this.usageLimit) return false;
    return true;
  }

  calculateDiscount(subtotal: Money): Money {
    if (subtotal.isLessThan(this.minOrder)) {
      return Money.zero();
    }
    let discountKzt = 0;
    if (this.discountType === 'percentage') {
      discountKzt = Math.round((subtotal.amountKzt * this.discountValue) / 100);
      if (this.maxDiscount && discountKzt > this.maxDiscount.amountKzt) {
        discountKzt = this.maxDiscount.amountKzt;
      }
    } else {
      discountKzt = Math.min(this.discountValue, subtotal.amountKzt);
    }
    return new Money(discountKzt);
  }

  incrementUsage(): void {
    this.usageCount += 1;
  }
}
