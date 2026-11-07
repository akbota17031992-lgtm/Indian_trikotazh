'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, MapPin, ShieldCheck, Truck, CreditCard, History, HeartHandshake } from 'lucide-react';
import { MVP_CATEGORIES_SEED } from '@india-trikotaj/shared';
import { useLocale } from '../contexts/LocaleContext';
import { useBranch } from '../contexts/BranchContext';
import { useCart } from '../contexts/CartContext';
import { ProductCard } from '../components/catalog/ProductCard';
import { Button, Card, CardContent, Badge } from '@india-trikotaj/ui';
import { CATALOG_PRODUCTS, type FullProductDetail } from '../lib/catalog-data';
import { getRecentlyViewedProductIds } from '../lib/recently-viewed';
import { getAllStoreProducts } from '../lib/products-store';

export function HomePageClient() {
  const { getBilingual, locale, t } = useLocale();
  const { selectedBranch } = useBranch();
  const { cart } = useCart();

  const [allProducts, setAllProducts] = useState<FullProductDetail[]>(CATALOG_PRODUCTS);
  const [recentlyViewedIds, setRecentlyViewedIds] = useState<string[]>([]);

  useEffect(() => {
    setAllProducts(getAllStoreProducts());
    setRecentlyViewedIds(getRecentlyViewedProductIds());

    const handleUpdate = () => {
      setAllProducts(getAllStoreProducts());
    };
    window.addEventListener('indiatrikotaj_products_updated', handleUpdate);
    return () => window.removeEventListener('indiatrikotaj_products_updated', handleUpdate);
  }, []);

  // 1. Популярные товары (бестселлеры, включая добавленные новинки)
  const featuredProducts = allProducts.slice(0, 4);

  // 2. Раздел "Вы недавно смотрели"
  const recentlyViewedProducts = useMemo(() => {
    if (recentlyViewedIds.length === 0) return [];
    return recentlyViewedIds
      .map(id => allProducts.find(p => p.id === id))
      .filter((p): p is FullProductDetail => !!p)
      .slice(0, 4);
  }, [recentlyViewedIds, allProducts]);

  // 3. Раздел "Вас могут заинтересовать" (умные рекомендации на основе просмотренного + корзины)
  const recommendedProducts = useMemo(() => {
    // Собираем категории и теги из просмотренных товаров и корзины
    const activeCategories = new Set<string>();
    const activeTags = new Set<string>();

    recentlyViewedProducts.forEach(p => {
      activeCategories.add(p.categorySlug);
      p.tags.forEach(t => activeTags.add(t));
    });

    cart.forEach(item => {
      const p = allProducts.find(cp => cp.id === item.productId);
      if (p) {
        activeCategories.add(p.categorySlug);
        p.tags.forEach(t => activeTags.add(t));
      }
    });

    // Исключаем товары, которые уже лежат в корзине или в недавних
    const excludedIds = new Set([
      ...recentlyViewedProducts.map(p => p.id),
      ...cart.map(i => i.productId),
    ]);

    // Если еще ничего не смотрели и корзина пуста - предлагаем сопутствующие популярные хиты
    if (activeCategories.size === 0) {
      return allProducts.slice(4, 8);
    }

    // Ранжируем товары по совпадению категорий и тегов
    const scored = allProducts.filter(p => !excludedIds.has(p.id)).map(p => {
      let score = 0;
      if (activeCategories.has(p.categorySlug)) score += 3;
      p.tags.forEach(t => {
        if (activeTags.has(t)) score += 1;
      });
      return { product: p, score };
    });

    scored.sort((a, b) => b.score - a.score);
    const topScored = scored.map(s => s.product);

    // Дополняем до 4 товаров если совпадений меньше
    if (topScored.length < 4) {
      const fallback = allProducts.filter(
        p => !excludedIds.has(p.id) && !topScored.some(ts => ts.id === p.id)
      );
      return [...topScored, ...fallback].slice(0, 4);
    }

    return topScored.slice(0, 4);
  }, [recentlyViewedProducts, cart, allProducts]);

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Banner */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/10 via-background to-background py-16 sm:py-24 border-b border-border/50">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  {locale === 'kz'
                    ? '100% үнді мақтасы • 16 дүкен Алматыда'
                    : '100% индийский хлопок • 16 магазинов в Алматы'}
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-foreground tracking-tight leading-tight">
                {locale === 'kz' ? (
                  <>
                    Үнді Трикотажы —{' '}
                    <span className="text-primary">Ыңғайлылық пен Сапа</span>
                  </>
                ) : (
                  <>
                    Индийский Трикотаж —{' '}
                    <span className="text-primary">Комфорт и Качество</span>
                  </>
                )}
              </h1>

              <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed">
                {locale === 'kz'
                  ? 'Үндістанның үздік фабрикаларынан тікелей жеткізілім. Базалық футболкалар, жұмсақ шапандар, пижамалар және термоішкиім. Kaspi Red 0-0-3 бөліп төлеу.'
                  : 'Прямые поставки от ведущих индийских фабрик. Базовые футболки, уютные халаты, пижамные комплекты и согревающее термобелье. Рассрочка Kaspi Red 0-0-3.'}
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
                <Link href="/catalog" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto font-bold h-12 px-8 flex items-center justify-center gap-2">
                    <span>{t('catalog')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/stores" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto font-semibold h-12 px-6 flex items-center justify-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span>{t('stores')}</span>
                  </Button>
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="pt-6 grid grid-cols-3 gap-4 border-t border-border/70 text-left">
                <div>
                  <div className="text-lg font-extrabold text-foreground">16 ТРЦ</div>
                  <div className="text-xs text-muted-foreground">в Алматы</div>
                </div>
                <div>
                  <div className="text-lg font-extrabold text-foreground">100%</div>
                  <div className="text-xs text-muted-foreground">индийский хлопок</div>
                </div>
                <div>
                  <div className="text-lg font-extrabold text-[#F14635]">0-0-3</div>
                  <div className="text-xs text-muted-foreground">Kaspi Red</div>
                </div>
              </div>
            </div>

            {/* Right Visual Box */}
            <div className="relative mx-auto w-full max-w-lg aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border border-border/70 bg-muted/40">
              <img
                src="https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=1000&q=80"
                alt="Индийский Трикотаж"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-6 text-white">
                <Badge variant="kaspi" className="w-fit mb-2 text-xs font-bold">
                  Kaspi Pay Серіктесі
                </Badge>
                <h3 className="text-lg font-bold">
                  {locale === 'kz' ? 'Таңдалған дүкен:' : 'Ваш магазин:'}{' '}
                  {locale === 'kz' ? selectedBranch.nameKz : selectedBranch.nameRu}
                </h3>
                <p className="text-xs text-white/80">
                  {locale === 'kz' ? selectedBranch.addressKz : selectedBranch.addressRu}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7 Categories Grid */}
      <section className="container mx-auto px-4 max-w-7xl">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              {locale === 'kz' ? 'Тауар санаттары' : 'Категории трикотажа'}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              {locale === 'kz'
                ? 'Үнді мақтасынан жасалған 7 негізгі санаттағы сапалы киімдер'
                : '7 основных категорий качественной одежды из индийского хлопка'}
            </p>
          </div>
          <Link href="/catalog" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
            <span>{locale === 'kz' ? 'Барлық санаттарды көру' : 'Смотреть все категории'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 sm:gap-4">
          {MVP_CATEGORIES_SEED.map(cat => {
            const name = getBilingual(cat.nameKz, cat.nameRu);
            return (
              <Link
                key={cat.slug}
                href={`/catalog?category=${cat.slug}`}
                className="group p-4 rounded-xl border border-border/80 bg-card hover:border-primary/50 hover:shadow-md transition-all flex flex-col justify-between text-center space-y-2"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto group-hover:scale-110 transition-transform font-bold text-xs">
                  {cat.displayOrder}
                </div>
                <div className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors">
                  {name}
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Featured Products */}
      <section className="container mx-auto px-4 max-w-7xl">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              {locale === 'kz' ? 'Танымал тауарлар' : 'Популярные товары'}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              {locale === 'kz'
                ? 'Алматы тұрғындарының ең көп таңдайтын үнді трикотаж тауарлары'
                : 'Бестселлеры индийского трикотажа в магазинах Алматы'}
            </p>
          </div>
          <Link href="/catalog" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
            <span>{locale === 'kz' ? 'Каталогқа өту' : 'Перейти в каталог'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 2. "Вы недавно смотрели" (Recently Viewed Products) */}
      {recentlyViewedProducts.length > 0 && (
        <section className="container mx-auto px-4 max-w-7xl">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-700">
                  <History className="w-4 h-4" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                  {locale === 'kz' ? 'Сіз жақында көрген тауарлар' : 'Вы недавно смотрели'}
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {locale === 'kz'
                  ? 'Соңғы қарап шыққан үнді трикотаж үлгілері'
                  : 'История просмотров для быстрого возврата к понравившимся вещам'}
              </p>
            </div>
            <Link href="/catalog" className="text-xs font-semibold text-[#0089D0] hover:underline flex items-center gap-1">
              <span>{locale === 'kz' ? 'Барлығын көру' : 'Смотреть весь каталог'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {recentlyViewedProducts.map(product => (
              <ProductCard key={`recent-${product.id}`} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* 3. "Вас могут заинтересовать" (Personalized Recommendations) */}
      <section className="container mx-auto px-4 max-w-7xl">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700">
                <Sparkles className="w-4 h-4 text-amber-600" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                {locale === 'kz' ? 'Сізді қызықтыруы мүмкін' : 'Вас могут заинтересовать'}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {locale === 'kz'
                ? 'Таңдалған бұйымдар мен себетіңізге сәйкес келетін ұсыныстар'
                : 'Похожие модели и сопутствующие товары на основе ваших предпочтений и корзины'}
            </p>
          </div>
          <Link href="/catalog" className="text-xs font-semibold text-[#0089D0] hover:underline flex items-center gap-1">
            <span>{locale === 'kz' ? 'Ұсыныстарды көру' : 'Все рекомендации'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {recommendedProducts.map(product => (
            <ProductCard key={`rec-${product.id}`} product={product} />
          ))}
        </div>
      </section>

      {/* Benefits & Kaspi Pay Showcase */}
      <section className="container mx-auto px-4 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-border/80 bg-gradient-to-br from-card to-muted/20">
            <CardContent className="p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-[#F14635] flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-foreground">Kaspi Pay & Red 0-0-3</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {locale === 'kz'
                  ? 'Kaspi QR арқылы бірден төлеңіз немесе 3 айға артық төлемсіз Kaspi Red бөліп төлеуді таңдаңыз.'
                  : 'Мгновенная оплата по Kaspi QR или удобная рассрочка без переплат на 3 месяца через Kaspi Red.'}
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/80 bg-gradient-to-br from-card to-muted/20">
            <CardContent className="p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <MapPin className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-foreground">
                {locale === 'kz' ? '16 филиалда тегін алып кету' : 'Самовывоз из 16 ТРЦ'}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {locale === 'kz'
                  ? 'MEGA Alma-Ata, Dostyk Plaza, Grand Park және басқа да ірі сауда орталықтарынан 15 минутта дайын болады.'
                  : 'Заберите заказ бесплатно через 15 минут в MEGA Alma-Ata, Dostyk Plaza, Grand Park и других ТРЦ.'}
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/80 bg-gradient-to-br from-card to-muted/20">
            <CardContent className="p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                <Truck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-foreground">
                {locale === 'kz' ? 'Курьерлік жеткізу (1 500 ₸)' : 'Курьер по Алматы (1 500 ₸)'}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {locale === 'kz'
                  ? 'Алматының кез келген ауданына есікке дейін жылдам және қауіпсіз жеткізу.'
                  : 'Быстрая доставка до двери в любой район Алматы: Медеуский, Бостандыкский, Алмалинский и др.'}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
