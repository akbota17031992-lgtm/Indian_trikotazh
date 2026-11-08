import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from 'react-native';
import { formatKZT, ALMATY_STORES_SEED } from '@india-trikotaj/shared';
import { MOBILE_PRODUCTS } from '../data/mock-products';
import type { MobileProduct } from '../types';

interface Props {
  onSelectProduct: (product: MobileProduct) => void;
  selectedStoreId: string;
  onSelectStore: (storeId: string) => void;
  locale: 'ru' | 'kz';
  onToggleLocale: () => void;
  initialCategory?: string;
}

type SortType = 'popular' | 'price_asc' | 'price_desc' | 'discount';

export function CatalogScreen({
  onSelectProduct,
  selectedStoreId,
  onSelectStore,
  locale,
  onToggleLocale,
  initialCategory,
}: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'all');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortType>('popular');
  const [isSortModalOpen, setIsSortModalOpen] = useState(false);

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

  // Sorting
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
    discount: { ru: 'По размеру скидки', kz: 'Жеңілдік бойынша' },
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.brandTitle}>КАТАЛОГ ТОВАРОВ</Text>
          <Text style={styles.brandSubtitle}>
            {locale === 'kz' ? `${filtered.length} тауар табылды` : `${filtered.length} товаров найдено`}
          </Text>
        </View>
        <TouchableOpacity style={styles.langBadge} onPress={onToggleLocale}>
          <Text style={styles.langText}>{locale === 'ru' ? 'KZ 🇰🇿' : 'RU 🇷🇺'}</Text>
        </TouchableOpacity>
      </View>

      {/* Selected Store Bar */}
      <View style={styles.storeBar}>
        <Text style={styles.storeIcon}>📍</Text>
        <View style={styles.storeInfo}>
          <Text style={styles.storeLabel}>{locale === 'kz' ? 'Филиалдағы қалдықтар:' : 'Остатки в филиале:'}</Text>
          <Text style={styles.storeName}>{locale === 'kz' ? currentStore.nameKz : currentStore.nameRu}</Text>
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <TextInput
          placeholder={locale === 'kz' ? 'Тауарларды іздеу...' : 'Поиск по трикотажу...'}
          placeholderTextColor="#9ca3af"
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity style={styles.clearSearchBtn} onPress={() => setSearchQuery('')}>
            <Text style={styles.clearSearchText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Category Pills */}
      <View>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          keyExtractor={c => c.id}
          contentContainerStyle={styles.categoryList}
          renderItem={({ item: c }) => (
            <TouchableOpacity
              style={[styles.categoryPill, selectedCategory === c.id && styles.categoryPillActive]}
              onPress={() => setSelectedCategory(c.id)}
            >
              <Text style={[styles.categoryText, selectedCategory === c.id && styles.categoryTextActive]}>
                {locale === 'kz' ? c.titleKz : c.titleRu}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Filter and Sort Toolbar */}
      <View style={styles.filterToolbar}>
        <TouchableOpacity
          style={[styles.stockFilterBtn, inStockOnly && styles.stockFilterBtnActive]}
          onPress={() => setInStockOnly(!inStockOnly)}
        >
          <Text style={[styles.stockFilterText, inStockOnly && styles.stockFilterTextActive]}>
            {inStockOnly ? '✓ В наличии' : '○ Только в наличии'}
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
        >
          <Text style={styles.sortBtnText}>
            ↕ {locale === 'kz' ? sortLabels[sortBy].kz : sortLabels[sortBy].ru}
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
            >
              <Text style={styles.resetFilterText}>
                {locale === 'kz' ? 'Сүзгілерді тазарту' : 'Сбросить фильтры'}
              </Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => {
          const stock = item.stockByStore[selectedStoreId] ?? 0;
          return (
            <TouchableOpacity style={styles.card} onPress={() => onSelectProduct(item)} activeOpacity={0.85}>
              <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />

              {/* Discount / Bestseller Badges */}
              {item.oldPriceKzt && (
                <View style={styles.discountBadge}>
                  <Text style={styles.discountBadgeText}>
                    -{Math.round(((item.oldPriceKzt - item.priceKzt) / item.oldPriceKzt) * 100)}%
                  </Text>
                </View>
              )}

              <View style={styles.cardBody}>
                <View style={styles.stockBadge}>
                  <Text style={[styles.stockText, stock === 0 && styles.stockTextZero]}>
                    {stock > 0
                      ? locale === 'kz'
                        ? `Қоймада: ${stock} дана`
                        : `В наличии: ${stock} шт.`
                      : locale === 'kz'
                      ? 'Басқа дүкендерде бар'
                      : 'В других магазинах'}
                  </Text>
                </View>
                <Text style={styles.cardTitle} numberOfLines={2}>
                  {locale === 'kz' ? item.titleKz : item.titleRu}
                </Text>
                <View style={styles.priceRow}>
                  <Text style={styles.cardPrice}>{formatKZT(item.priceKzt)}</Text>
                  {item.oldPriceKzt && (
                    <Text style={styles.cardOldPrice}>{formatKZT(item.oldPriceKzt)}</Text>
                  )}
                </View>
                <View style={styles.kaspiRedBadge}>
                  <Text style={styles.kaspiRedText}>
                    Kaspi Red {formatKZT(Math.round(item.priceKzt / 3))} x 3
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: '#78350f',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandTitle: { color: '#fef3c7', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
  brandSubtitle: { color: '#fde68a', fontSize: 11, marginTop: 1 },
  langBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  langText: { color: '#ffffff', fontSize: 12, fontWeight: '700' },
  storeBar: {
    backgroundColor: '#fffbeb',
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#fef3c7',
  },
  storeIcon: { fontSize: 16, marginRight: 8 },
  storeInfo: { flex: 1 },
  storeLabel: { fontSize: 10, color: '#92400e', textTransform: 'uppercase', fontWeight: '600' },
  storeName: { fontSize: 12, color: '#451a03', fontWeight: '700' },
  searchContainer: { paddingHorizontal: 16, paddingTop: 10, position: 'relative' },
  searchInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    paddingRight: 32,
    fontSize: 13,
    color: '#111827',
  },
  clearSearchBtn: { position: 'absolute', right: 26, top: 18 },
  clearSearchText: { color: '#9ca3af', fontSize: 14, fontWeight: '700' },
  categoryList: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  categoryPill: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryPillActive: { backgroundColor: '#b45309', borderColor: '#b45309' },
  categoryText: { fontSize: 12, color: '#4b5563', fontWeight: '500' },
  categoryTextActive: { color: '#ffffff', fontWeight: '700' },
  filterToolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  stockFilterBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
  },
  stockFilterBtnActive: { backgroundColor: '#ecfdf5', borderColor: '#10b981' },
  stockFilterText: { fontSize: 11, color: '#4b5563', fontWeight: '600' },
  stockFilterTextActive: { color: '#047857' },
  sortBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
  },
  sortBtnText: { fontSize: 11, color: '#374151', fontWeight: '600' },
  listContent: { paddingHorizontal: 12, paddingBottom: 24 },
  card: {
    flex: 1,
    margin: 4,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  cardImage: { width: '100%', height: 160, backgroundColor: '#f3f4f6' },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#dc2626',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountBadgeText: { color: '#ffffff', fontSize: 10, fontWeight: '800' },
  cardBody: { padding: 10 },
  stockBadge: {
    backgroundColor: '#ecfdf5',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 6,
  },
  stockText: { color: '#047857', fontSize: 10, fontWeight: '600' },
  stockTextZero: { color: '#9a3412' },
  cardTitle: { fontSize: 12, fontWeight: '600', color: '#1f2937', minHeight: 32 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  cardPrice: { fontSize: 14, fontWeight: '800', color: '#b45309' },
  cardOldPrice: { fontSize: 11, color: '#9ca3af', textDecorationLine: 'line-through' },
  kaspiRedBadge: {
    backgroundColor: '#fef2f2',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 6,
  },
  kaspiRedText: { color: '#dc2626', fontSize: 10, fontWeight: '700' },
  emptyContainer: { alignItems: 'center', paddingVertical: 40 },
  emptyEmoji: { fontSize: 40, marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#6b7280', fontWeight: '600' },
  resetFilterBtn: {
    marginTop: 12,
    backgroundColor: '#b45309',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  resetFilterText: { color: '#ffffff', fontSize: 12, fontWeight: '700' },
});
