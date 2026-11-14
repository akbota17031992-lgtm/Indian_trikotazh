import React from 'react';
import type { Metadata } from 'next';
import { AiStylistClient } from './AiStylistClient';

export const metadata: Metadata = {
  title: 'ИИ-Стилист по фото | Индийский Трикотаж Алматы',
  description:
    'Персональный подбор индийского трикотажа по фото и цветотипу внешности с проверкой наличия размеров в 16 филиалах Алматы.',
};

export default function AiStylistPage() {
  return <AiStylistClient />;
}

