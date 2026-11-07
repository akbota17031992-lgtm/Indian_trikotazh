'use client';

import React, { useState, useEffect } from 'react';
import { notFound, useParams } from 'next/navigation';
import { CATALOG_PRODUCTS, type FullProductDetail } from '../../../lib/catalog-data';
import { getAllStoreProducts } from '../../../lib/products-store';
import { ProductDetailClient } from '../../../components/catalog/ProductDetailClient';

export default function ProductPage() {
  const params = useParams();
  const rawSlug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug;
  const slug = (rawSlug || '').toLowerCase().trim();

  const [product, setProduct] = useState<FullProductDetail | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const all = getAllStoreProducts();
    const found = all.find(p => p.slug.toLowerCase() === slug || p.id === slug);
    if (found) {
      setProduct(found);
    }
    setIsReady(true);
  }, [slug]);

  if (!isReady) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-amber-600 font-bold">
        Загрузка товара...
      </div>
    );
  }

  if (!product) {
    notFound();
  }

  return <ProductDetailClient product={product} />;
}
