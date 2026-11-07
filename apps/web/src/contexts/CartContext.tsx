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

interface CartContextType {
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
}

const CartContext = createContext<CartContextType | undefined>(undefined);
const STORAGE_KEY = 'indiatrikotaj_cart';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [fulfillmentType, setFulfillmentType] = useState<FulfillmentType>('pickup');

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
  }, []);

  const saveItems = (nextItems: CartItem[]) => {
    setItems(nextItems);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextItems));
    }
  };

  const addItem = (newItem: Omit<CartItem, 'quantity'>, quantity = 1) => {
    const updated = addCartItem(items, newItem, quantity);
    saveItems(updated);
  };

  const updateQuantity = (variantId: string, quantity: number) => {
    const updated = updateCartItemQuantity(items, variantId, quantity);
    saveItems(updated);
  };

  const removeItem = (variantId: string) => {
    const updated = removeCartItem(items, variantId);
    saveItems(updated);
  };

  const clearCart = () => {
    saveItems([]);
  };

  const itemCount = items.reduce((sum: number, item: CartItem) => sum + item.quantity, 0);
  const { subtotalKzt, deliveryFeeKzt, totalKzt } = calculateCartTotals(items, fulfillmentType);

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
