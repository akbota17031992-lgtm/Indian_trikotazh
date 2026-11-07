import React from 'react';
import type { Metadata } from 'next';
import { CATALOG_PRODUCTS } from '../../lib/catalog-data';
import { CatalogPageClient } from './CatalogPageClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Каталог | Индийский Трикотаж Алматы',
  description:
    'Полный каталог качественного индийского трикотажа: футболки, халаты, пижамы, термобелье, детская одежда. 16 филиалов в Алматы.',
};

interface CatalogPageProps {
  searchParams?: Promise<{
    category?: string;
    gender?: string;
    season?: string;
  }>;
}

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const resolvedParams = searchParams ? await searchParams : {};
  const category = resolvedParams?.category;

  return (
    <CatalogPageClient
      initialProducts={CATALOG_PRODUCTS}
      initialCategory={category}
    />
  );
}
