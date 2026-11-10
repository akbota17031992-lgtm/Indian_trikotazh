export type AdminRole = 'superadmin' | 'admin' | 'manager';

export interface AdminAccount {
  id: string;
  login: string;
  passwordHash: string; // for demo plaintext matching or hashed
  name: string;
  role: AdminRole;
  email: string;
  phone: string;
  avatarBg: string;
  createdAt: string;
  lastLogin?: string;
  isActive: boolean;
}

export interface CustomerAccount {
  id: string;
  name: string;
  phone: string;
  email: string;
  bonusBalance: number;
  ordersCount: number;
  totalSpentKzt: number;
  registeredAt: string;
  status: 'active' | 'blocked';
  address?: string;
  notes?: string;
}

export interface PromoPromotion {
  id: string;
  titleRu: string;
  titleKz: string;
  badgeRu: string;
  discountPercent: number;
  promoCode?: string;
  categorySlug: string;
  isActive: boolean;
  validUntil: string;
}

// 3 предустановленных эталонных аккаунта под ТЗ (пароли защищены SHA-256 хешированием):
export const INITIAL_ADMIN_ACCOUNTS: AdminAccount[] = [
  {
    id: 'admin-001',
    login: 'superadmin',
    passwordHash: 'e34f92a20532a873cb3184398070b4b82a8fa29cf48572c203dc5f0fa6158231', // SHA-256(superadmin123)
    name: 'Ерлан Сериков (Владелец / Суперадмин)',
    role: 'superadmin',
    email: 'owner@indiatrikotaj.kz',
    phone: '+7 (701) 999-00-01',
    avatarBg: 'bg-purple-600',
    createdAt: '2026-01-10T10:00:00Z',
    isActive: true,
  },
  {
    id: 'admin-002',
    login: 'admin',
    passwordHash: '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', // SHA-256(admin123)
    name: 'Алия Касымова (Старший Администратор)',
    role: 'admin',
    email: 'admin@indiatrikotaj.kz',
    phone: '+7 (702) 888-00-02',
    avatarBg: 'bg-blue-600',
    createdAt: '2026-02-15T12:00:00Z',
    isActive: true,
  },
  {
    id: 'admin-003',
    login: 'manager',
    passwordHash: '866485796cfa8d7c0cf7111640205b83076433547577511d81f8030ae99ecea5', // SHA-256(manager123)
    name: 'Даурен Нургалиев (Контент-Менеджер)',
    role: 'manager',
    email: 'manager@indiatrikotaj.kz',
    phone: '+7 (705) 777-00-03',
    avatarBg: 'bg-emerald-600',
    createdAt: '2026-03-01T09:00:00Z',
    isActive: true,
  },
];

// Первоначальная клиентская база для управления
export const INITIAL_CUSTOMERS: CustomerAccount[] = [
  {
    id: 'cust-101',
    name: 'Азамат Смагулов',
    phone: '+7 (747) 375-99-14',
    email: 'azamat@mail.kz',
    bonusBalance: 1450,
    ordersCount: 3,
    totalSpentKzt: 28970,
    registeredAt: '2026-03-12',
    status: 'active',
  },
  {
    id: 'cust-102',
    name: 'Мадина Омарова',
    phone: '+7 (701) 123-45-67',
    email: 'madina.o@gmail.com',
    bonusBalance: 1000,
    ordersCount: 1,
    totalSpentKzt: 8990,
    registeredAt: '2026-04-05',
    status: 'active',
  },
  {
    id: 'cust-103',
    name: 'Руслан Ахметов',
    phone: '+7 (777) 555-11-22',
    email: 'ruslan.a@inbox.ru',
    bonusBalance: 3200,
    ordersCount: 5,
    totalSpentKzt: 54300,
    registeredAt: '2026-02-20',
    status: 'active',
  },
  {
    id: 'cust-104',
    name: 'Динара Жумабаева',
    phone: '+7 (708) 444-88-99',
    email: 'dinara.zh@icloud.com',
    bonusBalance: 500,
    ordersCount: 2,
    totalSpentKzt: 17980,
    registeredAt: '2026-04-18',
    status: 'active',
  },
];

// Первоначальные акции для менеджера
export const INITIAL_PROMOTIONS: PromoPromotion[] = [
  {
    id: 'promo-001',
    titleRu: 'Kaspi Red Фестиваль 0-0-3 на весь индийский хлопок',
    titleKz: 'Kaspi Red 0-0-3 барлық үнді мақтасына',
    badgeRu: '0-0-3',
    discountPercent: 10,
    promoCode: 'KASPIRED',
    categorySlug: 'all',
    isActive: true,
    validUntil: '2026-12-31',
  },
  {
    id: 'promo-002',
    titleRu: 'Скидка 15% на уютные хлопковые халаты и пижамы',
    titleKz: 'Шапандар мен пижамаларға 15% жеңілдік',
    badgeRu: '-15%',
    discountPercent: 15,
    promoCode: 'HOMELOVE',
    categorySlug: 'robes',
    isActive: true,
    validUntil: '2026-06-30',
  },
  {
    id: 'promo-003',
    titleRu: 'Двойные бонусы (+10%) при покупке термобелья',
    titleKz: 'Термоішкиімге қос бонустар (+10%)',
    badgeRu: '2X БОНУСЫ',
    discountPercent: 0,
    promoCode: 'WARM2026',
    categorySlug: 'thermal-underwear',
    isActive: true,
    validUntil: '2026-11-30',
  },
];

