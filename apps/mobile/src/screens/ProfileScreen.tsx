import React, { useState, useEffect } from 'react';
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
  const [email, setEmail] = useState(userProfile.email || '');

  // Keep local state in sync when profile updates
  useEffect(() => {
    setName(userProfile.name);
    setPhone(userProfile.phone);
    setEmail(userProfile.email || '');
  }, [userProfile]);

  const handleSaveProfile = () => {
    if (!name.trim()) {
      Alert.alert(locale === 'kz' ? 'Қате' : 'Ошибка', locale === 'kz' ? 'Аты-жөніңізді енгізіңіз' : 'Введите имя');
      return;
    }
    onUpdateProfile({
      ...userProfile,
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
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
        encodeURIComponent('Здравствуйте! Вопрос по приложению «Индийский Трикотаж».')
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
          <Text style={styles.subtitle}>
            {userProfile.isRegistered
              ? userProfile.phone
              : locale === 'kz'
              ? 'Қонақ режимі'
              : 'Гостевой режим'}
          </Text>
        </View>
        <TouchableOpacity style={styles.langBadge} onPress={onToggleLocale} activeOpacity={0.8}>
          <Text style={styles.langText}>{locale === 'ru' ? 'KZ 🇰🇿' : 'RU 🇷🇺'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* ================= GUEST STATE (NOT REGISTERED) ================= */}
        {!userProfile.isRegistered ? (
          <View style={styles.guestCard}>
            <View style={styles.guestAvatarCircle}>
              <Ionicons name="person-circle-outline" size={64} color="#b45309" />
            </View>

            <Text style={styles.guestTitle}>
              {locale === 'kz' ? 'Кіру немесе Тіркелу' : 'Войдите или зарегистрируйтесь'}
            </Text>
            <Text style={styles.guestDesc}>
              {locale === 'kz'
                ? 'Жеке кабинетке кіріп, бонустар жинаңыз және Face ID арқылы жылдам кіруді қосыңыз.'
                : 'Войдите по номеру телефона, чтобы копить бонусы 5% с покупок, отслеживать заказы и входить по Face ID.'}
            </Text>

            {/* Perks list */}
            <View style={styles.guestPerksList}>
              <View style={styles.guestPerkItem}>
                <Ionicons name="gift" size={18} color="#b45309" />
                <Text style={styles.guestPerkText}>
                  {locale === 'kz'
                    ? '+1 000 ₸ сәлемдесу бонусы бірден шотыңызға'
                    : '+1 000 ₸ приветственный бонус при регистрации'}
                </Text>
              </View>
              <View style={styles.guestPerkItem}>
                <Ionicons name="star" size={18} color="#f59e0b" />
                <Text style={styles.guestPerkText}>
                  {locale === 'kz'
                    ? 'Әр тапсырыстан 5% кешбэк (1 бонус = 1 ₸)'
                    : 'Кешбэк 5% с каждой покупки (1 бонус = 1 ₸)'}
                </Text>
              </View>
              <View style={styles.guestPerkItem}>
                <Ionicons name="receipt-outline" size={18} color="#0284c7" />
                <Text style={styles.guestPerkText}>
                  {locale === 'kz'
                    ? 'Тапсырыстар тарихы және жеткізуді бақылау'
                    : 'История покупок и отслеживание статуса доставки'}
                </Text>
              </View>
              <View style={styles.guestPerkItem}>
                <Ionicons name="scan-outline" size={18} color="#059669" />
                <Text style={styles.guestPerkText}>
                  {locale === 'kz'
                    ? 'Face ID және телефон құлпы арқылы жылдам кіру'
                    : 'Быстрый вход по Face ID и коду разблокировки телефона'}
                </Text>
              </View>
            </View>

            {/* Main Action Button */}
            <TouchableOpacity style={styles.guestLoginBtn} onPress={onOpenAuthModal} activeOpacity={0.88}>
              <Ionicons name="log-in-outline" size={20} color="#ffffff" style={{ marginRight: 8 }} />
              <Text style={styles.guestLoginBtnText}>
                {locale === 'kz' ? 'Кіру / Тіркелу' : 'Войти / Зарегистрироваться'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* ================= REGISTERED USER PROFILE ================= */
          <>
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
                  <Ionicons name="shield-checkmark" size={18} color="#059669" />
                  <Text style={styles.cardTitle}>
                    {locale === 'kz' ? 'Қауіпсіздік және Kaspi ID' : 'Безопасность и вход (Kaspi ID)'}
                  </Text>
                </View>
                <View style={styles.secureTag}>
                  <Text style={styles.secureTagText}>Активно</Text>
                </View>
              </View>

              <View style={styles.securityList}>
                {/* Biometrics Toggle (Face ID / Touch ID / Device Lock) */}
                <View style={styles.securityRow}>
                  <View style={styles.securityRowLeft}>
                    <Ionicons name="scan-outline" size={20} color="#b45309" style={{ marginRight: 10 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.securityRowTitle}>Face ID / Код телефона</Text>
                      <Text style={styles.securityRowSub}>
                        {locale === 'kz'
                          ? 'Смартфонның стандартты құлпымен кіру'
                          : 'Вход по биометрии или паролю/рисунку экрана'}
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

                {/* Quick Lock Button */}
                <TouchableOpacity style={styles.lockNowBtn} onPress={onLockApp} activeOpacity={0.8}>
                  <Ionicons name="lock-closed" size={16} color="#ffffff" style={{ marginRight: 6 }} />
                  <Text style={styles.lockNowBtnText}>
                    {locale === 'kz'
                      ? 'Қосымшаны бұғаттау (Face ID тексеру)'
                      : 'Заблокировать приложение (проверить Face ID)'}
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
                    <Text style={styles.infoVal}>{userProfile.email || '—'}</Text>
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
                            {order.items.length} {locale === 'kz' ? 'тауар' : 'позиций'}
                          </Text>
                          <Text style={styles.orderTotal}>{formatKZT(order.totalKzt)}</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Log Out Button */}
            <TouchableOpacity style={styles.logoutBtn} onPress={onLogout} activeOpacity={0.8}>
              <Ionicons name="log-out-outline" size={18} color="#ef4444" style={{ marginRight: 6 }} />
              <Text style={styles.logoutBtnText}>
                {locale === 'kz' ? 'Аккаунттан шығу' : 'Выйти из аккаунта'}
              </Text>
            </TouchableOpacity>
          </>
        )}

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
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
    backgroundColor: '#78350f',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fef3c7',
  },
  subtitle: {
    fontSize: 12,
    color: '#fde68a',
    marginTop: 2,
    fontWeight: '500',
  },
  langBadge: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  langText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  content: {
    padding: 16,
    gap: 14,
  },
  guestCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  guestAvatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fffbeb',
    borderWidth: 2,
    borderColor: '#fde68a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  guestTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 6,
  },
  guestDesc: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  guestPerksList: {
    width: '100%',
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 12,
    gap: 10,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  guestPerkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  guestPerkText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    lineHeight: 16,
  },
  guestLoginBtn: {
    width: '100%',
    backgroundColor: '#b45309',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 16,
    elevation: 3,
    shadowColor: '#b45309',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  guestLoginBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  bonusCard: {
    backgroundColor: '#78350f',
    borderRadius: 18,
    padding: 18,
    elevation: 3,
    shadowColor: '#78350f',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  bonusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  bonusLabel: {
    color: '#fde68a',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  bonusVal: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '800',
    marginTop: 4,
  },
  bonusBadge: {
    backgroundColor: '#fbbf24',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bonusBadgeText: {
    color: '#451a03',
    fontSize: 11,
    fontWeight: '800',
  },
  bonusDesc: {
    color: '#fef3c7',
    fontSize: 12,
    lineHeight: 16,
    opacity: 0.9,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  secureTag: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  secureTagText: {
    color: '#059669',
    fontSize: 10,
    fontWeight: '700',
  },
  securityList: {
    gap: 12,
  },
  securityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  securityRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  securityRowTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  securityRowSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  lockNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#78350f',
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 4,
  },
  lockNowBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  editBtnText: {
    fontSize: 12,
    color: '#b45309',
    fontWeight: '700',
  },
  profileInfoList: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  infoLabel: {
    fontSize: 13,
    color: '#64748b',
  },
  infoVal: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 13,
    color: '#0f172a',
  },
  saveBtn: {
    backgroundColor: '#b45309',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 6,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyOrders: {
    alignItems: 'center',
    paddingVertical: 18,
  },
  emptyOrdersTitle: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 8,
  },
  startShopBtn: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  startShopBtnText: {
    color: '#b45309',
    fontSize: 12,
    fontWeight: '700',
  },
  orderItem: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  orderItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  orderId: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  orderDate: {
    fontSize: 11,
    color: '#94a3b8',
    marginBottom: 4,
  },
  orderType: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  orderDivider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 8,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderItemsCount: {
    fontSize: 12,
    color: '#64748b',
  },
  orderTotal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  supportCard: {
    backgroundColor: '#f0fdf4',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  supportTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#166534',
    marginBottom: 4,
  },
  supportSub: {
    fontSize: 12,
    color: '#15803d',
    lineHeight: 16,
    marginBottom: 12,
  },
  whatsappBtn: {
    backgroundColor: '#16a34a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  whatsappBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff1f2',
    borderWidth: 1,
    borderColor: '#fecdd3',
    paddingVertical: 12,
    borderRadius: 12,
  },
  logoutBtnText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '700',
  },
  brandAbout: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  brandAboutTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 4,
  },
  brandAboutText: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 15,
  },
  brandAboutVersion: {
    fontSize: 10,
    color: '#cbd5e1',
    marginTop: 6,
  },
});
