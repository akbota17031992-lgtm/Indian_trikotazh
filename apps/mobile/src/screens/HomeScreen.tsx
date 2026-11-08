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
import { Ionicons } from '@expo/vector-icons';
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

      {/* Hero Promo Banner */}
      <View style={styles.heroCard}>
        <View style={styles.heroBadgeRow}>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>⚡ Kaspi Red 0-0-3</Text>
          </View>
          <View style={styles.heroBadgeEco}>
            <Text style={styles.heroBadgeEcoText}>🌿 100% Cotton</Text>
          </View>
        </View>

        <Text style={styles.heroTitle}>
          {locale === 'kz'
            ? 'Табиғи Үнді Мақтасы'
            : 'Натуральный Индийский Хлопок'}
        </Text>
        <Text style={styles.heroSubtitle}>
          {locale === 'kz'
            ? 'Премиум гребенной трикотаж тікелей Мумбаи және Тируппур фабрикаларынан.'
            : 'Премиальный гребенной трикотаж напрямую с фабрик Мумбаи и Тируппура.'}
        </Text>

        <TouchableOpacity
          style={styles.heroButton}
          onPress={() => onNavigateToCatalog()}
          activeOpacity={0.88}
        >
          <Text style={styles.heroButtonText}>
            {locale === 'kz' ? 'Каталогты көру' : 'Перейти в каталог'}
          </Text>
          <Ionicons name="arrow-forward" size={14} color="#451a03" />
        </TouchableOpacity>
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
        {bestsellers.map(product => {
          const stock = product.stockByStore[selectedStoreId] ?? 10;
          return (
            <TouchableOpacity
              key={product.id}
              style={styles.productCardH}
              onPress={() => onSelectProduct(product)}
              activeOpacity={0.88}
            >
              <View style={styles.imageContainerH}>
                <Image source={{ uri: product.imageUrl }} style={styles.productImageH} resizeMode="cover" />
                {product.oldPriceKzt && (
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountText}>
                      -{Math.round(((product.oldPriceKzt - product.priceKzt) / product.oldPriceKzt) * 100)}%
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.productBodyH}>
                <View style={styles.stockStatusRow}>
                  <View style={[styles.stockDot, { backgroundColor: stock > 0 ? '#10b981' : '#f59e0b' }]} />
                  <Text style={styles.stockTextH}>
                    {stock > 0
                      ? locale === 'kz'
                        ? `Қоймада: ${stock} дана`
                        : `В наличии: ${stock} шт.`
                      : locale === 'kz'
                      ? 'Тапсырыспен'
                      : 'Под заказ'}
                  </Text>
                </View>

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
        {newArrivals.map(product => {
          return (
            <TouchableOpacity
              key={product.id}
              style={styles.productCardH}
              onPress={() => onSelectProduct(product)}
              activeOpacity={0.88}
            >
              <View style={styles.imageContainerH}>
                <Image source={{ uri: product.imageUrl }} style={styles.productImageH} resizeMode="cover" />
                <View style={styles.newBadge}>
                  <Text style={styles.newBadgeText}>NEW</Text>
                </View>
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

      {/* Value Propositions / Trust Grid (Clean bottom section) */}
      <View style={styles.trustBox}>
        <View style={styles.trustHeaderRow}>
          <Text style={styles.trustMainTitle}>
            {locale === 'kz'
              ? 'Неге біздің трикотажды таңдайды?'
              : 'Почему выбирают наш трикотаж?'}
          </Text>
        </View>

        <View style={styles.trustGrid}>
          <View style={styles.trustItem}>
            <View style={[styles.trustIconCircle, { backgroundColor: '#ecfdf5' }]}>
              <Text style={styles.trustIconEmoji}>🌱</Text>
            </View>
            <Text style={styles.trustHeading}>100% Эко-хлопок</Text>
            <Text style={styles.trustDesc}>
              {locale === 'kz'
                ? 'Үндістаннан табиғи мақта, аллергия тудырмайды.'
                : 'Прямые поставки из Индии. Гипоаллергенный трикотаж.'}
            </Text>
          </View>

          <View style={styles.trustItem}>
            <View style={[styles.trustIconCircle, { backgroundColor: '#eff6ff' }]}>
              <Text style={styles.trustIconEmoji}>🏬</Text>
            </View>
            <Text style={styles.trustHeading}>16 магазинов</Text>
            <Text style={styles.trustDesc}>
              {locale === 'kz'
                ? 'Алматының барлық ірі СОО-ларында (MEGA, Dostyk).'
                : 'В каждом районе Алматы (MEGA, Dostyk Plaza, Grand Park).'}
            </Text>
          </View>

          <View style={styles.trustItem}>
            <View style={[styles.trustIconCircle, { backgroundColor: '#fef2f2' }]}>
              <Text style={styles.trustIconEmoji}>⚡</Text>
            </View>
            <Text style={styles.trustHeading}>Kaspi Red 0-0-3</Text>
            <Text style={styles.trustDesc}>
              {locale === 'kz'
                ? '3 айға процентсіз бөліп төлеу.'
                : 'Рассрочка без переплат и скрытых комиссий.'}
            </Text>
          </View>

          <View style={styles.trustItem}>
            <View style={[styles.trustIconCircle, { backgroundColor: '#fffbeb' }]}>
              <Text style={styles.trustIconEmoji}>🚚</Text>
            </View>
            <Text style={styles.trustHeading}>Доставка 2 часа</Text>
            <Text style={styles.trustDesc}>
              {locale === 'kz'
                ? 'Алматы бойынша курьермен есікке дейін.'
                : 'Быстрая доставка курьером по всему городу.'}
            </Text>
          </View>
        </View>
      </View>

      {/* Bottom spacer */}
      <View style={{ height: 30 }} />
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
  heroCard: {
    margin: 16,
    marginBottom: 8,
    backgroundColor: '#78350f',
    borderRadius: 18,
    padding: 18,
    shadowColor: '#78350f',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#92400e',
  },
  heroBadgeRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  heroBadge: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  heroBadgeText: { color: '#ffffff', fontSize: 10, fontWeight: '800' },
  heroBadgeEco: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  heroBadgeEcoText: { color: '#fef3c7', fontSize: 10, fontWeight: '700' },
  heroTitle: { color: '#ffffff', fontSize: 20, fontWeight: '800', marginBottom: 6, letterSpacing: 0.2 },
  heroSubtitle: { color: '#fde68a', fontSize: 12, lineHeight: 17, marginBottom: 16 },
  heroButton: {
    backgroundColor: '#f59e0b',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  heroButtonText: { color: '#451a03', fontSize: 13, fontWeight: '800' },
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
  productBodyH: { padding: 10 },
  stockStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
  stockDot: { width: 6, height: 6, borderRadius: 3 },
  stockTextH: { fontSize: 10, color: '#047857', fontWeight: '600' },
  productTitleH: { fontSize: 12, fontWeight: '600', color: '#1e293b', minHeight: 32, lineHeight: 16 },
  priceRowH: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  productPriceH: { fontSize: 14, fontWeight: '800', color: '#b45309' },
  productOldPriceH: { fontSize: 11, color: '#94a3b8', textDecorationLine: 'line-through' },
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
  trustBox: {
    margin: 16,
    marginTop: 22,
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  trustHeaderRow: { marginBottom: 14 },
  trustMainTitle: { fontSize: 15, fontWeight: '800', color: '#0f172a' },
  trustGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  trustItem: {
    width: '48%',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  trustIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  trustIconEmoji: { fontSize: 18 },
  trustHeading: { fontSize: 12, fontWeight: '700', color: '#0f172a', marginBottom: 2 },
  trustDesc: { fontSize: 10, color: '#64748b', lineHeight: 14 },
});
