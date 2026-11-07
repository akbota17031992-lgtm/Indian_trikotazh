/**
 * India Trikotaj E2E Testing Suite — Seed & Reference Fixtures
 * 16 Almaty Branches, 7 Categories, Bilingual Catalog & Inventory
 */

import type { Store, Category, Product, ProductVariant, StoreInventory } from './contracts.ts';

export const ALMATY_STORES_FIXTURE: Store[] = [
  {
    id: 'store-almaty-001',
    name_ru: 'ТРЦ MEGA Alma-Ata',
    name_kz: 'MEGA Alma-Ata СОСО',
    slug: 'mega-alma-ata',
    address_ru: 'ул. Розыбакиева, 247А, 2 этаж',
    address_kz: 'Розыбакиев к-сі, 247А, 2-қабат',
    district: 'Бостандыкский',
    latitude: 43.2033,
    longitude: 76.8925,
    phone: '+7 (727) 232-25-01',
    schedule_ru: 'Ежедневно с 10:00 до 22:00',
    schedule_kz: 'Күн сайын 10:00-ден 22:00-ге дейін',
    is_active: true
  },
  {
    id: 'store-almaty-002',
    name_ru: 'ТРЦ Dostyk Plaza',
    name_kz: 'Dostyk Plaza СОСО',
    slug: 'dostyk-plaza',
    address_ru: 'мкр. Самал-2, д. 111, 3 этаж',
    address_kz: 'Самал-2 ш/а, 111 үй, 3-қабат',
    district: 'Медеуский',
    latitude: 43.2335,
    longitude: 76.9565,
    phone: '+7 (727) 225-50-02',
    schedule_ru: 'Ежедневно с 10:00 до 22:00',
    schedule_kz: 'Күн сайын 10:00-ден 22:00-ге дейін',
    is_active: true
  },
  {
    id: 'store-almaty-003',
    name_ru: 'ТРК Grand Park',
    name_kz: 'Grand Park СОСК',
    slug: 'grand-park',
    address_ru: 'ул. Кабдолова, 1, блок 7',
    address_kz: 'Қабдолов к-сі, 1, 7 блок',
    district: 'Ауэзовский',
    latitude: 43.2388,
    longitude: 76.8494,
    phone: '+7 (727) 381-40-03',
    schedule_ru: 'Ежедневно с 10:00 до 21:00',
    schedule_kz: 'Күн сайын 10:00-ден 21:00-ге дейін',
    is_active: true
  },
  {
    id: 'store-almaty-004',
    name_ru: 'ТРЦ Moskva Metropolitan',
    name_kz: 'Moskva Metropolitan СОСО',
    slug: 'moskva-metropolitan',
    address_ru: 'пр. Абая, 109В, уг. ул. Алтынсарина',
    address_kz: 'Абай д-лы, 109В, Алтынсарин к-сі қиылысы',
    district: 'Ауэзовский',
    latitude: 43.2268,
    longitude: 76.8643,
    phone: '+7 (727) 335-60-04',
    schedule_ru: 'Ежедневно с 10:00 до 22:00',
    schedule_kz: 'Күн сайын 10:00-ден 22:00-ге дейін',
    is_active: true
  },
  {
    id: 'store-almaty-005',
    name_ru: 'ТРК ADK',
    name_kz: 'ADK СОСК',
    slug: 'adk',
    address_ru: 'ул. Сатпаева, 90/28, 2 этаж',
    address_kz: 'Сәтбаев к-сі, 90/28, 2-қабат',
    district: 'Бостандыкский',
    latitude: 43.2330,
    longitude: 76.8830,
    phone: '+7 (727) 331-30-05',
    schedule_ru: 'Ежедневно с 10:00 до 22:00',
    schedule_kz: 'Күн сайын 10:00-ден 22:00-ге дейін',
    is_active: true
  },
  {
    id: 'store-almaty-006',
    name_ru: 'ТЦ ЦУМ Зангар',
    name_kz: 'Занғар ОУД',
    slug: 'tsum-zangar',
    address_ru: 'пр. Абылай хана, 62, 3 этаж',
    address_kz: 'Абылай хан д-лы, 62, 3-қабат',
    district: 'Алмалинский',
    latitude: 43.2612,
    longitude: 76.9421,
    phone: '+7 (727) 279-70-06',
    schedule_ru: 'Ежедневно с 10:00 до 21:00',
    schedule_kz: 'Күн сайын 10:00-ден 21:00-ге дейін',
    is_active: true
  },
  {
    id: 'store-almaty-007',
    name_ru: 'ТРЦ Forum Almaty',
    name_kz: 'Forum Almaty СОСО',
    slug: 'forum-almaty',
    address_ru: 'пр. Сейфуллина, 617, 3 этаж',
    address_kz: 'Сейфуллин д-лы, 617, 3-қабат',
    district: 'Бостандыкский',
    latitude: 43.2307,
    longitude: 76.9298,
    phone: '+7 (727) 313-10-07',
    schedule_ru: 'Ежедневно с 10:00 до 22:00',
    schedule_kz: 'Күн сайын 10:00-ден 22:00-ге дейін',
    is_active: true
  },
  {
    id: 'store-almaty-008',
    name_ru: 'Молл Апорт Запад',
    name_kz: 'Апорт Батыс Молл',
    slug: 'aport-mall-west',
    address_ru: 'Ташкентский тракт, 17К',
    address_kz: 'Ташкент тас жолы, 17К',
    district: 'Наурызбайский',
    latitude: 43.2185,
    longitude: 76.7865,
    phone: '+7 (727) 312-10-08',
    schedule_ru: 'Ежедневно с 10:00 до 22:00',
    schedule_kz: 'Күн сайын 10:00-ден 22:00-ге дейін',
    is_active: true
  },
  {
    id: 'store-almaty-009',
    name_ru: 'Молл Апорт Восток',
    name_kz: 'Апорт Шығыс Молл',
    slug: 'aport-mall-east',
    address_ru: 'Кульджинский тракт, 106',
    address_kz: 'Құлжа тас жолы, 106',
    district: 'Турксибский',
    latitude: 43.3292,
    longitude: 77.0142,
    phone: '+7 (727) 312-20-09',
    schedule_ru: 'Ежедневно с 10:00 до 22:00',
    schedule_kz: 'Күн сайын 10:00-ден 22:00-ге дейін',
    is_active: true
  },
  {
    id: 'store-almaty-010',
    name_ru: 'ТРЦ MEGA Park',
    name_kz: 'MEGA Park СОСО',
    slug: 'mega-park',
    address_ru: 'ул. Макатаева, 127/1, 2 этаж',
    address_kz: 'Мақатаев к-сі, 127/1, 2-қабат',
    district: 'Алмалинский',
    latitude: 43.2641,
    longitude: 76.9295,
    phone: '+7 (727) 232-26-10',
    schedule_ru: 'Ежедневно с 10:00 до 22:00',
    schedule_kz: 'Күн сайын 10:00-ден 22:00-ге дейін',
    is_active: true
  },
  {
    id: 'store-almaty-011',
    name_ru: 'ТЦ Пассаж (Зеленый Базар)',
    name_kz: 'Пассаж СО (Көк Базар)',
    slug: 'passage-green-bazaar',
    address_ru: 'ул. Жибек Жолы, 50, 1 этаж',
    address_kz: 'Жібек Жолы к-сі, 50, 1-қабат',
    district: 'Медеуский',
    latitude: 43.2635,
    longitude: 76.9550,
    phone: '+7 (727) 273-10-11',
    schedule_ru: 'Вт-Вс с 09:00 до 19:00, Пн выходной',
    schedule_kz: 'Сей-Жек 09:00-ден 19:00-ге дейін, Дүй демалыс',
    is_active: true
  },
  {
    id: 'store-almaty-012',
    name_ru: 'ТД Адем',
    name_kz: 'Әдем СҮ',
    slug: 'adem',
    address_ru: 'ул. Северное Кольцо, 3, павильон 1',
    address_kz: 'Северное Кольцо к-сі, 3, 1 павильон',
    district: 'Жетысуский',
    latitude: 43.2978,
    longitude: 76.9080,
    phone: '+7 (727) 251-50-12',
    schedule_ru: 'Вт-Вс с 09:00 до 18:00, Пн выходной',
    schedule_kz: 'Сей-Жек 09:00-ден 18:00-ге дейін, Дүй демалыс',
    is_active: true
  },
  {
    id: 'store-almaty-013',
    name_ru: 'ТК Silk Way City',
    name_kz: 'Silk Way City СОК',
    slug: 'silk-way-city',
    address_ru: 'ул. Толе би, 71, уг. ул. Наурызбай батыра',
    address_kz: 'Төле би к-сі, 71, Наурызбай батыр к-сі қиылысы',
    district: 'Алмалинский',
    latitude: 43.2552,
    longitude: 76.9360,
    phone: '+7 (727) 267-20-13',
    schedule_ru: 'Ежедневно с 10:00 до 21:00',
    schedule_kz: 'Күн сайын 10:00-ден 21:00-ге дейін',
    is_active: true
  },
  {
    id: 'store-almaty-014',
    name_ru: 'ТРЦ MART Village',
    name_kz: 'MART Village СОСО',
    slug: 'mart-village',
    address_ru: 'ул. Рихарда Зорге, 18/1, 2 этаж',
    address_kz: 'Рихард Зорге к-сі, 18/1, 2-қабат',
    district: 'Турксибский',
    latitude: 43.3411,
    longitude: 76.9535,
    phone: '+7 (727) 343-50-14',
    schedule_ru: 'Ежедневно с 10:00 до 22:00',
    schedule_kz: 'Күн сайын 10:00-ден 22:00-ге дейін',
    is_active: true
  },
  {
    id: 'store-almaty-015',
    name_ru: 'ТД Тастак',
    name_kz: 'Тастақ СҮ',
    slug: 'tastak',
    address_ru: 'ул. Толе би, 249',
    address_kz: 'Төле би к-сі, 249',
    district: 'Алмалинский',
    latitude: 43.2514,
    longitude: 76.8770,
    phone: '+7 (727) 241-10-15',
    schedule_ru: 'Ежедневно с 09:00 до 20:00',
    schedule_kz: 'Күн сайын 09:00-ден 20:00-ге дейін',
    is_active: true
  },
  {
    id: 'store-almaty-016',
    name_ru: 'ТЦ City Plus',
    name_kz: 'City Plus СО',
    slug: 'city-plus',
    address_ru: 'пр. Толе би, 285',
    address_kz: 'Төле би д-лы, 285',
    district: 'Ауэзовский',
    latitude: 43.2490,
    longitude: 76.8580,
    phone: '+7 (727) 321-40-16',
    schedule_ru: 'Ежедневно с 10:00 до 21:00',
    schedule_kz: 'Күн сайын 10:00-ден 21:00-ге дейін',
    is_active: true
  }
];

export const CATEGORIES_FIXTURE: Category[] = [
  { id: 'cat-01', name_ru: 'Футболки', name_kz: 'Футболкалар', slug: 't-shirts', sort_order: 1, is_active: true },
  { id: 'cat-02', name_ru: 'Лонгсливы', name_kz: 'Лонгсливтер', slug: 'long-sleeves', sort_order: 2, is_active: true },
  { id: 'cat-03', name_ru: 'Халаты', name_kz: 'Шапандар', slug: 'robes', sort_order: 3, is_active: true },
  { id: 'cat-04', name_ru: 'Пижамы', name_kz: 'Пижамалар', slug: 'pajamas', sort_order: 4, is_active: true },
  { id: 'cat-05', name_ru: 'Термобелье', name_kz: 'Термоішкиім', slug: 'thermal-underwear', sort_order: 5, is_active: true },
  { id: 'cat-06', name_ru: 'Детская одежда', name_kz: 'Балалар киімі', slug: 'kids-clothing', sort_order: 6, is_active: true },
  { id: 'cat-07', name_ru: 'Домашний текстиль', name_kz: 'Үй тоқымасы', slug: 'home-textiles', sort_order: 7, is_active: true }
];

export const PRODUCTS_FIXTURE: Product[] = [
  {
    id: 'prod-001',
    category_id: 'cat-01',
    name_ru: 'Футболка базовая хлопковая премиум',
    name_kz: 'Премиум мақта базалық футболкасы',
    slug: 'futbolka-bazovaya-hlopkovaya-premium',
    description_ru: 'Классическая базовая футболка из 100% индийского хлопка плотностью 180 г/м². Идеальна для повседневного гардероба.',
    description_kz: '180 г/м² тығыздықтағы 100% үнді мақтасынан жасалған классикалық базалық футболка. Күнделікті киюге өте қолайлы.',
    material_ru: '100% индийский хлопок',
    material_kz: '100% үнді мақтасы',
    season: 'all-season',
    gender: 'unisex',
    base_price_kzt: 4990,
    is_published: true,
    tags: ['базовая', 'хлопок', 'индия', 'оверсайз', 'премиум']
  },
  {
    id: 'prod-002',
    category_id: 'cat-02',
    name_ru: 'Лонгслив трикотажный в рубчик',
    name_kz: 'Қабырғалы трикотаж лонгсливі',
    slug: 'longsliv-trikotazhnyj-v-rubchik',
    description_ru: 'Стильный лонгслив из мягкого индийского трикотажа с круглым вырезом.',
    description_kz: 'Жұмсақ үнді трикотажынан жасалған дөңгелек мойынды стильді лонгслив.',
    material_ru: '95% хлопок, 5% эластан',
    material_kz: '95% мақта, 5% эластан',
    season: 'demi-season',
    gender: 'women',
    base_price_kzt: 6990,
    is_published: true,
    tags: ['рубчик', 'трикотаж', 'осень', 'комфорт']
  },
  {
    id: 'prod-003',
    category_id: 'cat-03',
    name_ru: 'Халат махровый уютный банный',
    name_kz: 'Жайлы түкті монша шапаны',
    slug: 'halat-mahrovyj-uyutnyj-bannyj',
    description_ru: 'Мягкий банный халат из натуральной махры высочайшего качества. Высокая впитываемость.',
    description_kz: 'Ең жоғары сапалы табиғи түктен жасалған жұмсақ монша шапаны. Ылғалды жақсы сіңіреді.',
    material_ru: '100% хлопок махра',
    material_kz: '100% түкті мақта',
    season: 'all-season',
    gender: 'unisex',
    base_price_kzt: 14990,
    is_published: true,
    tags: ['халат', 'махра', 'дом', 'ванная']
  },
  {
    id: 'prod-004',
    category_id: 'cat-04',
    name_ru: 'Пижамный комплект хлопковый с шортами',
    name_kz: 'Шорты бар мақта пижама жиынтығы',
    slug: 'pizhamnyj-komplekt-hlopkovyj',
    description_ru: 'Легкий и дышащий домашний комплект для комфортного сна.',
    description_kz: 'Ыңғайлы ұйқыға арналған жеңіл әрі ауа өткізетін үй жиынтығы.',
    material_ru: '100% хлопок',
    material_kz: '100% мақта',
    season: 'summer',
    gender: 'women',
    base_price_kzt: 8990,
    is_published: true,
    tags: ['пижама', 'сон', 'лето', 'хлопок']
  },
  {
    id: 'prod-005',
    category_id: 'cat-05',
    name_ru: 'Термобелье зимнее двухслойное Active Warm',
    name_kz: 'Қысқы екі қабатты Active Warm термоішкиімі',
    slug: 'termobele-zimnee-dvuhslojnoe-active-warm',
    description_ru: 'Согревающий комплект термобелья для суровых зимних температур до -30°C.',
    description_kz: '-30°C дейінгі қатал қысқы ауа-райына арналған жылытатын термоішкиім жиынтығы.',
    material_ru: '70% хлопок, 20% шерсть, 10% эластан',
    material_kz: '70% мақта, 20% жүн, 10% эластан',
    season: 'winter',
    gender: 'men',
    base_price_kzt: 12990,
    is_published: true,
    tags: ['термобелье', 'зима', 'тепло', 'спорт']
  }
];

export const VARIANTS_FIXTURE: ProductVariant[] = [
  // prod-001 (T-shirt)
  { id: 'var-001-w-s', product_id: 'prod-001', sku: 'IT-TSH-WHT-S', size: 'S', color_ru: 'Белый', color_kz: 'Ақ', color_hex: '#FFFFFF', price_kzt: 4990, is_active: true },
  { id: 'var-001-w-m', product_id: 'prod-001', sku: 'IT-TSH-WHT-M', size: 'M', color_ru: 'Белый', color_kz: 'Ақ', color_hex: '#FFFFFF', price_kzt: 4990, is_active: true },
  { id: 'var-001-w-l', product_id: 'prod-001', sku: 'IT-TSH-WHT-L', size: 'L', color_ru: 'Белый', color_kz: 'Ақ', color_hex: '#FFFFFF', price_kzt: 4990, is_active: true },
  { id: 'var-001-b-m', product_id: 'prod-001', sku: 'IT-TSH-BLK-M', size: 'M', color_ru: 'Черный', color_kz: 'Қара', color_hex: '#000000', price_kzt: 4990, is_active: true },
  { id: 'var-001-b-l', product_id: 'prod-001', sku: 'IT-TSH-BLK-L', size: 'L', color_ru: 'Черный', color_kz: 'Қара', color_hex: '#000000', price_kzt: 4990, is_active: true },

  // prod-003 (Robe)
  { id: 'var-003-bl-l', product_id: 'prod-003', sku: 'IT-ROB-BLU-L', size: 'L', color_ru: 'Синий', color_kz: 'Көк', color_hex: '#1E3A8A', price_kzt: 14990, is_active: true },
  { id: 'var-003-bl-xl', product_id: 'prod-003', sku: 'IT-ROB-BLU-XL', size: 'XL', color_ru: 'Синий', color_kz: 'Көк', color_hex: '#1E3A8A', price_kzt: 14990, is_active: true }
];

export const INVENTORY_FIXTURE: StoreInventory[] = [
  // Mega Alma-Ata has stock
  { store_id: 'store-almaty-001', variant_id: 'var-001-w-m', quantity: 15, reserved_quantity: 2, available_quantity: 13, low_stock_threshold: 3 },
  { store_id: 'store-almaty-001', variant_id: 'var-001-w-l', quantity: 8, reserved_quantity: 0, available_quantity: 8, low_stock_threshold: 3 },
  { store_id: 'store-almaty-001', variant_id: 'var-003-bl-l', quantity: 5, reserved_quantity: 1, available_quantity: 4, low_stock_threshold: 2 },

  // Dostyk Plaza has stock
  { store_id: 'store-almaty-002', variant_id: 'var-001-w-m', quantity: 10, reserved_quantity: 0, available_quantity: 10, low_stock_threshold: 3 },
  { store_id: 'store-almaty-002', variant_id: 'var-003-bl-l', quantity: 2, reserved_quantity: 1, available_quantity: 1, low_stock_threshold: 2 }, // low stock

  // Grand Park has 0 stock of var-003-bl-l
  { store_id: 'store-almaty-003', variant_id: 'var-001-w-m', quantity: 4, reserved_quantity: 0, available_quantity: 4, low_stock_threshold: 3 },
  { store_id: 'store-almaty-003', variant_id: 'var-003-bl-l', quantity: 0, reserved_quantity: 0, available_quantity: 0, low_stock_threshold: 2 } // out of stock
];
