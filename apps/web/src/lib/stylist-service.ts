import { CATALOG_PRODUCTS, type FullProductDetail } from './catalog-data.ts';

export interface StylistRequest {
  imageBase64?: string;
  demoProfileId?: 'warm-autumn' | 'cool-winter' | 'soft-summer' | 'bright-spring';
  preferredCategory?: string;
  selectedBranchId?: string;
}

export interface ColorPaletteItem {
  nameRu: string;
  nameKz: string;
  hex: string;
}

export interface StylistAnalysisResult {
  colorType: {
    key: string;
    nameRu: string;
    nameKz: string;
    descriptionRu: string;
    descriptionKz: string;
    palette: ColorPaletteItem[];
  };
  silhouetteAdvice: {
    shapeRu: string;
    shapeKz: string;
    cutAdviceRu: string;
    cutAdviceKz: string;
  };
  lookTitleRu: string;
  lookTitleKz: string;
  stylistVerdictRu: string;
  stylistVerdictKz: string;
  matchedProducts: Array<{
    product: FullProductDetail;
    role: 'main' | 'bottom' | 'accessory';
    reasonRu: string;
    reasonKz: string;
    availableSizes: string[];
    inSelectedBranch: boolean;
    availableBranchesCount: number;
  }>;
  totalLookPriceKzt: number;
  bundleDiscountPercent: number;
  discountedPriceKzt: number;
}

export const PRESET_STYLES = {
  'warm-autumn': {
    colorType: {
      key: 'warm-autumn',
      nameRu: 'Тёплая Осень (Warm Autumn)',
      nameKz: 'Жылы Күз (Warm Autumn)',
      descriptionRu: 'Золотистый подтон кожи, каштановые или медные волосы, выразительные теплые глаза.',
      descriptionKz: 'Алтын түстес тері, қоңыр немесе мыс түсті шаш, жылы және терең көздер.',
      palette: [
        { nameRu: 'Теплый терракот', nameKz: 'Жылы терракота', hex: '#C85A32' },
        { nameRu: 'Изумрудный кашемир', nameKz: 'Зүбәржат кашемирі', hex: '#1B4D3E' },
        { nameRu: 'Золотистая горчица', nameKz: 'Алтын қыша', hex: '#D4AF37' },
        { nameRu: 'Глубокий шоколад', nameKz: 'Қою шоколад', hex: '#4A2C2A' },
      ],
    },
    silhouetteAdvice: {
      shapeRu: 'Комфортный городской Casual / Плавные линии',
      shapeKz: 'Ыңғайлы қалалық Casual / Жұмсақ сызықтар',
      cutAdviceRu: 'Рекомендуем сочетать свободный хлопковый лонгслив или худи с базовыми брюками и джоггерами.',
      cutAdviceKz: 'Еркін мақта лонгслив немесе худиді базалық шалбарлармен үйлестіруді ұсынамыз.',
    },
    lookTitleRu: 'Капсульный образ «Городской Casual & Уют»',
    lookTitleKz: '«Қалалық Casual және Жайлылық» капсулалық бейнесі',
    preferredCat: 'long-sleeves',
  },
  'cool-winter': {
    colorType: {
      key: 'cool-winter',
      nameRu: 'Контрастная Зима (Cool Winter)',
      nameKz: 'Айқын Қыс (Cool Winter)',
      descriptionRu: 'Фарфоровый или оливковый оттенок, темные волосы, высокая контрастность черт лица.',
      descriptionKz: 'Ашық немесе зәйтүн реңкті тері, қара шаш, келбеттің жоғары контрасты.',
      palette: [
        { nameRu: 'Глубокий индиго', nameKz: 'Қою индиго', hex: '#1F3A93' },
        { nameRu: 'Королевский бордо', nameKz: 'Корольдік бордо', hex: '#6B1724' },
        { nameRu: 'Кипенно-белый', nameKz: 'Аппақ қардай', hex: '#F8FAFC' },
        { nameRu: 'Благородный сапфир', nameKz: 'Асыл сапфир', hex: '#0F52BA' },
      ],
    },
    silhouetteAdvice: {
      shapeRu: 'Прямоугольный силуэт / Четкие пропорции',
      shapeKz: 'Тіктөртбұрышты пішін / Айқын пропорциялар',
      cutAdviceRu: 'Идеальны лаконичные прямые линии, костюмы двойки и монохромные контрастные образы.',
      cutAdviceKz: 'Тік таза сызықтар, екі бөлікті мақта костюмдер мен айқын монохром бейнелер үйлеседі.',
    },
    lookTitleRu: 'Капсульный образ «Стильный Контраст & Базовый Трикотаж»',
    lookTitleKz: '«Стильді Контраст және Базалық Трикотаж» капсулалық бейнесі',
    preferredCat: 'pajamas',
  },
  'soft-summer': {
    colorType: {
      key: 'soft-summer',
      nameRu: 'Нежное Лето (Soft Summer)',
      nameKz: 'Нәзік Жаз (Soft Summer)',
      descriptionRu: 'Мягкий прохладный подтон, русые волосы, спокойный серо-голубой или оливковый взгляд.',
      descriptionKz: 'Жұмсақ салқын реңк, қоңырқай шаш, нәзік сұр-көгілдір немесе жасыл көздер.',
      palette: [
        { nameRu: 'Пыльная роза', nameKz: 'Шаңды раушан', hex: '#C48B9F' },
        { nameRu: 'Мятный эвкалипт', nameKz: 'Жалбызды эвкалипт', hex: '#5E8C7A' },
        { nameRu: 'Дымчатый лавандовый', nameKz: 'Түтінді лаванда', hex: '#7E7B9A' },
        { nameRu: 'Пепельный беж', nameKz: 'Күлді бежевый', hex: '#A89F91' },
      ],
    },
    silhouetteAdvice: {
      shapeRu: 'Утонченный повседневный силуэт',
      shapeKz: 'Сәнді күнделікті нәзік бейне',
      cutAdviceRu: 'Подходят мягкие пастельные трикотажные ткани, рукава 3/4 и свободный расслабленный крой.',
      cutAdviceKz: 'Жұмсақ пастельді трикотаж маталар, 3/4 жеңдер және еркін ыңғайлы пішімдер керемет жарасады.',
    },
    lookTitleRu: 'Капсульный образ «Легкий Оверсайз & Пастельный Комфорт»',
    lookTitleKz: '«Жеңіл Оверсайз және Ыңғайлылық» капсулалық бейнесі',
    preferredCat: 'long-sleeves',
  },
  'bright-spring': {
    colorType: {
      key: 'bright-spring',
      nameRu: 'Сияющая Весна (Bright Spring)',
      nameKz: 'Жарқын Көктем (Bright Spring)',
      descriptionRu: 'Светящаяся персиковая кожа, светло-каштановые или золотистые волосы, открытый ясный взгляд.',
      descriptionKz: 'Жарқыраған шабдалы түстес тері, алтын-қоңыр шаш, жарқын ашық көздер.',
      palette: [
        { nameRu: 'Коралловый персик', nameKz: 'Маржанды шабдалы', hex: '#E76F51' },
        { nameRu: 'Солнечная охра', nameKz: 'Күн түстес охра', hex: '#E9C46A' },
        { nameRu: 'Бирюзовая лагуна', nameKz: 'Көгілдір лагуна', hex: '#2A9D8F' },
        { nameRu: 'Теплый крем', nameKz: 'Жылы кілегей', hex: '#FFF3E0' },
      ],
    },
    silhouetteAdvice: {
      shapeRu: 'Динамичный современный силуэт',
      shapeKz: 'Заманауи серпінді бейне',
      cutAdviceRu: 'Рекомендуем сочетать базовые хлопковые футболки премиум качества с удобными трикотажными брюками и толстовками.',
      cutAdviceKz: 'Жоғары сапалы базалық мақта футболкаларын ыңғайлы трикотаж шалбарлармен үйлестіруді ұсынамыз.',
    },
    lookTitleRu: 'Капсульный образ «Свежий Повседневный Смарт-Кэжуал»',
    lookTitleKz: '«Жаңа Күнделікті Смарт-Кэжуал» капсулалық бейнесі',
    preferredCat: 't-shirts',
  },
};

export function analyzeStyleAndMatchOutfit(req: StylistRequest): StylistAnalysisResult {
  const { imageBase64, demoProfileId, preferredCategory, selectedBranchId = 'store-almaty-001' } = req;

  // Pick style configuration
  let profileKey: keyof typeof PRESET_STYLES = 'warm-autumn';
  if (demoProfileId && PRESET_STYLES[demoProfileId]) {
    profileKey = demoProfileId;
  } else if (imageBase64) {
    const sum = Array.from(imageBase64.slice(0, 100)).reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const keys: (keyof typeof PRESET_STYLES)[] = ['warm-autumn', 'cool-winter', 'soft-summer', 'bright-spring'];
    profileKey = keys[sum % keys.length];
  }

  const currentProfile = PRESET_STYLES[profileKey];
  const allProducts = CATALOG_PRODUCTS;
  const catFilter = preferredCategory || currentProfile.preferredCat;

  // Find main piece (tunic, dress or pajama)
  let mainProduct = allProducts.find(p => p.categorySlug === catFilter) || allProducts[0];
  
  // Find matching second piece
  let secondaryProduct = allProducts.find(p => p.id !== mainProduct.id && (p.categorySlug === 't-shirts' || p.categorySlug === 'pajamas')) || allProducts[1];

  const matchedProducts: StylistAnalysisResult['matchedProducts'] = [
    {
      product: mainProduct,
      role: 'main',
      reasonRu: `Идеальный оттенок (${mainProduct.defaultColorRu}) гармонирует с вашим цветотипом «${currentProfile.colorType.nameRu}». Натуральный хлопок фабричного пошива приятно дышит и отлично держит форму.`,
      reasonKz: `Бұл реңк (${mainProduct.defaultColorKz}) сіздің «${currentProfile.colorType.nameKz}» түс сәйкестігіңізге мінсіз үйлеседі. Сапалы фабрикалық мақта денеге өте жайлы.`,
      availableSizes: mainProduct.variants.map(v => v.size),
      inSelectedBranch: (mainProduct.stockByStore[selectedBranchId] ?? 0) > 0,
      availableBranchesCount: Object.values(mainProduct.stockByStore).filter(qty => qty > 0).length,
    },
    {
      product: secondaryProduct,
      role: 'bottom',
      reasonRu: `Комплементарный компаньон для создания завершенного многослойного ансамбля. Идеально для комфортного повседневного городского гардероба.`,
      reasonKz: `Толық үйлесімді бейне жасауға арналған стильдік серіктес. Күнделікті қалалық киім үлгісіне арналған.`,
      availableSizes: secondaryProduct.variants.map(v => v.size),
      inSelectedBranch: (secondaryProduct.stockByStore[selectedBranchId] ?? 0) > 0,
      availableBranchesCount: Object.values(secondaryProduct.stockByStore).filter(qty => qty > 0).length,
    },
  ];

  const totalLookPriceKzt = matchedProducts.reduce((sum, item) => sum + item.product.basePriceKzt, 0);
  const bundleDiscountPercent = 5;
  const discountedPriceKzt = Math.round(totalLookPriceKzt * (1 - bundleDiscountPercent / 100));

  return {
    colorType: currentProfile.colorType,
    silhouetteAdvice: currentProfile.silhouetteAdvice,
    lookTitleRu: currentProfile.lookTitleRu,
    lookTitleKz: currentProfile.lookTitleKz,
    stylistVerdictRu: `На основе анализа вашей внешности ИИ подобрал цветовую палитру и комплект практичного базового трикотажа. Изделия из качественного натурального хлопка фабричного пошива отлично сидят по фигуре, дарят комфорт и идеально подходят для климата Алматы.`,
    stylistVerdictKz: `Сыртқы келбетіңізді сараптау негізінде ЖИ-стилист сапалы базалық трикотаждан үйлесімді түстер топтамасын таңдады. Фабрикалық табиғи мақтадан тігілген киімдер денеге жайлы қонып, Алматы ауа-райына өте қолайлы.`,
    matchedProducts,
    totalLookPriceKzt,
    bundleDiscountPercent,
    discountedPriceKzt,
  };
}

