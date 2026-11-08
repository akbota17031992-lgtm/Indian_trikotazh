import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatKZT, ALMATY_STORES_SEED } from '@india-trikotaj/shared';
import { MOBILE_PRODUCTS } from '../data/mock-products';
import type { MobileProduct } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HERO_CARD_WIDTH = SCREEN_WIDTH - 32;

interface Props {
  onSelectProduct: (product: MobileProduct) => void;
  cartProductQuantities: Record<string, number>;
  onIncreaseQuantity: (product: MobileProduct) => void;
  onDecreaseQuantity: (productId: string) => void;
  onNavigateToCatalog: (category?: string) => void;
  onNavigateToStores: () => void;
  onNavigateToProfile?: () => void;
  selectedStoreId: string;
  locale: 'ru' | 'kz';
  onToggleLocale: () => void;
  recentlyViewedIds: string[];
}

interface HomeProductCardProps {
  product: MobileProduct;
  selectedStoreId: string;
  locale: 'ru' | 'kz';
  quantityInCart: number;
  badgeType?: 'discount' | 'new' | 'rec' | 'none';
  showKaspi?: boolean;
  onSelectProduct: (product: MobileProduct) => void;
  onIncreaseQuantity: (product: MobileProduct) => void;
  onDecreaseQuantity: (productId: string) => void;
}

function HomeProductCard({
  product,
  selectedStoreId,
  locale,
  quantityInCart,
  badgeType = 'none',
  showKaspi = true,
  onSelectProduct,
  onIncreaseQuantity,
  onDecreaseQuantity,
}: HomeProductCardProps) {
  const stock = product.stockByStore[selectedStoreId] ?? 10;

  return (
    <View style={[styles.productCardH, quantityInCart > 0 && styles.productCardInCart]}>
      <TouchableOpacity
        onPress={() => onSelectProduct(product)}
        activeOpacity={0.88}
      >
        <View style={styles.imageContainerH}>
          <Image source={{ uri: product.imageUrl }} style={styles.productImageH} resizeMode="cover" />

          {/* Top-Left Badges */}
          {badgeType === 'discount' && product.oldPriceKzt && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>
                -{Math.round(((product.oldPriceKzt - product.priceKzt) / product.oldPriceKzt) * 100)}%
              </Text>
            </View>
          )}
          {badgeType === 'new' && (
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>NEW</Text>
            </View>
          )}
          {badgeType === 'rec' && (
            <View style={styles.recBadge}>
              <Text style={styles.recBadgeText}>✨ TOP</Text>
            </View>
          )}

          {/* Top-Right Permanent In-Cart Badge Marker */}
          {quantityInCart > 0 && (
            <View style={styles.inCartBadge}>
              <Ionicons name="checkmark-circle" size={10} color="#ffffff" />
              <Text style={styles.inCartBadgeText}>
                {quantityInCart} {locale === 'kz' ? 'себетте' : 'в корзине'}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.productBodyTopH}>
          <View style={styles.stockStatusRow}>
            <View style={[styles.stockDot, { backgroundColor: stock > 0 ? '#10b981' : '#f59e0b' }]} />
            <Text style={styles.stockTextH}>
              {stock > 0
                ? locale === 'kz' ? `Қоймада: ${stock} дана` : `В наличии: ${stock} шт.`
                : locale === 'kz' ? 'Тапсырыспен' : 'Под заказ'}
            </Text>
          </View>

          <Text style={styles.productTitleH} numberOfLines={2}>
            {locale === 'kz' ? product.titleKz : product.titleRu}
          </Text>
        </View>
      </TouchableOpacity>

      <View style={styles.productBodyBottomH}>
        <View style={styles.priceRowH}>
          <View style={{ flex: 1, paddingRight: 4 }}>
            <Text style={styles.productPriceH}>{formatKZT(product.priceKzt)}</Text>
            {product.oldPriceKzt && (
              <Text style={styles.productOldPriceH}>{formatKZT(product.oldPriceKzt)}</Text>
            )}
          </View>

          {quantityInCart > 0 ? (
            <View style={styles.stepperContainerH}>
              <TouchableOpacity
                style={styles.stepperBtnH}
                onPress={() => onDecreaseQuantity(product.id)}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
              >
                <Ionicons name="remove" size={12} color="#065f46" />
              </TouchableOpacity>

              <View style={styles.stepperCountWrapH}>
                <Text style={styles.stepperCountTextH}>{quantityInCart}</Text>
              </View>

              <TouchableOpacity
                style={[styles.stepperBtnH, styles.stepperBtnPlusH]}
                onPress={() => onIncreaseQuantity(product)}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
              >
                <Ionicons name="add" size={12} color="#ffffff" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.quickAddBtnH}
              onPress={() => onIncreaseQuantity(product)}
              activeOpacity={0.8}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Ionicons name="cart" size={14} color="#b45309" />
            </TouchableOpacity>
          )}
        </View>

        {showKaspi && (
          <View style={styles.kaspiBadgeH}>
            <Text style={styles.kaspiTextH}>
              Kaspi Red {formatKZT(Math.round(product.priceKzt / 3))} x 3
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

export function HomeScreen({
  onSelectProduct,
  cartProductQuantities,
  onIncreaseQuantity,
  onDecreaseQuantity,
  onNavigateToCatalog,
  onNavigateToStores,
  onNavigateToProfile,
  selectedStoreId,
  locale,
  onToggleLocale,
  recentlyViewedIds,
}: Props) {
  const carouselRef = useRef<any>(null);
  const [activeSlide, setActiveSlide] = useState(0);

  const heroSlides = useMemo(() => [
    {
      id: 'cotton',
      badge1: { textRu: '100% Эко-хлопок', textKz: '100% Табиғи мақта', icon: 'leaf', bg: 'rgba(255,255,255,0.2)', color: '#fef3c7' },
      badge2: { textRu: 'Прямой импорт', textKz: 'Тікелей импорт', icon: 'globe-outline', bg: 'rgba(255,255,255,0.15)', color: '#fde68a' },
      titleRu: 'Натуральный Индийский Хлопок',
      titleKz: 'Табиғи Үнді Мақтасы',
      subtitleRu: 'Премиальный гипоаллергенный гребенной трикотаж напрямую с фабрик Мумбаи и Тируппура.',
      subtitleKz: 'Мумбаи және Тируппур фабрикаларынан табиғи гипоаллергенді премиум трикотаж.',
      buttonTextRu: 'Перейти в каталог',
      buttonTextKz: 'Каталогқа өту',
      buttonBg: '#f59e0b',
      buttonTextColor: '#451a03',
      cardBg: '#78350f',
      borderColor: '#92400e',
      onPress: () => onNavigateToCatalog(),
    },
    {
      id: 'bonuses',
      badge1: { textRu: 'Кешбэк 5%', textKz: '5% Кешбэк', icon: 'star', bg: '#f59e0b', color: '#451a03' },
      badge2: { textRu: '1 бонус = 1 ₸', textKz: '1 бонус = 1 ₸', icon: 'gift', bg: 'rgba(255,255,255,0.22)', color: '#ffffff' },
      titleRu: 'Кешбэк 5% за каждый заказ',
      titleKz: 'Әр тапсырыстан 5% бонус',
      subtitleRu: 'Копите бонусы с каждой покупки! Оплачивайте баллами до 30% стоимости любого трикотажа.',
      subtitleKz: 'Әр сатып алудан бонус жинаңыз! Тауар құнының 30%-на дейін бонустармен төлеңіз.',
      buttonTextRu: 'Моя бонусная карта',
      buttonTextKz: 'Менің бонустық картам',
      buttonBg: '#fbbf24',
      buttonTextColor: '#1e1b4b',
      cardBg: '#1e1b4b',
      borderColor: '#3730a3',
      onPress: () => (onNavigateToProfile ? onNavigateToProfile() : onNavigateToCatalog()),
    },
    {
      id: 'sale',
      badge1: { textRu: 'Сезонные скидки', textKz: 'Маусымдық жеңілдіктер', icon: 'flame', bg: '#dc2626', color: '#ffffff' },
      badge2: { textRu: 'Скидки до -40%', textKz: '-40% дейін', icon: 'pricetag', bg: '#ea580c', color: '#ffffff' },
      titleRu: 'Акции и скидки на трикотаж',
      titleKz: 'Трикотажға арнайы жеңілдіктер',
      subtitleRu: 'Специальные цены на футболки, туники, пижамы и комплекты для дома из индийского хлопка.',
      subtitleKz: 'Базалық футболкалар, туникалар, пижамалар мен үй жиынтықтарына ең тиімді бағалар.',
      buttonTextRu: 'Смотреть все акции',
      buttonTextKz: 'Барлық акцияларды көру',
      buttonBg: '#ea580c',
      buttonTextColor: '#ffffff',
      cardBg: '#9a3412',
      borderColor: '#c2410c',
      onPress: () => onNavigateToCatalog(),
    },
    {
      id: 'stores',
      badge1: { textRu: '16 филиалов', textKz: '16 филиал', icon: 'storefront', bg: '#059669', color: '#ffffff' },
      badge2: { textRu: 'Бесплатный самовывоз', textKz: 'Тегін алып кету', icon: 'location', bg: 'rgba(255,255,255,0.2)', color: '#ffffff' },
      titleRu: '16 магазинов по Алматы',
      titleKz: 'Алматы бойынша 16 дүкен',
      subtitleRu: 'Забирайте онлайн-заказы в MEGA, Dostyk Plaza, Grand Park, Moskva и других ТРЦ уже сегодня.',
      subtitleKz: 'MEGA, Dostyk Plaza, Grand Park, Moskva СОО-ларында тапсырысты бүгін тегін алып кетіңіз.',
      buttonTextRu: 'Посмотреть магазины',
      buttonTextKz: 'Дүкендерді көру',
      buttonBg: '#10b981',
      buttonTextColor: '#064e3b',
      cardBg: '#064e3b',
      borderColor: '#047857',
      onPress: () => onNavigateToStores(),
    },
    {
      id: 'delivery-kaspi',
      badge1: { textRu: 'Kaspi Red 0-0-3', textKz: 'Kaspi Red 0-0-3', icon: 'flash', bg: '#ef4444', color: '#ffffff' },
      badge2: { textRu: 'Доставка 2 часа', textKz: '2 сағатта жеткізу', icon: 'bicycle', bg: '#0284c7', color: '#ffffff' },
      titleRu: 'Kaspi Red и экспресс-доставка',
      titleKz: 'Kaspi Red және жедел жеткізу',
      subtitleRu: 'Рассрочка без переплат на 3 месяца и быстрая курьерская доставка до двери по всей Алматы.',
      subtitleKz: '3 айға пайызсыз бөліп төлеу және Алматы бойынша есікке дейін 2 сағатта курьермен жеткізу.',
      buttonTextRu: 'Заказать с доставкой',
      buttonTextKz: 'Жеткізумен тапсырыс беру',
      buttonBg: '#ef4444',
      buttonTextColor: '#ffffff',
      cardBg: '#881337',
      borderColor: '#9f1239',
      onPress: () => onNavigateToCatalog(),
    },
  ], [locale, onNavigateToCatalog, onNavigateToStores, onNavigateToProfile]);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide(prev => {
        const next = (prev + 1) % heroSlides.length;
        carouselRef.current?.scrollTo({
          x: next * (HERO_CARD_WIDTH + 12),
          animated: true,
        });
        return next;
      });
    }, 4500);

    return () => clearInterval(timer);
  }, [heroSlides.length]);

  const handleCarouselScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const xOffset = e.nativeEvent.contentOffset.x;
    const index = Math.round(xOffset / (HERO_CARD_WIDTH + 12));
    if (index !== activeSlide && index >= 0 && index < heroSlides.length) {
      setActiveSlide(index);
    }
  };

  const handleDotPress = (index: number) => {
    setActiveSlide(index);
    carouselRef.current?.scrollTo({
      x: index * (HERO_CARD_WIDTH + 12),
      animated: true,
    });
  };
  const currentStore =
    ALMATY_STORES_SEED.find((_, i) => `store-almaty-${String(i + 1).padStart(3, '0')}` === selectedStoreId) ||
    ALMATY_STORES_SEED[0]!;

  const bestsellers = MOBILE_PRODUCTS.filter(p => p.isBestseller);
  const newArrivals = MOBILE_PRODUCTS.filter(p => p.isNew);

  // 1. Недавно просмотренные товары
  const recentlyViewedProducts = useMemo(() => {
    return recentlyViewedIds
      .map(id => MOBILE_PRODUCTS.find(p => p.id === id))
      .filter((p): p is MobileProduct => Boolean(p));
  }, [recentlyViewedIds]);

  // 2. Рекомендации "Вас могут заинтересовать"
  const recommendedProducts = useMemo(() => {
    const viewedCategories = new Set(recentlyViewedProducts.map(p => p.category));
    const recs = MOBILE_PRODUCTS.filter(
      p =>
        !recentlyViewedIds.slice(0, 2).includes(p.id) &&
        (viewedCategories.has(p.category) || p.isBestseller || p.isNew)
    );
    return recs.length > 0 ? recs : MOBILE_PRODUCTS.slice(0, 4);
  }, [recentlyViewedIds, recentlyViewedProducts]);

  const categories = [
    { id: 'all', titleRu: 'Все', titleKz: 'Барлығы', icon: '🛍️' },
    { id: 't-shirts', titleRu: 'Футболки', titleKz: 'Футболкалар', icon: '👕' },
    { id: 'tunics', titleRu: 'Туники', titleKz: 'Туникалар', icon: '👗' },
    { id: 'pajamas', titleRu: 'Пижамы', titleKz: 'Пижамалар', icon: '🌙' },
    { id: 'long-sleeves', titleRu: 'Лонгсливы', titleKz: 'Лонгсливтер', icon: '🧥' },
    { id: 'robes', titleRu: 'Халаты', titleKz: 'Шапандар', icon: '👘' },
    { id: 'thermal-underwear', titleRu: 'Термобелье', titleKz: 'Термоішкиім', icon: '❄️' },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.brandTitle}>ИНДИЙСКИЙ ТРИКОТАЖ</Text>
          <Text style={styles.brandSubtitle}>Прямой импорт из Индии • Алматы</Text>
        </View>
        <TouchableOpacity style={styles.langBadge} onPress={onToggleLocale} activeOpacity={0.8}>
          <Text style={styles.langText}>{locale === 'ru' ? 'KZ 🇰🇿' : 'RU 🇷🇺'}</Text>
        </TouchableOpacity>
      </View>

      {/* Selected Branch Banner */}
      <TouchableOpacity style={styles.storeBanner} onPress={onNavigateToStores} activeOpacity={0.85}>
        <View style={styles.pinCircle}>
          <Ionicons name="location" size={15} color="#b45309" />
        </View>
        <View style={styles.storeInfo}>
          <Text style={styles.storeLabel}>
            {locale === 'kz' ? 'Сіздің дүкеніңіз (16 филиал):' : 'Магазин самовывоза (16 филиалов):'}
          </Text>
          <Text style={styles.storeName}>
            {locale === 'kz' ? currentStore.nameKz : currentStore.nameRu}
          </Text>
        </View>
        <View style={styles.changeBadge}>
          <Text style={styles.storeChangeArrow}>
            {locale === 'kz' ? 'Өзгерту' : 'Сменить'}
          </Text>
          <Ionicons name="chevron-forward" size={12} color="#b45309" />
        </View>
      </TouchableOpacity>

      {/* Hero Promo Carousel */}
      <View style={styles.carouselWrapper}>
        <ScrollView
          ref={carouselRef}
          horizontal
          pagingEnabled={false}
          snapToInterval={HERO_CARD_WIDTH + 12}
          snapToAlignment="center"
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          onScroll={handleCarouselScroll}
          scrollEventThrottle={16}
          contentContainerStyle={styles.carouselContainer}
        >
          {heroSlides.map(slide => (
            <View
              key={slide.id}
              style={[
                styles.heroSlideCard,
                {
                  backgroundColor: slide.cardBg,
                  borderColor: slide.borderColor,
                },
              ]}
            >
              <View style={styles.heroBadgeRow}>
                <View style={[styles.heroBadge, { backgroundColor: slide.badge1.bg }]}>
                  <Ionicons
                    name={slide.badge1.icon as any}
                    size={11}
                    color={slide.badge1.color}
                    style={{ marginRight: 4 }}
                  />
                  <Text style={[styles.heroBadgeText, { color: slide.badge1.color }]}>
                    {locale === 'kz' ? slide.badge1.textKz : slide.badge1.textRu}
                  </Text>
                </View>

                {slide.badge2 && (
                  <View style={[styles.heroBadgeEco, { backgroundColor: slide.badge2.bg }]}>
                    <Ionicons
                      name={slide.badge2.icon as any}
                      size={11}
                      color={slide.badge2.color}
                      style={{ marginRight: 4 }}
                    />
                    <Text style={[styles.heroBadgeEcoText, { color: slide.badge2.color }]}>
                      {locale === 'kz' ? slide.badge2.textKz : slide.badge2.textRu}
                    </Text>
                  </View>
                )}
              </View>

              <Text style={styles.heroTitle}>
                {locale === 'kz' ? slide.titleKz : slide.titleRu}
              </Text>
              <Text style={styles.heroSubtitle}>
                {locale === 'kz' ? slide.subtitleKz : slide.subtitleRu}
              </Text>

              <TouchableOpacity
                style={[styles.heroButton, { backgroundColor: slide.buttonBg }]}
                onPress={slide.onPress}
                activeOpacity={0.88}
              >
                <Text style={[styles.heroButtonText, { color: slide.buttonTextColor }]}>
                  {locale === 'kz' ? slide.buttonTextKz : slide.buttonTextRu}
                </Text>
                <Ionicons name="arrow-forward" size={14} color={slide.buttonTextColor} />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>

        {/* Carousel Pagination Dots */}
        <View style={styles.carouselDotsRow}>
          {heroSlides.map((_, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => handleDotPress(idx)}
              style={[
                styles.carouselDot,
                activeSlide === idx && styles.carouselDotActive,
              ]}
              hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
            />
          ))}
        </View>
      </View>

      {/* Categories Horizontal Pills */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {locale === 'kz' ? 'Санаттар' : 'Категории'}
        </Text>
        <TouchableOpacity onPress={() => onNavigateToCatalog()} activeOpacity={0.7}>
          <Text style={styles.sectionLink}>
            {locale === 'kz' ? 'Барлығы' : 'Все'} →
          </Text>
        </TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesRow}>
        {categories.map(c => (
          <TouchableOpacity
            key={c.id}
            style={styles.categoryCard}
            onPress={() => onNavigateToCatalog(c.id === 'all' ? undefined : c.id)}
            activeOpacity={0.8}
          >
            <View style={styles.categoryIconCircle}>
              <Text style={styles.categoryIconText}>{c.icon}</Text>
            </View>
            <Text style={styles.categoryTitleText} numberOfLines={1}>
              {locale === 'kz' ? c.titleKz : c.titleRu}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Bestsellers Section */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <View style={styles.sectionIconBadge}>
            <Ionicons name="flame" size={14} color="#dc2626" />
          </View>
          <Text style={styles.sectionTitle}>
            {locale === 'kz' ? 'Хит тауарлар' : 'Хиты продаж'}
          </Text>
        </View>
        <TouchableOpacity onPress={() => onNavigateToCatalog()} activeOpacity={0.7}>
          <Text style={styles.sectionLink}>
            {locale === 'kz' ? 'Барлығы' : 'Смотреть все'} →
          </Text>
        </TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
        {bestsellers.map(product => (
          <HomeProductCard
            key={product.id}
            product={product}
            selectedStoreId={selectedStoreId}
            locale={locale}
            quantityInCart={cartProductQuantities[product.id] || 0}
            badgeType="discount"
            onSelectProduct={onSelectProduct}
            onIncreaseQuantity={onIncreaseQuantity}
            onDecreaseQuantity={onDecreaseQuantity}
          />
        ))}
      </ScrollView>

      {/* Recently Viewed Section */}
      {recentlyViewedProducts.length > 0 && (
        <>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.sectionIconBadge, { backgroundColor: '#fef3c7' }]}>
                <Ionicons name="time" size={13} color="#b45309" />
              </View>
              <Text style={styles.sectionTitle}>
                {locale === 'kz' ? 'Жақында көргендеріңіз' : 'Вы недавно смотрели'}
              </Text>
            </View>
            <TouchableOpacity onPress={() => onNavigateToCatalog()} activeOpacity={0.7}>
              <Text style={styles.sectionLink}>
                {locale === 'kz' ? 'Барлығы' : 'Все'} →
              </Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
            {recentlyViewedProducts.map(product => (
              <HomeProductCard
                key={`recent-${product.id}`}
                product={product}
                selectedStoreId={selectedStoreId}
                locale={locale}
                quantityInCart={cartProductQuantities[product.id] || 0}
                badgeType="none"
                showKaspi={false}
                onSelectProduct={onSelectProduct}
                onIncreaseQuantity={onIncreaseQuantity}
                onDecreaseQuantity={onDecreaseQuantity}
              />
            ))}
          </ScrollView>
        </>
      )}

      {/* Recommended Section: Вас могут заинтересовать */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <View style={[styles.sectionIconBadge, { backgroundColor: '#eff6ff' }]}>
            <Ionicons name="sparkles" size={13} color="#2563eb" />
          </View>
          <Text style={styles.sectionTitle}>
            {locale === 'kz' ? 'Сізге ұнауы мүмкін' : 'Вас могут заинтересовать'}
          </Text>
        </View>
        <TouchableOpacity onPress={() => onNavigateToCatalog()} activeOpacity={0.7}>
          <Text style={styles.sectionLink}>
            {locale === 'kz' ? 'Барлығы' : 'В каталог'} →
          </Text>
        </TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
        {recommendedProducts.map(product => (
          <HomeProductCard
            key={`rec-${product.id}`}
            product={product}
            selectedStoreId={selectedStoreId}
            locale={locale}
            quantityInCart={cartProductQuantities[product.id] || 0}
            badgeType="rec"
            onSelectProduct={onSelectProduct}
            onIncreaseQuantity={onIncreaseQuantity}
            onDecreaseQuantity={onDecreaseQuantity}
          />
        ))}
      </ScrollView>

      {/* New Arrivals Section */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <View style={[styles.sectionIconBadge, { backgroundColor: '#ecfdf5' }]}>
            <Ionicons name="sparkles" size={13} color="#059669" />
          </View>
          <Text style={styles.sectionTitle}>
            {locale === 'kz' ? 'Жаңа түсімдер' : 'Новинки сезона'}
          </Text>
        </View>
        <TouchableOpacity onPress={() => onNavigateToCatalog()} activeOpacity={0.7}>
          <Text style={styles.sectionLink}>
            {locale === 'kz' ? 'Барлығы' : 'В каталог'} →
          </Text>
        </TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
        {newArrivals.map(product => (
          <HomeProductCard
            key={`new-${product.id}`}
            product={product}
            selectedStoreId={selectedStoreId}
            locale={locale}
            quantityInCart={cartProductQuantities[product.id] || 0}
            badgeType="new"
            showKaspi={false}
            onSelectProduct={onSelectProduct}
            onIncreaseQuantity={onIncreaseQuantity}
            onDecreaseQuantity={onDecreaseQuantity}
          />
        ))}
      </ScrollView>

      {/* Bottom spacer */}
      <View style={{ height: 28 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    backgroundColor: '#78350f',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandTitle: { color: '#fef3c7', fontSize: 16, fontWeight: '800', letterSpacing: 0.6 },
  brandSubtitle: { color: '#fde68a', fontSize: 11, marginTop: 1 },
  langBadge: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  langText: { color: '#ffffff', fontSize: 12, fontWeight: '700' },
  storeBanner: {
    backgroundColor: '#fffbeb',
    paddingHorizontal: 16,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#fde68a',
  },
  pinCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  storeInfo: { flex: 1 },
  storeLabel: { fontSize: 10, color: '#92400e', textTransform: 'uppercase', fontWeight: '700' },
  storeName: { fontSize: 12, color: '#451a03', fontWeight: '800', marginTop: 1 },
  changeBadge: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  storeChangeArrow: { fontSize: 11, color: '#b45309', fontWeight: '700' },
  carouselWrapper: {
    marginTop: 10,
    marginBottom: 4,
  },
  carouselContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  heroSlideCard: {
    width: HERO_CARD_WIDTH,
    minHeight: 185,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1.5,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  carouselDotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    marginBottom: 4,
  },
  carouselDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#cbd5e1',
  },
  carouselDotActive: {
    width: 22,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#b45309',
  },
  heroBadgeRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  heroBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroBadgeText: { fontSize: 10, fontWeight: '800' },
  heroBadgeEco: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroBadgeEcoText: { fontSize: 10, fontWeight: '700' },
  heroTitle: { color: '#ffffff', fontSize: 19, fontWeight: '800', marginBottom: 6, letterSpacing: 0.2 },
  heroSubtitle: { color: 'rgba(255,255,255,0.85)', fontSize: 12, lineHeight: 17, marginBottom: 16 },
  heroButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  heroButtonText: { fontSize: 13, fontWeight: '800' },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 18,
    marginBottom: 10,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionIconBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#fef2f2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  sectionLink: { fontSize: 12, color: '#b45309', fontWeight: '700' },
  categoriesRow: { paddingHorizontal: 12, gap: 10 },
  categoryCard: {
    alignItems: 'center',
    width: 70,
    paddingVertical: 6,
  },
  categoryIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  categoryIconText: { fontSize: 24 },
  categoryTitleText: { fontSize: 11, color: '#334155', fontWeight: '600', textAlign: 'center' },
  horizontalList: { paddingHorizontal: 12, gap: 12 },
  productCardH: {
    width: 165,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  productCardInCart: {
    borderColor: '#10b981',
    borderWidth: 1.5,
  },
  imageContainerH: { position: 'relative', width: '100%', height: 160, backgroundColor: '#f1f5f9' },
  productImageH: { width: '100%', height: '100%' },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#dc2626',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  discountText: { color: '#ffffff', fontSize: 10, fontWeight: '800' },
  newBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#047857',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  newBadgeText: { color: '#ffffff', fontSize: 10, fontWeight: '800' },
  recBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#1d4ed8',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  recBadgeText: { color: '#ffffff', fontSize: 10, fontWeight: '800' },
  inCartBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#059669',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 3,
  },
  inCartBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '700',
  },
  productBodyH: { padding: 10 },
  productBodyTopH: { paddingHorizontal: 10, paddingTop: 10 },
  productBodyBottomH: { paddingHorizontal: 10, paddingBottom: 10, paddingTop: 2 },
  stockStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
  stockDot: { width: 6, height: 6, borderRadius: 3 },
  stockTextH: { fontSize: 10, color: '#047857', fontWeight: '600' },
  productTitleH: { fontSize: 12, fontWeight: '600', color: '#1e293b', minHeight: 32, lineHeight: 16 },
  priceRowH: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  productPriceH: { fontSize: 14, fontWeight: '800', color: '#b45309' },
  productOldPriceH: { fontSize: 11, color: '#94a3b8', textDecorationLine: 'line-through' },
  stepperContainerH: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#a7f3d0',
    overflow: 'hidden',
    height: 26,
  },
  stepperBtnH: {
    width: 22,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#d1fae5',
  },
  stepperCountWrapH: {
    minWidth: 18,
    paddingHorizontal: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperCountTextH: {
    fontSize: 11,
    fontWeight: '800',
    color: '#065f46',
  },
  stepperBtnPlusH: {
    backgroundColor: '#059669',
  },
  quickAddBtnH: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  quickAddBtnSuccess: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  kaspiBadgeH: {
    backgroundColor: '#fef2f2',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 6,
    borderWidth: 0.5,
    borderColor: '#fee2e2',
  },
  kaspiTextH: { color: '#dc2626', fontSize: 9, fontWeight: '700' },
});
