/**
 * Pure domain logic for shopping cart operations, calculations, and boundaries.
 */

export interface CartCalculationItem {
  priceKzt: number;
  quantity: number;
}

export type CartFulfillmentType = 'pickup' | 'courier';

export interface CartTotals {
  subtotalKzt: number;
  deliveryFeeKzt: number;
  totalKzt: number;
}

/**
 * Validates cart item quantity: must be a strictly positive integer (> 0).
 * Throws an Error with message 'invalid_quantity' if invalid.
 */
export function validateQuantity(qty: number): void {
  if (!Number.isInteger(qty) || qty <= 0) {
    throw new Error('invalid_quantity');
  }
}

/**
 * Calculates cart subtotal, delivery fee, and grand total in KZT.
 * Store pickup is 0 ₸, courier delivery in Almaty is 1 500 ₸.
 */
export function calculateCartTotals(
  items: CartCalculationItem[],
  fulfillmentType: CartFulfillmentType = 'pickup'
): CartTotals {
  const subtotalKzt = items.reduce((sum, item) => sum + item.priceKzt * item.quantity, 0);
  const deliveryFeeKzt = fulfillmentType === 'courier' ? 1500 : 0;
  const totalKzt = subtotalKzt + deliveryFeeKzt;
  return { subtotalKzt, deliveryFeeKzt, totalKzt };
}

/**
 * Updates item quantity in an items array. If quantity <= 0, item is removed.
 */
export function updateCartItemQuantity<T extends { variantId: string; quantity: number }>(
  items: T[],
  variantId: string,
  quantity: number
): T[] {
  if (quantity <= 0) {
    return items.filter(i => i.variantId !== variantId);
  }
  return items.map(i => (i.variantId === variantId ? { ...i, quantity } : i));
}

/**
 * Adds an item to the cart or increments existing quantity if variant already exists.
 */
export function addCartItem<T extends { variantId: string; quantity: number }>(
  items: T[],
  newItem: Omit<T, 'quantity'>,
  quantity = 1
): T[] {
  validateQuantity(quantity);
  const existingIndex = items.findIndex(i => i.variantId === newItem.variantId);
  if (existingIndex > -1) {
    return items.map((item, idx) =>
      idx === existingIndex ? { ...item, quantity: item.quantity + quantity } : item
    );
  }
  return [...items, { ...newItem, quantity } as T];
}

/**
 * Removes an item by variantId.
 */
export function removeCartItem<T extends { variantId: string }>(
  items: T[],
  variantId: string
): T[] {
  return items.filter(i => i.variantId !== variantId);
}
