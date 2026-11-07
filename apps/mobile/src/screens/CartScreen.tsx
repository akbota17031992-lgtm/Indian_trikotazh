import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';
import { formatKZT, ALMATY_STORES_SEED } from '@india-trikotaj/shared';
import type { CartItem } from '../types';

interface Props {
  cart: CartItem[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onClearCart: () => void;
  selectedStoreId: string;
  onSelectStore: (storeId: string) => void;
  locale: 'ru' | 'kz';
}

export function CartScreen({
  cart,
  onUpdateQuantity,
  onClearCart,
  selectedStoreId,
  locale,
}: Props) {
  const [isKaspiModalOpen, setIsKaspiModalOpen] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const subtotalKzt = cart.reduce((acc, item) => acc + item.product.priceKzt * item.quantity, 0);

  const handlePay = () => {
    setIsKaspiModalOpen(true);
    setPaymentSuccess(false);
  };

  const handleConfirmKaspi = () => {
    setPaymentSuccess(true);
    setTimeout(() => {
      setIsKaspiModalOpen(false);
      onClearCart();
    }, 2500);
  };

  const currentStore =
    ALMATY_STORES_SEED.find((_, i) => `store-almaty-${String(i + 1).padStart(3, '0')}` === selectedStoreId) ||
    ALMATY_STORES_SEED[0]!;

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{locale === 'kz' ? 'Себет' : 'Корзина покупок'}</Text>
        <Text style={styles.subtitle}>
          {cart.length > 0
            ? `${cart.length} ${locale === 'kz' ? 'тауар' : 'позиции'}`
            : locale === 'kz'
            ? 'Себет бос'
            : 'Пусто'}
        </Text>
      </View>

      {cart.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🛍️</Text>
          <Text style={styles.emptyTitle}>
            {locale === 'kz' ? 'Сіздің себетіңіз бос' : 'Ваша корзина пуста'}
          </Text>
          <Text style={styles.emptySub}>
            {locale === 'kz'
              ? 'Каталогтан үнді трикотажын таңдаңыз'
              : 'Выберите качественный трикотаж из каталога'}
          </Text>
        </View>
      ) : (
        <>
          {/* Pickup Store bar */}
          <View style={styles.storeCard}>
            <Text style={styles.storeCardLabel}>
              {locale === 'kz' ? 'Алу нүктесі (өзіңіз алып кету):' : 'Пункт самовывоза:'}
            </Text>
            <Text style={styles.storeCardName}>
              {locale === 'kz' ? currentStore.nameKz : currentStore.nameRu}
            </Text>
            <Text style={styles.storeCardAddress}>
              {locale === 'kz' ? currentStore.addressKz : currentStore.addressRu}
            </Text>
          </View>

          {/* Cart Items */}
          <FlatList
            data={cart}
            keyExtractor={item => `${item.product.id}-${item.size}`}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <View style={styles.itemRow}>
                <Image source={{ uri: item.product.imageUrl }} style={styles.itemImage} />
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName} numberOfLines={2}>
                    {locale === 'kz' ? item.product.titleKz : item.product.titleRu}
                  </Text>
                  <Text style={styles.itemMeta}>Размер: {item.size}</Text>
                  <Text style={styles.itemPrice}>
                    {formatKZT(item.product.priceKzt * item.quantity)}
                  </Text>
                </View>
                <View style={styles.quantityControls}>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => onUpdateQuantity(item.product.id, -1)}
                  >
                    <Text style={styles.qtyBtnText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.qtyValue}>{item.quantity}</Text>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => onUpdateQuantity(item.product.id, 1)}
                  >
                    <Text style={styles.qtyBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />

          {/* Checkout Footer */}
          <View style={styles.footer}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{locale === 'kz' ? 'Барлығы төлеуге:' : 'Итого к оплате:'}</Text>
              <Text style={styles.totalAmount}>{formatKZT(subtotalKzt)}</Text>
            </View>

            {/* Kaspi Pay Big Red Button */}
            <TouchableOpacity style={styles.kaspiBtn} onPress={handlePay} activeOpacity={0.85}>
              <Text style={styles.kaspiLogo}>🔴</Text>
              <View style={styles.kaspiBtnTexts}>
                <Text style={styles.kaspiBtnMain}>Kaspi Pay арқылы төлеу</Text>
                <Text style={styles.kaspiBtnSub}>Оплата Kaspi QR / Red 0-0-3</Text>
              </View>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Kaspi QR Payment Modal */}
      <Modal visible={isKaspiModalOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalHeaderTitle}>Оплата через Kaspi Pay</Text>
            <Text style={styles.modalSub}>Сеть магазинов «Индийский Трикотаж» Алматы</Text>

            {paymentSuccess ? (
              <View style={styles.successBox}>
                <Text style={styles.successEmoji}>✅</Text>
                <Text style={styles.successTitle}>Оплата успешно принята!</Text>
                <Text style={styles.successText}>
                  Фискальный чек ОФД отправлен. Заказ готов к выдаче в филиале: {currentStore.nameRu}
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.qrPlaceholder}>
                  <Text style={styles.qrCodeIcon}>📱</Text>
                  <Text style={styles.qrText}>Отсканируйте Kaspi QR в приложении Kaspi.kz</Text>
                  <Text style={styles.qrAmount}>{formatKZT(subtotalKzt)}</Text>
                </View>

                <View style={styles.kaspiRedRow}>
                  <Text style={styles.kaspiRedBadgeText}>Kaspi Red</Text>
                  <Text style={styles.kaspiRedInstallment}>
                    3 платежа по {formatKZT(Math.round(subtotalKzt / 3))} без переплат
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.simulatePayBtn}
                  onPress={handleConfirmKaspi}
                >
                  <Text style={styles.simulatePayText}>Имитировать оплату в Kaspi.kz</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={() => setIsKaspiModalOpen(false)}
                >
                  <Text style={styles.closeBtnText}>Отмена</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#78350f',
  },
  title: { fontSize: 18, fontWeight: '800', color: '#ffffff' },
  subtitle: { fontSize: 12, color: '#fde68a', marginTop: 2 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyEmoji: { fontSize: 50, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  emptySub: { fontSize: 13, color: '#6b7280', marginTop: 4, textAlign: 'center' },
  storeCard: {
    margin: 12,
    padding: 12,
    backgroundColor: '#fffbeb',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  storeCardLabel: { fontSize: 10, fontWeight: '700', color: '#92400e', textTransform: 'uppercase' },
  storeCardName: { fontSize: 13, fontWeight: '800', color: '#451a03', marginTop: 2 },
  storeCardAddress: { fontSize: 11, color: '#78350f', marginTop: 1 },
  list: { paddingHorizontal: 12, paddingBottom: 16 },
  itemRow: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  itemImage: { width: 64, height: 64, borderRadius: 8, backgroundColor: '#f3f4f6' },
  itemInfo: { flex: 1, marginLeft: 12 },
  itemName: { fontSize: 12, fontWeight: '600', color: '#111827' },
  itemMeta: { fontSize: 11, color: '#6b7280', marginTop: 2 },
  itemPrice: { fontSize: 13, fontWeight: '800', color: '#b45309', marginTop: 4 },
  quantityControls: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  qtyBtn: {
    width: 28,
    height: 28,
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: { fontSize: 16, fontWeight: '700', color: '#374151' },
  qtyValue: { fontSize: 13, fontWeight: '700', minWidth: 20, textAlign: 'center' },
  footer: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    padding: 16,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  totalLabel: { fontSize: 14, color: '#4b5563', fontWeight: '500' },
  totalAmount: { fontSize: 20, fontWeight: '900', color: '#111827' },
  kaspiBtn: {
    backgroundColor: '#f14635',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  kaspiLogo: { fontSize: 18 },
  kaspiBtnTexts: { alignItems: 'center' },
  kaspiBtnMain: { color: '#ffffff', fontSize: 15, fontWeight: '800' },
  kaspiBtnSub: { color: '#fee2e2', fontSize: 11, fontWeight: '500' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  modalHeaderTitle: { fontSize: 16, fontWeight: '800', color: '#111827' },
  modalSub: { fontSize: 11, color: '#6b7280', marginTop: 2, textAlign: 'center' },
  qrPlaceholder: {
    width: 180,
    height: 180,
    backgroundColor: '#f9fafb',
    borderWidth: 2,
    borderColor: '#f14635',
    borderRadius: 12,
    marginVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  qrCodeIcon: { fontSize: 44, marginBottom: 8 },
  qrText: { fontSize: 10, textAlign: 'center', color: '#6b7280' },
  qrAmount: { fontSize: 16, fontWeight: '900', color: '#f14635', marginTop: 8 },
  kaspiRedRow: {
    backgroundColor: '#fef2f2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  kaspiRedBadgeText: { backgroundColor: '#f14635', color: '#ffffff', fontSize: 10, fontWeight: '800', paddingHorizontal: 4, borderRadius: 3 },
  kaspiRedInstallment: { fontSize: 11, color: '#991b1b', fontWeight: '600' },
  simulatePayBtn: {
    backgroundColor: '#059669',
    width: '100%',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  simulatePayText: { color: '#ffffff', fontSize: 13, fontWeight: '700' },
  closeBtn: { marginTop: 10, paddingVertical: 8 },
  closeBtnText: { color: '#6b7280', fontSize: 12 },
  successBox: { alignItems: 'center', paddingVertical: 20 },
  successEmoji: { fontSize: 44, marginBottom: 10 },
  successTitle: { fontSize: 16, fontWeight: '800', color: '#047857' },
  successText: { fontSize: 12, color: '#4b5563', textAlign: 'center', marginTop: 6, lineHeight: 18 },
});
