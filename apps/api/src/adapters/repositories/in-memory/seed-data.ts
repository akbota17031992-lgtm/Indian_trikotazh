export interface SeedStore {
  id: string;
  slug: string;
  nameRu: string;
  nameKz: string;
  districtRu: string;
  districtKz: string;
  addressRu: string;
  addressKz: string;
  latitude: number;
  longitude: number;
  phone: string;
  scheduleRu: string;
  scheduleKz: string;
  isActive: boolean;
}

export const SEED_STORES: SeedStore[] = [
  {
    id: 'store-almaty-001',
    slug: 'mega-alma-ata',
    nameRu: 'ТРЦ MEGA Alma-Ata',
    nameKz: 'MEGA Alma-Ata СОСО',
    districtRu: 'Бостандыкский',
    districtKz: 'Бостандық',
    addressRu: 'ул. Розыбакиева, 247А, 2 этаж',
    addressKz: 'Розыбакиев к-сі, 247А, 2-қабат',
    latitude: 43.2033,
    longitude: 76.8925,
    phone: '+7 (727) 232-25-01',
    scheduleRu: 'Ежедневно с 10:00 до 22:00',
    scheduleKz: 'Күн сайын 10:00-ден 22:00-ге дейін',
    isActive: true
  },
  {
    id: 'store-almaty-002',
    slug: 'dostyk-plaza',
    nameRu: 'ТРЦ Dostyk Plaza',
    nameKz: 'Dostyk Plaza СОСО',
    districtRu: 'Медеуский',
    districtKz: 'Медеу',
    addressRu: 'мкр. Самал-2, д. 111, 3 этаж',
    addressKz: 'Самал-2 ш/а, 111 үй, 3-қабат',
    latitude: 43.2335,
    longitude: 76.9565,
    phone: '+7 (727) 225-50-02',
    scheduleRu: 'Ежедневно с 10:00 до 22:00',
    scheduleKz: 'Күн сайын 10:00-ден 22:00-ге дейін',
    isActive: true
  },
  {
    id: 'store-almaty-003',
    slug: 'grand-park',
    nameRu: 'ТРК Grand Park',
    nameKz: 'Grand Park СОСК',
    districtRu: 'Ауэзовский',
    districtKz: 'Әуезов',
    addressRu: 'ул. Кабдолова, 1, блок 7',
    addressKz: 'Қабдолов к-сі, 1, 7 блок',
    latitude: 43.2388,
    longitude: 76.8494,
    phone: '+7 (727) 381-40-03',
    scheduleRu: 'Ежедневно с 10:00 до 21:00',
    scheduleKz: 'Күн сайын 10:00-ден 21:00-ге дейін',
    isActive: true
  },
  {
    id: 'store-almaty-004',
    slug: 'moskva-metropolitan',
    nameRu: 'ТРЦ Moskva Metropolitan',
    nameKz: 'Moskva Metropolitan СОСО',
    districtRu: 'Ауэзовский',
    districtKz: 'Әуезов',
    addressRu: 'пр. Абая, 109В, уг. ул. Алтынсарина',
    addressKz: 'Абай д-лы, 109В, Алтынсарин к-сі қиылысы',
    latitude: 43.2268,
    longitude: 76.8643,
    phone: '+7 (727) 335-60-04',
    scheduleRu: 'Ежедневно с 10:00 до 22:00',
    scheduleKz: 'Күн сайын 10:00-ден 22:00-ге дейін',
    isActive: true
  },
  {
    id: 'store-almaty-005',
    slug: 'adk',
    nameRu: 'ТРК ADK',
    nameKz: 'ADK СОСК',
    districtRu: 'Бостандыкский',
    districtKz: 'Бостандық',
    addressRu: 'ул. Сатпаева, 90/28, 2 этаж',
    addressKz: 'Сәтбаев к-сі, 90/28, 2-қабат',
    latitude: 43.2330,
    longitude: 76.8830,
    phone: '+7 (727) 331-30-05',
    scheduleRu: 'Ежедневно с 10:00 до 22:00',
    scheduleKz: 'Күн сайын 10:00-ден 22:00-ге дейін',
    isActive: true
  },
  {
    id: 'store-almaty-006',
    slug: 'tsum-zangar',
    nameRu: 'ТЦ ЦУМ Зангар',
    nameKz: 'Занғар ОУД',
    districtRu: 'Алмалинский',
    districtKz: 'Алмалы',
    addressRu: 'пр. Абылай хана, 62, 3 этаж',
    addressKz: 'Абылай хан д-лы, 62, 3-қабат',
    latitude: 43.2612,
    longitude: 76.9421,
    phone: '+7 (727) 279-70-06',
    scheduleRu: 'Ежедневно с 10:00 до 21:00',
    scheduleKz: 'Күн сайын 10:00-ден 21:00-ге дейін',
    isActive: true
  },
  {
    id: 'store-almaty-007',
    slug: 'forum-almaty',
    nameRu: 'ТРЦ Forum Almaty',
    nameKz: 'Forum Almaty СОСО',
    districtRu: 'Бостандыкский',
    districtKz: 'Бостандық',
    addressRu: 'пр. Сейфуллина, 617, 3 этаж',
    addressKz: 'Сейфуллин д-лы, 617, 3-қабат',
    latitude: 43.2307,
    longitude: 76.9298,
    phone: '+7 (727) 313-10-07',
    scheduleRu: 'Ежедневно с 10:00 до 22:00',
    scheduleKz: 'Күн сайын 10:00-ден 22:00-ге дейін',
    isActive: true
  },
  {
    id: 'store-almaty-008',
    slug: 'aport-mall-west',
    nameRu: 'Молл Апорт Запад',
    nameKz: 'Апорт Батыс Молл',
    districtRu: 'Наурызбайский',
    districtKz: 'Наурызбай',
    addressRu: 'Ташкентский тракт, 17К',
    addressKz: 'Ташкент тас жолы, 17К',
    latitude: 43.2185,
    longitude: 76.7865,
    phone: '+7 (727) 312-10-08',
    scheduleRu: 'Ежедневно с 10:00 до 22:00',
    scheduleKz: 'Күн сайын 10:00-ден 22:00-ге дейін',
    isActive: true
  },
  {
    id: 'store-almaty-009',
    slug: 'aport-mall-east',
    nameRu: 'Молл Апорт Восток',
    nameKz: 'Апорт Шығыс Молл',
    districtRu: 'Турксибский',
    districtKz: 'Түрксіб',
    addressRu: 'Кульджинский тракт, 106',
    addressKz: 'Құлжа тас жолы, 106',
    latitude: 43.3292,
    longitude: 77.0142,
    phone: '+7 (727) 312-20-09',
    scheduleRu: 'Ежедневно с 10:00 до 22:00',
    scheduleKz: 'Күн сайын 10:00-ден 22:00-ге дейін',
    isActive: true
  },
  {
    id: 'store-almaty-010',
    slug: 'mega-park',
    nameRu: 'ТРЦ MEGA Park',
    nameKz: 'MEGA Park СОСО',
    districtRu: 'Алмалинский',
    districtKz: 'Алмалы',
    addressRu: 'ул. Макатаева, 127/1, 2 этаж',
    addressKz: 'Мақатаев к-сі, 127/1, 2-қабат',
    latitude: 43.2641,
    longitude: 76.9295,
    phone: '+7 (727) 232-26-10',
    scheduleRu: 'Ежедневно с 10:00 до 22:00',
    scheduleKz: 'Күн сайын 10:00-ден 22:00-ге дейін',
    isActive: true
  },
  {
    id: 'store-almaty-011',
    slug: 'passage-green-bazaar',
    nameRu: 'ТЦ Пассаж (Зеленый Базар)',
    nameKz: 'Пассаж СО (Көк Базар)',
    districtRu: 'Медеуский',
    districtKz: 'Медеу',
    addressRu: 'ул. Жибек Жолы, 50, 1 этаж',
    addressKz: 'Жібек Жолы к-сі, 50, 1-қабат',
    latitude: 43.2635,
    longitude: 76.9550,
    phone: '+7 (727) 273-10-11',
    scheduleRu: 'Вт-Вс с 09:00 до 19:00, Пн выходной',
    scheduleKz: 'Сей-Жек 09:00-ден 19:00-ге дейін, Дүй демалыс',
    isActive: true
  },
  {
    id: 'store-almaty-012',
    slug: 'adem',
    nameRu: 'ТД Адем',
    nameKz: 'Әдем СҮ',
    districtRu: 'Жетысуский',
    districtKz: 'Жетісу',
    addressRu: 'ул. Северное Кольцо, 3, павильон 1',
    addressKz: 'Северное Кольцо к-сі, 3, 1 павильон',
    latitude: 43.2978,
    longitude: 76.9080,
    phone: '+7 (727) 251-50-12',
    scheduleRu: 'Вт-Вс с 09:00 до 18:00, Пн выходной',
    scheduleKz: 'Сей-Жек 09:00-ден 18:00-ге дейін, Дүй демалыс',
    isActive: true
  },
  {
    id: 'store-almaty-013',
    slug: 'silk-way-city',
    nameRu: 'ТК Silk Way City',
    nameKz: 'Silk Way City СОК',
    districtRu: 'Алмалинский',
    districtKz: 'Алмалы',
    addressRu: 'ул. Толе би, 71, уг. ул. Наурызбай батыра',
    addressKz: 'Төле би к-сі, 71, Наурызбай батыр к-сі қиылысы',
    latitude: 43.2552,
    longitude: 76.9360,
    phone: '+7 (727) 267-20-13',
    scheduleRu: 'Ежедневно с 10:00 до 21:00',
    scheduleKz: 'Күн сайын 10:00-ден 21:00-ге дейін',
    isActive: true
  },
  {
    id: 'store-almaty-014',
    slug: 'mart-village',
    nameRu: 'ТРЦ MART Village',
    nameKz: 'MART Village СОСО',
    districtRu: 'Турксибский',
    districtKz: 'Түрксіб',
    addressRu: 'ул. Рихарда Зорге, 18/1, 2 этаж',
    addressKz: 'Рихард Зорге к-сі, 18/1, 2-қабат',
    latitude: 43.3411,
    longitude: 76.9535,
    phone: '+7 (727) 343-50-14',
    scheduleRu: 'Ежедневно с 10:00 до 22:00',
    scheduleKz: 'Күн сайын 10:00-ден 22:00-ге дейін',
    isActive: true
  },
  {
    id: 'store-almaty-015',
    slug: 'tastak',
    nameRu: 'ТД Тастак',
    nameKz: 'Тастақ СҮ',
    districtRu: 'Алмалинский',
    districtKz: 'Алмалы',
    addressRu: 'ул. Толе би, 249',
    addressKz: 'Төле би к-сі, 249',
    latitude: 43.2514,
    longitude: 76.8770,
    phone: '+7 (727) 241-10-15',
    scheduleRu: 'Ежедневно с 09:00 до 20:00',
    scheduleKz: 'Күн сайын 09:00-ден 20:00-ге дейін',
    isActive: true
  },
  {
    id: 'store-almaty-016',
    slug: 'city-plus',
    nameRu: 'ТЦ City Plus',
    nameKz: 'City Plus СО',
    districtRu: 'Ауэзовский',
    districtKz: 'Әуезов',
    addressRu: 'пр. Толе би, 285',
    addressKz: 'Төле би д-лы, 285',
    latitude: 43.2490,
    longitude: 76.8580,
    phone: '+7 (727) 321-40-16',
    scheduleRu: 'Ежедневно с 10:00 до 21:00',
    scheduleKz: 'Күн сайын 10:00-ден 21:00-ге дейін',
    isActive: true
  }
];

export const SEED_CATEGORIES = [
  { id: 'cat-01', nameRu: 'Футболки', nameKz: 'Футболкалар', slug: 't-shirts', sortOrder: 1, isActive: true },
  { id: 'cat-02', nameRu: 'Лонгсливы', nameKz: 'Лонгсливтер', slug: 'long-sleeves', sortOrder: 2, isActive: true },
  { id: 'cat-03', nameRu: 'Халаты', nameKz: 'Шапандар', slug: 'robes', sortOrder: 3, isActive: true },
  { id: 'cat-04', nameRu: 'Пижамы', nameKz: 'Пижамалар', slug: 'pajamas', sortOrder: 4, isActive: true },
  { id: 'cat-05', nameRu: 'Термобелье', nameKz: 'Термоішкиім', slug: 'thermal-underwear', sortOrder: 5, isActive: true },
  { id: 'cat-06', nameRu: 'Детская одежда', nameKz: 'Балалар киімі', slug: 'kids-clothing', sortOrder: 6, isActive: true },
  { id: 'cat-07', nameRu: 'Домашний текстиль', nameKz: 'Үй тоқымасы', slug: 'home-textiles', sortOrder: 7, isActive: true }
];

export const SEED_PRODUCTS = [
  {
    id: 'prod-001',
    categoryId: 'cat-01',
    nameRu: 'Футболка базовая хлопковая премиум',
    nameKz: 'Премиум мақта базалық футболкасы',
    slug: 'futbolka-bazovaya-hlopkovaya-premium',
    descriptionRu: 'Классическая базовая футболка из 100% индийского хлопка плотностью 180 г/м². Идеальна для повседневного гардероба.',
    descriptionKz: '180 г/м² тығыздықтағы 100% үнді мақтасынан жасалған классикалық базалық футболка. Күнделікті киюге өте қолайлы.',
    materialRu: '100% индийский хлопок',
    materialKz: '100% үнді мақтасы',
    season: 'all_season',
    gender: 'unisex',
    basePriceKzt: 4990,
    isPublished: true,
    isFeatured: true,
    tags: ['базовая', 'хлопок', 'индия', 'оверсайз', 'премиум']
  },
  {
    id: 'prod-002',
    categoryId: 'cat-02',
    nameRu: 'Лонгслив трикотажный в рубчик',
    nameKz: 'Қабырғалы трикотаж лонгсливі',
    slug: 'longsliv-trikotazhnyj-v-rubchik',
    descriptionRu: 'Стильный лонгслив из мягкого индийского трикотажа с круглым вырезом.',
    descriptionKz: 'Жұмсақ үнді трикотажынан жасалған дөңгелек мойынды стильді лонгслив.',
    materialRu: '95% хлопок, 5% эластан',
    materialKz: '95% мақта, 5% эластан',
    season: 'demi_season',
    gender: 'women',
    basePriceKzt: 6990,
    isPublished: true,
    isFeatured: false,
    tags: ['рубчик', 'трикотаж', 'осень', 'комфорт']
  },
  {
    id: 'prod-003',
    categoryId: 'cat-03',
    nameRu: 'Халат махровый уютный банный',
    nameKz: 'Жайлы түкті монша шапаны',
    slug: 'halat-mahrovyj-uyutnyj-bannyj',
    descriptionRu: 'Мягкий банный халат из натуральной махры высочайшего качества. Высокая впитываемость.',
    descriptionKz: 'Ең жоғары сапалы табиғи түктен жасалған жұмсақ монша шапаны. Ылғалды жақсы сіңіреді.',
    materialRu: '100% хлопок махра',
    materialKz: '100% түкті мақта',
    season: 'all_season',
    gender: 'unisex',
    basePriceKzt: 14990,
    isPublished: true,
    isFeatured: true,
    tags: ['халат', 'махра', 'дом', 'ванная']
  },
  {
    id: 'prod-004',
    categoryId: 'cat-04',
    nameRu: 'Пижамный комплект хлопковый с шортами',
    nameKz: 'Шорты бар мақта пижама жиынтығы',
    slug: 'pizhamnyj-komplekt-hlopkovyj',
    descriptionRu: 'Легкий и дышащий домашний комплект для комфортного сна.',
    descriptionKz: 'Ыңғайлы ұйқыға арналған жеңіл әрі ауа өткізетін үй жиынтығы.',
    materialRu: '100% хлопок',
    materialKz: '100% мақта',
    season: 'summer',
    gender: 'women',
    basePriceKzt: 8990,
    isPublished: true,
    isFeatured: false,
    tags: ['пижама', 'сон', 'лето', 'хлопок']
  },
  {
    id: 'prod-005',
    categoryId: 'cat-05',
    nameRu: 'Термобелье зимнее двухслойное Active Warm',
    nameKz: 'Қысқы екі қабатты Active Warm термоішкиімі',
    slug: 'termobele-zimnee-dvuhslojnoe-active-warm',
    descriptionRu: 'Согревающий комплект термобелья для суровых зимних температур до -30°C.',
    descriptionKz: '-30°C дейінгі қатал қысқы ауа-райына арналған жылытатын термоішкиім жиынтығы.',
    materialRu: '70% хлопок, 20% шерсть, 10% эластан',
    materialKz: '70% мақта, 20% жүн, 10% эластан',
    season: 'winter',
    gender: 'men',
    basePriceKzt: 12990,
    isPublished: true,
    isFeatured: true,
    tags: ['термобелье', 'зима', 'тепло', 'спорт']
  }
];

export const SEED_VARIANTS = [
  // prod-001 (T-shirt)
  { id: 'var-001-w-s', productId: 'prod-001', sku: 'IT-TSH-WHT-S', barcode: '4600000100011', size: 'S', colorRu: 'Белый', colorKz: 'Ақ', colorHex: '#FFFFFF', priceKzt: 4990, isActive: true },
  { id: 'var-001-w-m', productId: 'prod-001', sku: 'IT-TSH-WHT-M', barcode: '4600000100012', size: 'M', colorRu: 'Белый', colorKz: 'Ақ', colorHex: '#FFFFFF', priceKzt: 4990, isActive: true },
  { id: 'var-001-w-l', productId: 'prod-001', sku: 'IT-TSH-WHT-L', barcode: '4600000100013', size: 'L', colorRu: 'Белый', colorKz: 'Ақ', colorHex: '#FFFFFF', priceKzt: 4990, isActive: true },
  { id: 'var-001-b-m', productId: 'prod-001', sku: 'IT-TSH-BLK-M', barcode: '4600000100022', size: 'M', colorRu: 'Черный', colorKz: 'Қара', colorHex: '#000000', priceKzt: 4990, isActive: true },
  { id: 'var-001-b-l', productId: 'prod-001', sku: 'IT-TSH-BLK-L', barcode: '4600000100023', size: 'L', colorRu: 'Черный', colorKz: 'Қара', colorHex: '#000000', priceKzt: 4990, isActive: true },

  // prod-002 (Longsleeve)
  { id: 'var-002-bg-s', productId: 'prod-002', sku: 'IT-LNG-BEI-S', barcode: '4600000200011', size: 'S', colorRu: 'Бежевый', colorKz: 'Сарғыш', colorHex: '#D4C4B5', priceKzt: 6990, isActive: true },
  { id: 'var-002-bg-m', productId: 'prod-002', sku: 'IT-LNG-BEI-M', barcode: '4600000200012', size: 'M', colorRu: 'Бежевый', colorKz: 'Сарғыш', colorHex: '#D4C4B5', priceKzt: 6990, isActive: true },

  // prod-003 (Robe)
  { id: 'var-003-bl-l', productId: 'prod-003', sku: 'IT-ROB-BLU-L', barcode: '4600000300013', size: 'L', colorRu: 'Синий', colorKz: 'Көк', colorHex: '#1E3A8A', priceKzt: 14990, isActive: true },
  { id: 'var-003-bl-xl', productId: 'prod-003', sku: 'IT-ROB-BLU-XL', barcode: '4600000300014', size: 'XL', colorRu: 'Синий', colorKz: 'Көк', colorHex: '#1E3A8A', priceKzt: 14990, isActive: true },

  // prod-004 (Pajamas)
  { id: 'var-004-pk-s', productId: 'prod-004', sku: 'IT-PAJ-PNK-S', barcode: '4600000400011', size: 'S', colorRu: 'Розовый', colorKz: 'Қызғылт', colorHex: '#F472B6', priceKzt: 8990, isActive: true },
  { id: 'var-004-pk-m', productId: 'prod-004', sku: 'IT-PAJ-PNK-M', barcode: '4600000400012', size: 'M', colorRu: 'Розовый', colorKz: 'Қызғылт', colorHex: '#F472B6', priceKzt: 8990, isActive: true },

  // prod-005 (Thermal)
  { id: 'var-005-gr-m', productId: 'prod-005', sku: 'IT-TRM-GRY-M', barcode: '4600000500012', size: 'M', colorRu: 'Серый', colorKz: 'Сұр', colorHex: '#4B5563', priceKzt: 12990, isActive: true },
  { id: 'var-005-gr-l', productId: 'prod-005', sku: 'IT-TRM-GRY-L', barcode: '4600000500013', size: 'L', colorRu: 'Серый', colorKz: 'Сұр', colorHex: '#4B5563', priceKzt: 12990, isActive: true }
];

export const SEED_INVENTORIES = [
  // Mega Alma-Ata (store-almaty-001)
  { storeId: 'store-almaty-001', variantId: 'var-001-w-m', quantity: 15, reservedQuantity: 2 },
  { storeId: 'store-almaty-001', variantId: 'var-001-w-l', quantity: 8, reservedQuantity: 0 },
  { storeId: 'store-almaty-001', variantId: 'var-001-w-s', quantity: 5, reservedQuantity: 0 },
  { storeId: 'store-almaty-001', variantId: 'var-001-b-m', quantity: 10, reservedQuantity: 0 },
  { storeId: 'store-almaty-001', variantId: 'var-001-b-l', quantity: 7, reservedQuantity: 0 },
  { storeId: 'store-almaty-001', variantId: 'var-002-bg-s', quantity: 6, reservedQuantity: 0 },
  { storeId: 'store-almaty-001', variantId: 'var-002-bg-m', quantity: 9, reservedQuantity: 0 },
  { storeId: 'store-almaty-001', variantId: 'var-003-bl-l', quantity: 5, reservedQuantity: 1 },
  { storeId: 'store-almaty-001', variantId: 'var-003-bl-xl', quantity: 4, reservedQuantity: 0 },
  { storeId: 'store-almaty-001', variantId: 'var-004-pk-s', quantity: 6, reservedQuantity: 0 },
  { storeId: 'store-almaty-001', variantId: 'var-004-pk-m', quantity: 8, reservedQuantity: 0 },
  { storeId: 'store-almaty-001', variantId: 'var-005-gr-m', quantity: 12, reservedQuantity: 0 },
  { storeId: 'store-almaty-001', variantId: 'var-005-gr-l', quantity: 10, reservedQuantity: 0 },

  // Dostyk Plaza (store-almaty-002)
  { storeId: 'store-almaty-002', variantId: 'var-001-w-m', quantity: 10, reservedQuantity: 0 },
  { storeId: 'store-almaty-002', variantId: 'var-001-w-l', quantity: 5, reservedQuantity: 0 },
  { storeId: 'store-almaty-002', variantId: 'var-003-bl-l', quantity: 2, reservedQuantity: 1 },

  // Grand Park (store-almaty-003)
  { storeId: 'store-almaty-003', variantId: 'var-001-w-m', quantity: 4, reservedQuantity: 0 },
  { storeId: 'store-almaty-003', variantId: 'var-003-bl-l', quantity: 0, reservedQuantity: 0 }
];
