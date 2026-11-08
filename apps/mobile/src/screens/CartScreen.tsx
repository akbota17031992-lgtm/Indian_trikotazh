import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { formatKZT, ALMATY_STORES_SEED } from '@india-trikotaj/shared';
import type { CartItem, FulfillmentType, MobileOrder, UserProfile } from '../types';

interface Props {
  cart: CartItem[];
  onUpdateQuantity: (productId: string, size: string, delta: number) => void;
  onRemoveItem: (productId: string, size: string) => void;
  onClearCart: () => void;
  onOrderCreated: (order: MobileOrder) => void;
  selectedStoreId: string;
  onSelectStore: (storeId: string) => void;
  locale: 'ru' | 'kz';
  onNavigateToCatalog: () => void;
  userProfile?: UserProfile;
}

const ALMATY_DISTRICTS = [
  { id: 'bostandyk', ru: 'Бостандыкский', kz: 'Бостандық' },
  { id: 'medeu', ru: 'Медеуский', kz: 'Медеу' },
  { id: 'almaly', ru: 'Алмалинский', kz: 'Алмалы' },
  { id: 'auezov', ru: 'Ауэзовский', kz: 'Әуезов' },
  { id: 'zhetysu', ru: 'Жетысуский', kz: 'Жетісу' },
  { id: 'turksib', ru: 'Турксибский', kz: 'Түрксіб' },
  { id: 'alatau', ru: 'Алатауский', kz: 'Алатау' },
  { id: 'nauryzbay', ru: 'Наурызбайский', kz: 'Наурызбай' },
];

export function CartScreen({
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onOrderCreated,
  selectedStoreId,
  onSelectStore,
  locale,
  onNavigateToCatalog,
  userProfile,
}: Props) {
  const [fulfillmentType, setFulfillmentType] = useState<FulfillmentType>('pickup');
  const [selectedDistrict, setSelectedDistrict] = useState(ALMATY_DISTRICTS[0]!.ru);
  const [streetAddress, setStreetAddress] = useState('');
  const [apartment, setApartment] = useState('');
  const [customerName, setCustomerName] = useState(userProfile?.name || 'Достияр');
  const [customerPhone, setCustomerPhone] = useState(userProfile?.phone || '+7 (701) 992-84-12');
  const [comment, setComment] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'kaspi_pay' | 'cash_on_delivery'>('kaspi_pay');

  const [isKaspiModalOpen, setIsKaspiModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<MobileOrder | null>(null);

  const subtotalKzt = cart.reduce((acc, item) => acc + item.product.priceKzt * item.quantity, 0);
  const deliveryFeeKzt = fulfillmentType === 'courier' ? (subtotalKzt > 15000 ? 0 : 1500) : 0;
  const totalKzt = subtotalKzt + deliveryFeeKzt;

  const currentStore =
    ALMATY_STORES_SEED.find((_, i) => `store-almaty-${String(i + 1).padStart(3, '0')}` === selectedStoreId) ||
    ALMATY_STORES_SEED[0]!;

  const handleStartCheckout = () => {
    if (cart.length === 0) return;

    if (!customerName.trim()) {
      Alert.alert(locale === 'kz' ? 'Қате' : 'Ошибка', locale === 'kz' ? 'Атыңызды енгізіңіз' : 'Введите ваше имя');
      return;
    }
    if (!customerPhone.trim()) {
      Alert.alert(locale === 'kz' ? 'Қате' : 'Ошибка', locale === 'kz' ? 'Телефон нөмірін енгізіңіз' : 'Введите номер телефона');
      return;
    }
    if (fulfillmentType === 'courier' && !streetAddress.trim()) {
      Alert.alert(locale === 'kz' ? 'Қате' : 'Ошибка', locale === 'kz' ? 'Жеткізу мекенжайын енгізіңіз' : 'Введите улицу и дом для доставки');
      return;
    }

    if (paymentMethod === 'kaspi_pay') {
      setIsKaspiModalOpen(true);
    } else {
      finalizeOrder('cash_on_delivery');
    }
  };

  const finalizeOrder = (method: 'kaspi_pay' | 'cash_on_delivery') => {
    setIsProcessing(true);
    const orderId = `IT-${Math.floor(10000 + Math.random() * 90000)}`;

    const newOrder: MobileOrder = {
      id: orderId,
      createdAt: new Date().toLocaleDateString(locale === 'kz' ? 'kk-KZ' : 'ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      items: [...cart],
      totalKzt,
      fulfillmentType,
      pickupStoreId: fulfillmentType === 'pickup' ? selectedStoreId : undefined,
      courierAddress:
        fulfillmentType === 'courier'
          ? {
              district: selectedDistrict,
              street: streetAddress,
              building: '',
              apartment: apartment || undefined,
            }
          : undefined,
      customerName,
      customerPhone,
      paymentMethod: method,
      status: 'processing',
    };

    setTimeout(() => {
      setIsProcessing(false);
      setIsKaspiModalOpen(false);
      setCompletedOrder(newOrder);
      onOrderCreated(newOrder);
      onClearCart();
    }, 1800);
  };

  // If order was just placed, show success screen
  if (completedOrder) {
    return (
      <View style={styles.successContainer}>
        <View style={styles.successIconBox}>
          <Text style={styles.successIcon}>🎉</Text>
        </View>
        <Text style={styles.successTitle}>
          {locale === 'kz' ? 'Тапсырыс сәтті қабылданды!' : 'Заказ успешно оформлен!'}
        </Text>
        <Text style={styles.successOrderNumber}>№ {completedOrder.id}</Text>
        <Text style={styles.successDesc}>
          {completedOrder.fulfillmentType === 'pickup'
            ? locale === 'kz'
              ? `Тауар сізді «${currentStore.nameKz}» дүкенінде күтеді. СМС-хабарлама жіберілді.`
              : `Товар будет ожидать вас в филиале «${currentStore.nameRu}». Мы отправили SMS.`
            : locale === 'kz'
            ? `Курьер мекенжай бойынша жеткізеді: ${completedOrder.courierAddress?.district}, ${completedOrder.courierAddress?.street}.`
            : `Курьер доставит заказ по адресу: ${completedOrder.courierAddress?.district}, ${completedOrder.courierAddress?.street}.`}
        </Text>

        <View style={styles.orderSummaryCard}>
          <Text style={styles.summaryRow}>
            {locale === 'kz' ? 'Төлем түрі:' : 'Способ оплаты:'}{' '}
            <Text style={{ fontWeight: '700', color: '#b45309' }}>
              {completedOrder.paymentMethod === 'kaspi_pay' ? 'Kaspi QR (Оплачено)' : 'При получении'}
            </Text>
          </Text>
          <Text style={styles.summaryRow}>
            {locale === 'kz' ? 'Жалпы сомасы:' : 'Итого к оплате:'}{' '}
            <Text style={{ fontWeight: '800', color: '#111827' }}>{formatKZT(completedOrder.totalKzt)}</Text>
          </Text>
        </View>

        <TouchableOpacity
          style={styles.continueShopBtn}
          onPress={() => {
            setCompletedOrder(null);
            onNavigateToCatalog();
          }}
        >
          <Text style={styles.continueShopBtnText}>
            {locale === 'kz' ? 'Каталогқа оралу' : 'Вернуться к покупкам'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

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
              ? 'Каталогтан сапалы үнді трикотажын таңдаңыз'
              : 'Выберите качественный трикотаж из каталога'}
          </Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={onNavigateToCatalog}>
            <Text style={styles.emptyBtnText}>
              {locale === 'kz' ? 'Каталогқа өту →' : 'В каталог товаров →'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Cart Items List */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeading}>
              {locale === 'kz' ? 'Таңдалған тауарлар' : 'Товары в заказе'} ({cart.length})
            </Text>
            {cart.map(item => (
              <View key={`${item.product.id}-${item.size}-${item.color.id}`} style={styles.itemRow}>
                <Image source={{ uri: item.product.imageUrl }} style={styles.itemImage} />
                <View style={styles.itemBody}>
                  <Text style={styles.itemTitle} numberOfLines={2}>
                    {locale === 'kz' ? item.product.titleKz : item.product.titleRu}
                  </Text>
                  <View style={styles.itemMeta}>
                    <Text style={styles.metaBadge}>Размер: {item.size}</Text>
                    <View style={styles.colorPill}>
                      <View style={[styles.colorDot, { backgroundColor: item.color.hex }]} />
                      <Text style={styles.colorText}>
                        {locale === 'kz' ? item.color.nameKz : item.color.nameRu}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.itemPrice}>{formatKZT(item.product.priceKzt)}</Text>

                  {/* Quantity Controller & Delete */}
                  <View style={styles.quantityRow}>
                    <View style={styles.counterBox}>
                      <TouchableOpacity
                        style={styles.qtyBtn}
                        onPress={() => onUpdateQuantity(item.product.id, item.size, -1)}
                      >
                        <Text style={styles.qtyBtnText}>−</Text>
                      </TouchableOpacity>
                      <Text style={styles.qtyVal}>{item.quantity}</Text>
                      <TouchableOpacity
                        style={styles.qtyBtn}
                        onPress={() => onUpdateQuantity(item.product.id, item.size, 1)}
                      >
                        <Text style={styles.qtyBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => onRemoveItem(item.product.id, item.size)}
                    >
                      <Text style={styles.deleteBtnText}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* Fulfillment Switcher: Pickup vs Courier */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeading}>
              {locale === 'kz' ? 'Жеткізу түрі' : 'Способ получения'}
            </Text>
            <View style={styles.typeSwitcher}>
              <TouchableOpacity
                style={[styles.typeBtn, fulfillmentType === 'pickup' && styles.typeBtnActive]}
                onPress={() => setFulfillmentType('pickup')}
              >
                <Text style={styles.typeBtnIcon}>🏬</Text>
                <Text style={[styles.typeBtnText, fulfillmentType === 'pickup' && styles.typeBtnTextActive]}>
                  {locale === 'kz' ? 'Өзіңіз алып кету' : 'Самовывоз'}
                </Text>
                <Text style={styles.typeBtnSub}>Бесплатно</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.typeBtn, fulfillmentType === 'courier' && styles.typeBtnActive]}
                onPress={() => setFulfillmentType('courier')}
              >
                <Text style={styles.typeBtnIcon}>🚚</Text>
                <Text style={[styles.typeBtnText, fulfillmentType === 'courier' && styles.typeBtnTextActive]}>
                  {locale === 'kz' ? 'Курьермен' : 'Курьер по Алматы'}
                </Text>
                <Text style={styles.typeBtnSub}>
                  {subtotalKzt > 15000 ? 'Бесплатно' : '1 500 ₸'}
                </Text>
              </TouchableOpacity>
            </View>

            {fulfillmentType === 'pickup' ? (
              <View style={styles.pickupBox}>
                <Text style={styles.pickupLabel}>
                  {locale === 'kz' ? 'Таңдалған дүкен (16 филиал):' : 'Пункт выдачи заказа (16 филиалов):'}
                </Text>
                <Text style={styles.pickupName}>
                  {locale === 'kz' ? currentStore.nameKz : currentStore.nameRu}
                </Text>
                <Text style={styles.pickupAddress}>
                  {locale === 'kz' ? currentStore.addressKz : currentStore.addressRu}
                </Text>
                <Text style={styles.pickupHours}>🕒 {currentStore.openHoursRu}</Text>
              </View>
            ) : (
              <View style={styles.courierBox}>
                <Text style={styles.fieldLabel}>
                  {locale === 'kz' ? 'Алматы ауданын таңдаңыз:' : 'Район Алматы:'}
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.districtRow}>
                  {ALMATY_DISTRICTS.map(d => (
                    <TouchableOpacity
                      key={d.id}
                      style={[styles.districtPill, selectedDistrict === d.ru && styles.districtPillActive]}
                      onPress={() => setSelectedDistrict(d.ru)}
                    >
                      <Text style={[styles.districtPillText, selectedDistrict === d.ru && styles.districtPillTextActive]}>
                        {locale === 'kz' ? d.kz : d.ru}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={styles.fieldLabel}>{locale === 'kz' ? 'Көше, үй:' : 'Улица и номер дома:'}</Text>
                <TextInput
                  placeholder="Например: пр. Абая, 150"
                  placeholderTextColor="#9ca3af"
                  value={streetAddress}
                  onChangeText={setStreetAddress}
                  style={styles.textInput}
                />

                <Text style={styles.fieldLabel}>{locale === 'kz' ? 'Пәтер / Кеңсе:' : 'Квартира / Офис (необязательно):'}</Text>
                <TextInput
                  placeholder="Например: кв. 42, 3 этаж"
                  placeholderTextColor="#9ca3af"
                  value={apartment}
                  onChangeText={setApartment}
                  style={styles.textInput}
                />
              </View>
            )}
          </View>

          {/* Customer Contacts */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeading}>
              {locale === 'kz' ? 'Алушы мәліметтері' : 'Данные получателя'}
            </Text>

            <Text style={styles.fieldLabel}>{locale === 'kz' ? 'Сіздің атыңыз:' : 'Ваше имя:'}</Text>
            <TextInput
              placeholder="Как к вам обращаться"
              placeholderTextColor="#9ca3af"
              value={customerName}
              onChangeText={setCustomerName}
              style={styles.textInput}
            />

            <Text style={styles.fieldLabel}>{locale === 'kz' ? 'Телефон нөмірі (СМС үшін):' : 'Номер телефона (для SMS):'}</Text>
            <TextInput
              placeholder="+7 (7xx) xxx-xx-xx"
              placeholderTextColor="#9ca3af"
              value={customerPhone}
              onChangeText={setCustomerPhone}
              keyboardType="phone-pad"
              style={styles.textInput}
            />

            <Text style={styles.fieldLabel}>{locale === 'kz' ? 'Тапсырысқа түсініктеме:' : 'Комментарий к заказу:'}</Text>
            <TextInput
              placeholder="Код домофона, пожелания к упаковке..."
              placeholderTextColor="#9ca3af"
              value={comment}
              onChangeText={setComment}
              style={styles.textInput}
            />
          </View>

          {/* Payment Method */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeading}>
              {locale === 'kz' ? 'Төлем әдісі' : 'Способ оплаты'}
            </Text>

            <TouchableOpacity
              style={[styles.paymentMethodRow, paymentMethod === 'kaspi_pay' && styles.paymentMethodRowActive]}
              onPress={() => setPaymentMethod('kaspi_pay')}
            >
              <View style={styles.radioDot}>
                {paymentMethod === 'kaspi_pay' && <View style={styles.radioDotInner} />}
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.paymentMethodTitle}>🔴 Kaspi Pay / Kaspi Red 0-0-3</Text>
                <Text style={styles.paymentMethodSub}>
                  Оплата через Kaspi QR без комиссии, рассрочка на 3 месяца
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.paymentMethodRow, paymentMethod === 'cash_on_delivery' && styles.paymentMethodRowActive]}
              onPress={() => setPaymentMethod('cash_on_delivery')}
            >
              <View style={styles.radioDot}>
                {paymentMethod === 'cash_on_delivery' && <View style={styles.radioDotInner} />}
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.paymentMethodTitle}>💵 При получении</Text>
                <Text style={styles.paymentMethodSub}>
                  Наличными или картой в магазине / курьеру
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Order Summary Calculation */}
          <View style={styles.summaryCard}>
            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>Сумма товаров:</Text>
              <Text style={styles.calcVal}>{formatKZT(subtotalKzt)}</Text>
            </View>
            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>Доставка:</Text>
              <Text style={styles.calcVal}>
                {deliveryFeeKzt === 0 ? 'Бесплатно' : formatKZT(deliveryFeeKzt)}
              </Text>
            </View>
            <View style={[styles.calcRow, styles.calcRowTotal]}>
              <Text style={styles.calcLabelTotal}>Итого к оплате:</Text>
              <Text style={styles.calcValTotal}>{formatKZT(totalKzt)}</Text>
            </View>

            <TouchableOpacity
              style={styles.checkoutBtn}
              onPress={handleStartCheckout}
              activeOpacity={0.85}
            >
              <Text style={styles.checkoutBtnText}>
                {paymentMethod === 'kaspi_pay'
                  ? `Оплатить через Kaspi • ${formatKZT(totalKzt)}`
                  : `Оформить заказ • ${formatKZT(totalKzt)}`}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* Kaspi Pay Interactive Modal */}
      <Modal
        visible={isKaspiModalOpen}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsKaspiModalOpen(false)}
      >
        <View style={styles.kaspiModalOverlay}>
          <View style={styles.kaspiModalBox}>
            <View style={styles.kaspiHeader}>
              <Text style={styles.kaspiBrand}>Kaspi.kz</Text>
              <TouchableOpacity onPress={() => setIsKaspiModalOpen(false)}>
                <Text style={styles.kaspiClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.kaspiAmountTitle}>Сумма к оплате</Text>
            <Text style={styles.kaspiAmountValue}>{formatKZT(totalKzt)}</Text>
            <Text style={styles.kaspiStoreName}>Торговая сеть «Индийский Трикотаж»</Text>

            {/* Simulated QR Code box */}
            <View style={styles.qrCodeBox}>
              <Text style={styles.qrCodeEmoji}>📱</Text>
              <Text style={styles.qrCodeText}>Отсканируйте Kaspi QR в приложении</Text>
              <View style={styles.kaspiRedBadge}>
                <Text style={styles.kaspiRedBadgeText}>
                  Доступен Kaspi Red 0-0-3 ({formatKZT(Math.round(totalKzt / 3))} ₸ x 3)
                </Text>
              </View>
            </View>

            {/* Confirm Payment Simulation Button */}
            <TouchableOpacity
              style={[styles.kaspiPayNowBtn, isProcessing && { opacity: 0.6 }]}
              onPress={() => finalizeOrder('kaspi_pay')}
              disabled={isProcessing}
            >
              <Text style={styles.kaspiPayNowText}>
                {isProcessing ? '⏳ Подтверждение оплаты...' : '✓ Подтвердить оплату через Kaspi.kz'}
              </Text>
            </TouchableOpacity>
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
  title: { color: '#fef3c7', fontSize: 18, fontWeight: '800' },
  subtitle: { color: '#fde68a', fontSize: 12, marginTop: 2 },
  scrollContent: { padding: 16, gap: 14 },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sectionHeading: { fontSize: 14, fontWeight: '800', color: '#111827', marginBottom: 12 },
  itemRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  itemImage: { width: 70, height: 70, borderRadius: 8, backgroundColor: '#f3f4f6', marginRight: 12 },
  itemBody: { flex: 1 },
  itemTitle: { fontSize: 13, fontWeight: '600', color: '#1f2937' },
  itemMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  metaBadge: { fontSize: 11, color: '#6b7280', backgroundColor: '#f3f4f6', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  colorPill: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  colorDot: { width: 10, height: 10, borderRadius: 5 },
  colorText: { fontSize: 11, color: '#6b7280' },
  itemPrice: { fontSize: 14, fontWeight: '800', color: '#b45309', marginTop: 4 },
  quantityRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  counterBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  qtyBtn: { paddingHorizontal: 10, paddingVertical: 4 },
  qtyBtnText: { fontSize: 16, fontWeight: '700', color: '#374151' },
  qtyVal: { paddingHorizontal: 8, fontSize: 13, fontWeight: '700', color: '#111827' },
  deleteBtn: { padding: 4 },
  deleteBtnText: { fontSize: 16 },
  typeSwitcher: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  typeBtn: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
  },
  typeBtnActive: { borderColor: '#b45309', backgroundColor: '#fffbeb' },
  typeBtnIcon: { fontSize: 20, marginBottom: 2 },
  typeBtnText: { fontSize: 12, fontWeight: '700', color: '#374151' },
  typeBtnTextActive: { color: '#92400e' },
  typeBtnSub: { fontSize: 10, color: '#6b7280', marginTop: 2 },
  pickupBox: {
    backgroundColor: '#fffbeb',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  pickupLabel: { fontSize: 10, color: '#92400e', textTransform: 'uppercase', fontWeight: '700' },
  pickupName: { fontSize: 13, fontWeight: '800', color: '#451a03', marginTop: 2 },
  pickupAddress: { fontSize: 11, color: '#78350f', marginTop: 2 },
  pickupHours: { fontSize: 11, color: '#92400e', marginTop: 4, fontWeight: '600' },
  courierBox: { gap: 8 },
  districtRow: { gap: 6, paddingVertical: 4 },
  districtPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
  },
  districtPillActive: { backgroundColor: '#b45309', borderColor: '#b45309' },
  districtPillText: { fontSize: 11, color: '#4b5563', fontWeight: '600' },
  districtPillTextActive: { color: '#ffffff' },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: '#4b5563', marginTop: 4 },
  textInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#111827',
  },
  paymentMethodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    marginBottom: 8,
  },
  paymentMethodRowActive: { borderColor: '#dc2626', backgroundColor: '#fef2f2' },
  radioDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#9ca3af',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDotInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#dc2626' },
  paymentMethodTitle: { fontSize: 13, fontWeight: '700', color: '#111827' },
  paymentMethodSub: { fontSize: 11, color: '#6b7280', marginTop: 2 },
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  calcRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  calcRowTotal: { borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 10, marginTop: 4 },
  calcLabel: { fontSize: 13, color: '#6b7280' },
  calcVal: { fontSize: 13, fontWeight: '600', color: '#111827' },
  calcLabelTotal: { fontSize: 16, fontWeight: '800', color: '#111827' },
  calcValTotal: { fontSize: 18, fontWeight: '800', color: '#b45309' },
  checkoutBtn: {
    marginTop: 14,
    backgroundColor: '#dc2626',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  checkoutBtnText: { color: '#ffffff', fontSize: 15, fontWeight: '800' },
  emptyContainer: { alignItems: 'center', paddingVertical: 80, paddingHorizontal: 20 },
  emptyEmoji: { fontSize: 50, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 6 },
  emptySub: { fontSize: 13, color: '#6b7280', textAlign: 'center', marginBottom: 20 },
  emptyBtn: {
    backgroundColor: '#b45309',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  emptyBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
  kaspiModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  kaspiModalBox: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
  },
  kaspiHeader: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kaspiBrand: { fontSize: 18, fontWeight: '900', color: '#dc2626' },
  kaspiClose: { fontSize: 18, color: '#9ca3af', fontWeight: '700' },
  kaspiAmountTitle: { fontSize: 12, color: '#6b7280', marginTop: 12 },
  kaspiAmountValue: { fontSize: 26, fontWeight: '900', color: '#111827', marginTop: 2 },
  kaspiStoreName: { fontSize: 12, color: '#4b5563', marginTop: 2 },
  qrCodeBox: {
    marginVertical: 18,
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    width: '100%',
  },
  qrCodeEmoji: { fontSize: 54, marginBottom: 6 },
  qrCodeText: { fontSize: 12, fontWeight: '600', color: '#374151' },
  kaspiRedBadge: { backgroundColor: '#fef2f2', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginTop: 8 },
  kaspiRedBadgeText: { fontSize: 11, fontWeight: '700', color: '#dc2626' },
  kaspiPayNowBtn: {
    width: '100%',
    backgroundColor: '#dc2626',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  kaspiPayNowText: { color: '#ffffff', fontSize: 14, fontWeight: '800' },
  successContainer: { flex: 1, backgroundColor: '#ffffff', padding: 24, alignItems: 'center', justifyContent: 'center' },
  successIconBox: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#ecfdf5', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  successIcon: { fontSize: 36 },
  successTitle: { fontSize: 20, fontWeight: '900', color: '#047857', textAlign: 'center', marginBottom: 4 },
  successOrderNumber: { fontSize: 16, fontWeight: '800', color: '#b45309', marginBottom: 12 },
  successDesc: { fontSize: 13, color: '#4b5563', textAlign: 'center', lineHeight: 18, marginBottom: 20 },
  orderSummaryCard: { width: '100%', backgroundColor: '#f9fafb', padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 24 },
  summaryRow: { fontSize: 13, color: '#4b5563', marginBottom: 6 },
  continueShopBtn: { width: '100%', backgroundColor: '#78350f', paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  continueShopBtnText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
});
