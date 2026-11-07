'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ShoppingBag, ShieldCheck, Truck, ChevronRight, ChevronLeft, Check, Sparkles, ArrowRight } from 'lucide-react';
import { formatKZT } from '@india-trikotaj/shared';
import { useLocale } from '../../contexts/LocaleContext';
import { useCart } from '../../contexts/CartContext';
import { useBranch } from '../../contexts/BranchContext';
import { ProductStockBadge } from './ProductStockBadge';
import { ProductCard } from './ProductCard';
import { Button, Badge, Card, CardContent } from '@india-trikotaj/ui';
import { saveRecentlyViewedProduct } from '../../lib/recently-viewed';
import { CATALOG_PRODUCTS, type FullProductDetail } from '../../lib/catalog-data';

interface ProductDetailClientProps {
  product: FullProductDetail;
}

export function ProductDetailClient({ product }: ProductDetailClientProps) {
  const { getBilingual, locale, t } = useLocale();
  const { addItem } = useCart();
  const { selectedBranch } = useBranch();

  const [selectedVariant, setSelectedVariant] = useState(
    product.variants[0] || {
      id: product.defaultVariantId,
      sku: `IT-${product.id}`,
      size: product.defaultSize,
      colorRu: product.defaultColorRu,
      colorKz: product.defaultColorKz,
      colorHex: '#000000',
      priceKzt: product.basePriceKzt,
      stockByStore: product.stockByStore,
    }
  );

  const [selectedImage, setSelectedImage] = useState(
    product.images[0] || product.imageUrl || ''
  );
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);

  // Automatically save to recently viewed history
  useEffect(() => {
    if (product?.id) {
      saveRecentlyViewedProduct(product.id);
    }
  }, [product?.id]);

  const title = getBilingual(product.nameKz, product.nameRu);
  const description = getBilingual(product.descriptionKz, product.descriptionRu);
  const material = getBilingual(product.materialKz, product.materialRu);
  const categoryName = getBilingual(product.categoryNameKz, product.categoryNameRu);
  const currentStoreQty = selectedVariant.stockByStore[selectedBranch.id] ?? 0;

  const handleAddToCart = () => {
    addItem(
      {
        variantId: selectedVariant.id,
        productId: product.id,
        titleRu: product.nameRu,
        titleKz: product.nameKz,
        sku: selectedVariant.sku,
        size: selectedVariant.size,
        colorRu: selectedVariant.colorRu,
        colorKz: selectedVariant.colorKz,
        colorHex: selectedVariant.colorHex,
        priceKzt: selectedVariant.priceKzt,
        imageUrl: product.imageUrl,
      },
      quantity
    );
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    if (typeof window !== 'undefined') {
      window.location.href = '/checkout';
    }
  };

  // Group unique sizes and colors
  const availableSizes = Array.from(new Set(product.variants.map(v => v.size)));
  const availableColors = Array.from(
    new Map(
      product.variants.map(v => [
        v.colorRu,
        { colorRu: v.colorRu, colorKz: v.colorKz, hex: v.colorHex },
      ])
    ).values()
  );

  // Recommendations: products from the same category or matching tags
  const relatedProducts = useMemo(() => {
    const sameCategory = CATALOG_PRODUCTS.filter(
      p => p.id !== product.id && p.categorySlug === product.categorySlug
    );
    const relatedByTags = CATALOG_PRODUCTS.filter(
      p =>
        p.id !== product.id &&
        p.categorySlug !== product.categorySlug &&
        p.tags.some(tag => product.tags.includes(tag))
    );
    const combined = [...sameCategory, ...relatedByTags];
    if (combined.length < 4) {
      const rest = CATALOG_PRODUCTS.filter(
        p => p.id !== product.id && !combined.some(c => c.id === p.id)
      );
      return [...combined, ...rest].slice(0, 4);
    }
    return combined.slice(0, 4);
  }, [product]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Breadcrumb Navigation (Test 19.5) */}
      <nav className="flex items-center space-x-2 text-xs text-muted-foreground mb-6 overflow-x-auto pb-1">
        <Link href="/" className="hover:text-foreground">
          {t('home')}
        </Link>
        <ChevronRight className="h-3 w-3 shrink-0" />
        <Link href="/catalog" className="hover:text-foreground">
          {t('catalog')}
        </Link>
        <ChevronRight className="h-3 w-3 shrink-0" />
        <Link href={`/catalog?category=${product.categorySlug}`} className="hover:text-foreground">
          {categoryName}
        </Link>
        <ChevronRight className="h-3 w-3 shrink-0" />
        <span className="text-foreground truncate max-w-[200px] sm:max-w-none">{title}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        {/* Left Column: Image Gallery */}
        <div className="space-y-4">
          <div className="aspect-[4/5] bg-muted/30 rounded-2xl overflow-hidden border border-border/80 flex items-center justify-center relative group">
            {selectedImage ? (
              <img src={selectedImage} alt={title} className="w-full h-full object-cover transition-all duration-300" />
            ) : (
              <span className="text-6xl font-extrabold text-muted-foreground/20">IT</span>
            )}
            <Badge variant="kaspi" className="absolute top-4 right-4 text-xs font-bold px-2.5 py-1">
              Kaspi Red 0-0-3
            </Badge>

            {/* Navigation arrows for multiple photos */}
            {product.images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const currentIdx = product.images.indexOf(selectedImage);
                    const prevIdx = currentIdx > 0 ? currentIdx - 1 : product.images.length - 1;
                    setSelectedImage(product.images[prevIdx]!);
                  }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-background/80 backdrop-blur-md border border-border shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
                  aria-label="Предыдущее фото"
                >
                  <ChevronLeft className="w-5 h-5 text-foreground" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const currentIdx = product.images.indexOf(selectedImage);
                    const nextIdx = currentIdx < product.images.length - 1 ? currentIdx + 1 : 0;
                    setSelectedImage(product.images[nextIdx]!);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-background/80 backdrop-blur-md border border-border shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
                  aria-label="Следующее фото"
                >
                  <ChevronRight className="w-5 h-5 text-foreground" />
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full pointer-events-none">
                  {Math.max(1, product.images.indexOf(selectedImage) + 1)} / {product.images.length}
                </div>
              </>
            )}
          </div>

          {/* Thumbnails */}
          {product.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedImage(img)}
                  className={`w-16 h-20 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${
                    selectedImage === img ? 'border-primary ring-2 ring-primary/20 scale-105' : 'border-border opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`${title} ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Details & Purchase Actions */}
        <div className="space-y-6">
          <div className="space-y-2">
            <Badge variant="secondary" className="text-xs">
              {categoryName}
            </Badge>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              {title}
            </h1>
            <p className="text-xs text-muted-foreground">
              {t('skuLabel')}: <span className="font-mono">{selectedVariant.sku}</span>
            </p>
          </div>

          {/* Price Box */}
          <div className="p-4 bg-muted/40 rounded-xl border border-border space-y-1">
            <div className="text-3xl font-black text-foreground">
              {formatKZT(selectedVariant.priceKzt)}
            </div>
            <div className="text-xs text-[#F14635] font-semibold flex items-center gap-1.5">
              <span>Kaspi Red: 3 x {formatKZT(Math.round(selectedVariant.priceKzt / 3))}/мес</span>
              <span className="text-muted-foreground font-normal">|</span>
              <span className="text-amber-700 dark:text-amber-500">
                12 x {formatKZT(Math.round(selectedVariant.priceKzt / 12))}/мес
              </span>
            </div>
          </div>

          {/* Real-time Branch Stock Badge (Features 20.2, 20.3, B20.2) */}
          <ProductStockBadge
            variantId={selectedVariant.id}
            stockByStore={selectedVariant.stockByStore}
            lowStockThreshold={3}
          />

          {/* Variant Selector: Sizes */}
          {availableSizes.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground block">
                {t('size')}: <span className="text-primary font-bold">{selectedVariant.size}</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {availableSizes.map(sz => {
                  const isSelected = selectedVariant.size === sz;
                  // Recommendations: products from the same category or matching tags
  const relatedProducts = useMemo(() => {
    const sameCategory = CATALOG_PRODUCTS.filter(
      p => p.id !== product.id && p.categorySlug === product.categorySlug
    );
    const relatedByTags = CATALOG_PRODUCTS.filter(
      p =>
        p.id !== product.id &&
        p.categorySlug !== product.categorySlug &&
        p.tags.some(tag => product.tags.includes(tag))
    );
    const combined = [...sameCategory, ...relatedByTags];
    if (combined.length < 4) {
      const rest = CATALOG_PRODUCTS.filter(
        p => p.id !== product.id && !combined.some(c => c.id === p.id)
      );
      return [...combined, ...rest].slice(0, 4);
    }
    return combined.slice(0, 4);
  }, [product]);

  return (
                    <Button
                      key={sz}
                      type="button"
                      variant={isSelected ? 'default' : 'outline'}
                      size="sm"
                      className={`h-9 px-3.5 text-xs font-semibold min-w-10 ${
                        isSelected ? 'bg-primary text-primary-foreground' : ''
                      }`}
                      onClick={() => {
                        const match = product.variants.find(
                          v => v.size === sz && v.colorRu === selectedVariant.colorRu
                        ) || product.variants.find(v => v.size === sz);
                        if (match) setSelectedVariant(match);
                      }}
                    >
                      {sz}
                    </Button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Variant Selector: Colors */}
          {availableColors.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground block">
                {t('color')}:{' '}
                <span className="text-primary font-bold">
                  {getBilingual(selectedVariant.colorKz, selectedVariant.colorRu)}
                </span>
              </label>
              <div className="flex flex-wrap gap-2">
                {availableColors.map(c => {
                  const isSelected = selectedVariant.colorRu === c.colorRu;
                  const colorLabel = getBilingual(c.colorKz, c.colorRu);
                  // Recommendations: products from the same category or matching tags
  const relatedProducts = useMemo(() => {
    const sameCategory = CATALOG_PRODUCTS.filter(
      p => p.id !== product.id && p.categorySlug === product.categorySlug
    );
    const relatedByTags = CATALOG_PRODUCTS.filter(
      p =>
        p.id !== product.id &&
        p.categorySlug !== product.categorySlug &&
        p.tags.some(tag => product.tags.includes(tag))
    );
    const combined = [...sameCategory, ...relatedByTags];
    if (combined.length < 4) {
      const rest = CATALOG_PRODUCTS.filter(
        p => p.id !== product.id && !combined.some(c => c.id === p.id)
      );
      return [...combined, ...rest].slice(0, 4);
    }
    return combined.slice(0, 4);
  }, [product]);

  return (
                    <button
                      key={c.colorRu}
                      type="button"
                      onClick={() => {
                        const match = product.variants.find(
                          v => v.colorRu === c.colorRu && v.size === selectedVariant.size
                        ) || product.variants.find(v => v.colorRu === c.colorRu);
                        if (match) setSelectedVariant(match);
                      }}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-2 transition-all ${
                        isSelected
                          ? 'border-primary ring-2 ring-primary/20 bg-primary/5 font-semibold'
                          : 'border-border hover:bg-muted/40'
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0"
                        style={{ backgroundColor: c.hex }}
                      />
                      <span>{colorLabel}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity and Action Buttons */}
          <div className="space-y-3 pt-2">
            <div className="flex gap-3">
              {/* Add to Cart */}
              <Button
                type="button"
                size="lg"
                onClick={handleAddToCart}
                disabled={currentStoreQty <= 0}
                className="flex-1 h-12 text-sm font-bold flex items-center justify-center gap-2"
              >
                {isAdded ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>{locale === 'kz' ? 'Себетке қосылды!' : 'Добавлено в корзину!'}</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    <span>{t('addToCart')}</span>
                  </>
                )}
              </Button>

              {/* Buy Now */}
              <Button
                type="button"
                variant="kaspi"
                size="lg"
                onClick={handleBuyNow}
                disabled={currentStoreQty <= 0}
                className="flex-1 h-12 text-sm font-bold"
              >
                {t('buyNow')}
              </Button>
            </div>
          </div>

          {/* Product Specifications & Logistics Card */}
          <Card className="border-border/70 bg-card">
            <CardContent className="p-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 pb-3 border-b border-border/60">
                <span className="text-muted-foreground">{t('material')}:</span>
                <span className="font-semibold text-foreground text-right">{material}</span>
                <span className="text-muted-foreground">{t('countryOfOrigin')}:</span>
                <span className="font-semibold text-foreground text-right">Индия</span>
              </div>

              <div className="flex items-center gap-2 text-muted-foreground pt-1">
                <Truck className="w-4 h-4 text-primary shrink-0" />
                <span>
                  {locale === 'kz'
                    ? 'Алматы бойынша курьерлік жеткізу (1 500 ₸) немесе 16 филиалдан тегін алып кету'
                    : 'Курьерская доставка по Алматы (1 500 ₸) или бесплатный самовывоз из 16 ТРЦ'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  {locale === 'kz'
                    ? '100% түпнұсқа үнді сапасы, қайтару және айырбастау кепілдігі'
                    : '100% оригинальное качество из Индии, гарантия возврата и обмена 14 дней'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          <div className="space-y-2 pt-2">
            <h3 className="text-sm font-bold text-foreground">{t('productDescription')}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
          </div>
        </div>
      </div>

      {/* "Вас могут заинтересовать" (Related / Recommended Products) */}
      {relatedProducts.length > 0 && (
        <section className="mt-16 pt-8 border-t border-neutral-200">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
                  {locale === 'kz' ? 'Сізді қызықтыруы мүмкін' : 'Вас могут заинтересовать'}
                </h2>
              </div>
              <p className="text-xs text-muted-foreground">
                {locale === 'kz'
                  ? 'Осы бұйымға ұқсас және бірге жарасатын үнді трикотаж тауарлары'
                  : 'Похожие модели и сопутствующие товары из той же категории и коллекции'}
              </p>
            </div>
            <Link
              href={`/catalog?category=${product.categorySlug}`}
              className="text-xs font-semibold text-[#0089D0] hover:underline flex items-center gap-1"
            >
              <span>{locale === 'kz' ? 'Санаттағы барлық тауарлар' : 'Все товары в категории'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map(relProduct => (
              <ProductCard key={`detail-rel-${relProduct.id}`} product={relProduct} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
