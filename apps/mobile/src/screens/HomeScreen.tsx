import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { formatKZT, ALMATY_STORES_SEED } from '@india-trikotaj/shared';
import { MOBILE_PRODUCTS } from '../data/mock-products';
import type { MobileProduct } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Props {
  onSelectProduct: (product: MobileProduct) => void;
  onNavigateToCatalog: (category?: string) => void;
  onNavigateToStores: () => void;
  selectedStoreId: string;
  locale: 'ru' | 'kz';
  onToggleLocale: () => void;
}

export function HomeScreen({
  onSelectProduct,
  onNavigateToCatalog,
  onNavigateToStores,
  selectedStoreId,
  locale,
  onToggleLocale,
}: Props) {
  const currentStore =
    ALMATY_STORES_SEED.find((_, i) => `store-almaty-${String(i + 1).padStart(3, '0')}` === selectedStoreId) ||
    ALMATY_STORES_SEED[0]!;

  const bestsellers = MOBILE_PRODUCTS.filter(p => p.isBestseller);
  const newArrivals = MOBILE_PRODUCTS.filter(p => p.isNew);

  const categories = [
    { id: 'all', titleRu: 'Весь каталог', titleKz: 'Барлық каталог', icon: '🛍️' },
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
        <TouchableOpacity style={styles.langBadge} onPress={onToggleLocale}>
          <Text style={styles.langText}>{locale === 'ru' ? 'KZ 🇰🇿' : 'RU 🇷🇺'}</Text>
        </TouchableOpacity>
      </View>

      {/* Selected Branch Banner */}
      <TouchableOpacity style={styles.storeBanner} onPress={onNavigateToStores} activeOpacity={0.85}>
        <Text style={styles.storePin}>📍</Text>
        <View style={styles.storeInfo}>
          <Text style={styles.storeLabel}>
            {locale === 'kz' ? 'Сіздің филиалыңыз (16 дүкен):' : 'Ваш филиал (из 16 по Алматы):'}
          </Text>
          <Text style={styles.storeName}>
            {locale === 'kz' ? currentStore.nameKz : currentStore.nameRu}
          </Text>
        </View>
        <Text style={styles.storeChangeArrow}>
          {locale === 'kz' ? 'Өзгерту →' : 'Сменить →'}
        </Text>
      </TouchableOpacity>

      {/* Hero Promo Banner */}
      <View style={styles.heroCard}>
        <View style={styles.heroBadge}>
          <Text style={styles.heroBadgeText}>⚡ Kaspi Red 0-0-3</Text>
        </View>
        <Text style={styles.heroTitle}>
          {locale === 'kz'
            ? '100% Табиғи Үнді Мақтасы'
            : '100% Натуральный Индийский Хлопок'}
        </Text>
        <Text style={styles.heroSubtitle}>
          {locale === 'kz'
            ? 'Жоғары сапалы трикотаж, дымқыл тартпайтын және дем алатын маталар.'
            : 'Премиальный гребенной трикотаж прямо из фабрик Мумбаи и Тируппура.'}
        </Text>
        <TouchableOpacity
          style={styles.heroButton}
          onPress={() => onNavigateToCatalog()}
          activeOpacity={0.9}
        >
          <Text style={styles.heroButtonText}>
            {locale === 'kz' ? 'Каталогқа өту →' : 'Смотреть коллекцию →'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Categories Horizontal Circles */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {locale === 'kz' ? 'Санаттар' : 'Категории'}
        </Text>
        <TouchableOpacity onPress={() => onNavigateToCatalog()}>
          <Text style={styles.sectionLink}>
            {locale === 'kz' ? 'Барлығы' : 'Все'}
          </Text>
        </TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesRow}>
        {categories.map(c => (
          <TouchableOpacity
            key={c.id}
            style={styles.categoryItem}
            onPress={() => onNavigateToCatalog(c.id === 'all' ? undefined : c.id)}
            activeOpacity={0.8}
          >
            <View style={styles.categoryCircle}>
              <Text style={styles.categoryIcon}>{c.icon}</Text>
            </View>
            <Text style={styles.categoryLabel} numberOfLines={1}>
              {locale === 'kz' ? c.titleKz : c.titleRu}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Bestsellers Section */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.fireEmoji}>🔥</Text>
          <Text style={styles.sectionTitle}>
            {locale === 'kz' ? 'Хит тауарлар' : 'Хиты продаж'}
          </Text>
        </View>
        <TouchableOpacity onPress={() => onNavigateToCatalog()}>
          <Text style={styles.sectionLink}>
            {locale === 'kz' ? 'Барлығы →' : 'Все товары →'}
          </Text>
        </TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
        {bestsellers.map(product => {
          const stock = product.stockByStore[selectedStoreId] ?? 10;
          return (
            <TouchableOpacity
              key={product.id}
              style={styles.productCardH}
              onPress={() => onSelectProduct(product)}
              activeOpacity={0.85}
            >
              <Image source={{ uri: product.imageUrl }} style={styles.productImageH} />
              {product.oldPriceKzt && (
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>
                    -{Math.round(((product.oldPriceKzt - product.priceKzt) / product.oldPriceKzt) * 100)}%
                  </Text>
                </View>
              )}
              <View style={styles.productBodyH}>
                <Text style={styles.stockTextH}>
                  {stock > 0
                    ? locale === 'kz'
                      ? `✓ Қоймада бар (${stock} дана)`
                      : `✓ В наличии (${stock} шт)`
                    : locale === 'kz'
                    ? 'Тапсырыспен'
                    : 'Под заказ'}
                </Text>
                <Text style={styles.productTitleH} numberOfLines={2}>
                  {locale === 'kz' ? product.titleKz : product.titleRu}
                </Text>
                <View style={styles.priceRowH}>
                  <Text style={styles.productPriceH}>{formatKZT(product.priceKzt)}</Text>
                  {product.oldPriceKzt && (
                    <Text style={styles.productOldPriceH}>{formatKZT(product.oldPriceKzt)}</Text>
                  )}
                </View>
                <View style={styles.kaspiBadgeH}>
                  <Text style={styles.kaspiTextH}>
                    Kaspi Red {formatKZT(Math.round(product.priceKzt / 3))} x 3
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* New Arrivals Section */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.fireEmoji}>✨</Text>
          <Text style={styles.sectionTitle}>
            {locale === 'kz' ? 'Жаңа түсімдер' : 'Новинки сезона'}
          </Text>
        </View>
        <TouchableOpacity onPress={() => onNavigateToCatalog()}>
          <Text style={styles.sectionLink}>
            {locale === 'kz' ? 'Каталог →' : 'В каталог →'}
          </Text>
        </TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
        {newArrivals.map(product => {
          return (
            <TouchableOpacity
              key={product.id}
              style={styles.productCardH}
              onPress={() => onSelectProduct(product)}
              activeOpacity={0.85}
            >
              <Image source={{ uri: product.imageUrl }} style={styles.productImageH} />
              <View style={styles.newBadge}>
                <Text style={styles.newBadgeText}>NEW</Text>
              </View>
              <View style={styles.productBodyH}>
                <Text style={styles.productTitleH} numberOfLines={2}>
                  {locale === 'kz' ? product.titleKz : product.titleRu}
                </Text>
                <Text style={styles.productPriceH}>{formatKZT(product.priceKzt)}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Value Propositions / Trust Grid (Moved to bottom) */}
      <View style={styles.trustBox}>
        <Text style={styles.trustMainTitle}>
          {locale === 'kz'
            ? 'Неге біздің трикотажды таңдайды?'
            : 'Почему выбирают наш трикотаж?'}
        </Text>
        <View style={styles.trustGrid}>
          <View style={styles.trustItem}>
            <Text style={styles.trustIcon}>🌱</Text>
            <Text style={styles.trustHeading}>100% Эко-хлопок</Text>
            <Text style={styles.trustDesc}>
              {locale === 'kz'
                ? 'Үндістаннан тікелей табиғи мақта, аллергия тудырмайды.'
                : 'Прямые поставки из Индии. Гипоаллергенный гребенной хлопок.'}
            </Text>
          </View>
          <View style={styles.trustItem}>
            <Text style={styles.trustIcon}>🏬</Text>
            <Text style={styles.trustHeading}>16 магазинов</Text>
            <Text style={styles.trustDesc}>
              {locale === 'kz'
                ? 'Алматының барлық ірі СОО-ларында орналасқан.'
                : 'В каждом районе Алматы (MEGA, Dostyk Plaza, Grand Park...).'}
            </Text>
          </View>
          <View style={styles.trustItem}>
            <Text style={styles.trustIcon}>⚡</Text>
            <Text style={styles.trustHeading}>Kaspi Red 0-0-3</Text>
            <Text style={styles.trustDesc}>
              {locale === 'kz'
                ? '3 айға процентсіз және үстемесіз бөліп төлеу.'
                : 'Рассрочка без переплат и скрытых комиссий.'}
            </Text>
          </View>
          <View style={styles.trustItem}>
            <Text style={styles.trustIcon}>🚚</Text>
            <Text style={styles.trustHeading}>Доставка за 2 часа</Text>
            <Text style={styles.trustDesc}>
              {locale === 'kz'
                ? 'Алматы бойынша курьер арқылы үйіңізге дейін.'
                : 'Быстрая доставка курьером до двери по всему городу.'}
            </Text>
          </View>
        </View>
      </View>

      {/* Bottom spacer */}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#78350f',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandTitle: { color: '#fef3c7', fontSize: 17, fontWeight: '800', letterSpacing: 0.5 },
  brandSubtitle: { color: '#fde68a', fontSize: 11, marginTop: 2 },
  langBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  langText: { color: '#ffffff', fontSize: 12, fontWeight: '700' },
  storeBanner: {
    backgroundColor: '#fffbeb',
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#fde68a',
  },
  storePin: { fontSize: 18, marginRight: 8 },
  storeInfo: { flex: 1 },
  storeLabel: { fontSize: 10, color: '#92400e', textTransform: 'uppercase', fontWeight: '600' },
  storeName: { fontSize: 13, color: '#451a03', fontWeight: '700', marginTop: 1 },
  storeChangeArrow: { fontSize: 12, color: '#b45309', fontWeight: '700' },
  heroCard: {
    margin: 16,
    backgroundColor: '#78350f',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  heroBadge: {
    backgroundColor: '#dc2626',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 10,
  },
  heroBadgeText: { color: '#ffffff', fontSize: 11, fontWeight: '800' },
  heroTitle: { color: '#ffffff', fontSize: 20, fontWeight: '800', marginBottom: 6 },
  heroSubtitle: { color: '#fde68a', fontSize: 13, lineHeight: 18, marginBottom: 16 },
  heroButton: {
    backgroundColor: '#f59e0b',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  heroButtonText: { color: '#451a03', fontSize: 13, fontWeight: '700' },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 12,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center' },
  fireEmoji: { fontSize: 18, marginRight: 6 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: '#111827' },
  sectionLink: { fontSize: 13, color: '#b45309', fontWeight: '600' },
  categoriesRow: { paddingHorizontal: 12, gap: 12 },
  categoryItem: { alignItems: 'center', width: 72 },
  categoryCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  categoryIcon: { fontSize: 26 },
  categoryLabel: { fontSize: 11, color: '#374151', fontWeight: '600', textAlign: 'center' },
  horizontalList: { paddingHorizontal: 12, gap: 12 },
  productCardH: {
    width: 170,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  productImageH: { width: '100%', height: 160, backgroundColor: '#f3f4f6' },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#dc2626',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountText: { color: '#ffffff', fontSize: 10, fontWeight: '800' },
  newBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#047857',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  newBadgeText: { color: '#ffffff', fontSize: 10, fontWeight: '800' },
  productBodyH: { padding: 10 },
  stockTextH: { fontSize: 10, color: '#047857', fontWeight: '600', marginBottom: 4 },
  productTitleH: { fontSize: 12, fontWeight: '600', color: '#1f2937', minHeight: 32 },
  priceRowH: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  productPriceH: { fontSize: 14, fontWeight: '800', color: '#b45309' },
  productOldPriceH: { fontSize: 11, color: '#9ca3af', textDecorationLine: 'line-through' },
  kaspiBadgeH: {
    backgroundColor: '#fef2f2',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 6,
  },
  kaspiTextH: { color: '#dc2626', fontSize: 9, fontWeight: '700' },
  trustBox: {
    margin: 16,
    marginTop: 20,
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  trustMainTitle: { fontSize: 15, fontWeight: '800', color: '#1f2937', marginBottom: 12 },
  trustGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  trustItem: {
    width: '48%',
    backgroundColor: '#f9fafb',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  trustIcon: { fontSize: 24, marginBottom: 4 },
  trustHeading: { fontSize: 12, fontWeight: '700', color: '#111827', marginBottom: 2 },
  trustDesc: { fontSize: 10, color: '#6b7280', lineHeight: 14 },
});

