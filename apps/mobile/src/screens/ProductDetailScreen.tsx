import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Modal,
  FlatList,
} from 'react-native';
import { formatKZT, ALMATY_STORES_SEED } from '@india-trikotaj/shared';
import type { MobileProduct, ProductColor } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Props {
  product: MobileProduct;
  onBack: () => void;
  onAddToCart: (product: MobileProduct, size: string, color: ProductColor) => void;
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
  const [selectedSize, setSelectedSize] = useState(product.sizes[0] || 'M');
  const [selectedColor, setSelectedColor] = useState<ProductColor>(product.colors[0] || {
    id: 'default',
    nameRu: 'Основной',
    nameKz: 'Негізгі',
    hex: '#78350f',
  });
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [added, setAdded] = useState(false);
  const [isStoreStockModalOpen, setIsStoreStockModalOpen] = useState(false);

  const images = product.images && product.images.length > 0 ? product.images : [product.imageUrl];
  const stock = product.stockByStore[selectedStoreId] ?? 0;

  const currentStore =
    ALMATY_STORES_SEED.find((_, i) => `store-almaty-${String(i + 1).padStart(3, '0')}` === selectedStoreId) ||
    ALMATY_STORES_SEED[0]!;

  const handleAdd = () => {
    onAddToCart(product, selectedSize, selectedColor);
    setAdded(true);
    setTimeout(() => setAdded(false), 2200);
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

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Gallery Slider */}
        <View style={styles.galleryContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={e => {
              const slide = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
              setActiveImageIndex(slide);
            }}
            scrollEventThrottle={16}
          >
            {images.map((img, idx) => (
              <Image key={idx} source={{ uri: img }} style={styles.heroImage} resizeMode="cover" />
            ))}
          </ScrollView>

          {/* Dots Indicator */}
          {images.length > 1 && (
            <View style={styles.dotsRow}>
              {images.map((_, idx) => (
                <View
                  key={idx}
                  style={[styles.dot, activeImageIndex === idx && styles.dotActive]}
                />
              ))}
            </View>
          )}

          {/* Bestseller Badge */}
          {product.isBestseller && (
            <View style={styles.bestsellerBadge}>
              <Text style={styles.bestsellerText}>🔥 ХИТ ПРОДАЖ</Text>
            </View>
          )}
        </View>

        {/* Details Content */}
        <View style={styles.detailsBox}>
          {/* Price & SKU */}
          <View style={styles.priceRow}>
            <View>
              <Text style={styles.price}>{formatKZT(product.priceKzt)}</Text>
              {product.oldPriceKzt && (
                <Text style={styles.oldPrice}>{formatKZT(product.oldPriceKzt)}</Text>
              )}
            </View>
            <Text style={styles.skuText}>SKU: {product.slug}</Text>
          </View>

          <Text style={styles.title}>{locale === 'kz' ? product.titleKz : product.titleRu}</Text>

          {/* Kaspi Pay Red 0-0-3 badge */}
          <View style={styles.kaspiBox}>
            <Text style={styles.kaspiTitle}>Kaspi Red 0-0-3 бөліп төлеу / Рассрочка</Text>
            <Text style={styles.kaspiSub}>
              {formatKZT(Math.round(product.priceKzt / 3))} x 3 айға процентсіз (0% переплаты)
            </Text>
          </View>

          {/* Store Stock in selected branch */}
          <View style={styles.stockCard}>
            <View style={styles.stockStatusRow}>
              <View style={[styles.stockIndicator, { backgroundColor: stock > 0 ? '#10b981' : '#f59e0b' }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.stockLocationTitle}>
                  {locale === 'kz' ? currentStore.nameKz : currentStore.nameRu}
                </Text>
                <Text style={styles.stockLocationSubtitle}>
                  {stock > 0
                    ? locale === 'kz'
                      ? `✓ Қоймада бар: ${stock} дана`
                      : `✓ В наличии: ${stock} шт.`
                    : locale === 'kz'
                    ? 'Бұл дүкенде таусылды'
                    : 'Нет в этом филиале'}
                </Text>
              </View>
            </View>

            {/* Button to open all 16 stores stock */}
            <TouchableOpacity
              style={styles.allStoresBtn}
              onPress={() => setIsStoreStockModalOpen(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.allStoresBtnText}>
                {locale === 'kz'
                  ? 'Барлық 16 дүкендегі қалдықты көру →'
                  : 'Наличие во всех 16 магазинах Алматы →'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Color Selector */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {locale === 'kz' ? 'Түсі:' : 'Цвет:'}{' '}
              <Text style={styles.selectedAttrText}>
                {locale === 'kz' ? selectedColor.nameKz : selectedColor.nameRu}
              </Text>
            </Text>
            <View style={styles.colorRow}>
              {product.colors.map(color => {
                const isSelected = selectedColor.id === color.id;
                return (
                  <TouchableOpacity
                    key={color.id}
                    style={[styles.colorCircleWrapper, isSelected && styles.colorCircleWrapperActive]}
                    onPress={() => setSelectedColor(color)}
                  >
                    <View style={[styles.colorCircle, { backgroundColor: color.hex }]} />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Size Selector */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {locale === 'kz' ? 'Өлшемді таңдаңыз:' : 'Выберите размер:'}{' '}
              <Text style={styles.selectedAttrText}>{selectedSize}</Text>
            </Text>
            <View style={styles.sizeRow}>
              {product.sizes.map(s => (
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

          {/* Fabric Composition */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{locale === 'kz' ? 'Мата құрамы:' : 'Состав ткани:'}</Text>
            <Text style={styles.bodyText}>
              {locale === 'kz' ? product.compositionKz : product.compositionRu}
            </Text>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{locale === 'kz' ? 'Сипаттама:' : 'Описание модели:'}</Text>
            <Text style={styles.bodyText}>
              {locale === 'kz' ? product.descriptionKz : product.descriptionRu}
            </Text>
          </View>

          {/* Care Guidelines */}
          <View style={styles.careBox}>
            <Text style={styles.careTitle}>🧼 {locale === 'kz' ? 'Күтім нұсқаулары:' : 'Рекомендации по уходу:'}</Text>
            <Text style={styles.careItem}>• Стирка при 30°C в деликатном режиме</Text>
            <Text style={styles.careItem}>• Не отбеливать хлорсодержащими средствами</Text>
            <Text style={styles.careItem}>• Гладить при температуре до 150°C</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Sticky Action Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomPriceCol}>
          <Text style={styles.bottomPriceLabel}>{locale === 'kz' ? 'Бағасы:' : 'Итого:'}</Text>
          <Text style={styles.bottomPriceVal}>{formatKZT(product.priceKzt)}</Text>
        </View>

        <TouchableOpacity
          style={[styles.addToCartBtn, added && styles.addToCartBtnSuccess]}
          onPress={handleAdd}
          activeOpacity={0.85}
        >
          <Text style={styles.addToCartText}>
            {added
              ? locale === 'kz'
                ? '✓ Себетке қосылды!'
                : '✓ Добавлено в корзину!'
              : locale === 'kz'
              ? '🛒 Себетке салу'
              : '🛒 В корзину'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 16 Stores Stock Modal */}
      <Modal
        visible={isStoreStockModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsStoreStockModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  {locale === 'kz' ? '16 дүкендегі қалдықтар' : 'Наличие в 16 магазинах'}
                </Text>
                <Text style={styles.modalSubtitle} numberOfLines={1}>
                  {locale === 'kz' ? product.titleKz : product.titleRu}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setIsStoreStockModalOpen(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={ALMATY_STORES_SEED}
              keyExtractor={item => item.slug}
              contentContainerStyle={styles.storeStockList}
              renderItem={({ item, index }) => {
                const storeId = `store-almaty-${String(index + 1).padStart(3, '0')}`;
                const storeStock = product.stockByStore[storeId] ?? 0;
                const isSelected = storeId === selectedStoreId;

                return (
                  <View style={[styles.storeStockRow, isSelected && styles.storeStockRowSelected]}>
                    <View style={styles.storeStockLeft}>
                      <Text style={styles.storeStockName}>
                        {locale === 'kz' ? item.nameKz : item.nameRu}
                      </Text>
                      <Text style={styles.storeStockAddress}>
                        {locale === 'kz' ? item.addressKz : item.addressRu}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.storeStockBadge,
                        storeStock > 0 ? styles.storeStockBadgeGreen : styles.storeStockBadgeZero,
                      ]}
                    >
                      <Text
                        style={[
                          styles.storeStockBadgeText,
                          storeStock > 0 ? styles.storeStockBadgeTextGreen : styles.storeStockBadgeTextZero,
                        ]}
                      >
                        {storeStock > 0
                          ? `${storeStock} ${locale === 'kz' ? 'дана' : 'шт.'}`
                          : locale === 'kz'
                          ? 'Жоқ'
                          : 'Нет'}
                      </Text>
                    </View>
                  </View>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  topBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#78350f',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: { paddingVertical: 4, paddingRight: 8 },
  backText: { color: '#fef3c7', fontSize: 14, fontWeight: '700' },
  topBarTitle: { color: '#ffffff', fontSize: 14, fontWeight: '600', flex: 1 },
  content: { paddingBottom: 100 },
  galleryContainer: { width: SCREEN_WIDTH, height: 340, position: 'relative' },
  heroImage: { width: SCREEN_WIDTH, height: 340, backgroundColor: '#f3f4f6' },
  dotsRow: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: 'rgba(255,255,255,0.5)' },
  dotActive: { backgroundColor: '#ffffff', width: 18 },
  bestsellerBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    backgroundColor: '#dc2626',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  bestsellerText: { color: '#ffffff', fontSize: 11, fontWeight: '800' },
  detailsBox: { padding: 16 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  price: { fontSize: 22, fontWeight: '800', color: '#b45309' },
  oldPrice: { fontSize: 14, color: '#9ca3af', textDecorationLine: 'line-through' },
  skuText: { fontSize: 11, color: '#9ca3af', fontWeight: '500' },
  title: { fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 12, lineHeight: 22 },
  kaspiBox: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  kaspiTitle: { color: '#dc2626', fontSize: 12, fontWeight: '800' },
  kaspiSub: { color: '#991b1b', fontSize: 11, marginTop: 2, fontWeight: '500' },
  stockCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  stockStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stockIndicator: { width: 10, height: 10, borderRadius: 5 },
  stockLocationTitle: { fontSize: 13, fontWeight: '700', color: '#1e293b' },
  stockLocationSubtitle: { fontSize: 11, color: '#64748b', marginTop: 2 },
  allStoresBtn: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  allStoresBtnText: { color: '#b45309', fontSize: 12, fontWeight: '700' },
  section: { marginTop: 14, borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 14 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 8 },
  selectedAttrText: { color: '#b45309', fontWeight: '700' },
  colorRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  colorCircleWrapper: {
    padding: 3,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorCircleWrapperActive: { borderColor: '#b45309' },
  colorCircle: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: '#d1d5db' },
  sizeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  sizeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
  },
  sizeBtnActive: { backgroundColor: '#78350f', borderColor: '#78350f' },
  sizeText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  sizeTextActive: { color: '#ffffff' },
  bodyText: { fontSize: 13, color: '#4b5563', lineHeight: 19 },
  careBox: {
    marginTop: 16,
    backgroundColor: '#fffbeb',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  careTitle: { fontSize: 12, fontWeight: '700', color: '#92400e', marginBottom: 4 },
  careItem: { fontSize: 11, color: '#78350f', lineHeight: 16 },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 6,
  },
  bottomPriceCol: { marginRight: 16 },
  bottomPriceLabel: { fontSize: 10, color: '#6b7280', textTransform: 'uppercase' },
  bottomPriceVal: { fontSize: 18, fontWeight: '800', color: '#b45309' },
  addToCartBtn: {
    flex: 1,
    backgroundColor: '#b45309',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addToCartBtnSuccess: { backgroundColor: '#047857' },
  addToCartText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '75%',
    paddingBottom: 24,
  },
  modalHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#111827' },
  modalSubtitle: { fontSize: 11, color: '#6b7280', marginTop: 2, maxWidth: 260 },
  modalCloseBtn: { padding: 4 },
  modalCloseText: { fontSize: 18, color: '#9ca3af', fontWeight: '700' },
  storeStockList: { paddingHorizontal: 16, paddingVertical: 8 },
  storeStockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  storeStockRowSelected: { backgroundColor: '#fef3c7', borderRadius: 8, paddingHorizontal: 8 },
  storeStockLeft: { flex: 1, marginRight: 12 },
  storeStockName: { fontSize: 13, fontWeight: '700', color: '#1e293b' },
  storeStockAddress: { fontSize: 11, color: '#64748b', marginTop: 2 },
  storeStockBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  storeStockBadgeGreen: { backgroundColor: '#ecfdf5' },
  storeStockBadgeZero: { backgroundColor: '#fef2f2' },
  storeStockBadgeText: { fontSize: 11, fontWeight: '700' },
  storeStockBadgeTextGreen: { color: '#047857' },
  storeStockBadgeTextZero: { color: '#b91c1c' },
});
