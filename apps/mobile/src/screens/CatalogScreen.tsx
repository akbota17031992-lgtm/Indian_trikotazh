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
}

export function CatalogScreen({
  onSelectProduct,
  selectedStoreId,
  onSelectStore,
  locale,
  onToggleLocale,
}: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', titleRu: 'Все товары', titleKz: 'Барлығы' },
    { id: 't-shirts', titleRu: 'Футболки', titleKz: 'Футболкалар' },
    { id: 'tunics', titleRu: 'Туники', titleKz: 'Туникалар' },
    { id: 'pajamas', titleRu: 'Пижамы', titleKz: 'Пижамалар' },
    { id: 'textiles', titleRu: 'Текстиль', titleKz: 'Текстиль' },
  ];

  const filtered = MOBILE_PRODUCTS.filter(p => {
    const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;
    const title = locale === 'kz' ? p.titleKz : p.titleRu;
    const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const currentStore =
    ALMATY_STORES_SEED.find((_, i) => `store-almaty-${String(i + 1).padStart(3, '0')}` === selectedStoreId) ||
    ALMATY_STORES_SEED[0]!;

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.brandTitle}>ИНДИЙСКИЙ ТРИКОТАЖ</Text>
          <Text style={styles.brandSubtitle}>Алматы • 16 филиалов</Text>
        </View>
        <TouchableOpacity style={styles.langBadge} onPress={onToggleLocale}>
          <Text style={styles.langText}>{locale === 'ru' ? 'KZ 🇰🇿' : 'RU 🇷🇺'}</Text>
        </TouchableOpacity>
      </View>

      {/* Selected Store Bar */}
      <View style={styles.storeBar}>
        <Text style={styles.storeIcon}>📍</Text>
        <View style={styles.storeInfo}>
          <Text style={styles.storeLabel}>{locale === 'kz' ? 'Таңдалған дүкен:' : 'Магазин получения:'}</Text>
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
      </View>

      {/* Category Pills */}
      <View style={styles.categoryList}>
        {categories.map(c => (
          <TouchableOpacity
            key={c.id}
            style={[styles.categoryPill, selectedCategory === c.id && styles.categoryPillActive]}
            onPress={() => setSelectedCategory(c.id)}
          >
            <Text style={[styles.categoryText, selectedCategory === c.id && styles.categoryTextActive]}>
              {locale === 'kz' ? c.titleKz : c.titleRu}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Products Grid */}
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const stock = item.stockByStore[selectedStoreId] ?? 12;
          return (
            <TouchableOpacity style={styles.card} onPress={() => onSelectProduct(item)} activeOpacity={0.85}>
              <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
              <View style={styles.cardBody}>
                <View style={styles.stockBadge}>
                  <Text style={styles.stockText}>
                    {stock > 0
                      ? locale === 'kz'
                        ? `Қоймада: ${stock} дана`
                        : `В наличии: ${stock} шт.`
                      : locale === 'kz'
                      ? 'Таусылды'
                      : 'Под заказ'}
                  </Text>
                </View>
                <Text style={styles.cardTitle} numberOfLines={2}>
                  {locale === 'kz' ? item.titleKz : item.titleRu}
                </Text>
                <Text style={styles.cardPrice}>{formatKZT(item.priceKzt)}</Text>
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
  searchContainer: { paddingHorizontal: 16, paddingTop: 10 },
  searchInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#111827',
  },
  categoryList: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
    flexWrap: 'wrap',
  },
  categoryPill: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  categoryPillActive: { backgroundColor: '#b45309', borderColor: '#b45309' },
  categoryText: { fontSize: 11, color: '#4b5563', fontWeight: '500' },
  categoryTextActive: { color: '#ffffff', fontWeight: '700' },
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
  cardTitle: { fontSize: 12, fontWeight: '600', color: '#1f2937', minHeight: 32 },
  cardPrice: { fontSize: 14, fontWeight: '800', color: '#b45309', marginTop: 4 },
  kaspiRedBadge: {
    backgroundColor: '#fef2f2',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  kaspiRedText: { color: '#dc2626', fontSize: 10, fontWeight: '700' },
});
