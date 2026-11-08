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
import { Ionicons } from '@expo/vector-icons';
import { formatKZT, ALMATY_STORES_SEED } from '@india-trikotaj/shared';
import type { MobileProduct, ProductColor } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Props {
  product: MobileProduct;
  onBack: () => void;
  onAddToCart: (product: MobileProduct, size: string, color: ProductColor) => void;
  onIncreaseQuantity: (product: MobileProduct) => void;
  onDecreaseQuantity: (productId: string) => void;
  quantityInCart: number;
  selectedStoreId: string;
  locale: 'ru' | 'kz';
}

export function ProductDetailScreen({
  product,
  onBack,
  onAddToCart,
  onIncreaseQuantity,
  onDecreaseQuantity,
  quantityInCart,
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

  const handleIncrease = () => {
    onIncreaseQuantity(product);
  };

  const handleDecrease = () => {
    onDecreaseQuantity(product.id);
  };

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={20} color="#fef3c7" />
          <Text style={styles.backText}>{locale === 'kz' ? 'Артқа' : 'Назад'}</Text>
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
              <Ionicons name="flame" size={12} color="#ffffff" style={{ marginRight: 4 }} />
              <Text style={styles.bestsellerText}>ХИТ ПРОДАЖ</Text>
            </View>
          )}

          {/* Permanent In-Cart Badge */}
          {quantityInCart > 0 && (
            <View style={styles.inCartHeroBadge}>
              <Ionicons name="checkmark-circle" size={13} color="#ffffff" style={{ marginRight: 4 }} />
              <Text style={styles.inCartHeroBadgeText}>
                {locale === 'kz' ? `${quantityInCart} себетте` : `${quantityInCart} в корзине`}
              </Text>
            </View>
          )}
        </View>

        {/* Details Content Box */}
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

          {/* In-Cart Status Box */}
          {quantityInCart > 0 && (
            <View style={styles.inCartAlertBox}>
              <View style={styles.inCartAlertLeft}>
                <View style={styles.inCartIconCircle}>
                  <Ionicons name="cart" size={16} color="#059669" />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.inCartAlertTitle}>
                    {locale === 'kz' ? 'Тауар себетке қосылған' : 'Товар добавлен в корзину'}
                  </Text>
                  <Text style={styles.inCartAlertSubtitle}>
                    {locale === 'kz'
                      ? `Тапсырысыңызда барлығы: ${quantityInCart} дана`
                      : `В вашем заказе сейчас: ${quantityInCart} шт.`}
                  </Text>
                </View>
              </View>
              <View style={styles.inCartCountPill}>
                <Text style={styles.inCartCountPillText}>{quantityInCart} шт</Text>
              </View>
            </View>
          )}

          <Text style={styles.title}>{locale === 'kz' ? product.titleKz : product.titleRu}</Text>

          {/* Kaspi Pay Red 0-0-3 badge */}
          <View style={styles.kaspiBox}>
            <View style={styles.kaspiTitleRow}>
              <Text style={styles.kaspiTitle}>Kaspi Red 0-0-3</Text>
              <Text style={styles.kaspiBadge}>Рассрочка 0%</Text>
            </View>
            <Text style={styles.kaspiSub}>
              {formatKZT(Math.round(product.priceKzt / 3))} x 3 айға процентсіз (3 платежа без переплат)
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
              <Ionicons name="storefront-outline" size={14} color="#b45309" style={{ marginRight: 6 }} />
              <Text style={styles.allStoresBtnText}>
                {locale === 'kz'
                  ? 'Барлық 16 дүкендегі қалдықты көру'
                  : 'Наличие во всех 16 магазинах Алматы'}
              </Text>
              <Ionicons name="chevron-forward" size={13} color="#b45309" />
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
                    activeOpacity={0.8}
                  >
                    <View style={[styles.colorCircle, { backgroundColor: color.hex }]}>
                      {isSelected && (
                        <Ionicons
                          name="checkmark"
                          size={14}
                          color={color.hex === '#ffffff' ? '#111827' : '#ffffff'}
                        />
                      )}
                    </View>
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
              {product.sizes.map(s => {
                const isSelected = selectedSize === s;
                return (
                  <TouchableOpacity
                    key={s}
                    style={[styles.sizeBtn, isSelected && styles.sizeBtnActive]}
                    onPress={() => setSelectedSize(s)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.sizeText, isSelected && styles.sizeTextActive]}>{s}</Text>
                  </TouchableOpacity>
                );
              })}
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
          <Text style={styles.bottomPriceLabel}>
            {quantityInCart > 0
              ? locale === 'kz'
                ? `Себетте (${quantityInCart} дана):`
                : `В корзине (${quantityInCart} шт):`
              : locale === 'kz'
              ? 'Бағасы:'
              : 'Итого:'}
          </Text>
          <Text style={styles.bottomPriceVal}>
            {formatKZT(product.priceKzt * (quantityInCart > 0 ? quantityInCart : 1))}
          </Text>
        </View>

        {quantityInCart > 0 ? (
          <View style={styles.bottomStepperContainer}>
            <TouchableOpacity
              style={styles.bottomStepperBtn}
              onPress={handleDecrease}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="remove" size={20} color="#065f46" />
            </TouchableOpacity>

            <View style={styles.bottomStepperCountWrap}>
              <Text style={styles.bottomStepperCountText}>{quantityInCart}</Text>
              <Text style={styles.bottomStepperCountUnit}>
                {locale === 'kz' ? 'дана' : 'шт'}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.bottomStepperBtn, styles.bottomStepperBtnPlus]}
              onPress={handleIncrease}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="add" size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.addToCartBtn, added && styles.addToCartBtnSuccess]}
            onPress={handleAdd}
            activeOpacity={0.85}
          >
            <Ionicons
              name={added ? 'checkmark-circle' : 'cart'}
              size={18}
              color="#ffffff"
              style={{ marginRight: 6 }}
            />
            <Text style={styles.addToCartText}>
              {added
                ? locale === 'kz'
                  ? 'Қосылды!'
                  : 'Добавлено!'
                : locale === 'kz'
                ? 'Себетке салу'
                : 'В корзину'}
            </Text>
          </TouchableOpacity>
        )}
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
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={22} color="#64748b" />
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
    paddingTop: 10,
    paddingBottom: 12,
    backgroundColor: '#78350f',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4, paddingRight: 8 },
  backText: { color: '#fef3c7', fontSize: 13, fontWeight: '700' },
  topBarTitle: { color: '#ffffff', fontSize: 13, fontWeight: '600', flex: 1 },
  content: { paddingBottom: 110 },
  galleryContainer: { width: SCREEN_WIDTH, height: 350, position: 'relative' },
  heroImage: { width: SCREEN_WIDTH, height: 350, backgroundColor: '#f1f5f9' },
  dotsRow: {
    position: 'absolute',
    bottom: 14,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.45)' },
  dotActive: { backgroundColor: '#ffffff', width: 18 },
  bestsellerBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    backgroundColor: '#dc2626',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 6,
  },
  bestsellerText: { color: '#ffffff', fontSize: 11, fontWeight: '800' },
  inCartHeroBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  inCartHeroBadgeText: { color: '#ffffff', fontSize: 11, fontWeight: '800' },
  inCartAlertBox: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1.5,
    borderColor: '#a7f3d0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inCartAlertLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  inCartIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#d1fae5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inCartAlertTitle: { fontSize: 13, fontWeight: '800', color: '#065f46' },
  inCartAlertSubtitle: { fontSize: 11, color: '#047857', marginTop: 1 },
  inCartCountPill: {
    backgroundColor: '#059669',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  inCartCountPillText: { color: '#ffffff', fontSize: 12, fontWeight: '800' },
  detailsBox: { padding: 16 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  price: { fontSize: 24, fontWeight: '900', color: '#b45309' },
  oldPrice: { fontSize: 14, color: '#94a3b8', textDecorationLine: 'line-through' },
  skuText: { fontSize: 11, color: '#94a3b8', fontWeight: '500' },
  title: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 12, lineHeight: 24 },
  kaspiBox: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  kaspiTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kaspiTitle: { color: '#dc2626', fontSize: 13, fontWeight: '800' },
  kaspiBadge: { backgroundColor: '#dc2626', color: '#ffffff', fontSize: 10, fontWeight: '700', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, overflow: 'hidden' },
  kaspiSub: { color: '#991b1b', fontSize: 11, marginTop: 4, fontWeight: '500' },
  stockCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  allStoresBtnText: { color: '#b45309', fontSize: 12, fontWeight: '700', flex: 1 },
  section: { marginTop: 14, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 14 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#334155', marginBottom: 8 },
  selectedAttrText: { color: '#b45309', fontWeight: '800' },
  colorRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  colorCircleWrapper: {
    padding: 3,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorCircleWrapperActive: { borderColor: '#b45309' },
  colorCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sizeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  sizeBtn: {
    minWidth: 46,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  sizeBtnActive: { backgroundColor: '#78350f', borderColor: '#78350f' },
  sizeText: { fontSize: 13, fontWeight: '600', color: '#334155' },
  sizeTextActive: { color: '#ffffff', fontWeight: '800' },
  bodyText: { fontSize: 13, color: '#475569', lineHeight: 20 },
  careBox: {
    marginTop: 16,
    backgroundColor: '#fffbeb',
    borderRadius: 12,
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
    borderTopColor: '#e2e8f0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 8,
  },
  bottomPriceCol: { marginRight: 16 },
  bottomPriceLabel: { fontSize: 10, color: '#64748b', textTransform: 'uppercase', fontWeight: '600' },
  bottomPriceVal: { fontSize: 20, fontWeight: '900', color: '#b45309' },
  addToCartBtn: {
    flex: 1,
    backgroundColor: '#b45309',
    paddingVertical: 13,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#b45309',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  addToCartBtnSuccess: { backgroundColor: '#059669', shadowColor: '#059669' },
  addToCartText: { color: '#ffffff', fontSize: 14, fontWeight: '800' },
  bottomStepperContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ecfdf5',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#a7f3d0',
    paddingHorizontal: 6,
    paddingVertical: 4,
    height: 48,
  },
  bottomStepperBtn: {
    width: 40,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#d1fae5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomStepperBtnPlus: {
    backgroundColor: '#059669',
  },
  bottomStepperCountWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  bottomStepperCountText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#065f46',
  },
  bottomStepperCountUnit: {
    fontSize: 12,
    fontWeight: '700',
    color: '#047857',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    maxHeight: '78%',
    paddingBottom: 24,
  },
  modalHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  modalSubtitle: { fontSize: 11, color: '#64748b', marginTop: 2, maxWidth: 260 },
  modalCloseBtn: { padding: 4 },
  storeStockList: { paddingHorizontal: 16, paddingVertical: 8 },
  storeStockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
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
