import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatKZT, ALMATY_STORES_SEED } from '@india-trikotaj/shared';
import { MOBILE_PRODUCTS } from '../data/mock-products';
import type { MobileProduct } from '../types';

interface Props {
  onSelectProduct: (product: MobileProduct) => void;
  cartProductQuantities: Record<string, number>;
  onIncreaseQuantity: (product: MobileProduct) => void;
  onDecreaseQuantity: (productId: string) => void;
  selectedStoreId: string;
  onSelectStore: (storeId: string) => void;
  locale: 'ru' | 'kz';
  onToggleLocale: () => void;
  initialCategory?: string;
  initialSearchQuery?: string;
}

type SortType = 'popular' | 'price_asc' | 'price_desc' | 'discount';

export function CatalogScreen({
  onSelectProduct,
  cartProductQuantities,
  onIncreaseQuantity,
  onDecreaseQuantity,
  selectedStoreId,
  onSelectStore,
  locale,
  onToggleLocale,
  initialCategory,
  initialSearchQuery,
}: Props) {
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery || '');
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'all');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortType>('popular');

  useEffect(() => {
    if (initialCategory !== undefined) setSelectedCategory(initialCategory);
  }, [initialCategory]);

  useEffect(() => {
    if (initialSearchQuery !== undefined) setSearchQuery(initialSearchQuery);
  }, [initialSearchQuery]);

  const categories = [
    { id: 'all', titleRu: 'Все товары', titleKz: 'Барлығы' },
    { id: 't-shirts', titleRu: 'Футболки', titleKz: 'Футболкалар' },
    { id: 'tunics', titleRu: 'Туники', titleKz: 'Туникалар' },
    { id: 'pajamas', titleRu: 'Пижамы', titleKz: 'Пижамалар' },
    { id: 'long-sleeves', titleRu: 'Лонгсливы', titleKz: 'Лонгсливтер' },
    { id: 'robes', titleRu: 'Халаты', titleKz: 'Шапандар' },
    { id: 'thermal-underwear', titleRu: 'Термобелье', titleKz: 'Термоішкиім' },
  ];

  let filtered = MOBILE_PRODUCTS.filter(p => {
    const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;
    const title = locale === 'kz' ? p.titleKz : p.titleRu;
    const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase());
    const stockInStore = p.stockByStore[selectedStoreId] ?? 0;
    const matchesStock = !inStockOnly || stockInStore > 0;
    return matchesCat && matchesSearch && matchesStock;
  });

  // Sorting logic
  filtered = [...filtered].sort((a, b) => {
    if (sortBy === 'price_asc') return a.priceKzt - b.priceKzt;
    if (sortBy === 'price_desc') return b.priceKzt - a.priceKzt;
    if (sortBy === 'discount') {
      const discA = a.oldPriceKzt ? a.oldPriceKzt - a.priceKzt : 0;
      const discB = b.oldPriceKzt ? b.oldPriceKzt - b.priceKzt : 0;
      return discB - discA;
    }
    return (b.isBestseller ? 1 : 0) - (a.isBestseller ? 1 : 0);
  });

  const currentStore =
    ALMATY_STORES_SEED.find((_, i) => `store-almaty-${String(i + 1).padStart(3, '0')}` === selectedStoreId) ||
    ALMATY_STORES_SEED[0]!;

  const sortLabels: Record<SortType, { ru: string; kz: string }> = {
    popular: { ru: 'По популярности', kz: 'Танымалдығы бойынша' },
    price_asc: { ru: 'Сначала дешевле', kz: 'Алдымен арзандары' },
    price_desc: { ru: 'Сначала дороже', kz: 'Алдымен қымбаттары' },
    discount: { ru: 'По скидке', kz: 'Жеңілдік бойынша' },
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.brandTitle}>КАТАЛОГ ТОВАРОВ</Text>
          <Text style={styles.brandSubtitle}>
            {locale === 'kz' ? `${filtered.length} тауар табылды` : `${filtered.length} моделей в наличии`}
          </Text>
        </View>
        <TouchableOpacity style={styles.langBadge} onPress={onToggleLocale} activeOpacity={0.8}>
          <Text style={styles.langText}>{locale === 'ru' ? 'KZ 🇰🇿' : 'RU 🇷🇺'}</Text>
        </TouchableOpacity>
      </View>

      {/* Selected Store Bar */}
      <View style={styles.storeBar}>
        <Ionicons name="location-sharp" size={14} color="#b45309" style={{ marginRight: 6 }} />
        <View style={styles.storeInfo}>
          <Text style={styles.storeLabel}>
            {locale === 'kz' ? 'Филиалдағы қалдықтар:' : 'Наличие в филиале:'}
          </Text>
          <Text style={styles.storeName}>{locale === 'kz' ? currentStore.nameKz : currentStore.nameRu}</Text>
        </View>
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInner}>
          <Ionicons name="search" size={16} color="#94a3b8" style={{ marginRight: 8 }} />
          <TextInput
            placeholder={locale === 'kz' ? 'Тауарларды іздеу...' : 'Поиск по трикотажу...'}
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close-circle" size={16} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category Horizontal Pills */}
      <View style={{ marginBottom: 4 }}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          keyExtractor={c => c.id}
          contentContainerStyle={styles.categoryList}
          renderItem={({ item: c }) => {
            const isActive = selectedCategory === c.id;
            return (
              <TouchableOpacity
                style={[styles.categoryPill, isActive && styles.categoryPillActive]}
                onPress={() => setSelectedCategory(c.id)}
                activeOpacity={0.8}
              >
                <Text style={[styles.categoryText, isActive && styles.categoryTextActive]}>
                  {locale === 'kz' ? c.titleKz : c.titleRu}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Filter and Sort Toolbar */}
      <View style={styles.filterToolbar}>
        <TouchableOpacity
          style={[styles.stockFilterBtn, inStockOnly && styles.stockFilterBtnActive]}
          onPress={() => setInStockOnly(!inStockOnly)}
          activeOpacity={0.8}
        >
          <Ionicons
            name={inStockOnly ? 'checkbox' : 'square-outline'}
            size={14}
            color={inStockOnly ? '#059669' : '#64748b'}
            style={{ marginRight: 5 }}
          />
          <Text style={[styles.stockFilterText, inStockOnly && styles.stockFilterTextActive]}>
            {locale === 'kz' ? 'Қоймадағылар' : 'В наличии'}
          </Text>
        </TouchableOpacity>

        {/* Sort Pill */}
        <TouchableOpacity
          style={styles.sortBtn}
          onPress={() => {
            const sequence: SortType[] = ['popular', 'price_asc', 'price_desc', 'discount'];
            const nextIdx = (sequence.indexOf(sortBy) + 1) % sequence.length;
            setSortBy(sequence[nextIdx]!);
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="swap-vertical" size={13} color="#475569" style={{ marginRight: 4 }} />
          <Text style={styles.sortBtnText}>
            {locale === 'kz' ? sortLabels[sortBy].kz : sortLabels[sortBy].ru}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Products Grid */}
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🔍</Text>
            <Text style={styles.emptyText}>
              {locale === 'kz' ? 'Тауарлар табылмады' : 'Товары не найдены'}
            </Text>
            <TouchableOpacity
              style={styles.resetFilterBtn}
              onPress={() => {
                setSelectedCategory('all');
                setSearchQuery('');
                setInStockOnly(false);
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.resetFilterText}>
                {locale === 'kz' ? 'Сүзгілерді тазарту' : 'Сбросить фильтры'}
              </Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => {
          const stock = item.stockByStore[selectedStoreId] ?? 0;
          const quantityInCart = cartProductQuantities[item.id] || 0;
          return (
            <View style={[styles.card, quantityInCart > 0 && styles.cardInCart]}>
              <TouchableOpacity
                onPress={() => onSelectProduct(item)}
                activeOpacity={0.88}
              >
                <View style={styles.cardImageContainer}>
                  <Image source={{ uri: item.imageUrl }} style={styles.cardImage} resizeMode="cover" />

                  {/* Discount Badge */}
                  {item.oldPriceKzt && (
                    <View style={styles.discountBadge}>
                      <Text style={styles.discountBadgeText}>
                        -{Math.round(((item.oldPriceKzt - item.priceKzt) / item.oldPriceKzt) * 100)}%
                      </Text>
                    </View>
                  )}

                  {/* In-Cart Badge Marker */}
                  {quantityInCart > 0 && (
                    <View style={styles.inCartBadge}>
                      <Ionicons name="checkmark-circle" size={11} color="#ffffff" />
                      <Text style={styles.inCartBadgeText}>
                        {quantityInCart} {locale === 'kz' ? 'себетте' : 'в корзине'}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.cardBodyTop}>
                  <View style={styles.stockBadgeRow}>
                    <View style={[styles.stockDot, { backgroundColor: stock > 0 ? '#10b981' : '#f59e0b' }]} />
                    <Text style={[styles.stockText, stock === 0 && styles.stockTextZero]}>
                      {stock > 0
                        ? locale === 'kz'
                          ? `Қоймада: ${stock} дана`
                          : `В наличии: ${stock} шт.`
                        : locale === 'kz'
                        ? 'Басқа дүкендерде бар'
                        : 'В других филиалах'}
                    </Text>
                  </View>

                  <Text style={styles.cardTitle} numberOfLines={2}>
                    {locale === 'kz' ? item.titleKz : item.titleRu}
                  </Text>
                </View>
              </TouchableOpacity>

              <View style={styles.cardBodyBottom}>
                <View style={styles.priceRow}>
                  <View style={{ flex: 1, paddingRight: 4 }}>
                    <Text style={styles.cardPrice}>{formatKZT(item.priceKzt)}</Text>
                    {item.oldPriceKzt && (
                      <Text style={styles.cardOldPrice}>{formatKZT(item.oldPriceKzt)}</Text>
                    )}
                  </View>

                  {quantityInCart > 0 ? (
                    <View style={styles.stepperContainer}>
                      <TouchableOpacity
                        style={styles.stepperBtn}
                        onPress={() => onDecreaseQuantity(item.id)}
                        activeOpacity={0.7}
                        hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                      >
                        <Ionicons name="remove" size={13} color="#065f46" />
                      </TouchableOpacity>

                      <View style={styles.stepperCountWrap}>
                        <Text style={styles.stepperCountText}>{quantityInCart}</Text>
                      </View>

                      <TouchableOpacity
                        style={[styles.stepperBtn, styles.stepperBtnPlus]}
                        onPress={() => onIncreaseQuantity(item)}
                        activeOpacity={0.7}
                        hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                      >
                        <Ionicons name="add" size={13} color="#ffffff" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.quickAddBtn}
                      onPress={() => onIncreaseQuantity(item)}
                      activeOpacity={0.8}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <Ionicons
                        name="cart"
                        size={15}
                        color="#b45309"
                      />
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.kaspiRedBadge}>
                  <Text style={styles.kaspiRedText}>
                    Kaspi Red {formatKZT(Math.round(item.priceKzt / 3))} x 3
                  </Text>
                </View>
              </View>
            </View>
          );
        }}
      />
    </View>
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
  brandTitle: { color: '#fef3c7', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
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
  storeBar: {
    backgroundColor: '#fffbeb',
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#fde68a',
  },
  storeInfo: { flex: 1 },
  storeLabel: { fontSize: 10, color: '#92400e', textTransform: 'uppercase', fontWeight: '700' },
  storeName: { fontSize: 12, color: '#451a03', fontWeight: '800' },
  searchContainer: { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 6 },
  searchInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0f172a',
    padding: 0,
  },
  categoryList: { paddingHorizontal: 14, paddingVertical: 8, gap: 8 },
  categoryPill: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  categoryPillActive: { backgroundColor: '#b45309', borderColor: '#b45309' },
  categoryText: { fontSize: 12, color: '#475569', fontWeight: '600' },
  categoryTextActive: { color: '#ffffff', fontWeight: '700' },
  filterToolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingBottom: 8,
    gap: 8,
  },
  stockFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  stockFilterBtnActive: { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' },
  stockFilterText: { fontSize: 11, color: '#475569', fontWeight: '600' },
  stockFilterTextActive: { color: '#047857', fontWeight: '700' },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  sortBtnText: { fontSize: 11, color: '#334155', fontWeight: '600' },
  listContent: { paddingHorizontal: 10, paddingBottom: 24 },
  card: {
    flex: 1,
    margin: 4,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardInCart: {
    borderColor: '#10b981',
    borderWidth: 1.5,
  },
  cardImageContainer: { position: 'relative', width: '100%', height: 165, backgroundColor: '#f1f5f9' },
  cardImage: { width: '100%', height: '100%' },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#dc2626',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  discountBadgeText: { color: '#ffffff', fontSize: 10, fontWeight: '800' },
  inCartBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#059669',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 12,
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
    fontSize: 10,
    fontWeight: '700',
  },
  cardBody: { padding: 10 },
  cardBodyTop: { paddingHorizontal: 10, paddingTop: 10 },
  cardBodyBottom: { paddingHorizontal: 10, paddingBottom: 10, paddingTop: 2 },
  stockBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
  stockDot: { width: 6, height: 6, borderRadius: 3 },
  stockText: { color: '#047857', fontSize: 10, fontWeight: '600' },
  stockTextZero: { color: '#9a3412' },
  cardTitle: { fontSize: 12, fontWeight: '600', color: '#1e293b', minHeight: 32, lineHeight: 16 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  cardPrice: { fontSize: 14, fontWeight: '800', color: '#b45309' },
  cardOldPrice: { fontSize: 11, color: '#94a3b8', textDecorationLine: 'line-through' },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#a7f3d0',
    overflow: 'hidden',
    height: 28,
  },
  stepperBtn: {
    width: 24,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#d1fae5',
  },
  stepperCountWrap: {
    minWidth: 20,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperCountText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#065f46',
  },
  stepperBtnPlus: {
    backgroundColor: '#059669',
  },
  quickAddBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kaspiRedBadge: {
    backgroundColor: '#fef2f2',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 6,
    borderWidth: 0.5,
    borderColor: '#fee2e2',
  },
  kaspiRedText: { color: '#dc2626', fontSize: 9, fontWeight: '700' },
  emptyContainer: { alignItems: 'center', paddingVertical: 40 },
  emptyEmoji: { fontSize: 40, marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#64748b', fontWeight: '600' },
  resetFilterBtn: {
    marginTop: 12,
    backgroundColor: '#b45309',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  resetFilterText: { color: '#ffffff', fontSize: 12, fontWeight: '700' },
});
