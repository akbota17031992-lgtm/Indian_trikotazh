import { formatKZT } from '@india-trikotaj/shared';

/**
 * Money Value Object
 * Enforces non-negative whole integer Kazakhstani Tenge amounts (₸). Zero floating-point tiyn.
 */
export class Money {
  readonly amountKzt: number;

  constructor(amountKzt: number) {
    if (!Number.isInteger(amountKzt)) {
      throw new Error(`Money amount must be a whole integer: ${amountKzt}`);
    }
    if (amountKzt < 0) {
      throw new Error(`Money amount cannot be negative: ${amountKzt}`);
    }
    this.amountKzt = amountKzt;
  }

  static zero(): Money {
    return new Money(0);
  }

  static from(amountKzt: number): Money {
    return new Money(amountKzt);
  }

  add(other: Money): Money {
    return new Money(this.amountKzt + other.amountKzt);
  }

  subtract(other: Money): Money {
    const diff = this.amountKzt - other.amountKzt;
    if (diff < 0) {
      throw new Error(`Insufficient funds: ${this.amountKzt} - ${other.amountKzt} < 0`);
    }
    return new Money(diff);
  }

  multiply(factor: number): Money {
    if (factor < 0) {
      throw new Error(`Multiplier factor cannot be negative: ${factor}`);
    }
    return new Money(Math.round(this.amountKzt * factor));
  }

  equals(other: Money): boolean {
    return this.amountKzt === other.amountKzt;
  }

  isGreaterThan(other: Money): boolean {
    return this.amountKzt > other.amountKzt;
  }

  isLessThan(other: Money): boolean {
    return this.amountKzt < other.amountKzt;
  }

  format(): string {
    return formatKZT(this.amountKzt);
  }

  toJSON(): number {
    return this.amountKzt;
  }
}
