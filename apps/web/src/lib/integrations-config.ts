export type IntegrationStatus = 'connected' | 'testing' | 'error' | 'disabled';
export type IntegrationCategory =
  | 'payments'
  | 'fiscal'
  | 'ai'
  | 'sync_1c'
  | 'notifications'
  | 'delivery'
  | 'custom';

export interface IntegrationConfig {
  id: string;
  name: string;
  provider: string;
  category: IntegrationCategory;
  status: IntegrationStatus;
  isTestMode: boolean;
  description: string;
  badge: string;
  endpointUrl: string;
  apiKey: string;
  apiSecret?: string;
  merchantOrClientId?: string;
  cashboxOrSenderId?: string;
  webhookUrl?: string;
  lastSyncAt?: string;
  lastPingMs?: number;
  autoSync: boolean;
  syncIntervalMinutes?: number;
  extraSettings?: {
    model?: string;
    autoRemoveBackground?: boolean;
    autoTranslateKz?: boolean;
    temperature?: number;
    commissionRate?: string;
    senderName?: string;
    defaultWarehouse?: string;
    [key: string]: any;
  };
}

export const STORAGE_INTEGRATIONS_KEY = 'indiatrikotaj_admin_integrations';

export const DEFAULT_INTEGRATIONS: IntegrationConfig[] = [
  {
    id: 'kaspi-pay',
    name: 'Kaspi Pay & Kaspi QR',
    provider: 'ApiPay.kz (АО «Kaspi Bank»)',
    category: 'payments',
    status: 'connected',
    isTestMode: true,
    description: 'Прием оплаты через Kaspi QR, Kaspi Red и Kaspi Kredit. Комиссия 0.95% - 1.95% вместо 15% у маркетплейса',
    badge: 'Kaspi Pay 0.95%',
    endpointUrl: 'https://api.apipay.kz/v1',
    apiKey: 'apipay_live_kz_9837264819',
    apiSecret: 'sec_kaspi_d83fa901bc772e41',
    merchantOrClientId: 'KZ_MERCHANT_884102',
    webhookUrl: 'https://india-trikotaj.kz/api/webhooks/kaspi-pay',
    lastSyncAt: 'Сегодня, 11:30',
    lastPingMs: 24,
    autoSync: true,
    extraSettings: {
      commissionRate: '0.95% - 1.95%',
    },
  },
  {
    id: 'webkassa-ofd',
    name: 'Фискализация ОФД (WebKassa)',
    provider: 'КГД МФ РК / АО «Казахтелеком» ОФД',
    category: 'fiscal',
    status: 'connected',
    isTestMode: false,
    description: 'Автоматическая выдача фискальных электронных чеков покупателям РК при онлайн-оплате и самовывозе',
    badge: 'ОФД WebKassa',
    endpointUrl: 'https://webkassa.kz/api/v2',
    apiKey: 'SWK-OFD-TOKEN-2026-KZ',
    apiSecret: 'kassa_pwd_998124',
    merchantOrClientId: 'БИН 980412356789',
    cashboxOrSenderId: 'SWK00000001',
    webhookUrl: 'https://india-trikotaj.kz/api/webhooks/webkassa',
    lastSyncAt: 'Сегодня, 11:28',
    lastPingMs: 38,
    autoSync: true,
    extraSettings: {
      defaultWarehouse: 'Онлайн-касса филиалов Алматы',
    },
  },
  {
    id: 'gemini-ai',
    name: 'Google Gemini 1.5/2.0 Vision AI',
    provider: 'Google Cloud & DeepMind AI',
    category: 'ai',
    status: 'connected',
    isTestMode: false,
    description: 'ИИ-распознавание индийского хлопка, генерация двуязычных карточек (RU/KZ), удаление фона с фото за 3 секунды',
    badge: 'Gemini Vision AI',
    endpointUrl: 'https://generativelanguage.googleapis.com/v1beta',
    apiKey: 'AIzaSyD-india-trikotaj-gemini-key',
    lastSyncAt: 'Сегодня, 11:15',
    lastPingMs: 58,
    autoSync: true,
    extraSettings: {
      model: 'gemini-1.5-flash',
      autoRemoveBackground: true,
      autoTranslateKz: true,
      temperature: 0.2,
    },
  },
  {
    id: 'sync-1c',
    name: 'Синхронизация остатков 1С:Предприятие 8',
    provider: '1С:Розница 8.3 / OData & CommerceML',
    category: 'sync_1c',
    status: 'connected',
    isTestMode: false,
    description: 'Мгновенная синхронизация остатков хлопка по всем 16 магазинам Алматы, списание при онлайн-заказах',
    badge: '1С:Розница 8.3',
    endpointUrl: 'https://1c.india-trikotaj.kz/odata/standard.odata',
    apiKey: 'odata_sync_almaty',
    apiSecret: '1c_secure_pwd_2026',
    syncIntervalMinutes: 5,
    autoSync: true,
    lastSyncAt: 'Сегодня, 11:32',
    lastPingMs: 31,
  },
  {
    id: 'smsc-kz',
    name: 'СМС и WhatsApp уведомления',
    provider: 'SMSC.kz / WhatsApp Cloud API',
    category: 'notifications',
    status: 'connected',
    isTestMode: true,
    description: 'Отправка покупателям статусов сборки, готовности самовывоза в филиале и ссылок на фискальные чеки',
    badge: 'SMSC.kz & WA',
    endpointUrl: 'https://smsc.kz/sys/send.php',
    apiKey: 'smsc_india_client',
    apiSecret: 'smsc_token_7701',
    cashboxOrSenderId: 'INDIATRIKO',
    lastSyncAt: 'Сегодня, 11:05',
    lastPingMs: 19,
    autoSync: true,
    extraSettings: {
      senderName: 'INDIATRIKO',
    },
  },
  {
    id: 'yandex-delivery',
    name: 'Яндекс Go & Kaspi Доставка',
    provider: 'Яндекс Доставка B2B & Kaspi Logistics',
    category: 'delivery',
    status: 'connected',
    isTestMode: true,
    description: 'Курьерская доставка по Алматы день-в-день, автоматический вызов курьера к филиалу отправки',
    badge: 'Яндекс B2B',
    endpointUrl: 'https://b2b.taxi.yandex.net/b2b/cargo/integration/v2',
    apiKey: 'yandex_b2b_almaty_token',
    merchantOrClientId: 'CLIENT-ALMATY-LOGISTICS-01',
    lastSyncAt: 'Сегодня, 10:45',
    lastPingMs: 44,
    autoSync: false,
    extraSettings: {
      defaultWarehouse: 'Центральный склад (ТРЦ MEGA Park, Макатаева 127)',
    },
  },
];

export function getStoredIntegrations(): IntegrationConfig[] {
  if (typeof window === 'undefined') return DEFAULT_INTEGRATIONS;
  try {
    const raw = localStorage.getItem(STORAGE_INTEGRATIONS_KEY);
    if (!raw) return DEFAULT_INTEGRATIONS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_INTEGRATIONS;
  } catch {
    return DEFAULT_INTEGRATIONS;
  }
}

export function saveStoredIntegrations(integrations: IntegrationConfig[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_INTEGRATIONS_KEY, JSON.stringify(integrations));
  } catch (err) {
    console.error('Failed to save integrations to localStorage', err);
  }
}

