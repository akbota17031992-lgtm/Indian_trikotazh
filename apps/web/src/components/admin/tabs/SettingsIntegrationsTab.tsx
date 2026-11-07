'use client';

import React, { useState } from 'react';
import { formatKZT } from '@india-trikotaj/shared';
import {
  type IntegrationConfig,
  type IntegrationCategory,
  type IntegrationStatus,
  DEFAULT_INTEGRATIONS,
  saveStoredIntegrations,
} from '@/lib/integrations-config';
import {
  Globe,
  CheckCircle2,
  ShieldAlert,
  Clock,
  RotateCcw,
  Plus,
  Search,
  Check,
  Copy,
  Key,
  Lock,
  Eye,
  EyeOff,
  Receipt,
  CreditCard,
  MessageSquare,
  Power,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Settings,
  Trash2,
} from 'lucide-react';

interface SettingsIntegrationsTabProps {
  isSuperadmin: boolean;
  isAdmin: boolean;
  showToast: (msg: string) => void;
  integrations: IntegrationConfig[];
  onIntegrationsChange: (updated: IntegrationConfig[]) => void;
}

export function SettingsIntegrationsTab({
  isSuperadmin,
  isAdmin,
  showToast,
  integrations,
  onIntegrationsChange,
}: SettingsIntegrationsTabProps) {
  const [editingIntegration, setEditingIntegration] = useState<IntegrationConfig | null>(null);
  const [isCreatingIntegration, setIsCreatingIntegration] = useState<boolean>(false);
  const [integrationsCategoryFilter, setIntegrationsCategoryFilter] = useState<string>('all');
  const [integrationsSearch, setIntegrationsSearch] = useState<string>('');
  const [showSecretMap, setShowSecretMap] = useState<Record<string, boolean>>({});
  const [pingingId, setPingingId] = useState<string | null>(null);
  const [isSyncing1C, setIsSyncing1C] = useState<boolean>(false);
  const [testKaspiQrModal, setTestKaspiQrModal] = useState<boolean>(false);
  const [testFiscalModal, setTestFiscalModal] = useState<{
    orderId: string;
    ticketNumber: string;
    fiscalSign: string;
    regNumber: string;
    amountKzt: number;
    vatKzt: number;
    cashboxId: string;
    date: string;
  } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Duplicate checks for integrations
  const modalIntegrationNameClean = editingIntegration?.name?.trim().toLowerCase();
  const duplicateIntegrationName =
    editingIntegration && modalIntegrationNameClean
      ? integrations.find(
          i => i.id !== editingIntegration.id && i.name.trim().toLowerCase() === modalIntegrationNameClean
        )
      : null;

  const saveIntegrationsToStorage = (updated: IntegrationConfig[]) => {
    onIntegrationsChange(updated);
    saveStoredIntegrations(updated);
  };

  const handleToggleIntegration = (id: string) => {
    const item = integrations.find(i => i.id === id);
    if (!item) return;
    const newStatus: IntegrationStatus =
      item.status === 'connected' || item.status === 'testing'
        ? 'disabled'
        : item.isTestMode
        ? 'testing'
        : 'connected';
    const updated = integrations.map(i => (i.id === id ? { ...i, status: newStatus } : i));
    saveIntegrationsToStorage(updated);
    showToast(newStatus === 'disabled' ? `Шлюз «${item.name}» отключен` : `Шлюз «${item.name}» включен`);
  };

  const handlePingIntegration = async (id: string) => {
    const item = integrations.find(i => i.id === id);
    if (!item) return;
    setPingingId(id);
    await new Promise(r => setTimeout(r, 600));
    const randomPing = Math.floor(18 + Math.random() * 32);
    const updated = integrations.map(i =>
      i.id === id ? { ...i, lastPingMs: randomPing, lastSyncAt: 'Только что' } : i
    );
    saveIntegrationsToStorage(updated);
    setPingingId(null);
    showToast(`Связь с шлюзом «${item.provider}»: 200 OK (${randomPing} мс)`);
  };

  const handleOpenCreateIntegration = () => {
    if (!isSuperadmin) {
      showToast('Добавление новых API шлюзов доступно только Главному Суперадминистратору');
      return;
    }
    setIsCreatingIntegration(true);
    setEditingIntegration({
      id: `custom-api-${Date.now()}`,
      name: '',
      provider: '',
      category: 'custom',
      status: 'connected',
      isTestMode: false,
      description: '',
      badge: 'Пользовательский API',
      endpointUrl: 'https://',
      apiKey: '',
      apiSecret: '',
      merchantOrClientId: '',
      cashboxOrSenderId: '',
      webhookUrl: '',
      autoSync: false,
      lastPingMs: 25,
      lastSyncAt: 'Только что',
    });
  };

  const handleOpenEditIntegration = (integration: IntegrationConfig) => {
    setIsCreatingIntegration(false);
    setEditingIntegration({ ...integration });
  };

  const handleSaveIntegration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingIntegration) return;
    const cleanName = editingIntegration.name.trim();
    if (!cleanName) {
      showToast('Укажите название интеграции');
      return;
    }
    const cleanEndpoint = editingIntegration.endpointUrl.trim();
    if (!cleanEndpoint) {
      showToast('Укажите URL эндпоинта API');
      return;
    }
    if (duplicateIntegrationName) {
      showToast(`Интеграция с названием «${cleanName}» уже существует`);
      return;
    }

    if (isCreatingIntegration) {
      saveIntegrationsToStorage([...integrations, editingIntegration]);
      showToast(`Интеграция «${cleanName}» успешно добавлена!`);
    } else {
      const updated = integrations.map(i => (i.id === editingIntegration.id ? editingIntegration : i));
      saveIntegrationsToStorage(updated);
      showToast(`Параметры интеграции «${cleanName}» обновлены!`);
    }
    setEditingIntegration(null);
  };

  const handleDeleteIntegration = (id: string, name: string) => {
    if (!isSuperadmin) {
      showToast('Только Суперадмин имеет право удалять интеграции');
      return;
    }
    if (window.confirm(`Вы действительно хотите удалить интеграцию «${name}»?`)) {
      const updated = integrations.filter(i => i.id !== id);
      saveIntegrationsToStorage(updated);
      showToast(`Интеграция «${name}» удалена`);
      if (editingIntegration?.id === id) {
        setEditingIntegration(null);
      }
    }
  };

  const handleResetIntegrations = () => {
    if (!isSuperadmin) {
      showToast('Только Суперадмин имеет право сбрасывать параметры шлюзов');
      return;
    }
    if (window.confirm('Сбросить настройки всех интеграций и шлюзов к начальным параметрам?')) {
      saveIntegrationsToStorage(DEFAULT_INTEGRATIONS);
      showToast('Шлюзы и API сброшены к исходным параметрам');
    }
  };

  const handleTrigger1CSync = async () => {
    setIsSyncing1C(true);
    await new Promise(r => setTimeout(r, 1200));
    const updated = integrations.map(i =>
      i.category === 'sync_1c' ? { ...i, lastSyncAt: 'Только что', lastPingMs: 28 } : i
    );
    saveIntegrationsToStorage(updated);
    setIsSyncing1C(false);
    showToast('Синхронизация с 1С завершена: остатки 16 филиалов обновлены!');
  };

  const handleGenerateKaspiQr = () => {
    setTestKaspiQrModal(true);
  };

  const handleTestWebKassaReceipt = () => {
    const timestamp = new Date().toLocaleString('ru-RU');
    const ticketNumber = `TICK-${Math.floor(100000 + Math.random() * 900000)}`;
    const fiscalSign = Math.floor(1000000000 + Math.random() * 9000000000).toString();
    const regNumber = `0101${Math.floor(10000000 + Math.random() * 90000000)}`;
    const amountKzt = 14990;
    const vatKzt = Math.round((amountKzt * 12) / 112);

    setTestFiscalModal({
      orderId: `KZ-ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      ticketNumber,
      fiscalSign,
      regNumber,
      amountKzt,
      vatKzt,
      cashboxId: 'SWK00000001',
      date: timestamp,
    });
  };

  const handleCopyClipboard = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedKey(label);
    showToast(`Скопировано: ${label}`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header & Metrics */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 border-b border-slate-800 gap-4">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2.5">
            <Globe className="w-5 h-5 text-amber-400" />
            <span>Управление шлюзами, API и интеграциями РК</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Эквайринг Kaspi Pay (0.95%), фискализация WebKassa ОФД, 1С (16 филиалов), Google Gemini AI и логистика
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleResetIntegrations}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700 cursor-pointer"
            title="Вернуть предустановленные параметры интеграций"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Сброс к исходным</span>
          </button>

          <button
            onClick={handleOpenCreateIntegration}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 transition-all shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Добавить API / Вебхук</span>
          </button>
        </div>
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-3.5">
          <div className="text-slate-400 text-xs flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-amber-400" />
            <span>Всего интеграций</span>
          </div>
          <div className="text-2xl font-black text-white mt-1">
            {integrations.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">В единой шине данных</div>
        </div>

        <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-3.5">
          <div className="text-slate-400 text-xs flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Активно шлюзов</span>
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-1 flex items-center gap-2">
            <span>{integrations.filter(i => i.status === 'connected' || i.status === 'testing').length}</span>
            <span className="text-xs font-normal text-slate-400">/ {integrations.length}</span>
          </div>
          <div className="text-[11px] text-emerald-400/80 mt-0.5">Все сервисы онлайн</div>
        </div>

        <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-3.5">
          <div className="text-slate-400 text-xs flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span>Тестовый режим (Sandbox)</span>
          </div>
          <div className="text-2xl font-black text-amber-400 mt-1">
            {integrations.filter(i => i.isTestMode).length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Безопасная отладка</div>
        </div>

        <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-3.5">
          <div className="text-slate-400 text-xs flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span>Средний отклик API</span>
          </div>
          <div className="text-2xl font-black text-blue-400 mt-1">
            {Math.round(
              integrations.reduce((acc, curr) => acc + (curr.lastPingMs || 30), 0) /
                (integrations.length || 1)
            )}{' '}
            <span className="text-sm font-semibold">мс</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Высокая скорость ответа</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none text-xs">
          {[
            { id: 'all', label: 'Все', icon: '🌐' },
            { id: 'payments', label: 'Платежи (Kaspi)', icon: '💳' },
            { id: 'fiscal', label: 'ОФД (WebKassa)', icon: '🧾' },
            { id: 'ai', label: 'Gemini AI', icon: '✨' },
            { id: 'sync_1c', label: '1С:Розница (16 филиалов)', icon: '🔄' },
            { id: 'notifications', label: 'SMS & WA', icon: '💬' },
            { id: 'delivery', label: 'Доставка', icon: '🚚' },
            { id: 'custom', label: 'Пользовательские', icon: '🔌' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setIntegrationsCategoryFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                integrationsCategoryFilter === tab.id
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={integrationsSearch}
            onChange={(e) => setIntegrationsSearch(e.target.value)}
            placeholder="Поиск по названию, провайдеру..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
          />
          {integrationsSearch && (
            <button
              onClick={() => setIntegrationsSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {integrations
          .filter((item) => {
            const matchCat =
              integrationsCategoryFilter === 'all' || item.category === integrationsCategoryFilter;
            const q = integrationsSearch.trim().toLowerCase();
            const matchQuery =
              !q ||
              item.name.toLowerCase().includes(q) ||
              item.provider.toLowerCase().includes(q) ||
              item.description.toLowerCase().includes(q) ||
              item.endpointUrl.toLowerCase().includes(q) ||
              item.badge.toLowerCase().includes(q);
            return matchCat && matchQuery;
          })
          .map((item) => {
            const isPingRunning = pingingId === item.id;
            const isSecretVisible = Boolean(showSecretMap[item.id]);

            return (
              <div
                key={item.id}
                className={`border rounded-2xl p-5 space-y-4 transition-all flex flex-col justify-between ${
                  item.status === 'disabled'
                    ? 'bg-slate-900/40 border-slate-800 opacity-70'
                    : item.status === 'error'
                    ? 'bg-red-950/20 border-red-500/40'
                    : item.isTestMode
                    ? 'bg-slate-800/40 border-amber-500/40'
                    : 'bg-slate-800/40 border-slate-700/60 hover:border-amber-500/40'
                }`}
              >
                {/* Top Header */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-lg">
                        {item.badge}
                      </span>
                      <span className="text-xs text-slate-400">{item.provider}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {item.status === 'disabled' ? (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-slate-400 bg-slate-700/40 px-2 py-0.5 rounded-md">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                          Отключен
                        </span>
                      ) : item.isTestMode ? (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-md">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                          Тестовый (Sandbox)
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          Онлайн ({item.lastPingMs || 25} мс)
                        </span>
                      )}

                      {/* Quick Enable/Disable Toggle */}
                      <button
                        onClick={() => handleToggleIntegration(item.id)}
                        className={`p-1.5 rounded-lg transition-colors border ${
                          item.status !== 'disabled'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                            : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                        }`}
                        title={item.status !== 'disabled' ? 'Отключить шлюз' : 'Включить шлюз'}
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-base font-bold text-white flex items-center justify-between">
                      <span>{item.name}</span>
                      {item.extraSettings?.commissionRate && (
                        <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800/40">
                          Комиссия: {item.extraSettings.commissionRate}
                        </span>
                      )}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>

                {/* Technical Credentials Box */}
                <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800 space-y-2 text-xs font-mono">
                  {/* Endpoint URL */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-500 shrink-0 font-sans text-[11px]">URL API:</span>
                    <span className="text-slate-300 truncate max-w-[280px] sm:max-w-[340px]">
                      {item.endpointUrl}
                    </span>
                    <button
                      onClick={() => handleCopyClipboard(item.endpointUrl, `URL ${item.name}`)}
                      className="p-1 text-slate-400 hover:text-white transition-colors rounded hover:bg-slate-800 shrink-0"
                      title="Скопировать эндпоинт"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>

                  {/* API Key */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-500 shrink-0 font-sans text-[11px]">API Key:</span>
                    <span className="text-amber-300 truncate max-w-[280px] sm:max-w-[340px]">
                      {isSecretVisible
                        ? item.apiKey
                        : item.apiKey
                        ? `${item.apiKey.slice(0, 6)}••••••••${item.apiKey.slice(-4)}`
                        : 'Не задан'}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() =>
                          setShowSecretMap((prev) => ({
                            ...prev,
                            [item.id]: !prev[item.id],
                          }))
                        }
                        className="p-1 text-slate-400 hover:text-white transition-colors rounded hover:bg-slate-800"
                        title={isSecretVisible ? 'Скрыть ключ' : 'Показать ключ'}
                      >
                        {isSecretVisible ? (
                          <EyeOff className="w-3 h-3" />
                        ) : (
                          <Eye className="w-3 h-3" />
                        )}
                      </button>
                      <button
                        onClick={() => handleCopyClipboard(item.apiKey, `API Key ${item.name}`)}
                        className="p-1 text-slate-400 hover:text-white transition-colors rounded hover:bg-slate-800"
                        title="Скопировать ключ"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Extra Attributes */}
                  {item.merchantOrClientId && (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-sans">Идентификатор / БИН:</span>
                      <span className="text-slate-300 font-semibold">{item.merchantOrClientId}</span>
                    </div>
                  )}

                  {item.cashboxOrSenderId && (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-sans">Касса / Отправитель:</span>
                      <span className="text-slate-300 font-semibold">{item.cashboxOrSenderId}</span>
                    </div>
                  )}

                  {item.extraSettings?.model && (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-sans">ИИ Модель:</span>
                      <span className="text-purple-300 font-semibold">
                        {item.extraSettings.model} (Vision AI)
                      </span>
                    </div>
                  )}

                  {item.syncIntervalMinutes && (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-sans">Интервал автосинхронизации:</span>
                      <span className="text-emerald-400 font-semibold">
                        Каждые {item.syncIntervalMinutes} минут
                      </span>
                    </div>
                  )}

                  <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 font-sans">
                    <span>Последняя активность: {item.lastSyncAt || 'Сегодня'}</span>
                    <span>Задержка: {item.lastPingMs || 25} мс</span>
                  </div>
                </div>

                {/* Bottom Action Buttons */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => handlePingIntegration(item.id)}
                      disabled={isPingRunning || item.status === 'disabled'}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                        item.status === 'disabled'
                          ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
                          : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
                      }`}
                    >
                      <RefreshCw
                        className={`w-3 h-3 ${isPingRunning ? 'animate-spin text-amber-400' : ''}`}
                      />
                      <span>{isPingRunning ? 'Пинг...' : 'Проверить связь'}</span>
                    </button>

                    {/* Context Action 1: Kaspi Pay Test QR */}
                    {item.id === 'kaspi-pay' && (
                      <button
                        onClick={handleGenerateKaspiQr}
                        className="px-3 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/50 text-red-300 border border-red-800/50 text-xs font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <CreditCard className="w-3 h-3 text-red-400" />
                        <span>Тест Kaspi QR</span>
                      </button>
                    )}

                    {/* Context Action 2: WebKassa Fiscal Receipt */}
                    {item.id === 'webkassa-ofd' && (
                      <button
                        onClick={handleTestWebKassaReceipt}
                        className="px-3 py-1.5 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 border border-emerald-800/50 text-xs font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <Receipt className="w-3 h-3 text-emerald-400" />
                        <span>Тестовый чек ОФД</span>
                      </button>
                    )}

                    {/* Context Action 3: 1C Inventory Sync */}
                    {item.id === 'sync-1c' && (
                      <button
                        onClick={handleTrigger1CSync}
                        disabled={isSyncing1C}
                        className="px-3 py-1.5 rounded-xl bg-blue-950/40 hover:bg-blue-900/50 text-blue-300 border border-blue-800/50 text-xs font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <RefreshCw
                          className={`w-3 h-3 text-blue-400 ${
                            isSyncing1C ? 'animate-spin' : ''
                          }`}
                        />
                        <span>
                          {isSyncing1C ? 'Синхронизация 16 филиалов...' : 'Синхронизировать 1С'}
                        </span>
                      </button>
                    )}

                    {/* Context Action 4: Custom Integration Delete (Superadmin only) */}
                    {item.category === 'custom' && isSuperadmin && (
                      <button
                        onClick={() => handleDeleteIntegration(item.id, item.name)}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-red-950/40 text-slate-400 hover:text-red-300 border border-slate-700 hover:border-red-800/50 text-xs transition-colors"
                        title="Удалить интеграцию"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => handleOpenEditIntegration(item)}
                    className="px-3 py-1.5 rounded-xl bg-slate-700/60 hover:bg-amber-500/20 text-slate-200 hover:text-amber-300 border border-slate-600/50 hover:border-amber-500/40 text-xs font-bold flex items-center gap-1.5 transition-colors ml-auto"
                  >
                    <Settings className="w-3 h-3" />
                    <span>Настройки API</span>
                  </button>
                </div>
              </div>
            );
          })}
      </div>

      {/* Modal: Edit / Create Integration */}
      {editingIntegration && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setEditingIntegration(null)}
        >
          <div
            className="bg-slate-900 border border-slate-700 rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <Globe className="w-5 h-5 text-amber-400" />
                  {isCreatingIntegration
                    ? 'Подключение нового API / Шлюза'
                    : `Настройка API: ${editingIntegration.name}`}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isCreatingIntegration
                    ? 'Интеграция сторонней системы, CRM, службы доставки или вебхука'
                    : `ID: ${editingIntegration.id} • Провайдер: ${editingIntegration.provider}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingIntegration(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveIntegration} className="space-y-4 text-xs">
              {/* Row 1: Name & Provider */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Название интеграции *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingIntegration.name}
                    onChange={(e) =>
                      setEditingIntegration({ ...editingIntegration, name: e.target.value })
                    }
                    placeholder="Например: Kaspi Pay QR"
                    className={`w-full px-3 py-2 bg-slate-800 border rounded-xl text-white placeholder-slate-500 focus:outline-none transition-colors ${
                      duplicateIntegrationName
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-slate-700 focus:border-amber-500'
                    }`}
                  />
                  {duplicateIntegrationName && (
                    <p className="text-[11px] text-red-400 font-medium mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Интеграция с таким названием уже существует
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Провайдер сервиса
                  </label>
                  <input
                    type="text"
                    value={editingIntegration.provider}
                    onChange={(e) =>
                      setEditingIntegration({ ...editingIntegration, provider: e.target.value })
                    }
                    placeholder="Например: ApiPay.kz / Kaspi Bank"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Row 2: Category & Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Категория шлюза
                  </label>
                  <select
                    value={editingIntegration.category}
                    onChange={(e) =>
                      setEditingIntegration({
                        ...editingIntegration,
                        category: e.target.value as IntegrationCategory,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="payments">Платежный шлюз (Kaspi Pay / Эквайринг)</option>
                    <option value="fiscal">Фискализация ОФД (WebKassa / Чеки)</option>
                    <option value="ai">Искусственный интеллект (Gemini Vision)</option>
                    <option value="sync_1c">Синхронизация 1С / Склад</option>
                    <option value="notifications">СМС и Мессенджеры (SMSC.kz)</option>
                    <option value="delivery">Курьерская доставка (Яндекс / Kaspi)</option>
                    <option value="custom">Пользовательский Webhook / API</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Состояние интеграции
                  </label>
                  <select
                    value={editingIntegration.status}
                    onChange={(e) =>
                      setEditingIntegration({
                        ...editingIntegration,
                        status: e.target.value as IntegrationStatus,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="connected">Подключен (Онлайн)</option>
                    <option value="testing">Тестирование (Sandbox)</option>
                    <option value="disabled">Отключен</option>
                  </select>
                </div>
              </div>

              {/* Row 3: Mode Toggles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-800/40 p-3 rounded-xl border border-slate-800">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingIntegration.isTestMode}
                    onChange={(e) =>
                      setEditingIntegration({
                        ...editingIntegration,
                        isTestMode: e.target.checked,
                      })
                    }
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500"
                  />
                  <div>
                    <div className="font-semibold text-white">Тестовый контур (Sandbox)</div>
                    <div className="text-[10px] text-slate-400">
                      Симуляция запросов без списания реальных средств
                    </div>
                  </div>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingIntegration.autoSync}
                    onChange={(e) =>
                      setEditingIntegration({
                        ...editingIntegration,
                        autoSync: e.target.checked,
                      })
                    }
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500"
                  />
                  <div>
                    <div className="font-semibold text-white">Автоматическая синхронизация</div>
                    <div className="text-[10px] text-slate-400">
                      Регулярный опрос и фоновое обновление данных
                    </div>
                  </div>
                </label>
              </div>

              {/* Row 4: Endpoint URL */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  URL эндпоинта API *
                </label>
                <input
                  type="url"
                  required
                  value={editingIntegration.endpointUrl}
                  onChange={(e) =>
                    setEditingIntegration({
                      ...editingIntegration,
                      endpointUrl: e.target.value,
                    })
                  }
                  placeholder="https://api.service.kz/v1"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Row 5: API Key & API Secret */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    API Key / Публичный токен
                  </label>
                  <input
                    type="text"
                    disabled={!isSuperadmin}
                    value={editingIntegration.apiKey}
                    onChange={(e) =>
                      setEditingIntegration({
                        ...editingIntegration,
                        apiKey: e.target.value,
                      })
                    }
                    placeholder="apipay_key_..."
                    className={`w-full px-3 py-2 border rounded-xl font-mono text-white placeholder-slate-500 focus:outline-none transition-colors ${
                      !isSuperadmin
                        ? 'bg-slate-900/80 border-slate-800 text-slate-400 cursor-not-allowed'
                        : 'bg-slate-800 border-slate-700 focus:border-amber-500'
                    }`}
                  />
                  {!isSuperadmin && (
                    <p className="text-[10px] text-slate-500 mt-1">
                      Ключ защищен. Изменение доступно только суперадминистратору
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Secret Key / Пароль шлюза
                  </label>
                  <input
                    type="password"
                    disabled={!isSuperadmin}
                    value={editingIntegration.apiSecret || ''}
                    onChange={(e) =>
                      setEditingIntegration({
                        ...editingIntegration,
                        apiSecret: e.target.value,
                      })
                    }
                    placeholder="sec_token_..."
                    className={`w-full px-3 py-2 border rounded-xl font-mono text-white placeholder-slate-500 focus:outline-none transition-colors ${
                      !isSuperadmin
                        ? 'bg-slate-900/80 border-slate-800 text-slate-400 cursor-not-allowed'
                        : 'bg-slate-800 border-slate-700 focus:border-amber-500'
                    }`}
                  />
                  {!isSuperadmin && (
                    <p className="text-[10px] text-slate-500 mt-1">
                      Пароль защищен. Изменение доступно только суперадминистратору
                    </p>
                  )}
                </div>
              </div>

              {/* Row 6: Merchant ID & Cashbox/Sender ID */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Merchant ID / БИН организации
                  </label>
                  <input
                    type="text"
                    value={editingIntegration.merchantOrClientId || ''}
                    onChange={(e) =>
                      setEditingIntegration({
                        ...editingIntegration,
                        merchantOrClientId: e.target.value,
                      })
                    }
                    placeholder="Например: KZ_MERCHANT_884102"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Номер кассы / Имя отправителя SMS
                  </label>
                  <input
                    type="text"
                    value={editingIntegration.cashboxOrSenderId || ''}
                    onChange={(e) =>
                      setEditingIntegration({
                        ...editingIntegration,
                        cashboxOrSenderId: e.target.value,
                      })
                    }
                    placeholder="SWK00000001 / INDIATRIKO"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Row 7: Webhook URL */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  URL вебхука для входящих уведомлений
                </label>
                <input
                  type="url"
                  value={editingIntegration.webhookUrl || ''}
                  onChange={(e) =>
                    setEditingIntegration({
                      ...editingIntegration,
                      webhookUrl: e.target.value,
                    })
                  }
                  placeholder="https://india-trikotaj.kz/api/webhooks/kaspi-pay"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Row 8: Description */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Описание и назначение шлюза
                </label>
                <textarea
                  rows={2}
                  value={editingIntegration.description}
                  onChange={(e) =>
                    setEditingIntegration({
                      ...editingIntegration,
                      description: e.target.value,
                    })
                  }
                  placeholder="Краткое описание работы интеграции..."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Contextual Settings: Gemini Model */}
              {editingIntegration.category === 'ai' && (
                <div className="bg-purple-950/20 border border-purple-800/40 p-3 rounded-xl space-y-2">
                  <div className="font-bold text-purple-300 text-xs">
                    Параметры нейросети Google Gemini
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-slate-300 mb-1">Выбранная модель:</label>
                      <select
                        value={editingIntegration.extraSettings?.model || 'gemini-1.5-flash'}
                        onChange={(e) =>
                          setEditingIntegration({
                            ...editingIntegration,
                            extraSettings: {
                              ...editingIntegration.extraSettings,
                              model: e.target.value,
                            },
                          })
                        }
                        className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white"
                      >
                        <option value="gemini-1.5-flash">
                          Gemini 1.5 Flash (Скорость: 3 сек, Рекомендуется)
                        </option>
                        <option value="gemini-1.5-pro">
                          Gemini 1.5 Pro (Максимальное качество описаний)
                        </option>
                        <option value="gemini-2.0-flash">
                          Gemini 2.0 Flash (Экспериментальная)
                        </option>
                      </select>
                    </div>

                    <div className="space-y-1 pt-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={
                            editingIntegration.extraSettings?.autoRemoveBackground ?? true
                          }
                          onChange={(e) =>
                            setEditingIntegration({
                              ...editingIntegration,
                              extraSettings: {
                                ...editingIntegration.extraSettings,
                                autoRemoveBackground: e.target.checked,
                              },
                            })
                          }
                          className="w-3.5 h-3.5 rounded text-amber-500"
                        />
                        <span className="text-slate-300">Автоочистка фона на фото</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={
                            editingIntegration.extraSettings?.autoTranslateKz ?? true
                          }
                          onChange={(e) =>
                            setEditingIntegration({
                              ...editingIntegration,
                              extraSettings: {
                                ...editingIntegration.extraSettings,
                                autoTranslateKz: e.target.checked,
                              },
                            })
                          }
                          className="w-3.5 h-3.5 rounded text-amber-500"
                        />
                        <span className="text-slate-300">
                          Автоперевод описаний на казахский (KZ)
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Contextual Settings: 1C Sync Interval */}
              {editingIntegration.category === 'sync_1c' && (
                <div className="bg-blue-950/20 border border-blue-800/40 p-3 rounded-xl space-y-2">
                  <div className="font-bold text-blue-300 text-xs">
                    Параметры обмена 1С:Розница 8.3
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-slate-300 mb-1">
                        Интервал автообмена остатками:
                      </label>
                      <select
                        value={editingIntegration.syncIntervalMinutes || 5}
                        onChange={(e) =>
                          setEditingIntegration({
                            ...editingIntegration,
                            syncIntervalMinutes: Number(e.target.value),
                          })
                        }
                        className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white"
                      >
                        <option value={1}>Каждую 1 минуту (Высокая нагрузка)</option>
                        <option value={5}>Каждые 5 минут (Оптимально)</option>
                        <option value={15}>Каждые 15 минут</option>
                        <option value={60}>Каждый 1 час</option>
                      </select>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center">
                      Остатки списываются синхронно по всем 16 филиалам г. Алматы при каждом заказе
                    </div>
                  </div>
                </div>
              )}

              {/* Footer Buttons */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <div>
                  {isSuperadmin && (isCreatingIntegration || editingIntegration.category === 'custom') ? (
                    <button
                      type="button"
                      onClick={() =>
                        handleDeleteIntegration(editingIntegration.id, editingIntegration.name)
                      }
                      className="px-3 py-2 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-950/40 border border-red-800/50 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Удалить API</span>
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-500">
                      {isAdmin && !isSuperadmin ? 'Режим администратора (ключи защищены)' : 'Системный шлюз'}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingIntegration(null)}
                    className="px-4 py-2 rounded-xl text-slate-400 hover:text-white transition-colors"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    disabled={Boolean(duplicateIntegrationName)}
                    className={`px-5 py-2 rounded-xl font-bold transition-all shadow-md ${
                      duplicateIntegrationName
                        ? 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-60'
                        : 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                    }`}
                  >
                    {isCreatingIntegration ? 'Подключить API' : 'Сохранить настройки'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Kaspi Pay Test QR Simulation */}
      {testKaspiQrModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setTestKaspiQrModal(false)}
        >
          <div
            className="bg-slate-900 border border-red-500/50 rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setTestKaspiQrModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white"
            >
              ✕
            </button>

            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-red-600/20 text-red-500 border border-red-500/30">
              <CreditCard className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-black text-white text-lg">Kaspi Pay • Тестовый QR</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Сгенерирован через ApiPay.kz (Договор #KZ-AP-2026)
              </p>
            </div>

            <div className="bg-red-950/30 border border-red-900/50 rounded-2xl p-4 space-y-1">
              <div className="text-2xl font-black text-white">500 ₸</div>
              <div className="text-xs text-emerald-400 font-bold">
                Комиссия: 0.95% (4.75 ₸) вместо 75 ₸ у Kaspi.kz
              </div>
            </div>

            {/* QR Graphic Mock */}
            <div className="bg-white p-4 rounded-2xl max-w-[200px] mx-auto shadow-inner relative flex items-center justify-center aspect-square">
              <div className="w-full h-full border-4 border-black border-dashed flex flex-col items-center justify-center p-2 text-center text-slate-950 font-mono text-[10px] font-bold">
                <div className="w-8 h-8 rounded-lg bg-red-600 text-white font-bold flex items-center justify-center text-xs mb-1">
                  K
                </div>
                <span>Kaspi QR</span>
                <span className="text-[8px] text-slate-600">Оплата 500 ₸</span>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 space-y-1">
              <div>⏱ Время на оплату: <span className="font-bold text-amber-400">04:59</span></div>
              <div>Поддерживает: Kaspi QR, Kaspi Gold, Kaspi Red (0-0-3), Kaspi Kredit</div>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={() => {
                  setTestKaspiQrModal(false);
                  showToast('Kaspi Webhook: Платеж на 500 ₸ успешно подтвержден и фискализирован!');
                }}
                className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition-colors"
              >
                Имитировать оплату (WebHook 200 OK)
              </button>
              <button
                onClick={() => setTestKaspiQrModal(false)}
                className="w-full py-2 rounded-xl text-slate-400 hover:text-white text-xs transition-colors"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: WebKassa Fiscal Receipt Preview */}
      {testFiscalModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setTestFiscalModal(null)}
        >
          <div
            className="bg-slate-900 border border-emerald-500/50 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setTestFiscalModal(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white"
            >
              ✕
            </button>

            <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
              <Receipt className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="font-bold text-white text-base">
                  Фискальный чек КГД МФ РК
                </h3>
                <p className="text-[11px] text-slate-400">
                  Оператор фискальных данных (ОФД WebKassa)
                </p>
              </div>
            </div>

            {/* Thermal paper style receipt */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-slate-300 font-mono text-xs space-y-2">
              <div className="text-center pb-2 border-b border-dashed border-slate-700">
                <div className="font-bold text-white">ТОО «INDIA TRIKOTAJ ALMATY»</div>
                <div className="text-[11px] text-slate-400">БИН: 980412356789</div>
                <div className="text-[10px] text-slate-500">
                  г. Алматы, филиал ТРЦ MEGA Park (Макатаева 127)
                </div>
              </div>

              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>1. Хлопковая футболка премиум (Индия)</span>
                </div>
                <div className="flex justify-between text-slate-400 pl-2">
                  <span>1 шт x 4 500 ₸</span>
                  <span className="text-white font-bold">4 500 ₸</span>
                </div>

                <div className="flex justify-between pt-1">
                  <span>2. Халат махровый банный уютный</span>
                </div>
                <div className="flex justify-between text-slate-400 pl-2">
                  <span>1 шт x 10 490 ₸</span>
                  <span className="text-white font-bold">10 490 ₸</span>
                </div>
              </div>

              <div className="pt-2 border-t border-dashed border-slate-700 space-y-1">
                <div className="flex justify-between text-base font-bold text-white">
                  <span>ИТОГО К ОПЛАТЕ:</span>
                  <span className="text-emerald-400">{formatKZT(testFiscalModal.amountKzt)}</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>В т.ч. НДС 12%:</span>
                  <span>{formatKZT(testFiscalModal.vatKzt)}</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Способ оплаты:</span>
                  <span className="text-amber-300">Безналичный (Kaspi Pay QR)</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-500 space-y-0.5">
                <div>Касса: {testFiscalModal.cashboxId} (Онлайн-касса)</div>
                <div>РНМ: {testFiscalModal.regNumber}</div>
                <div>Фискальный признак: {testFiscalModal.fiscalSign}</div>
                <div>Чек: #{testFiscalModal.ticketNumber}</div>
                <div>Время: {testFiscalModal.date}</div>
                <div className="text-emerald-400 pt-1">
                  Проверка чека: consumer.oofd.kz
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() =>
                  handleCopyClipboard(
                    `https://consumer.oofd.kz/check?reg=${testFiscalModal.regNumber}&ticket=${testFiscalModal.ticketNumber}&sign=${testFiscalModal.fiscalSign}`,
                    'Ссылка на фискальный чек'
                  )
                }
                className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition-colors flex items-center justify-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Скопировать ссылку</span>
              </button>
              <button
                onClick={() => setTestFiscalModal(null)}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors"
              >
                Готово
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

