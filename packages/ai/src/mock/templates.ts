export interface CategoryTemplate {
  slug: string;
  canonicalRu: string;
  canonicalKz: string;
  subcategories: string[];
  materials: string[];
  defaultColors: string[];
  season: 'all-season' | 'summer' | 'winter' | 'demi-season';
  gender: 'unisex' | 'men' | 'women' | 'kids';
  suggestedPricesKzt: number[];
  tags: string[];
  titleGeneratorRu: (subcat: string, color: string) => string;
  titleGeneratorKz: (subcat: string, color: string) => string;
  descRu: string;
  descKz: string;
}

export const CATEGORY_TEMPLATES: Record<string, CategoryTemplate> = {
  't-shirts': {
    slug: 't-shirts',
    canonicalRu: 'Футболки',
    canonicalKz: 'Футболкалар',
    subcategories: ['Базовые', 'Оверсайз', 'С принтом', 'Поло'],
    materials: ['100% хлопок', '100% индийский хлопок пенье (180 г/м²)'],
    defaultColors: ['Белый', 'Черный', 'Темно-синий', 'Бежевый'],
    season: 'all-season',
    gender: 'unisex',
    suggestedPricesKzt: [4990, 5490, 5990, 6490],
    tags: ['трикотаж', 'хлопок', 'индия', 'базовая', 'мақта', 'футболка'],
    titleGeneratorRu: (sub, col) => `Футболка ${sub.toLowerCase()} ${col.toLowerCase()} Индийский Трикотаж`,
    titleGeneratorKz: (sub, col) => `Үнді трикотажы ${col.toLowerCase()} ${sub.toLowerCase()} футболкасы`,
    descRu: 'Мягкий премиальный индийский трикотаж из натурального 100% хлопка. Отлично сохраняет форму и дарит непревзойденный комфорт.',
    descKz: '100% табиғи мақтадан жасалған жұмсақ премиум үнді трикотажы. Пішінін сақтайды және керемет жайлылық береді.',
  },
  'long-sleeves': {
    slug: 'long-sleeves',
    canonicalRu: 'Лонгсливы',
    canonicalKz: 'Лонгсливтер',
    subcategories: ['Классические', 'Свободный крой', 'В полоску'],
    materials: ['100% хлопок', '100% индийский хлопок (210 г/м²)'],
    defaultColors: ['Серый меланж', 'Черный', 'Темно-синий', 'Хаки'],
    season: 'all-season',
    gender: 'unisex',
    suggestedPricesKzt: [5990, 6490, 6990],
    tags: ['трикотаж', 'лонгслив', 'хлопок', 'индия', 'ұзын жең', 'мақта'],
    titleGeneratorRu: (sub, col) => `Лонгслив ${sub.toLowerCase()} ${col.toLowerCase()} Индийский Трикотаж`,
    titleGeneratorKz: (sub, col) => `Үнді трикотажы ${col.toLowerCase()} лонгсливі`,
    descRu: 'Универсальный лонгслив из плотного 100% индийского хлопка. Идеален для многослойных образов и прохладной погоды.',
    descKz: 'Тығыз 100% үнді мақтасынан жасалған әмбебап лонгслив. Салқын күндерге өте қолайлы.',
  },
  'robes': {
    slug: 'robes',
    canonicalRu: 'Халаты',
    canonicalKz: 'Шапандар',
    subcategories: ['Вафельные', 'Махровые', 'Кимоно'],
    materials: ['100% хлопок', '100% индийский хлопок (вафля 240 г/м²)'],
    defaultColors: ['Белый', 'Бежевый', 'Мятный', 'Серый'],
    season: 'all-season',
    gender: 'unisex',
    suggestedPricesKzt: [9990, 11990, 14990],
    tags: ['трикотаж', 'халат', 'шапан', 'хлопок', 'индия', 'үй', 'мақта'],
    titleGeneratorRu: (sub, col) => `Халаты ${sub.toLowerCase()} ${col.toLowerCase()} Индийский Трикотаж`,
    titleGeneratorKz: (sub, col) => `Үнді трикотажы ${col.toLowerCase()} ${sub.toLowerCase()} шапаны`,
    descRu: 'Уютный домашний халат из 100% натурального индийского хлопка. Быстро впитывает влагу и создает атмосферу домашнего спа.',
    descKz: '100% табиғи үнді мақтасынан жасалған жайлы үй шапаны. Ылғалды жақсы сіңіреді және демалыс сыйлайды.',
  },
  'pajamas': {
    slug: 'pajamas',
    canonicalRu: 'Пижамы',
    canonicalKz: 'Пижамалар',
    subcategories: ['Комплекты', 'Шорты и топ', 'Брючные'],
    materials: ['100% хлопок', '100% дышащий индийский хлопок'],
    defaultColors: ['Голубой', 'Лавандовый', 'Пудровый', 'Белый'],
    season: 'all-season',
    gender: 'women',
    suggestedPricesKzt: [7990, 8990, 9990],
    tags: ['трикотаж', 'пижама', 'сон', 'хлопок', 'мақта', 'индия'],
    titleGeneratorRu: (sub, col) => `Пижама ${sub.toLowerCase()} ${col.toLowerCase()} Индийский Трикотаж`,
    titleGeneratorKz: (sub, col) => `Үнді трикотажы ${col.toLowerCase()} пижама жиынтығы`,
    descRu: 'Дышащий пижамный комплект из шелковистого 100% индийского хлопка. Дарит максимальное расслабление и здоровый сон.',
    descKz: 'Жібектей 100% үнді мақтасынан жасалған дем алатын пижама жиынтығы. Ұйқы кезінде жайлылық пен тыныштық сыйлайды.',
  },
  'thermal-underwear': {
    slug: 'thermal-underwear',
    canonicalRu: 'Термобелье',
    canonicalKz: 'Термоішкиім',
    subcategories: ['Зимний комплект', 'Футболка термо', 'Кальсоны'],
    materials: ['100% хлопок', '95% хлопок, 5% эластан'],
    defaultColors: ['Черный', 'Антрацит', 'Темно-серый'],
    season: 'winter',
    gender: 'unisex',
    suggestedPricesKzt: [8990, 9990, 11990],
    tags: ['трикотаж', 'термобелье', 'термоішкиім', 'зима', 'жылы', 'хлопок'],
    titleGeneratorRu: (sub, col) => `Термобелье ${sub.toLowerCase()} ${col.toLowerCase()} Индийский Трикотаж`,
    titleGeneratorKz: (sub, col) => `Үнді трикотажы ${col.toLowerCase()} термоішкиімі`,
    descRu: 'Согревающий комплект термобелья из 100% индийского хлопка с мягким внутренним начесом. Надежная защита в холодную погоду.',
    descKz: 'Ішкі жұмсақ түгі бар 100% үнді мақтасынан жасалған жылытатын термоішкиім жиынтығы. Суықтан сенімді қорғайды.',
  },
  'kids-clothing': {
    slug: 'kids-clothing',
    canonicalRu: 'Детская одежда',
    canonicalKz: 'Балалар киімі',
    subcategories: ['Костюмы', 'Футболки детские', 'Боди'],
    materials: ['100% хлопок', '100% органический хлопок'],
    defaultColors: ['Желтый', 'Мятный', 'Голубой', 'Розовый'],
    season: 'all-season',
    gender: 'kids',
    suggestedPricesKzt: [3490, 3990, 4490],
    tags: ['трикотаж', 'детская одежда', 'балалар киімі', 'бала', 'хлопок', 'мақта'],
    titleGeneratorRu: (sub, col) => `Детская одежда ${sub.toLowerCase()} ${col.toLowerCase()} Индийский Трикотаж`,
    titleGeneratorKz: (sub, col) => `Үнді трикотажы ${col.toLowerCase()} балалар киімі`,
    descRu: 'Гипоаллергенный детский комплект из чистейшего 100% индийского хлопка. Безопасные швы и забота о нежной детской коже.',
    descKz: 'Таза 100% үнді мақтасынан жасалған гипоаллергенді балалар киімі. Нәзік теріге арналған жұмсақ әрі қауіпсіз тігістер.',
  },
  'home-textiles': {
    slug: 'home-textiles',
    canonicalRu: 'Домашний текстиль',
    canonicalKz: 'Үй тоқымасы',
    subcategories: ['Полотенца', 'Простыни', 'Пледы'],
    materials: ['100% хлопок', '100% индийский хлопок (махра 550 г/м²)'],
    defaultColors: ['Белый', 'Изумрудный', 'Коричневый', 'Бежевый'],
    season: 'all-season',
    gender: 'unisex',
    suggestedPricesKzt: [3990, 4990, 6990],
    tags: ['текстиль', 'полотенце', 'сүлгі', 'үй тоқымасы', 'хлопок', 'мақта', 'индия'],
    titleGeneratorRu: (sub, col) => `Домашний текстиль ${sub.toLowerCase()} ${col.toLowerCase()} Индийский Трикотаж`,
    titleGeneratorKz: (sub, col) => `Үнді трикотажы ${col.toLowerCase()} үй тоқымасы`,
    descRu: 'Махровый домашний текстиль высшего качества из отборного 100% индийского хлопка. Идеальная плотность и мягкость.',
    descKz: 'Таңдаулы 100% үнді мақтасынан жасалған жоғары сапалы түкті үй тоқымасы. Жоғары тығыздық пен ерекше жұмсақтық.',
  },
};
