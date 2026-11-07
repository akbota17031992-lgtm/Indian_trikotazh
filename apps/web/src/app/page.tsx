import React from 'react';
import type { Metadata } from 'next';
import { HomePageClient } from './HomePageClient';

export const metadata: Metadata = {
  title: 'Индийский Трикотаж | Үнді Трикотажы — Магазины в Алматы',
  description:
    'Сеть розничных магазинов качественного трикотажа в Алматы. 16 филиалов в ТРЦ (MEGA Alma-Ata, Dostyk Plaza, Grand Park), 100% индийский хлопок, Kaspi QR, Kaspi Red 0-0-3.',
};

export default function HomePage() {
  return <HomePageClient />;
}
