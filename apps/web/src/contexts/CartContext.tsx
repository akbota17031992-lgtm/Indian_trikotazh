'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { formatKZT } from '@india-trikotaj/shared';
import {
  calculateCartTotals,
  updateCartItemQuantity,
  addCartItem,
  removeCartItem,
} from '../lib/cart-helpers';

export interface CartItem {
  variantId: string;
  productId: string;
  titleRu: string;
  titleKz: string;
  sku: string;
  size: string;
  colorRu: string;
  colorKz: string;
  colorHex?: string;
  priceKzt: number;
  oldPriceKzt?: number;
  imageUrl?: string;
  quantity: number;
}

export type FulfillmentType = 'pickup' | 'courier';

export interface CartContextType {
  cart: CartItem[];
  items: CartItem[]; // alias for compatibility
  itemCount: number;
  subtotalKzt: number;
  deliveryFeeKzt: number;
  totalKzt: number;
  fulfillmentType: FulfillmentType;
  setFulfillmentType: (type: FulfillmentType) => void;
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  removeItem: (variantId: string) => void;
  clearCart: () => void;
  formattedSubtotal: string;
  formattedDeliveryFee: string;
  formattedTotal: string;

  // Selection & Batch Operations
  selectedVariantIds: string[];
  isAllSelected: boolean;
  toggleSelectItem: (variantId: string) => void;
  selectAll: (selected: boolean) => void;
  removeSelectedItems: () => void;
  selectedItems: CartItem[];
  selectedItemCount: number;
  selectedSubtotalKzt: number;
  selectedDeliveryFeeKzt: number;
  selectedTotalKzt: number;
  formattedSelectedSubtotal: string;
  formattedSelectedDeliveryFee: string;
  formattedSelectedTotal: string;
}

const CartContext = createContext<CartContextType | undefined>(undefined);
const STORAGE_KEY = 'indiatrikotaj_cart';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [fulfillmentType, setFulfillmentType] = useState<FulfillmentType>('pickup');
  const [selectedVariantIds, setSelectedVariantIds] = useState<string[]>([]);
  const [hasInitializedSelection, setHasInitializedSelection] = useState(false);

  // Load from localStorage on mount & listen for cross-tab updates (B23.2)
  useEffect(() => {
    const loadCart = () => {
      try {
        if (typeof localStorage === 'undefined') return;
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            setItems(parsed);
            if (!hasInitializedSelection) {
              setSelectedVariantIds(parsed.map((i: CartItem) => i.variantId));
              setHasInitializedSelection(true);
            }
          }
        }
      } catch (err) {
        console.error('Failed to parse cart storage:', err);
      }
    };

    loadCart();

    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        loadCart();
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorage);
      return () => window.removeEventListener('storage', handleStorage);
    }
  }, [hasInitializedSelection]);

  const saveItems = (nextItems: CartItem[]) => {
    setItems(nextItems);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextItems));
    }
  };

  const addItem = (newItem: Omit<CartItem, 'quantity'>, quantity = 1) => {
    const updated = addCartItem(items, newItem, quantity);
    saveItems(updated);
    setSelectedVariantIds(prev => Array.from(new Set([...prev, newItem.variantId])));
  };

  const updateQuantity = (variantId: string, quantity: number) => {
    const updated = updateCartItemQuantity(items, variantId, quantity);
    saveItems(updated);
  };

  const removeItem = (variantId: string) => {
    const updated = removeCartItem(items, variantId);
    saveItems(updated);
    setSelectedVariantIds(prev => prev.filter(id => id !== variantId));
  };

  const clearCart = () => {
    saveItems([]);
    setSelectedVariantIds([]);
  };

  const toggleSelectItem = (variantId: string) => {
    setSelectedVariantIds(prev =>
      prev.includes(variantId) ? prev.filter(id => id !== variantId) : [...prev, variantId]
    );
  };

  const selectAll = (selected: boolean) => {
    setSelectedVariantIds(selected ? items.map(i => i.variantId) : []);
  };

  const removeSelectedItems = () => {
    const remaining = items.filter(i => !selectedVariantIds.includes(i.variantId));
    saveItems(remaining);
    setSelectedVariantIds([]);
  };

  const itemCount = items.reduce((sum: number, item: CartItem) => sum + item.quantity, 0);
  const { subtotalKzt, deliveryFeeKzt, totalKzt } = calculateCartTotals(items, fulfillmentType);

  // Selected totals
  const isAllSelected = items.length > 0 && selectedVariantIds.length === items.length;
  const selectedItems = items.filter(i => selectedVariantIds.includes(i.variantId));
  const selectedItemCount = selectedItems.reduce((sum: number, item: CartItem) => sum + item.quantity, 0);
  const selectedSubtotalKzt = selectedItems.reduce(
    (sum: number, item: CartItem) => sum + item.priceKzt * item.quantity,
    0
  );
  const selectedDeliveryFeeKzt =
    fulfillmentType === 'courier'
      ? selectedSubtotalKzt > 15000 || selectedSubtotalKzt === 0
        ? 0
        : 1500
      : 0;
  const selectedTotalKzt = selectedSubtotalKzt + selectedDeliveryFeeKzt;

  return (
    <CartContext.Provider
      value={{
        cart: items,
        items,
        itemCount,
        subtotalKzt,
        deliveryFeeKzt,
        totalKzt,
        fulfillmentType,
        setFulfillmentType,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        formattedSubtotal: formatKZT(subtotalKzt),
        formattedDeliveryFee: formatKZT(deliveryFeeKzt),
        formattedTotal: formatKZT(totalKzt),

        // Selection & Batch Operations
        selectedVariantIds,
        isAllSelected,
        toggleSelectItem,
        selectAll,
        removeSelectedItems,
        selectedItems,
        selectedItemCount,
        selectedSubtotalKzt,
        selectedDeliveryFeeKzt,
        selectedTotalKzt,
        formattedSelectedSubtotal: formatKZT(selectedSubtotalKzt),
        formattedSelectedDeliveryFee: formatKZT(selectedDeliveryFeeKzt),
        formattedSelectedTotal: formatKZT(selectedTotalKzt),
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used within CartProvider');
  }
  return ctx;
}
