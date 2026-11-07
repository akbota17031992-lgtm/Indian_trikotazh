'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShoppingBag, Star, Check, Sparkles } from 'lucide-react';
import { formatKZT } from '@india-trikotaj/shared';
import { useLocale } from '../../contexts/LocaleContext';
import { useBranch } from '../../contexts/BranchContext';
import { useCart } from '../../contexts/CartContext';
import { Card, CardContent, Button, Badge } from '@india-trikotaj/ui';

export interface CatalogProductItem {
  id: string;
  category_id?: string;
  slug: string;
  nameRu: string;
  nameKz: string;
  descriptionRu?: string;
  descriptionKz?: string;
  basePriceKzt: number;
  categorySlug: string;
  categoryNameRu: string;
  categoryNameKz: string;
  imageUrl?: string;
  materialRu?: string;
  materialKz?: string;
  defaultVariantId: string;
  defaultSize: string;
  defaultColorRu: string;
  defaultColorKz: string;
  stockByStore: Record<string, number>;
}

interface ProductCardProps {
  product: CatalogProductItem;
}

export function ProductCard({ product }: ProductCardProps) {
  const { getBilingual, locale, t } = useLocale();
  const { selectedBranch } = useBranch();
  const { addItem } = useCart();
  const [isAdded, setIsAdded] = useState(false);

  const title = getBilingual(product.nameKz, product.nameRu);
  const currentBranchQty = product.stockByStore[selectedBranch.id] ?? 0;
  const currentBranchName = locale === 'kz' ? selectedBranch.nameKz : selectedBranch.nameRu;
  const monthlyRed = Math.round(product.basePriceKzt / 3);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(
      {
        variantId: product.defaultVariantId,
        productId: product.id,
        titleRu: product.nameRu,
        titleKz: product.nameKz,
        sku: `IT-${product.id.slice(0, 4)}-${product.defaultSize}`,
        size: product.defaultSize,
        colorRu: product.defaultColorRu,
        colorKz: product.defaultColorKz,
        priceKzt: product.basePriceKzt,
        imageUrl: product.imageUrl,
      },
      1
    );
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1500);
  };

  return (
    <Card className="group overflow-hidden rounded-2xl border border-neutral-200/80 hover:border-red-500/50 hover:shadow-xl transition-all duration-200 flex flex-col h-full bg-white relative">
      {/* Top Media Anchor */}
      <Link href={`/catalog/${product.slug}`} className="block relative aspect-[4/5] bg-neutral-50 overflow-hidden">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-neutral-100">
            <span className="text-3xl font-extrabold text-neutral-300">IT</span>
          </div>
        )}

        {/* Kaspi Red Badge (Top-left) */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1 bg-[#F14635] text-white text-[11px] font-extrabold px-2 py-0.5 rounded-md shadow-sm">
          <span>0-0-3</span>
        </div>

        {/* Bonus Points Badge (Top-right) */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm">
          <Sparkles className="w-3 h-3" />
          <span>+5% бонусов</span>
        </div>
      </Link>

      <CardContent className="p-3.5 flex-1 flex flex-col justify-between space-y-2.5">
        <div>
          {/* Kaspi Price & Installment Block */}
          <div className="space-y-0.5 mb-1.5">
            <div className="text-lg font-black text-neutral-900 tracking-tight">
              {formatKZT(product.basePriceKzt)}
            </div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-50 text-[#F14635] font-bold text-xs">
              <span>{formatKZT(monthlyRed)}</span>
              <span className="text-[10px] font-medium text-neutral-500">× 3 мес</span>
            </div>
          </div>

          {/* Product Title */}
          <Link href={`/catalog/${product.slug}`}>
            <h3 className="font-medium text-xs sm:text-sm text-neutral-800 line-clamp-2 hover:text-[#F14635] transition-colors leading-snug">
              {title}
            </h3>
          </Link>

          {/* Rating & Reviews (Kaspi style) */}
          <div className="flex items-center gap-1.5 pt-1.5 text-xs text-neutral-500">
            <div className="flex items-center text-amber-500">
              <Star className="w-3.5 h-3.5 fill-amber-400 stroke-amber-400" />
              <span className="font-bold text-neutral-900 text-xs ml-1">4.9</span>
            </div>
            <span>•</span>
            <span className="text-[11px] text-neutral-500">(18 отзывов)</span>
          </div>
        </div>

        {/* Store & Cart Section (Kaspi Layout) */}
        <div className="pt-2.5 border-t border-neutral-100 space-y-2">
          {/* Real-time Branch Stock indicator label */}
          <div className="text-[11px] font-semibold flex items-center gap-1.5 min-h-[18px]">
            {currentBranchQty > 0 ? (
              <span className="text-emerald-700 flex items-center gap-1.5 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="truncate">В наличии: {currentBranchName}</span>
              </span>
            ) : (
              <span className="text-neutral-400">Под заказ 1–2 дня</span>
            )}
          </div>

          {/* Full-width Kaspi CTA Button */}
          <Button
            type="button"
            size="sm"
            onClick={handleQuickAdd}
            className={`w-full h-9 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm ${
              isAdded
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-[#F14635] hover:bg-[#D93828] active:bg-[#B92A1C] text-white'
            }`}
            title={t('addToCart')}
          >
            {isAdded ? (
              <>
                <Check className="h-4 w-4" />
                <span>В корзине</span>
              </>
            ) : (
              <>
                <ShoppingBag className="h-4 w-4" />
                <span>В корзину</span>
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
