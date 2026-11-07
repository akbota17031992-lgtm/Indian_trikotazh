'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight, ArrowDown, Sparkles, Loader2 } from 'lucide-react';
import { CatalogFilters, type CatalogFilterState } from '../../components/catalog/CatalogFilters';
import { ProductCard } from '../../components/catalog/ProductCard';
import { useBranch } from '../../contexts/BranchContext';
import { useLocale } from '../../contexts/LocaleContext';
import { MVP_CATEGORIES_SEED } from '@india-trikotaj/shared';
import type { FullProductDetail } from '../../lib/catalog-data';
import { getAllStoreProducts } from '../../lib/products-store';

interface CatalogPageClientProps {
  initialProducts: FullProductDetail[];
  initialCategory?: string;
}

export function CatalogPageClient({ initialProducts, initialCategory }: CatalogPageClientProps) {
  const { selectedBranch } = useBranch();
  const { locale, t } = useLocale();

  const [productsList, setProductsList] = useState<FullProductDetail[]>(initialProducts);

  useEffect(() => {
    // Sync products with dynamic ones created in admin panel
    setProductsList(getAllStoreProducts());

    const handleUpdate = () => {
      setProductsList(getAllStoreProducts());
    };
    window.addEventListener('indiatrikotaj_products_updated', handleUpdate);
    return () => window.removeEventListener('indiatrikotaj_products_updated', handleUpdate);
  }, []);

  const PAGE_CHUNK_SIZE = 9;
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_CHUNK_SIZE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const [filters, setFilters] = useState<CatalogFilterState>({
    search: '',
    category: initialCategory || 'all',
    gender: 'all',
    season: 'all',
    size: 'all',
    brand: 'all',
    collection: 'all',
    color: 'all',
    minPrice: 1000,
    maxPrice: 50000,
    sortBy: 'popular',
    inStockOnly: false,
  });

  // Reset pagination when any filter changes
  useEffect(() => {
    setVisibleCount(PAGE_CHUNK_SIZE);
  }, [filters]);

  const handleReset = () => {
    setFilters({
      search: '',
      category: 'all',
      gender: 'all',
      season: 'all',
      size: 'all',
      brand: 'all',
      collection: 'all',
      color: 'all',
      minPrice: 1000,
      maxPrice: 50000,
      sortBy: 'popular',
      inStockOnly: false,
    });
    setVisibleCount(PAGE_CHUNK_SIZE);
  };

  const filteredProducts = useMemo(() => {
    let result = productsList.filter(p => {
      // Search filter
      if (filters.search.trim()) {
        const query = filters.search.toLowerCase().trim();
        const matchesName =
          p.nameRu.toLowerCase().includes(query) || p.nameKz.toLowerCase().includes(query);
        const matchesTag = p.tags.some(tag => tag.toLowerCase().includes(query));
        if (!matchesName && !matchesTag) return false;
      }

      // Category filter
      if (filters.category !== 'all' && p.categorySlug !== filters.category) {
        return false;
      }

      // Gender filter (extended Kaspi: women, men, girls, boys, babies, teens)
      if (filters.gender !== 'all') {
        if (filters.gender === 'women' && p.gender !== 'women' && p.gender !== 'unisex') return false;
        if (filters.gender === 'men' && p.gender !== 'men' && p.gender !== 'unisex') return false;
        if (filters.gender === 'girls' && p.gender !== 'kids' && !p.tags.includes('для девочек') && p.gender !== 'unisex') return false;
        if (filters.gender === 'boys' && p.gender !== 'kids' && !p.tags.includes('для мальчиков') && p.gender !== 'unisex') return false;
        if (filters.gender === 'babies' && p.categorySlug !== 'kids' && !p.tags.includes('малыши')) return false;
        if (filters.gender === 'teens' && p.gender !== 'kids' && p.gender !== 'unisex') return false;
      }

      // Season filter
      if (filters.season !== 'all' && p.season !== filters.season && p.season !== 'all-season') {
        return false;
      }

      // Size filter (checks variants or Russian size numbers)
      if (filters.size !== 'all') {
        const sizeMap: Record<string, string> = {
          '42': 'XS',
          '44': 'S',
          '46': 'M',
          '48': 'L',
          '50': 'XL',
          '52': '2XL',
        };
        const internationalSize = sizeMap[filters.size] || filters.size;
        const hasSize = p.variants.some(
          v => v.size === filters.size || v.size === internationalSize
        );
        if (!hasSize) return false;
      }

      // Brand filter
      if (filters.brand !== 'all') {
        const brandMatch = p.tags.some(t => t.toLowerCase() === filters.brand.toLowerCase()) ||
          p.nameRu.toLowerCase().includes(filters.brand.toLowerCase());
        if (!brandMatch) return false;
      }

      // Collection filter
      if (filters.collection !== 'all') {
        if (filters.collection.includes('Базовая') && !p.tags.includes('базовая')) return false;
        if (filters.collection.includes('Весна-Лето') && p.season !== 'summer' && p.season !== 'all-season') return false;
        if (filters.collection.includes('Осень-Зима') && p.season !== 'winter' && p.season !== 'demi-season') return false;
      }

      // Color filter (checks variants)
      if (filters.color !== 'all') {
        const hasColor = p.variants.some(
          v => v.colorRu.toLowerCase().includes(filters.color.toLowerCase())
        );
        if (!hasColor) return false;
      }

      // Price range filter
      if (filters.minPrice !== undefined && p.basePriceKzt < filters.minPrice) {
        return false;
      }
      if (filters.maxPrice !== undefined && p.basePriceKzt > filters.maxPrice) {
        return false;
      }

      // Store in-stock filter
      if (filters.inStockOnly) {
        const stock = p.stockByStore[selectedBranch.id] ?? 0;
        if (stock <= 0) return false;
      }

      return true;
    });

    // Sorting
    if (filters.sortBy === 'price_asc') {
      result.sort((a, b) => a.basePriceKzt - b.basePriceKzt);
    } else if (filters.sortBy === 'price_desc') {
      result.sort((a, b) => b.basePriceKzt - a.basePriceKzt);
    } else if (filters.sortBy === 'name') {
      result.sort((a, b) => a.nameRu.localeCompare(b.nameRu));
    }

    return result;
  }, [initialProducts, filters, selectedBranch]);

  const currentCategoryInfo = useMemo(() => {
    if (filters.category === 'all') return null;
    return MVP_CATEGORIES_SEED.find(c => c.slug === filters.category);
  }, [filters.category]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Breadcrumbs on Catalog Page */}
      <nav className="flex items-center space-x-2 text-xs text-muted-foreground mb-6 overflow-x-auto pb-1">
        <Link href="/" className="hover:text-foreground transition-colors">
          {t('home')}
        </Link>
        <ChevronRight className="h-3 w-3 shrink-0" />
        {currentCategoryInfo ? (
          <>
            <button
              type="button"
              onClick={() => setFilters(prev => ({ ...prev, category: 'all' }))}
              className="hover:text-foreground transition-colors"
            >
              {t('catalog')}
            </button>
            <ChevronRight className="h-3 w-3 shrink-0" />
            <span className="text-foreground font-medium">
              {locale === 'kz' ? currentCategoryInfo.nameKz : currentCategoryInfo.nameRu}
            </span>
          </>
        ) : (
          <span className="text-foreground font-medium">{t('catalog')}</span>
        )}
      </nav>

      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
          {currentCategoryInfo
            ? (locale === 'kz' ? currentCategoryInfo.nameKz : currentCategoryInfo.nameRu)
            : t('catalog')}
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          {currentCategoryInfo
            ? (locale === 'kz' ? currentCategoryInfo.descriptionKz : currentCategoryInfo.descriptionRu)
            : (locale === 'kz'
                ? 'Үндістаннан әкелінген 100% мақта трикотажы, 16 Алматы филиалында қолжетімді'
                : 'Качественный трикотаж из 100% индийского хлопка в 16 магазинах Алматы')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left: Filters Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-20">
            <CatalogFilters filters={filters} onChange={setFilters} onReset={handleReset} />
          </div>
        </div>

        {/* Right: Products Grid */}
        <div className="lg:col-span-3">
          {filteredProducts.length === 0 ? (
            <div className="py-16 text-center space-y-3 bg-muted/20 rounded-2xl border border-border">
              <p className="text-base font-semibold text-foreground">
                {locale === 'kz' ? 'Тауарлар табылмады' : 'Товары не найдены'}
              </p>
              <p className="text-xs text-muted-foreground">
                {locale === 'kz'
                  ? 'Сүзгілерді өзгертіп немесе іздеу сөзін тазартып көріңіз'
                  : 'Попробуйте изменить параметры фильтрации или сбросить поиск'}
              </p>
              <button
                type="button"
                onClick={handleReset}
                className="text-xs text-primary font-semibold hover:underline"
              >
                {locale === 'kz' ? 'Сүзгілерді тазарту' : 'Сбросить фильтры'}
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Product Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.slice(0, visibleCount).map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Load More Button & Counter (Kaspi / E-commerce UX) */}
              {visibleCount < filteredProducts.length ? (
                <div className="pt-4 pb-8 flex flex-col items-center justify-center space-y-3 border-t border-neutral-200/70">
                  <div className="text-xs text-neutral-500 font-medium">
                    Показано <strong>{Math.min(visibleCount, filteredProducts.length)}</strong> из{' '}
                    <strong>{filteredProducts.length}</strong> товаров
                  </div>

                  {/* Progress bar */}
                  <div className="w-48 h-1 bg-neutral-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#0089D0] transition-all duration-300 rounded-full"
                      style={{
                        width: `${Math.round((visibleCount / filteredProducts.length) * 100)}%`,
                      }}
                    />
                  </div>

                  <button
                    type="button"
                    disabled={isLoadingMore}
                    onClick={() => {
                      setIsLoadingMore(true);
                      setTimeout(() => {
                        setVisibleCount(prev => prev + PAGE_CHUNK_SIZE);
                        setIsLoadingMore(false);
                      }, 350);
                    }}
                    className="mt-2 px-8 py-3 bg-white hover:bg-neutral-50 active:bg-neutral-100 text-[#0089D0] border-2 border-[#0089D0] rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 hover:shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {isLoadingMore ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Загружаем товары...</span>
                      </>
                    ) : (
                      <>
                        <ArrowDown className="w-4 h-4" />
                        <span>Показать еще товары</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="pt-8 pb-4 text-center text-xs text-neutral-400 border-t border-neutral-100 flex items-center justify-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Вы просмотрели все доступные товары ({filteredProducts.length})</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
