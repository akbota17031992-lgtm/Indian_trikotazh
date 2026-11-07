import React from 'react';
import type { Metadata } from 'next';
import { CheckoutForm } from '../../components/checkout/CheckoutForm';

export const metadata: Metadata = {
  title: 'Оформление заказа | Индийский Трикотаж',
  description:
    'Оформление заказа с быстрой курьерской доставкой по Алматы или самовывозом из 16 филиалов. Оплата через Kaspi Pay.',
};

export default function CheckoutPage() {
  return <CheckoutForm />;
}
