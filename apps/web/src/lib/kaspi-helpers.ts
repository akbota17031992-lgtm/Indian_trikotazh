/**
 * Pure domain logic for Kaspi Pay countdown, installment calculations, and idempotency.
 */

/**
 * Formats a remaining seconds countdown into strictly padded mm:ss format.
 * Clamps negative or non-finite values safely to 00:00.
 */
export function formatCountdown(seconds: number): string {
  const safeSecs = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
  const m = Math.floor(safeSecs / 60);
  const s = safeSecs % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/**
 * Calculates whole Tenge Kaspi Red installment (0-0-3: 3 months equal payments).
 * Produces whole integer KZT without tiyn drift.
 */
export function calculateKaspiRedInstallment(totalKzt: number): number {
  if (!Number.isFinite(totalKzt) || totalKzt <= 0) return 0;
  return Math.round(totalKzt / 3);
}

/**
 * Calculates whole Tenge Kaspi Kredit installment (0-0-12: 12 months equal payments).
 * Produces whole integer KZT without tiyn drift.
 */
export function calculateKaspiKreditMonthly(totalKzt: number): number {
  if (!Number.isFinite(totalKzt) || totalKzt <= 0) return 0;
  return Math.round(totalKzt / 12);
}

/**
 * Truncates push invoice description to the Kaspi protocol limit (max 60 characters).
 */
export function truncateKaspiDescription(description: string, maxLength = 60): string {
  if (!description) return '';
  return description.slice(0, maxLength);
}

/**
 * Creates an idempotent debounce guard to protect against rapid double-clicks on payment submission.
 */
export function createDebounceGuard(): {
  execute: <T>(fn: () => T) => T | undefined;
  isLocked: () => boolean;
  reset: () => void;
} {
  let locked = false;
  return {
    execute<T>(fn: () => T): T | undefined {
      if (locked) return undefined;
      locked = true;
      return fn();
    },
    isLocked(): boolean {
      return locked;
    },
    reset(): void {
      locked = false;
    },
  };
}
