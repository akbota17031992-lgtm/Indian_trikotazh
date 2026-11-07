'use client';

import React, { useState } from 'react';
import { ShieldCheck, UserPlus, LogIn, ArrowRight, AlertCircle, Phone, CheckCircle2 } from 'lucide-react';
import { type AdminAccount, type AdminRole, type CustomerAccount } from '@/lib/admin-roles-data';
import { formatPhoneInput, getPhoneDigits } from '@/components/admin/AdminDashboardClient';
import { formatKazakhstanPhone } from '@india-trikotaj/shared';

interface AdminAuthGateProps {
  accounts: AdminAccount[];
  customers: CustomerAccount[];
  onLoginSuccess: (account: AdminAccount) => void;
  onRegisterAccount: (newAccount: AdminAccount, newCustomer: CustomerAccount) => void;
}

export function AdminAuthGate({ accounts, customers = [], onLoginSuccess, onRegisterAccount }: AdminAuthGateProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  
  // Login form
  const [loginInput, setLoginInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Register form (для добавления нового сотрудника в панель)
  const [regLogin, setRegLogin] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('+7 (7');
  const [regRole] = useState<AdminRole>('manager');
  const [regSecretCode, setRegSecretCode] = useState('');

  // Real-time duplicate checks for registration form
  const regLoginClean = regLogin.trim().toLowerCase();
  const duplicateRegLogin = regLoginClean
    ? accounts.find(a => a.login.trim().toLowerCase() === regLoginClean)
    : null;

  const regPhoneDigits = getPhoneDigits(regPhone);
  const regPhoneLast10 = regPhoneDigits.length >= 10 ? regPhoneDigits.slice(-10) : '';
  const duplicateStaffByPhone = regPhoneLast10
    ? accounts.find(a => getPhoneDigits(a.phone).slice(-10) === regPhoneLast10)
    : null;
  const duplicateCustomerByPhone = regPhoneLast10
    ? customers.find(c => getPhoneDigits(c.phone).slice(-10) === regPhoneLast10)
    : null;
  const duplicateRegPhone = duplicateStaffByPhone || duplicateCustomerByPhone;

  const regEmailClean = regEmail.trim().toLowerCase();
  const duplicateStaffByEmail = regEmailClean
    ? accounts.find(a => a.email?.trim().toLowerCase() === regEmailClean)
    : null;
  const duplicateCustomerByEmail = regEmailClean
    ? customers.find(c => c.email?.trim().toLowerCase() === regEmailClean)
    : null;
  const duplicateRegEmail = duplicateStaffByEmail || duplicateCustomerByEmail;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const inputClean = loginInput.trim().toLowerCase();
    const inputDigits = loginInput.replace(/\D/g, '');
    const last10 = inputDigits.length >= 10 ? inputDigits.slice(-10) : '';

    // Search in staff accounts by prioritized order:
    // 1. Exact login match (highest priority)
    // 2. Exact email match
    // 3. Exact phone match (10 digits)
    const byLogin = accounts.find(a => a.isActive && a.login.trim().toLowerCase() === inputClean);
    const byEmail = !byLogin ? accounts.find(a => a.isActive && a.email && a.email.trim().toLowerCase() === inputClean) : null;
    const byPhone = (!byLogin && !byEmail && last10) ? accounts.find(a => a.isActive && getPhoneDigits(a.phone).slice(-10) === last10) : null;
    const account = byLogin || byEmail || byPhone;

    if (!account) {
      // Check if it's a customer trying to log into the admin portal
      const matchCustomer = customers.find(c => {
        if (last10 && getPhoneDigits(c.phone).slice(-10) === last10) return true;
        if (c.email && c.email.trim().toLowerCase() === inputClean) return true;
        return false;
      });

      if (matchCustomer) {
        setErrorMsg(
          `Пользователь «${matchCustomer.name}» зарегистрирован как покупатель сети. Панель Control Hub предназначена только для персонала. Для входа покупателя используйте интернет-магазин.`
        );
        return;
      }

      setErrorMsg('Неверный логин, телефон или пароль сотрудника');
      return;
    }

    if (account.passwordHash !== passwordInput) {
      setErrorMsg('Неверный пароль сотрудника');
      return;
    }

    onLoginSuccess(account);
  };

  const handleQuickPresetLogin = (acc: AdminAccount) => {
    onLoginSuccess(acc);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (regSecretCode !== 'INDIA2026') {
      setErrorMsg('Неверный ключ доступа организации (Секретный код компании: INDIA2026)');
      return;
    }

    if (duplicateRegLogin) {
      setErrorMsg(`Сотрудник с логином «${regLogin}» уже зарегистрирован. Выберите другой логин.`);
      return;
    }

    if (duplicateRegPhone) {
      setErrorMsg(
        `Номер ${regPhone} уже зарегистрирован (Владелец: «${duplicateRegPhone.name}»). Нельзя использовать один номер для разных сотрудников.`
      );
      return;
    }

    if (duplicateRegEmail) {
      setErrorMsg(
        `Email «${regEmail}» уже зарегистрирован (Владелец: «${duplicateRegEmail.name}»). Нельзя использовать один email для разных сотрудников.`
      );
      return;
    }

    const cleanPhone = formatKazakhstanPhone(regPhone) || regPhone.trim();
    const cleanEmail = regEmail.trim();

    const newAcc: AdminAccount = {
      id: `admin-${Date.now()}`,
      login: regLogin.trim(),
      passwordHash: regPassword,
      name: regName.trim(),
      role: regRole,
      email: cleanEmail,
      phone: cleanPhone,
      avatarBg: 'bg-emerald-600',
      createdAt: new Date().toISOString(),
      isActive: true,
    };

    const newCust: CustomerAccount = {
      id: `cust-${Date.now()}`,
      name: regName.trim(),
      phone: cleanPhone,
      email: cleanEmail,
      bonusBalance: 500, // 500 приветственных бонусов
      ordersCount: 0,
      totalSpentKzt: 0,
      registeredAt: new Date().toISOString().split('T')[0] || '2026-11-07',
      status: 'active',
      notes: 'Сотрудник сети (зарегистрирован через Control Hub)',
    };

    onRegisterAccount(newAcc, newCust);
    onLoginSuccess(newAcc);
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-neutral-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-600/20 text-amber-500 border border-amber-500/30 shadow-lg shadow-amber-500/10">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black tracking-tight text-white">
          Control Hub • Закрытый доступ
        </h2>
        <p className="text-xs text-neutral-400">
          Внутренняя система управления сетью «Индийский Трикотаж» (Алматы)
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-neutral-900 py-8 px-6 shadow-2xl rounded-3xl sm:px-10 border border-neutral-800 space-y-6">
          {/* Tabs: Login / Register */}
          <div className="grid grid-cols-2 p-1 bg-neutral-950 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg(null);
              }}
              className={`py-2 rounded-lg transition-all cursor-pointer ${
                mode === 'login' ? 'bg-amber-600 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Вход сотрудника
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMsg(null);
              }}
              className={`py-2 rounded-lg transition-all cursor-pointer ${
                mode === 'register' ? 'bg-amber-600 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Регистрация в панели
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-xs text-red-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{errorMsg}</span>
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-1.5">
                  Логин, Телефон или Email
                </label>
                <input
                  type="text"
                  required
                  value={loginInput}
                  onChange={e => setLoginInput(e.target.value)}
                  placeholder="superadmin или +7 (701) 999-00-01"
                  className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                />
                <span className="text-[10px] text-neutral-500 mt-1 block">
                  Поддерживается вход по логину (superadmin), номеру телефона или корпоративной почте
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-1.5">
                  Пароль
                </label>
                <input
                  type="password"
                  required
                  value={passwordInput}
                  onChange={e => setPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow-lg shadow-amber-600/20 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Войти в систему управления</span>
              </button>

              {/* Quick Demo Pre-configured Roles */}
              <div className="pt-4 border-t border-neutral-800/80 space-y-2">
                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
                  Быстрый вход под ролями из ТЗ:
                </span>
                <div className="space-y-1.5">
                  {accounts.map(acc => (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => handleQuickPresetLogin(acc)}
                      className="w-full text-left p-2 rounded-xl bg-neutral-950 hover:bg-neutral-800/70 border border-neutral-800 transition-colors flex items-center justify-between group cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            acc.role === 'superadmin'
                              ? 'bg-purple-500'
                              : acc.role === 'admin'
                              ? 'bg-blue-500'
                              : 'bg-emerald-500'
                          }`}
                        />
                        <div className="text-xs">
                          <div className="font-bold text-neutral-200 group-hover:text-amber-400 transition-colors">
                            {acc.name}
                          </div>
                          <div className="text-[10px] text-neutral-500">
                            Роль: <strong className="capitalize">{acc.role}</strong> • Пароль: {acc.passwordHash}
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-neutral-600 group-hover:text-amber-400 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  ))}
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3">
              {/* Proactive Duplicate Alert Banners if User Already Exists */}
              {duplicateRegPhone && (
                <div className="p-3 bg-amber-950/70 border border-amber-600/70 rounded-2xl text-xs text-amber-200 space-y-2 animate-in fade-in">
                  <div className="flex items-center gap-2 font-bold text-amber-300">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Пользователь с номером {regPhone} уже есть в системе!</span>
                  </div>
                  <p className="text-[11px] text-neutral-300 leading-relaxed">
                    Владелец: <strong>«{duplicateRegPhone.name}»</strong>. Повторная регистрация не требуется — выполните вход по номеру телефона.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setLoginInput(duplicateStaffByPhone ? duplicateStaffByPhone.login : regPhone);
                      setErrorMsg(null);
                    }}
                    className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md shadow-amber-600/20 cursor-pointer"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Войти по этому номеру телефона →</span>
                  </button>
                </div>
              )}

              {duplicateRegEmail && !duplicateRegPhone && (
                <div className="p-3 bg-amber-950/70 border border-amber-600/70 rounded-2xl text-xs text-amber-200 space-y-2 animate-in fade-in">
                  <div className="flex items-center gap-2 font-bold text-amber-300">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Email {regEmail} уже зарегистрирован!</span>
                  </div>
                  <p className="text-[11px] text-neutral-300 leading-relaxed">
                    Владелец: <strong>«{duplicateRegEmail.name}»</strong>. Выполните вход с этим email или логином.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setLoginInput(duplicateStaffByEmail ? duplicateStaffByEmail.login : regEmail);
                      setErrorMsg(null);
                    }}
                    className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Войти по этому Email →</span>
                  </button>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-300 mb-1">
                  Секретный код сети (Ключ допуска) *
                </label>
                <input
                  type="text"
                  required
                  value={regSecretCode}
                  onChange={e => setRegSecretCode(e.target.value)}
                  placeholder="INDIA2026"
                  className="w-full px-3 py-2 bg-neutral-950 border border-amber-800/50 rounded-xl text-amber-300 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <span className="text-[10px] text-neutral-500">Код организации для допуска: INDIA2026</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-300 mb-1">Логин *</label>
                  <input
                    type="text"
                    required
                    value={regLogin}
                    onChange={e => setRegLogin(e.target.value)}
                    placeholder="manager_dostyk"
                    className={`w-full px-3 py-2 bg-neutral-950 border rounded-xl text-white text-xs font-mono focus:ring-2 focus:ring-amber-500 transition-colors ${
                      duplicateRegLogin ? 'border-red-500 text-red-200' : 'border-neutral-800'
                    }`}
                  />
                  {duplicateRegLogin && (
                    <p className="text-[10px] text-red-400 mt-1 flex items-center gap-1 font-semibold">
                      <AlertCircle className="w-3 h-3 text-red-400 shrink-0" />
                      Логин занят ({duplicateRegLogin.name})
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-neutral-300 mb-1">Пароль *</label>
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={e => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-xs font-mono focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-300 mb-1">ФИО сотрудника *</label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={e => setRegName(e.target.value)}
                  placeholder="Тимур Байжанов"
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-xs focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-300 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={e => setRegEmail(e.target.value)}
                    placeholder="timur@indiatrikotaj.kz"
                    className={`w-full px-3 py-2 bg-neutral-950 border rounded-xl text-white text-xs focus:ring-2 focus:ring-amber-500 transition-colors ${
                      duplicateRegEmail ? 'border-red-500 text-red-200' : 'border-neutral-800'
                    }`}
                  />
                  {duplicateRegEmail && (
                    <p className="text-[10px] text-red-400 mt-1 flex items-center gap-1 font-semibold">
                      <AlertCircle className="w-3 h-3 text-red-400 shrink-0" />
                      Email занят ({duplicateRegEmail.name})
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-neutral-300 mb-1">Телефон *</label>
                  <input
                    type="tel"
                    required
                    value={regPhone}
                    onChange={e => setRegPhone(formatPhoneInput(e.target.value))}
                    onBlur={() => {
                      if (regPhone) {
                        const fmt = formatKazakhstanPhone(regPhone);
                        if (fmt) setRegPhone(fmt);
                      }
                    }}
                    placeholder="+7 (701) 000-00-00"
                    className={`w-full px-3 py-2 bg-neutral-950 border rounded-xl text-white text-xs font-mono focus:ring-2 focus:ring-amber-500 transition-colors ${
                      duplicateRegPhone ? 'border-red-500 text-red-200' : 'border-neutral-800'
                    }`}
                  />
                  {duplicateRegPhone && (
                    <p className="text-[10px] text-red-400 mt-1 flex items-center gap-1 font-semibold">
                      <AlertCircle className="w-3 h-3 text-red-400 shrink-0" />
                      Номер занят ({duplicateRegPhone.name})
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-300 mb-1">Роль при регистрации</label>
                <div className="p-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-200 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="font-semibold text-emerald-400">Менеджер (Товары и Акции)</span>
                  </div>
                  <span className="text-[10px] text-neutral-500 bg-neutral-900 px-2 py-0.5 rounded">Базовый доступ</span>
                </div>
                <p className="text-[10px] text-neutral-500 mt-1">
                  Роли «Администратор» и «Суперадминистратор» присваиваются действующим владельцем системы через раздел «Сотрудники и роли».
                </p>
              </div>

              <button
                type="submit"
                disabled={Boolean(duplicateRegLogin || duplicateRegPhone || duplicateRegEmail)}
                className={`w-full py-3 mt-2 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow-lg ${
                  duplicateRegLogin || duplicateRegPhone || duplicateRegEmail
                    ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed opacity-60'
                    : 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20 cursor-pointer'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <span>Зарегистрировать и войти</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
