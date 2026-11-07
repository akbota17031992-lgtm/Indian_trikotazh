'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Badge,
  Input,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@india-trikotaj/ui';
import { formatKZT, validateKazakhstanPhone } from '@india-trikotaj/shared';
import {
  QrCode,
  Smartphone,
  CreditCard,
  Percent,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCw,
  ExternalLink,
} from 'lucide-react';
import type { KaspiPaymentMode } from '../../types/checkout';
import { useKaspiPayment } from '../../hooks/use-kaspi-payment';

interface KaspiCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  orderNumber: string;
  amountKzt: number;
  customerPhone?: string;
  initialMode?: KaspiPaymentMode;
  onPaymentSuccess?: (orderId: string) => void;
  locale?: 'ru' | 'kz';
}

export function KaspiCheckoutModal({
  isOpen,
  onClose,
  orderId,
  orderNumber,
  amountKzt,
  customerPhone = '',
  initialMode = 'QR',
  onPaymentSuccess,
  locale = 'ru',
}: KaspiCheckoutModalProps) {
  const [selectedMode, setSelectedMode] = useState<KaspiPaymentMode>(initialMode);
  const [phoneInput, setPhoneInput] = useState<string>(customerPhone);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const {
    invoice,
    isLoading,
    error,
    isSuccess,
    initiatePayment,
    resetPayment,
    formatCountdown,
  } = useKaspiPayment({
    onSuccess: id => {
      onPaymentSuccess?.(id);
    },
  });

  // Calculate installment amounts strictly (Tests 2, 3)
  const redMonthly = Math.round(amountKzt / 3);
  const kreditMonthly = Math.round(amountKzt / 12);

  // Initialize invoice when modal opens
  useEffect(() => {
    if (isOpen && orderId && amountKzt > 0 && !invoice && !isSuccess) {
      handleCreateInvoice(selectedMode);
    }
  }, [isOpen, orderId, amountKzt]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhoneInput(e.target.value);
    if (phoneError) setPhoneError(null);
  };

  const handleCreateInvoice = (mode: KaspiPaymentMode) => {
    setSelectedMode(mode);
    setPhoneError(null);

    // If push mode, validate phone
    if (mode !== 'QR') {
      const targetPhone = phoneInput || customerPhone;
      if (!validateKazakhstanPhone(targetPhone)) {
        setPhoneError(
          locale === 'kz'
            ? 'Дұрыс телефон нөмірін енгізіңіз (+7 7xx...)'
            : 'Введите корректный номер телефона (+7 7xx...)'
        );
        return;
      }
    }

    const desc =
      locale === 'kz'
        ? `Тапсырыс #${orderNumber || orderId.slice(0, 8)}`
        : `Заказ #${orderNumber || orderId.slice(0, 8)}`;

    initiatePayment({
      orderId,
      amountKzt,
      paymentMode: mode,
      phone: mode !== 'QR' ? phoneInput || customerPhone : undefined,
      description: desc,
    });
  };

  const handleClose = () => {
    resetPayment();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && handleClose()}>
      <DialogContent className="max-w-md p-6 sm:rounded-2xl">
        <DialogHeader className="space-y-1 text-center">
          <DialogTitle className="text-xl font-bold flex items-center justify-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#F14635]" />
            {locale === 'kz' ? 'Kaspi Pay арқылы төлеу' : 'Оплата через Kaspi Pay'}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {locale === 'kz' ? 'Төлем сомасы:' : 'Сумма к оплате:'}{' '}
            <span className="font-semibold text-foreground">{formatKZT(amountKzt)}</span>
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          // ================= PAYMENT SUCCESS STATE =================
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center animate-in zoom-in">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-foreground">
                {locale === 'kz' ? 'Төлем сәтті өтті!' : 'Оплата прошла успешно!'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {locale === 'kz'
                  ? `Тапсырыс #${orderNumber} рәсімделді және дайындалуда.`
                  : `Заказ #${orderNumber} подтвержден и передан в сборку.`}
              </p>
            </div>
            <Button
              className="w-full mt-4 bg-primary text-primary-foreground"
              onClick={handleClose}
            >
              {locale === 'kz' ? 'Тапсырысты көру' : 'Посмотреть заказ'}
            </Button>
          </div>
        ) : (
          // ================= PAYMENT MODES TABS =================
          <div className="space-y-4 pt-2">
            <Tabs
              value={selectedMode}
              onValueChange={val => handleCreateInvoice(val as KaspiPaymentMode)}
              className="w-full"
            >
              <TabsList className="grid grid-cols-4 w-full h-auto p-1 bg-muted rounded-xl">
                <TabsTrigger
                  value="QR"
                  className="py-2 text-xs flex flex-col items-center gap-1 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  <QrCode className="w-4 h-4 text-[#F14635]" />
                  <span>Kaspi QR</span>
                </TabsTrigger>
                <TabsTrigger
                  value="KaspiGold"
                  className="py-2 text-xs flex flex-col items-center gap-1 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  <Smartphone className="w-4 h-4 text-[#F14635]" />
                  <span>Kaspi Gold</span>
                </TabsTrigger>
                <TabsTrigger
                  value="KaspiRed"
                  className="py-2 text-xs flex flex-col items-center gap-1 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  <Percent className="w-4 h-4 text-[#F14635]" />
                  <span>Kaspi Red</span>
                </TabsTrigger>
                <TabsTrigger
                  value="KaspiKredit"
                  className="py-2 text-xs flex flex-col items-center gap-1 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  <CreditCard className="w-4 h-4 text-[#F14635]" />
                  <span>Kaspi Kredit</span>
                </TabsTrigger>
              </TabsList>

              {/* ===== MODE 1: DYNAMIC QR ===== */}
              <TabsContent value="QR" className="pt-4 space-y-4">
                <div className="flex flex-col items-center justify-center p-4 border border-border rounded-xl bg-card">
                  {invoice?.isExpired ? (
                    <div className="py-8 flex flex-col items-center text-center space-y-3">
                      <AlertTriangle className="w-10 h-10 text-amber-500" />
                      <div className="text-sm font-medium text-foreground">
                        {locale === 'kz' ? 'QR-код мерзімі аяқталды' : 'Срок действия QR-кода истек'}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCreateInvoice('QR')}
                        className="flex items-center gap-1 text-xs"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                        {locale === 'kz' ? 'Жаңа шот шығару' : 'Выставить новый счет'}
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="relative p-2 bg-white rounded-lg shadow-inner">
                        {invoice?.qrImageUrl ? (
                          <img
                            src={invoice.qrImageUrl}
                            alt="Kaspi QR"
                            className="w-48 h-48 object-contain"
                          />
                        ) : (
                          <div className="w-48 h-48 flex items-center justify-center bg-muted animate-pulse rounded">
                            <QrCode className="w-16 h-16 text-muted-foreground/40" />
                          </div>
                        )}
                      </div>

                      <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                        <Clock className="w-3.5 h-3.5 text-primary" />
                        <span>
                          {locale === 'kz' ? 'Жарамдылық мерзімі:' : 'Действителен:'}{' '}
                          <span className="font-mono font-semibold text-foreground">
                            {formatCountdown(invoice?.remainingSeconds ?? 300)}
                          </span>
                        </span>
                      </div>

                      <p className="mt-2 text-xs text-center text-muted-foreground">
                        {locale === 'kz'
                          ? 'Kaspi.kz қосымшасын ашып, экрандағы QR-кодты сканерлеңіз'
                          : 'Откройте приложение Kaspi.kz и отсканируйте QR-код на экране'}
                      </p>

                      {invoice?.qrTokenUrl && (
                        <a
                          href={invoice.qrTokenUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 text-xs text-[#F14635] hover:underline flex items-center gap-1 font-medium"
                        >
                          <span>
                            {locale === 'kz'
                              ? 'Kaspi.kz қосымшасында ашу'
                              : 'Открыть в приложении Kaspi.kz'}
                          </span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </>
                  )}
                </div>
              </TabsContent>

              {/* ===== MODE 2: KASPI GOLD (PHONE PUSH) ===== */}
              <TabsContent value="KaspiGold" className="pt-4 space-y-4">
                <div className="space-y-3">
                  <label className="text-xs font-medium text-foreground">
                    {locale === 'kz'
                      ? 'Kaspi Gold тіркелген телефон нөмірі:'
                      : 'Номер телефона в Kaspi Gold:'}
                  </label>
                  <div className="flex gap-2">
                    <Input
                      value={phoneInput}
                      onChange={handlePhoneChange}
                      placeholder="+7 (701) 234-56-78"
                      className={`text-sm ${phoneError ? 'border-destructive' : ''}`}
                    />
                    <Button
                      variant="kaspi"
                      size="sm"
                      isLoading={isLoading}
                      onClick={() => handleCreateInvoice('KaspiGold')}
                      className="shrink-0 text-xs"
                    >
                      {locale === 'kz' ? 'Шот жіберу' : 'Выставить счет'}
                    </Button>
                  </div>
                  {phoneError && <p className="text-xs text-destructive">{phoneError}</p>}

                  {invoice?.paymentMode === 'KaspiGold' && !invoice.isExpired && (
                    <div className="p-3 bg-muted/50 rounded-xl space-y-2 border border-border">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          {locale === 'kz' ? 'Шот жіберілді' : 'Счет выставлен'}:
                        </span>
                        <span className="font-mono font-medium text-foreground">
                          {formatCountdown(invoice.remainingSeconds)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {locale === 'kz'
                          ? `Kaspi.kz қосымшасына кіріп, ${formatKZT(amountKzt)} төлемін растаңыз.`
                          : `Откройте приложение Kaspi.kz и подтвердите оплату на ${formatKZT(amountKzt)}.`}
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* ===== MODE 3: KASPI RED (INSTALLMENT 0-0-3) ===== */}
              <TabsContent value="KaspiRed" className="pt-4 space-y-4">
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="kaspi" className="text-xs">
                      Kaspi Red 0-0-3
                    </Badge>
                    <span className="text-xs font-semibold text-[#F14635]">
                      3 x {formatKZT(redMonthly)}/мес
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {locale === 'kz'
                      ? '3 айға пайызсыз және артық төлемсіз бөліп төлеу.'
                      : 'Рассрочка на 3 месяца без процентов и переплат.'}
                  </p>
                </div>

                <div className="space-y-3">
                  <Input
                    value={phoneInput}
                    onChange={handlePhoneChange}
                    placeholder="+7 (701) 234-56-78"
                    className="text-sm"
                  />
                  {phoneError && <p className="text-xs text-destructive">{phoneError}</p>}

                  <Button
                    variant="kaspi"
                    className="w-full text-xs font-medium"
                    isLoading={isLoading}
                    onClick={() => handleCreateInvoice('KaspiRed')}
                  >
                    {locale === 'kz'
                      ? `Kaspi Red арқылы рәсімдеу (${formatKZT(amountKzt)})`
                      : `Оформить в Kaspi Red (${formatKZT(amountKzt)})`}
                  </Button>
                </div>
              </TabsContent>

              {/* ===== MODE 4: KASPI KREDIT (0-0-12) ===== */}
              <TabsContent value="KaspiKredit" className="pt-4 space-y-4">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs border-amber-500 text-amber-700">
                      Kaspi Бөліп төлеу 0-0-12
                    </Badge>
                    <span className="text-xs font-semibold text-amber-800">
                      12 x {formatKZT(kreditMonthly)}/мес
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {locale === 'kz'
                      ? '12 айға дейін бөліп төлеу немесе несие.'
                      : 'Рассрочка или кредит на 12 месяцев.'}
                  </p>
                </div>

                <div className="space-y-3">
                  <Input
                    value={phoneInput}
                    onChange={handlePhoneChange}
                    placeholder="+7 (701) 234-56-78"
                    className="text-sm"
                  />
                  {phoneError && <p className="text-xs text-destructive">{phoneError}</p>}

                  <Button
                    variant="kaspi"
                    className="w-full text-xs font-medium"
                    isLoading={isLoading}
                    onClick={() => handleCreateInvoice('KaspiKredit')}
                  >
                    {locale === 'kz'
                      ? `Kaspi Kredit арқылы рәсімдеу (${formatKZT(amountKzt)})`
                      : `Оформить в Kaspi Kredit (${formatKZT(amountKzt)})`}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>

            {error && (
              <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="mt-4 pt-2 border-t border-border flex sm:justify-between items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            {locale === 'kz' ? 'Жабу' : 'Закрыть'}
          </Button>
          {!isSuccess && (
            <div className="text-[11px] text-muted-foreground">
              {locale === 'kz' ? 'Қауіпсіз Kaspi төлемі' : 'Защищенный платеж Kaspi'}
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
