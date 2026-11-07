'use client';

import React, { useState, useEffect } from 'react';
import { useCart } from '../../contexts/CartContext';
import { useBranch } from '../../contexts/BranchContext';
import { useLocale } from '../../contexts/LocaleContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@india-trikotaj/ui';
import { formatKZT, validateKazakhstanPhone, normalizeKazakhstanPhone, formatPhoneInput } from '@india-trikotaj/shared';
import { Store, Truck, ShieldCheck, Sparkles, Gift } from 'lucide-react';
import { ApiClient } from '../../lib/api-client';
import { KaspiCheckoutModal } from './KaspiCheckoutModal';
import type { KaspiPaymentMode } from '../../types/checkout';

export function CheckoutForm() {
  const { cart, subtotalKzt, clearCart, fulfillmentType, setFulfillmentType } = useCart();
  const { selectedBranch, branches } = useBranch();
  const { locale, t } = useLocale();
  const { user, isAuthenticated, openAuthModal } = useAuth();

  const [pickupStoreId, setPickupStoreId] = useState<string>(selectedBranch.id);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('+7 (7');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerComment, setCustomerComment] = useState('');
  const [applyBonus, setApplyBonus] = useState(false);

  // Autofill user information if logged in
  useEffect(() => {
    if (user) {
      const displayName = user.fullName || user.name || '';
      if (displayName && !customerName) setCustomerName(displayName);
      if (user.phone && (customerPhone === '+7 (7' || !customerPhone)) {
        setCustomerPhone(formatPhoneInput(user.phone));
      }
      if (user.email && !customerEmail) setCustomerEmail(user.email);
    }
  }, [user]);

  // Courier address state
  const [districtRu, setDistrictRu] = useState('Медеуский');
  const [districtKz, setDistrictKz] = useState('Медеу ауданы');
  const [street, setStreet] = useState('');
  const [building, setBuilding] = useState('');
  const [apartment, setApartment] = useState('');

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal checkout state
  const [isKaspiModalOpen, setIsKaspiModalOpen] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<string>('');
  const [createdOrderNumber, setCreatedOrderNumber] = useState<string>('');
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<KaspiPaymentMode>('QR');

  const availableBonus = user?.bonusesKzt ?? user?.bonusBalance ?? 0;
  const deliveryFeeKzt = fulfillmentType === 'courier' ? 1500 : 0;
  const rawTotal = subtotalKzt + deliveryFeeKzt;
  const maxBonusDiscount = isAuthenticated && user ? Math.min(availableBonus, Math.floor(rawTotal * 0.3)) : 0;
  const bonusDiscountKzt = applyBonus ? maxBonusDiscount : 0;
  const totalKzt = Math.max(0, rawTotal - bonusDiscountKzt);

  // Начисление бонусов за покупку (5% кэшбэк от суммы товаров)
  const earnedBonusKzt = Math.round(Math.max(0, subtotalKzt - bonusDiscountKzt) * 0.05);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!customerName.trim() || customerName.trim().length < 2) {
      errors.customerName = locale === 'kz' ? 'Аты-жөніңізді енгізіңіз' : 'Укажите ваше имя';
    }

    if (!validateKazakhstanPhone(customerPhone)) {
      errors.customerPhone =
        locale === 'kz'
          ? 'Қазақстан нөмірін енгізіңіз (+7 7xx...)'
          : 'Введите номер телефона Казахстана (+7 7xx...)';
    }

    if (fulfillmentType === 'pickup') {
      if (!pickupStoreId) {
        errors.pickupStoreId = locale === 'kz' ? 'Дүкенді таңдаңыз' : 'Выберите магазин для самовывоза';
      }
    } else {
      if (!street.trim()) {
        errors.street = locale === 'kz' ? 'Көшені енгізіңіз' : 'Укажите улицу';
      }
      if (!building.trim()) {
        errors.building = locale === 'kz' ? 'Үй нөмірін енгізіңіз' : 'Укажите номер дома';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitOrder = async (mode: KaspiPaymentMode) => {
    // Prevent duplicate rapid submissions (B22.5)
    if (isSubmitting) return;

    if (!validateForm()) return;
    if (cart.length === 0) {
      alert(locale === 'kz' ? 'Себет бос' : 'Корзина пуста');
      return;
    }

    setIsSubmitting(true);
    setSelectedPaymentMode(mode);

    try {
      const orderPayload = {
        customerName: customerName.trim(),
        customerPhone: normalizeKazakhstanPhone(customerPhone) || customerPhone,
        customerEmail: customerEmail.trim() || null,
        fulfillmentType,
        pickupStoreId: fulfillmentType === 'pickup' ? pickupStoreId : null,
        deliveryAddress:
          fulfillmentType === 'courier'
            ? {
                city: 'Алматы' as const,
                districtRu,
                districtKz,
                street: street.trim(),
                building: building.trim(),
                apartment: apartment.trim() || undefined,
              }
            : null,
        items: cart.map(i => ({
          variantId: i.variantId,
          quantity: i.quantity,
        })),
        paymentMethod:
          mode === 'QR'
            ? 'kaspi_qr'
            : mode === 'KaspiGold'
              ? 'kaspi_gold'
              : mode === 'KaspiRed'
                ? 'kaspi_red'
                : 'kaspi_kredit',
        customerComment: customerComment.trim() || null,
      };

      const order = await ApiClient.createOrder(orderPayload);
      setCreatedOrderId(order.id);
      setCreatedOrderNumber(order.orderNumber || order.id.slice(0, 8));
      setIsKaspiModalOpen(true);
    } catch (err: any) {
      alert(err?.message || 'Ошибка создания заказа');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentSuccess = (orderId: string) => {
    clearCart();
    if (typeof window !== 'undefined') {
      window.location.href = `/orders/${orderId}`;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-2xl font-bold mb-6">
        {locale === 'kz' ? 'Тапсырысты рәсімдеу' : 'Оформление заказа'}
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Form Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Contacts Card */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold">
                1. {locale === 'kz' ? 'Байланыс деректері' : 'Контактные данные'}
              </CardTitle>
              {!isAuthenticated && (
                <button
                  type="button"
                  onClick={openAuthModal}
                  className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-md"
                >
                  <Gift className="w-3.5 h-3.5" />
                  <span>{locale === 'kz' ? 'Кіру / +1 000 ₸ бонустар' : 'Войти / +1 000 ₸ бонусов'}</span>
                </button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {isAuthenticated && user && (
                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg flex items-center justify-between text-xs text-emerald-950">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>
                      {locale === 'kz' ? 'Сіз жүйеге кірдіңіз:' : 'Вы авторизованы как:'}{' '}
                      <strong>{user.fullName || user.name || user.phone}</strong>
                    </span>
                  </div>
                  <div className="font-bold flex items-center gap-1 text-emerald-800">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    {formatKZT(availableBonus)} бонусов
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-foreground">
                    {locale === 'kz' ? 'Атыңыз' : 'Имя'} *
                  </label>
                  <Input
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    placeholder="Азамат"
                    className={formErrors.customerName ? 'border-destructive' : ''}
                  />
                  {formErrors.customerName && (
                    <p className="text-xs text-destructive mt-1">{formErrors.customerName}</p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-medium text-foreground">
                    {locale === 'kz' ? 'Телефон нөмірі' : 'Телефон'} *
                  </label>
                  <Input
                    value={customerPhone}
                    onChange={e => {
                      if (formErrors.customerPhone) {
                        setFormErrors(prev => ({ ...prev, customerPhone: '' }));
                      }
                      setCustomerPhone(formatPhoneInput(e.target.value));
                    }}
                    placeholder="+7 (701) 000-00-00"
                    className={formErrors.customerPhone ? 'border-destructive' : ''}
                  />
                  {formErrors.customerPhone && (
                    <p className="text-xs text-destructive mt-1">{formErrors.customerPhone}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-foreground">
                  Email ({locale === 'kz' ? 'міндетті емес' : 'необязательно'})
                </label>
                <Input
                  value={customerEmail}
                  onChange={e => setCustomerEmail(e.target.value)}
                  placeholder="example@mail.kz"
                />
              </div>
            </CardContent>
          </Card>

          {/* Fulfillment Type Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">
                2. {locale === 'kz' ? 'Алу тәсілі' : 'Способ получения'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs
                value={fulfillmentType}
                onValueChange={val => setFulfillmentType(val as 'pickup' | 'courier')}
                className="w-full"
              >
                <TabsList className="grid grid-cols-2 w-full h-auto p-1 bg-muted rounded-xl">
                  <TabsTrigger
                    value="pickup"
                    className="py-2.5 text-xs sm:text-sm font-medium flex items-center gap-2"
                  >
                    <Store className="w-4 h-4 text-primary" />
                    <span>{locale === 'kz' ? 'Дүкеннен алып кету (0 ₸)' : 'Самовывоз из магазина (0 ₸)'}</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="courier"
                    className="py-2.5 text-xs sm:text-sm font-medium flex items-center gap-2"
                  >
                    <Truck className="w-4 h-4 text-primary" />
                    <span>{locale === 'kz' ? 'Курьермен жеткізу (1 500 ₸)' : 'Курьер по Алматы (1 500 ₸)'}</span>
                  </TabsTrigger>
                </TabsList>

                {/* Pickup Tab */}
                <TabsContent value="pickup" className="pt-4 space-y-3">
                  <label className="text-xs font-medium text-foreground">
                    {locale === 'kz' ? 'Алматыдағы филиалды таңдаңыз:' : 'Выберите магазин для самовывоза:'}
                  </label>
                  <select
                    value={pickupStoreId}
                    onChange={e => setPickupStoreId(e.target.value)}
                    className="w-full p-2.5 border border-border rounded-lg bg-background text-sm"
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>
                        {locale === 'kz' ? b.nameKz : b.nameRu} ({locale === 'kz' ? b.districtKz : b.districtRu})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
                    <span>
                      {locale === 'kz'
                        ? 'Тапсырыс 15 минуттан кейін дайын болады'
                        : 'Готовность заказа через 15 минут после оплаты'}
                    </span>
                  </p>
                </TabsContent>

                {/* Courier Tab */}
                <TabsContent value="courier" className="pt-4 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-foreground">
                        {locale === 'kz' ? 'Аудан' : 'Район Алматы'} *
                      </label>
                      <select
                        value={districtRu}
                        onChange={e => {
                          setDistrictRu(e.target.value);
                          setDistrictKz(e.target.value);
                        }}
                        className="w-full p-2 border border-border rounded-lg bg-background text-sm"
                      >
                        <option value="Бостандыкский">Бостандыкский</option>
                        <option value="Медеуский">Медеуский</option>
                        <option value="Алмалинский">Алмалинский</option>
                        <option value="Ауэзовский">Ауэзовский</option>
                        <option value="Жетысуский">Жетысуский</option>
                        <option value="Наурызбайский">Наурызбайский</option>
                        <option value="Турксибский">Турксибский</option>
                        <option value="Алатауский">Алатауский</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-foreground">
                        {locale === 'kz' ? 'Көше' : 'Улица'} *
                      </label>
                      <Input
                        value={street}
                        onChange={e => setStreet(e.target.value)}
                        placeholder="пр. Достык"
                        className={formErrors.street ? 'border-destructive' : ''}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-foreground">
                        {locale === 'kz' ? 'Үй' : 'Дом'} *
                      </label>
                      <Input
                        value={building}
                        onChange={e => setBuilding(e.target.value)}
                        placeholder="105"
                        className={formErrors.building ? 'border-destructive' : ''}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-foreground">
                        {locale === 'kz' ? 'Пәтер' : 'Квартира'}
                      </label>
                      <Input
                        value={apartment}
                        onChange={e => setApartment(e.target.value)}
                        placeholder="42"
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Order Summary & Kaspi Payment Triggers */}
        <div className="space-y-6">
          <Card className="sticky top-20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">
                {locale === 'kz' ? 'Тапсырыс сомасы' : 'Ваш заказ'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>
                  {locale === 'kz' ? 'Тауарлар' : 'Товары'} ({cart.length}):
                </span>
                <span className="font-semibold text-foreground">{formatKZT(subtotalKzt)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>{locale === 'kz' ? 'Жеткізу' : 'Доставка'}:</span>
                <span className="font-semibold text-foreground">{formatKZT(deliveryFeeKzt)}</span>
              </div>

              {/* Loyalty Bonus Row */}
              {isAuthenticated && user && availableBonus > 0 && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg space-y-1.5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-emerald-900 select-none">
                    <input
                      type="checkbox"
                      checked={applyBonus}
                      onChange={e => setApplyBonus(e.target.checked)}
                      className="rounded border-emerald-400 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                    />
                    <span>
                      {locale === 'kz' ? 'Бонустарды шегеру' : 'Списать бонусы'}: -{formatKZT(maxBonusDiscount)}
                    </span>
                  </label>
                  <p className="text-[11px] text-emerald-700 pl-6">
                    {locale === 'kz'
                      ? `Қолжетімді: ${formatKZT(availableBonus)} (тапсырыстың 30%-на дейін)`
                      : `Доступно: ${formatKZT(availableBonus)} (до 30% от чека)`}
                  </p>
                </div>
              )}

              {bonusDiscountKzt > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>{locale === 'kz' ? 'Бонус жеңілдігі' : 'Скидка бонусами'}:</span>
                  <span>-{formatKZT(bonusDiscountKzt)}</span>
                </div>
              )}

              <div className="border-t border-border pt-3 flex justify-between text-base font-bold text-foreground">
                <span>{locale === 'kz' ? 'Барлығы' : 'Итого'}:</span>
                <span className="text-[#F14635]">{formatKZT(totalKzt)}</span>
              </div>

              {/* Earned Bonus Badge (Кэшбэк бонусами за эту покупку) */}
              <div className="p-2.5 bg-gradient-to-r from-amber-50 to-amber-100/70 border border-amber-200 rounded-lg flex items-center justify-between text-xs text-amber-950 shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center font-black text-xs shrink-0">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-bold text-amber-900 leading-tight">
                      {locale === 'kz' ? 'Тапсырыс үшін берілетін бонус:' : 'Начислим за эту покупку:'}
                    </div>
                    <div className="text-[10px] text-amber-700">
                      {locale === 'kz' ? '5% кэшбэк келесі сатып алуларға' : '5% кэшбэк на следующие покупки'}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-black text-sm text-amber-800">+{formatKZT(earnedBonusKzt)}</span>
                </div>
              </div>

              {/* Installment Info Box */}
              <div className="p-2.5 bg-red-50/80 rounded-lg text-xs space-y-1 text-red-900 border border-red-100">
                <div className="font-semibold flex items-center justify-between">
                  <span>Kaspi Red (0-0-3):</span>
                  <span>3 x {formatKZT(Math.round(totalKzt / 3))}/мес</span>
                </div>
                <div className="text-[11px] text-red-700">
                  {locale === 'kz'
                    ? '0% артық төлемсіз бөліп төлеу'
                    : 'Рассрочка без переплат на 3 месяца'}
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-2 pt-0">
              <Button
                variant="kaspi"
                size="lg"
                className="w-full text-sm font-semibold flex items-center justify-center gap-2"
                isLoading={isSubmitting}
                onClick={() => handleSubmitOrder('QR')}
              >
                <span>{locale === 'kz' ? 'Kaspi QR арқылы төлеу' : 'Оплатить через Kaspi QR'}</span>
              </Button>

              <div className="grid grid-cols-2 gap-2 w-full">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  disabled={isSubmitting}
                  onClick={() => handleSubmitOrder('KaspiRed')}
                >
                  Kaspi Red 0-0-3
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  disabled={isSubmitting}
                  onClick={() => handleSubmitOrder('KaspiGold')}
                >
                  Kaspi Gold
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Kaspi Pay Checkout Modal */}
      <KaspiCheckoutModal
        isOpen={isKaspiModalOpen}
        onClose={() => setIsKaspiModalOpen(false)}
        orderId={createdOrderId}
        orderNumber={createdOrderNumber}
        amountKzt={totalKzt}
        customerPhone={customerPhone}
        initialMode={selectedPaymentMode}
        onPaymentSuccess={handlePaymentSuccess}
        locale={locale}
      />
    </div>
  );
}
