/**
 * SKU (Stock Keeping Unit) Value Object
 */
export class Sku {
  readonly value: string;

  constructor(raw: string) {
    const trimmed = (raw || '').trim().toUpperCase();
    if (!trimmed || trimmed.length < 3) {
      throw new Error(`Invalid SKU format: ${raw}`);
    }
    this.value = trimmed;
  }

  static from(raw: string): Sku {
    return new Sku(raw);
  }

  equals(other: Sku): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  toJSON(): string {
    return this.value;
  }
}
