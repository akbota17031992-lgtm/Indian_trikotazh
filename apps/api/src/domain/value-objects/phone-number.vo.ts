import {
  validateKazakhstanPhone,
  formatKazakhstanPhone
} from '@india-trikotaj/shared';

/**
 * KazakhstanPhoneNumber Value Object
 * Validates Kazakhstan mobile/landline numbers and formats to E.164 (+77xxxxxxxxx).
 */
export class KazakhstanPhoneNumber {
  readonly digits: string; // 11 digits starting with 7 (e.g. 77011234567)

  constructor(raw: string) {
    const cleaned = (raw || '').replace(/\D/g, '');
    if (cleaned.length !== 11 || (cleaned[0] !== '7' && cleaned[0] !== '8')) {
      throw new Error(`Invalid Kazakhstan phone number: ${raw}`);
    }
    this.digits = '7' + cleaned.slice(1);
    if (!validateKazakhstanPhone(this.toE164())) {
      throw new Error(`Phone number prefix is not recognized in Kazakhstan: ${raw}`);
    }
  }

  static from(raw: string): KazakhstanPhoneNumber {
    return new KazakhstanPhoneNumber(raw);
  }

  static isValid(raw: string): boolean {
    try {
      new KazakhstanPhoneNumber(raw);
      return true;
    } catch {
      return false;
    }
  }

  toE164(): string {
    return `+${this.digits}`;
  }

  format(): string {
    return formatKazakhstanPhone(this.toE164());
  }

  equals(other: KazakhstanPhoneNumber): boolean {
    return this.digits === other.digits;
  }

  toString(): string {
    return this.toE164();
  }

  toJSON(): string {
    return this.toE164();
  }
}
