'use client';

import React, { useState, useMemo } from 'react';
import { useAuth, CustomerUser } from '@/contexts/AuthContext';
import { useLocale } from '@/contexts/LocaleContext';
import { validateKazakhstanPhone } from '@india-trikotaj/shared';
import { INITIAL_CUSTOMERS, INITIAL_ADMIN_ACCOUNTS, CustomerAccount } from '@/lib/admin-roles-data';
import {
  X,
  Phone,
  CheckCircle2,
  Gift,
  ArrowRight,
  User,
  Sparkles,
  AlertCircle,
  LogIn,
} from 'lucide-react';

export function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, login } = useAuth();
  const { locale } = useLocale();

  // Steps: 'phone' -> 'otp' -> 'profile'
  const [step, setStep] = useState<'phone' | 'otp' | 'profile'>('phone');
  const [phone, setPhone] = useState('+7 (7');
  const [otpCode, setOtpCode] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [demoCodeHint, setDemoCodeHint] = useState<string | null>(null);

  const formatPhoneInput = (value: string): string => {
    const digits = value.replace(/\D/g, '');
    let clean = digits;
    if (clean.startsWith('8')) {
      clean = '7' + clean.slice(1);
    } else if (!clean.startsWith('7')) {
      clean = '7' + clean;
    }

    clean = clean.slice(0, 11);
    const len = clean.length;
    if (len <= 1) return '+7 (';

    const op = clean.slice(1, 4);
    if (len <= 4) return `+7 (${op}`;

    const p1 = clean.slice(4, 7);
    if (len <= 7) return `+7 (${op}) ${p1}`;

    const p2 = clean.slice(7, 9);
    if (len <= 9) return `+7 (${op}) ${p1}-${p2}`;

    const p3 = clean.slice(9, 11);
    return `+7 (${op}) ${p1}-${p2}-${p3}`;
  };

  // Check if this phone number already exists in CRM database or staff accounts
  const knownCustomer = useMemo(() => {
    const digits = phone.replace(/\D/g, '');
    const last10 = digits.length >= 10 ? digits.slice(-10) : '';
    if (!last10) return null;

    // 1. Priority 1: Check in staff accounts from localStorage (e.g. Dosbol dos / registered employees)
    try {
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem('indiatrikotaj_admin_accounts');
        if (raw) {
          const list = JSON.parse(raw);
          const found = list.find((a: any) => a.phone && a.phone.replace(/\D/g, '').slice(-10) === last10);
          if (found) {
            return {
              id: found.id,
              name: found.name,
              phone: found.phone,
              email: found.email,
              bonusBalance: 500,
              ordersCount: 0,
              role: (found.role === 'manager' ? 'store_manager' : 'admin') as 'store_manager' | 'admin',
            };
          }
        }
      }
    } catch {
      // ignore
    }

    // 2. Priority 2: Check in CRM localStorage customers (custom registered customers)
    try {
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem('indiatrikotaj_admin_customers');
        if (raw) {
          const list: CustomerAccount[] = JSON.parse(raw);
          // Prioritize non-initial custom accounts first
          const customFound = list.find(
            c => !c.id.startsWith('cust-10') && c.phone && c.phone.replace(/\D/g, '').slice(-10) === last10
          );
          if (customFound) {
            return {
              id: customFound.id,
              name: customFound.name,
              phone: customFound.phone,
              email: customFound.email,
              bonusBalance: customFound.bonusBalance,
              ordersCount: customFound.ordersCount,
              role: 'customer' as const,
            };
          }
          const defaultFound = list.find(c => c.phone && c.phone.replace(/\D/g, '').slice(-10) === last10);
          if (defaultFound) {
            return {
              id: defaultFound.id,
              name: defaultFound.name,
              phone: defaultFound.phone,
              email: defaultFound.email,
              bonusBalance: defaultFound.bonusBalance,
              ordersCount: defaultFound.ordersCount,
              role: 'customer' as const,
            };
          }
        }
      }
    } catch {
      // ignore JSON parse error
    }

    // 3. Priority 3: Check in INITIAL_ADMIN_ACCOUNTS
    const initAcc = INITIAL_ADMIN_ACCOUNTS.find(a => a.phone.replace(/\D/g, '').slice(-10) === last10);
    if (initAcc) {
      return {
        id: initAcc.id,
        name: initAcc.name,
        phone: initAcc.phone,
        email: initAcc.email,
        bonusBalance: 500,
        ordersCount: 0,
        role: (initAcc.role === 'manager' ? 'store_manager' : 'admin') as 'store_manager' | 'admin',
      };
    }

    // 4. Priority 4: Check in INITIAL_CUSTOMERS
    const initCust = INITIAL_CUSTOMERS.find(c => c.phone.replace(/\D/g, '').slice(-10) === last10);
    if (initCust) {
      return {
        id: initCust.id,
        name: initCust.name,
        phone: initCust.phone,
        email: initCust.email,
        bonusBalance: initCust.bonusBalance,
        ordersCount: initCust.ordersCount,
        role: 'customer' as const,
      };
    }

    return null;
  }, [phone]);

  if (!isAuthModalOpen) return null;

  const handlePhoneChange = (val: string) => {
    setErrorMsg(null);
    setPhone(formatPhoneInput(val));
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateKazakhstanPhone(phone)) {
      setErrorMsg(
        locale === 'kz'
          ? 'Қазақстанның дұрыс телефон нөмірін енгізіңіз (+7 7XX XXX XX XX)'
          : 'Введите корректный номер Казахстана (+7 7XX XXX XX XX)'
      );
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_otp',
          phone,
          existingCustomer: knownCustomer || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Ошибка отправки SMS');
      } else {
        setDemoCodeHint(data.demoOtpCode || '7777');
        setStep('otp');
      }
    } catch {
      setErrorMsg('Ошибка соединения');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length < 4) {
      setErrorMsg('Введите 4-значный код из SMS');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify_otp',
          phone,
          code: otpCode,
          existingCustomer: knownCustomer || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Неверный код подтверждения');
      } else {
        // CRITICAL: If customer is ALREADY in the database, NEVER show profile registration!
        // Immediately perform login by phone number.
        if (knownCustomer || !data.isNewUser) {
          const resolvedName = (knownCustomer?.name && knownCustomer.name !== 'Покупатель сети')
            ? knownCustomer.name
            : ((data.user?.fullName && data.user.fullName !== 'Покупатель сети')
                ? data.user.fullName
                : 'Покупатель сети');

          const userToLogin: CustomerUser = {
            id: knownCustomer?.id || data.user?.id || `usr-${Date.now()}`,
            phone: phone,
            fullName: resolvedName,
            name: resolvedName,
            email: knownCustomer?.email || data.user?.email,
            role: data.user?.role || (knownCustomer?.role === 'admin' || knownCustomer?.role === 'store_manager' ? (knownCustomer.role as any) : 'customer'),
            bonusesKzt: knownCustomer?.bonusBalance ?? data.user?.bonusesKzt ?? 1000,
            ordersCount: knownCustomer?.ordersCount ?? data.user?.ordersCount ?? 0,
          };

          // Synchronize admin session if this phone belongs to an authorized staff member
          try {
            const cleanDigits = phone.replace(/\D/g, '').slice(-10);
            const rawAccounts = localStorage.getItem('indiatrikotaj_admin_accounts');
            const staffList = rawAccounts ? JSON.parse(rawAccounts) : INITIAL_ADMIN_ACCOUNTS;
            const staffMatch = staffList.find((a: any) => a.phone && a.phone.replace(/\D/g, '').slice(-10) === cleanDigits);
            if (staffMatch && staffMatch.isActive) {
              localStorage.setItem('indiatrikotaj_admin_session', JSON.stringify(staffMatch));
              userToLogin.role = staffMatch.role === 'manager' ? 'store_manager' : 'admin';
            } else {
              // Pure retail customer: clear any stale admin session so sessions don't conflict
              localStorage.removeItem('indiatrikotaj_admin_session');
            }
          } catch (e) {
            console.error(e);
          }

          login(userToLogin);
          return;
        }

        // Only brand-new unrecognised phones enter step 3 (profile registration)
        setStep('profile');
      }
    } catch {
      setErrorMsg('Ошибка соединения');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || fullName.trim().length < 2) {
      setErrorMsg('Введите ваше имя');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register',
          phone,
          code: otpCode || '7777',
          fullName: fullName.trim(),
          email: email.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        // Sync newly registered customer into admin customers CRM in localStorage
        try {
          const cleanDigits = phone.replace(/\D/g, '').slice(-10);
          const raw = localStorage.getItem('indiatrikotaj_admin_customers');
          const list: CustomerAccount[] = raw ? JSON.parse(raw) : [...INITIAL_CUSTOMERS];
          const exists = list.some(c => c.phone && c.phone.replace(/\D/g, '').slice(-10) === cleanDigits);
          if (!exists) {
            const newCustRecord: CustomerAccount = {
              id: data.user.id || `cust-${Date.now()}`,
              name: fullName.trim(),
              phone: phone.trim(),
              email: email.trim() || '',
              bonusBalance: 1000,
              ordersCount: 0,
              totalSpentKzt: 0,
              registeredAt: new Date().toISOString().split('T')[0] || '2026-11-07',
              status: 'active',
              notes: 'Зарегистрирован через интернет-магазин (+1 000 ₸ бонусов)',
            };
            list.unshift(newCustRecord);
            localStorage.setItem('indiatrikotaj_admin_customers', JSON.stringify(list));
          }
        } catch (e) {
          console.error('Failed to sync to admin customers', e);
        }

        login(data.user);
      } else {
        setErrorMsg(data.error || 'Ошибка регистрации');
      }
    } catch {
      setErrorMsg('Ошибка соединения');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-neutral-100">
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-amber-800 to-amber-900 px-6 py-6 text-white relative">
          <button
            onClick={closeAuthModal}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
            aria-label="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-700/60 text-amber-200 text-xs font-semibold mb-2">
            <Gift className="w-3.5 h-3.5 text-amber-300" />
            <span>Бонусная программа сети</span>
          </div>

          <h3 className="text-xl font-bold tracking-tight">
            {knownCustomer
              ? (locale === 'kz' ? 'Жеке кабинетке кіру' : 'Вход в личный кабинет')
              : (locale === 'kz' ? 'Кіру немесе Тіркелу' : 'Вход по номеру телефона')}
          </h3>
          <p className="text-xs text-amber-100/80 mt-1">
            {knownCustomer
              ? `Рады видеть вас снова, ${knownCustomer.name}! Введите номер для входа.`
              : 'Дарим 1 000 ₸ бонусов на покупки трикотажа при первом входе'}
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: ENTER PHONE */}
          {step === 'phone' && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5 uppercase tracking-wider">
                  {locale === 'kz' ? 'Телефон нөмірі' : 'Номер телефона'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => handlePhoneChange(e.target.value)}
                    placeholder="+7 (7XX) XXX-XX-XX"
                    className="w-full pl-10 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-amber-600 focus:bg-white transition-all font-mono"
                    required
                  />
                </div>

                {/* Instant Recognition Banner if Already Registered */}
                {knownCustomer ? (
                  <div className="mt-2.5 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <span className="font-bold text-emerald-900">{knownCustomer.name}</span>
                      <span className="block text-[11px] text-emerald-700">
                        Пользователь найден в базе. Выполняется вход по SMS-коду (без повторной регистрации).
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-neutral-400 mt-1.5">
                    Отправим бесплатное SMS с кодом подтверждения
                  </p>
                )}
              </div>

              {!knownCustomer && (
                <div className="p-3 bg-amber-50/80 border border-amber-200/60 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
                  <Sparkles className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <span>
                    <strong>+1 000 ₸ бонусов:</strong> начисляются сразу на баланс для оплаты до 30% заказа в 16 магазинах Алматы.
                  </span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-4 bg-amber-800 hover:bg-amber-900 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-md shadow-amber-900/10 cursor-pointer"
              >
                {isLoading ? (
                  <span>Отправка кода...</span>
                ) : knownCustomer ? (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Получить SMS-код для входа</span>
                  </>
                ) : (
                  <>
                    <span>Получить код подтверждения</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 2: ENTER OTP */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                    Код из SMS
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('phone');
                      setOtpCode('');
                    }}
                    className="text-xs text-amber-700 hover:text-amber-800 font-semibold"
                  >
                    Изменить номер
                  </button>
                </div>

                {knownCustomer && (
                  <div className="mb-2 p-2 bg-neutral-100 rounded-lg text-xs text-neutral-700 flex items-center justify-between">
                    <span>Пользователь: <strong>{knownCustomer.name}</strong></span>
                    <span className="text-emerald-700 font-bold">{knownCustomer.bonusBalance} ₸ бонусов</span>
                  </div>
                )}

                <p className="text-xs text-neutral-500 mb-2">
                  Мы отправили 4-значный проверочный код на номер <strong className="text-neutral-800">{phone}</strong>
                </p>

                <div className="relative">
                  <input
                    type="text"
                    maxLength={4}
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••"
                    className="w-full text-center tracking-[0.5em] text-2xl font-black py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:bg-white transition-all font-mono"
                    autoFocus
                    required
                  />
                </div>

                {demoCodeHint && (
                  <div className="mt-2 text-center text-xs text-emerald-700 font-semibold bg-emerald-50 py-1.5 px-2 rounded-lg border border-emerald-200">
                    Код подтверждения для теста: <strong className="text-emerald-900 text-sm">{demoCodeHint}</strong>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-4 bg-amber-800 hover:bg-amber-900 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-md shadow-amber-900/10 cursor-pointer"
              >
                <span>{isLoading ? 'Проверка...' : (knownCustomer ? 'Войти в личный кабинет' : 'Подтвердить и войти')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* STEP 3: NEW USER PROFILE (ONLY FOR GENUINE NEW USERS) */}
          {step === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="text-center py-1">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-neutral-900 text-base">Номер подтверждён!</h4>
                <p className="text-xs text-neutral-500">Как к вам обращаться в заказах сети?</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Ваше имя и фамилия *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Айгерим Смагулова"
                    className="w-full pl-9 pr-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-semibold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:bg-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Электронная почта (для чеков ОФД)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="aigerim@example.kz"
                  className="w-full px-3 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-700/20 cursor-pointer"
              >
                <Gift className="w-4 h-4" />
                <span>Завершить и забрать 1 000 ₸ бонусов</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
