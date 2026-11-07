import React from 'react';
import type { Metadata } from 'next';
import { StoresPageClient } from './StoresPageClient';

export const metadata: Metadata = {
  title: 'Магазины в Алматы | 16 филиалов | Индийский Трикотаж',
  description:
    'Адреса, графики работы и телефоны 16 филиалов сети «Индийский Трикотаж» в Алматы: MEGA Alma-Ata, Dostyk Plaza, Grand Park, Moskva Metropolitan, ADK и др.',
};

export default function StoresPage() {
  return <StoresPageClient />;
}
