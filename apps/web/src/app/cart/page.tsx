import React from 'react';
import type { Metadata } from 'next';
import { CartPageClient } from './CartPageClient';

export const metadata: Metadata = {
  title: 'Корзина | Индийский Трикотаж Алматы',
  description: 'Корзина покупок качественного индийского трикотажа с возможностью самовывоза из 16 ТРЦ или доставки по Алматы.',
};

export default function CartPage() {
  return <CartPageClient />;
}
