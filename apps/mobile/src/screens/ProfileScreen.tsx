import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  TextInput,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatKZT } from '@india-trikotaj/shared';
import type { MobileOrder, UserProfile } from '../types';

interface Props {
  userProfile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
  orders: MobileOrder[];
  locale: 'ru' | 'kz';
  onToggleLocale: () => void;
  onNavigateToCatalog: () => void;
  onLockApp: () => void;
  onOpenAuthModal: () => void;
  onLogout: () => void;
}

export function ProfileScreen({
  userProfile,
  onUpdateProfile,
  orders,
  locale,
  onToggleLocale,
  onNavigateToCatalog,
  onLockApp,
  onOpenAuthModal,
  onLogout,
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(userProfile.name);
  const [phone, setPhone] = useState(userProfile.phone);
  const [email, setEmail] = useState(userProfile.email || 'dostiyar@gmail.com');

  const handleSaveProfile = () => {
    onUpdateProfile({
      ...userProfile,
      name,
      phone,
      email,
    });
    setIsEditing(false);
    Alert.alert(
      locale === 'kz' ? 'Сақталды' : 'Сохранено',
      locale === 'kz' ? 'Профиль сәтті жаңартылды' : 'Данные профиля обновлены'
    );
  };

  const handleToggleBiometrics = (val: boolean) => {
    onUpdateProfile({
      ...userProfile,
      biometricsEnabled: val,
    });
  };

  const handleWhatsAppSupport = () => {
    Linking.openURL(
      'https://wa.me/77019928412?text=' +
        encodeURIComponent('Здравствуйте! Вопрос по заказу в приложении «Индийский Трикотаж».')
    );
  };

  const statusMap: Record<string, { ru: string; kz: string; color: string; bg: string }> = {
    new: { ru: 'Принят', kz: 'Қабылданды', color: '#b45309', bg: '#fef3c7' },
    processing: { ru: 'Собирается на складе', kz: 'Қоймада жиналуда', color: '#1d4ed8', bg: '#dbeafe' },
    ready_for_pickup: { ru: 'Готов к выдаче в магазине', kz: 'Дүкенде алуға дайын', color: '#047857', bg: '#ecfdf5' },
    in_delivery: { ru: 'Передан курьеру', kz: 'Курьерге берілді', color: '#6d28d9', bg: '#ede9fe' },
    completed: { ru: 'Выполнен', kz: 'Аяқталды', color: '#15803d', bg: '#f0fdf4' },
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{locale === 'kz' ? 'Жеке кабинет' : 'Личный кабинет'}</Text>
          <Text style={styles.subtitle}>{userProfile.phone}</Text>
        </View>
        <TouchableOpacity style={styles.langBadge} onPress={onToggleLocale} activeOpacity={0.8}>
          <Text style={styles.langText}>{locale === 'ru' ? 'KZ 🇰🇿' : 'RU 🇷🇺'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Loyalty Bonus Card */}
        <View style={styles.bonusCard}>
          <View style={styles.bonusHeader}>
            <View>
              <Text style={styles.bonusLabel}>
                {locale === 'kz' ? 'Бонустық шот:' : 'Бонусный баланс:'}
              </Text>
              <Text style={styles.bonusVal}>{formatKZT(userProfile.bonusPoints)}</Text>
            </View>
            <View style={styles.bonusBadge}>
              <Ionicons name="star" size={12} color="#451a03" style={{ marginRight: 3 }} />
              <Text style={styles.bonusBadgeText}>Gold 5%</Text>
            </View>
          </View>
          <Text style={styles.bonusDesc}>
            {locale === 'kz'
              ? 'Әрбір сатып алудан 5% кэшбэк беріледі. 1 бонус = 1 теңге.'
              : 'Кэшбэк 5% с каждой покупки трикотажа. 1 бонус = 1 ₸. Можно оплачивать до 30% заказа.'}
          </Text>
        </View>

        {/* Security & Kaspi ID Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="shield-checkmark" size={18} color="#dc2626" />
              <Text style={styles.cardTitle}>
                {locale === 'kz' ? 'Қауіпсіздік және Kaspi ID' : 'Безопасность и вход (Kaspi ID)'}
              </Text>
            </View>
            <View style={styles.secureTag}>
              <Text style={styles.secureTagText}>Активно</Text>
            </View>
          </View>

          <View style={styles.securityList}>
            {/* Biometrics Toggle */}
            <View style={styles.securityRow}>
              <View style={styles.securityRowLeft}>
                <Ionicons name="scan-outline" size={20} color="#b45309" style={{ marginRight: 10 }} />
                <View>
                  <Text style={styles.securityRowTitle}>Face ID / Touch ID</Text>
                  <Text style={styles.securityRowSub}>
                    {locale === 'kz' ? 'Биометриямен жылдам ашу' : 'Разблокировка лицом или отпечатком'}
                  </Text>
                </View>
              </View>
              <Switch
                value={Boolean(userProfile.biometricsEnabled)}
                onValueChange={handleToggleBiometrics}
                trackColor={{ false: '#cbd5e1', true: '#059669' }}
                thumbColor="#ffffff"
              />
            </View>

            {/* PIN Code Setup */}
            <View style={styles.securityRow}>
              <View style={styles.securityRowLeft}>
                <Ionicons name="keypad-outline" size={20} color="#b45309" style={{ marginRight: 10 }} />
                <View>
                  <Text style={styles.securityRowTitle}>
                    {locale === 'kz' ? '4 санды ПИН-код' : '4-значный ПИН-код'}
                  </Text>
                  <Text style={styles.securityRowSub}>
                    {userProfile.pinCode ? '••••' : 'Не установлен'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity style={styles.actionPill} onPress={onOpenAuthModal} activeOpacity={0.7}>
                <Text style={styles.actionPillText}>
                  {locale === 'kz' ? 'Өзгерту' : 'Изменить'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Graphic Pattern */}
            <View style={styles.securityRow}>
              <View style={styles.securityRowLeft}>
                <Ionicons name="grid-outline" size={20} color="#b45309" style={{ marginRight: 10 }} />
                <View>
                  <Text style={styles.securityRowTitle}>
                    {locale === 'kz' ? 'Графикалық кілт (сурет)' : 'Графический ключ'}
                  </Text>
                  <Text style={styles.securityRowSub}>
                    {userProfile.patternCode ? 'Настроен (3x3)' : 'Не задан'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity style={styles.actionPill} onPress={onOpenAuthModal} activeOpacity={0.7}>
                <Text style={styles.actionPillText}>
                  {locale === 'kz' ? 'Өзгерту' : 'Изменить'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Quick Lock Button */}
            <TouchableOpacity style={styles.lockNowBtn} onPress={onLockApp} activeOpacity={0.8}>
              <Ionicons name="lock-closed" size={16} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.lockNowBtnText}>
                {locale === 'kz' ? 'Қосымшаны бұғаттау (Экран блокировки)' : 'Заблокировать приложение сейчас'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* User Profile Form */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="person-circle-outline" size={18} color="#b45309" />
              <Text style={styles.cardTitle}>
                {locale === 'kz' ? 'Менің деректерім' : 'Мои данные'}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setIsEditing(!isEditing)} activeOpacity={0.7}>
              <Text style={styles.editBtnText}>
                {isEditing
                  ? locale === 'kz'
                    ? 'Болдырмау'
                    : 'Отмена'
                  : locale === 'kz'
                  ? 'Өзгерту'
                  : 'Редактировать'}
              </Text>
            </TouchableOpacity>
          </View>

          {isEditing ? (
            <View style={{ gap: 10, marginTop: 8 }}>
              <Text style={styles.inputLabel}>{locale === 'kz' ? 'Аты-жөні:' : 'ФИО:'}</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Ваше имя"
              />
              <Text style={styles.inputLabel}>{locale === 'kz' ? 'Телефон:' : 'Телефон:'}</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholder="+7 (7xx) xxx-xx-xx"
              />
              <Text style={styles.inputLabel}>{locale === 'kz' ? 'Электрондық пошта:' : 'Email:'}</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="dostiyar@gmail.com"
              />
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile} activeOpacity={0.88}>
                <Text style={styles.saveBtnText}>
                  {locale === 'kz' ? 'Сақтау' : 'Сохранить изменения'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.profileInfoList}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{locale === 'kz' ? 'Аты-жөні:' : 'ФИО:'}</Text>
                <Text style={styles.infoVal}>{userProfile.name}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{locale === 'kz' ? 'Телефон:' : 'Телефон:'}</Text>
                <Text style={styles.infoVal}>{userProfile.phone}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{locale === 'kz' ? 'Пошта:' : 'Почта:'}</Text>
                <Text style={styles.infoVal}>{userProfile.email || 'dostiyar@gmail.com'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{locale === 'kz' ? 'Қала:' : 'Город:'}</Text>
                <Text style={styles.infoVal}>Алматы, Казахстан</Text>
              </View>
            </View>
          )}
        </View>

        {/* Order History */}
        <View style={styles.card}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <Ionicons name="receipt-outline" size={17} color="#b45309" />
            <Text style={styles.cardTitle}>
              {locale === 'kz' ? 'Менің тапсырыстарым' : 'История заказов'} ({orders.length})
            </Text>
          </View>

          {orders.length === 0 ? (
            <View style={styles.emptyOrders}>
              <Ionicons name="cube-outline" size={36} color="#94a3b8" style={{ marginBottom: 6 }} />
              <Text style={styles.emptyOrdersTitle}>
                {locale === 'kz' ? 'Әзірге тапсырыстар жоқ' : 'У вас пока нет заказов'}
              </Text>
              <TouchableOpacity style={styles.startShopBtn} onPress={onNavigateToCatalog} activeOpacity={0.8}>
                <Text style={styles.startShopBtnText}>
                  {locale === 'kz' ? 'Каталогқа өту' : 'Перейти в каталог'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ gap: 10, marginTop: 10 }}>
              {orders.map(order => {
                const st = statusMap[order.status] || statusMap['processing']!;
                return (
                  <View key={order.id} style={styles.orderItem}>
                    <View style={styles.orderItemHeader}>
                      <Text style={styles.orderId}>№ {order.id}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
                        <Text style={[styles.statusBadgeText, { color: st.color }]}>
                          {locale === 'kz' ? st.kz : st.ru}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.orderDate}>{order.createdAt}</Text>

                    <Text style={styles.orderType}>
                      {order.fulfillmentType === 'pickup'
                        ? locale === 'kz'
                          ? '🏬 Самовывоз дүкеннен'
                          : '🏬 Самовывоз из магазина'
                        : locale === 'kz'
                        ? '🚚 Алматы бойынша курьер'
                        : '🚚 Курьерская доставка'}
                    </Text>

                    <View style={styles.orderDivider} />

                    <View style={styles.orderFooter}>
                      <Text style={styles.orderItemsCount}>
                        {order.items.length}{' '}
                        {locale === 'kz' ? 'тауар' : 'позиций'}
                      </Text>
                      <Text style={styles.orderTotal}>{formatKZT(order.totalKzt)}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Customer Care / WhatsApp */}
        <View style={styles.supportCard}>
          <Text style={styles.supportTitle}>
            {locale === 'kz' ? 'Сұрақтарыңыз бар ма?' : 'Возникли вопросы по заказу?'}
          </Text>
          <Text style={styles.supportSub}>
            {locale === 'kz'
              ? 'Біздің кеңесшілер WhatsApp арқылы кез келген уақытта жауап беруге дайын.'
              : 'Наши консультанты помогут подобрать размер, цвет и сориентируют по доставке.'}
          </Text>

          <TouchableOpacity style={styles.whatsappBtn} onPress={handleWhatsAppSupport} activeOpacity={0.88}>
            <Ionicons name="logo-whatsapp" size={18} color="#ffffff" style={{ marginRight: 6 }} />
            <Text style={styles.whatsappBtnText}>Написать в WhatsApp</Text>
          </TouchableOpacity>
        </View>

        {/* Log Out Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={18} color="#ef4444" style={{ marginRight: 6 }} />
          <Text style={styles.logoutBtnText}>
            {locale === 'kz' ? 'Аккаунттан шығу' : 'Выйти из аккаунта'}
          </Text>
        </TouchableOpacity>

        {/* Brand Information */}
        <View style={styles.brandAbout}>
          <Text style={styles.brandAboutTitle}>«Индийский Трикотаж» в Алматы</Text>
          <Text style={styles.brandAboutText}>
            Прямые поставки трикотажа от ведущих фабрик Индии (Тируппур, Мумбаи). 16 розничных магазинов в торговых центрах Алматы.
          </Text>
          <Text style={styles.brandAboutVersion}>Версия: 1.3.0 • Kaspi ID Security Enabled</Text>
        </View>

        <View style={{ height: 30 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
    backgroundColor: '#78350f',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { color: '#fef3c7', fontSize: 18, fontWeight: '800' },
  subtitle: { color: '#fde68a', fontSize: 12, marginTop: 2 },
  langBadge: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  langText: { color: '#ffffff', fontSize: 12, fontWeight: '700' },
  content: { padding: 14, gap: 12 },
  bonusCard: {
    backgroundColor: '#78350f',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#78350f',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  bonusHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bonusLabel: { color: '#fde68a', fontSize: 11, textTransform: 'uppercase', fontWeight: '700' },
  bonusVal: { color: '#ffffff', fontSize: 26, fontWeight: '900', marginTop: 2 },
  bonusBadge: { backgroundColor: '#f59e0b', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  bonusBadgeText: { color: '#451a03', fontSize: 11, fontWeight: '800' },
  bonusDesc: { color: '#fef3c7', fontSize: 11, marginTop: 10, lineHeight: 16 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 14, fontWeight: '800', color: '#0f172a' },
  editBtnText: { fontSize: 12, fontWeight: '700', color: '#b45309' },
  secureTag: {
    backgroundColor: '#fef2f2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  secureTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#dc2626',
  },
  securityList: {
    marginTop: 12,
    gap: 12,
  },
  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  securityRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  securityRowTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  securityRowSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  actionPill: {
    backgroundColor: '#fffbeb',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  actionPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#b45309',
  },
  lockNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#475569',
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 4,
  },
  lockNowBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  profileInfoList: { marginTop: 10, gap: 8 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  infoLabel: { fontSize: 13, color: '#64748b' },
  infoVal: { fontSize: 13, fontWeight: '600', color: '#0f172a' },
  inputLabel: { fontSize: 12, fontWeight: '600', color: '#475569' },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0f172a',
  },
  saveBtn: {
    backgroundColor: '#b45309',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 6,
  },
  saveBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '700' },
  emptyOrders: { alignItems: 'center', paddingVertical: 20 },
  emptyOrdersTitle: { fontSize: 13, color: '#64748b', marginBottom: 12 },
  startShopBtn: { backgroundColor: '#fef3c7', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  startShopBtnText: { fontSize: 12, fontWeight: '700', color: '#92400e' },
  orderItem: { backgroundColor: '#f8fafc', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  orderItemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderId: { fontSize: 13, fontWeight: '800', color: '#0f172a' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5 },
  statusBadgeText: { fontSize: 11, fontWeight: '700' },
  orderDate: { fontSize: 11, color: '#94a3b8', marginTop: 4 },
  orderType: { fontSize: 11, color: '#475569', marginTop: 6, fontWeight: '500' },
  orderDivider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 8 },
  orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderItemsCount: { fontSize: 12, color: '#64748b' },
  orderTotal: { fontSize: 14, fontWeight: '800', color: '#b45309' },
  supportCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  supportTitle: { fontSize: 14, fontWeight: '800', color: '#0f172a' },
  supportSub: { fontSize: 12, color: '#64748b', marginTop: 4, lineHeight: 16 },
  whatsappBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 12,
  },
  whatsappBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '700' },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#fca5a5',
    paddingVertical: 12,
    borderRadius: 12,
  },
  logoutBtnText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '700',
  },
  brandAbout: { padding: 12, alignItems: 'center' },
  brandAboutTitle: { fontSize: 12, fontWeight: '700', color: '#64748b' },
  brandAboutText: { fontSize: 11, color: '#94a3b8', textAlign: 'center', marginTop: 4, lineHeight: 15 },
  brandAboutVersion: { fontSize: 10, color: '#cbd5e1', marginTop: 6 },
});
