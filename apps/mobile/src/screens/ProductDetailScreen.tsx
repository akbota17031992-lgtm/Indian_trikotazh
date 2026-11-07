import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { formatKZT, ALMATY_STORES_SEED } from '@india-trikotaj/shared';
import type { MobileProduct } from '../types';

interface Props {
  product: MobileProduct;
  onBack: () => void;
  onAddToCart: (product: MobileProduct, size: string) => void;
  selectedStoreId: string;
  locale: 'ru' | 'kz';
}

export function ProductDetailScreen({
  product,
  onBack,
  onAddToCart,
  selectedStoreId,
  locale,
}: Props) {
  const sizes = ['S', 'M', 'L', 'XL', '2XL'];
  const [selectedSize, setSelectedSize] = useState('M');
  const [added, setAdded] = useState(false);

  const stock = product.stockByStore[selectedStoreId] ?? 12;

  const handleAdd = () => {
    onAddToCart(product, selectedSize);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>← {locale === 'kz' ? 'Артқа' : 'Назад'}</Text>
        </TouchableOpacity>
        <Text style={styles.topBarTitle} numberOfLines={1}>
          {locale === 'kz' ? product.titleKz : product.titleRu}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Image source={{ uri: product.imageUrl }} style={styles.heroImage} />

        <View style={styles.detailsBox}>
          <View style={styles.stockRow}>
            <View style={styles.stockBadge}>
              <Text style={styles.stockBadgeText}>
                {stock > 0
                  ? locale === 'kz'
                    ? `✓ Осы филиалда бар (${stock} дана)`
                    : `✓ В наличии в этом филиале (${stock} шт)`
                  : locale === 'kz'
                  ? 'Басқа дүкендерден тапсырыспен'
                  : 'Под заказ из других филиалов'}
              </Text>
            </View>
            <Text style={styles.skuText}>SKU: {product.slug}</Text>
          </View>

          <Text style={styles.title}>{locale === 'kz' ? product.titleKz : product.titleRu}</Text>
          <Text style={styles.price}>{formatKZT(product.priceKzt)}</Text>

          {/* Kaspi Pay Red 0-0-3 badge */}
          <View style={styles.kaspiBox}>
            <Text style={styles.kaspiTitle}>Kaspi Red 0-0-3 бөліп төлеу / Рассрочка</Text>
            <Text style={styles.kaspiSub}>
              {formatKZT(Math.round(product.priceKzt / 3))} x 3 айға процентсіз
            </Text>
          </View>

          {/* Size Selector */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{locale === 'kz' ? 'Өлшемді таңдаңыз:' : 'Выберите размер:'}</Text>
            <View style={styles.sizeRow}>
              {sizes.map(s => (
                <TouchableOpacity
                  key={s}
                  style={[styles.sizeBtn, selectedSize === s && styles.sizeBtnActive]}
                  onPress={() => setSelectedSize(s)}
                >
                  <Text style={[styles.sizeText, selectedSize === s && styles.sizeTextActive]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Composition */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{locale === 'kz' ? 'Мата құрамы:' : 'Состав ткани:'}</Text>
            <Text style={styles.compositionText}>
              {locale === 'kz' ? product.compositionKz : product.compositionRu}
            </Text>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{locale === 'kz' ? 'Сипаттамасы:' : 'Описание товара:'}</Text>
            <Text style={styles.descriptionText}>
              {locale === 'kz' ? product.descriptionKz : product.descriptionRu}
            </Text>
          </View>

          {/* 16 Store Availability */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {locale === 'kz' ? 'Алматы дүкендерінде болуы (16 филиал):' : 'Наличие в магазинах Алматы (16 филиалов):'}
            </Text>
            <View style={styles.storesList}>
              {ALMATY_STORES_SEED.slice(0, 5).map((store, idx) => {
                const storeId = `store-almaty-${String(idx + 1).padStart(3, '0')}`;
                const storeStock = product.stockByStore[storeId] ?? (idx === 0 ? 24 : 10 + idx * 3);
                return (
                  <View key={store.slug} style={styles.storeItemRow}>
                    <Text style={styles.storeItemName}>{locale === 'kz' ? store.nameKz : store.nameRu}</Text>
                    <Text style={styles.storeItemStock}>
                      {storeStock > 0 ? `${storeStock} шт.` : 'Жоқ / Нет'}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Add to Cart Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.addBtn, added && styles.addBtnSuccess]}
          onPress={handleAdd}
          activeOpacity={0.8}
        >
          <Text style={styles.addBtnText}>
            {added
              ? locale === 'kz'
                ? '✓ Себетке қосылды'
                : '✓ Добавлено в корзину'
              : locale === 'kz'
              ? `Себетке қосу • ${formatKZT(product.priceKzt)}`
              : `В корзину • ${formatKZT(product.priceKzt)}`}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  topBar: {
    height: 50,
    backgroundColor: '#78350f',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  backButton: { marginRight: 12 },
  backText: { color: '#fef3c7', fontSize: 14, fontWeight: '700' },
  topBarTitle: { color: '#ffffff', fontSize: 14, fontWeight: '600', flex: 1 },
  content: { paddingBottom: 100 },
  heroImage: { width: '100%', height: 320, backgroundColor: '#f3f4f6' },
  detailsBox: { padding: 16 },
  stockRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stockBadge: { backgroundColor: '#ecfdf5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  stockBadgeText: { color: '#047857', fontSize: 11, fontWeight: '700' },
  skuText: { fontSize: 11, color: '#9ca3af' },
  title: { fontSize: 18, fontWeight: '800', color: '#111827', marginTop: 10 },
  price: { fontSize: 20, fontWeight: '900', color: '#b45309', marginTop: 4 },
  kaspiBox: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
  },
  kaspiTitle: { color: '#dc2626', fontSize: 12, fontWeight: '800' },
  kaspiSub: { color: '#991b1b', fontSize: 11, marginTop: 2 },
  section: { marginTop: 18 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 8 },
  sizeRow: { flexDirection: 'row', gap: 8 },
  sizeBtn: {
    width: 44,
    height: 38,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  sizeBtnActive: { borderColor: '#b45309', backgroundColor: '#fffbeb' },
  sizeText: { fontSize: 13, color: '#374151', fontWeight: '600' },
  sizeTextActive: { color: '#b45309', fontWeight: '800' },
  compositionText: { fontSize: 13, color: '#4b5563', lineHeight: 18 },
  descriptionText: { fontSize: 13, color: '#6b7280', lineHeight: 19 },
  storesList: { backgroundColor: '#f9fafb', borderRadius: 8, padding: 8 },
  storeItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  storeItemName: { fontSize: 11, color: '#4b5563' },
  storeItemStock: { fontSize: 11, fontWeight: '700', color: '#047857' },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    padding: 12,
  },
  addBtn: {
    backgroundColor: '#b45309',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  addBtnSuccess: { backgroundColor: '#059669' },
  addBtnText: { color: '#ffffff', fontSize: 15, fontWeight: '800' },
});
