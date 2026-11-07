export const geminiProductExtractionSchema = {
  type: 'object',
  properties: {
    name_ru: {
      type: 'string',
      description: 'Commercial product title in Russian, including "Индийский Трикотаж"',
    },
    name_kz: {
      type: 'string',
      description: 'Commercial product title in Kazakh, including "Үнді трикотажы"',
    },
    description_ru: {
      type: 'string',
      description: 'Detailed marketing description in Russian emphasizing 100% хлопок',
    },
    description_kz: {
      type: 'string',
      description: 'Detailed marketing description in Kazakh emphasizing 100% мақта',
    },
    category: {
      type: 'string',
      enum: [
        'Футболки',
        'Лонгсливы',
        'Халаты',
        'Пижамы',
        'Термобелье',
        'Детская одежда',
        'Домашний текстиль',
        't-shirts',
        'long-sleeves',
        'robes',
        'pajamas',
        'thermal-underwear',
        'kids-clothing',
        'home-textiles',
      ],
      description: 'Primary marketplace apparel category',
    },
    subcategory: {
      type: 'string',
      description: 'Apparel subcategory (e.g. Базовые, Оверсайз, Вафельные)',
    },
    colors: {
      type: 'array',
      items: { type: 'string' },
      description: 'Array of detected color names in Russian',
    },
    material: {
      type: 'string',
      description: 'Fabric composition (e.g. 100% хлопок)',
    },
    season: {
      type: 'string',
      enum: ['all-season', 'summer', 'winter', 'demi-season'],
      description: 'Seasonality of the garment',
    },
    gender: {
      type: 'string',
      enum: ['unisex', 'men', 'women', 'kids'],
      description: 'Target gender',
    },
    tags: {
      type: 'array',
      items: { type: 'string' },
      description: 'Search tags in Russian and Kazakh',
    },
    suggestedPriceKzt: {
      type: 'integer',
      description: 'Suggested retail price in whole Kazakhstani Tenge (KZT)',
    },
  },
  required: [
    'name_ru',
    'name_kz',
    'description_ru',
    'description_kz',
    'category',
    'subcategory',
    'colors',
    'material',
    'season',
    'gender',
    'tags',
    'suggestedPriceKzt',
  ],
};
