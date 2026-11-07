export interface MvpCategorySeed {
  slug: string;
  nameRu: string;
  nameKz: string;
  descriptionRu: string;
  descriptionKz: string;
  displayOrder: number;
}

export const MVP_CATEGORIES_SEED: readonly MvpCategorySeed[] = [
  {
    slug: 't-shirts',
    nameRu: 'Футболки',
    nameKz: 'Футболкалар',
    descriptionRu: 'Базовые и принтованные футболки из 100% индийского хлопка',
    descriptionKz: '100% үнді мақтасынан жасалған негізгі және принтті футболкалар',
    displayOrder: 1,
  },
  {
    slug: 'long-sleeves',
    nameRu: 'Лонгсливы',
    nameKz: 'Лонгсливтер',
    descriptionRu: 'Удобные кофты с длинным рукавом для повседневной носки',
    descriptionKz: 'Күнделікті киюге арналған ұзын жеңді ыңғайлы жейделер',
    displayOrder: 2,
  },
  {
    slug: 'robes',
    nameRu: 'Халаты',
    nameKz: 'Шапандар',
    descriptionRu: 'Уютные хлопковые и вафельные домашние халаты',
    descriptionKz: 'Жайлы мақта және вафли үй шапандары',
    displayOrder: 3,
  },
  {
    slug: 'pajamas',
    nameRu: 'Пижамы',
    nameKz: 'Пижамалар',
    descriptionRu: 'Дышащие хлопковые пижамные комплекты для сна и отдыха',
    descriptionKz: 'Ұйқы мен демалысқа арналған дем алатын мақта пижама жиынтықтары',
    displayOrder: 4,
  },
  {
    slug: 'thermal-underwear',
    nameRu: 'Термобелье',
    nameKz: 'Термоішкиім',
    descriptionRu: 'Согревающее белье с натуральными хлопковыми волокнами',
    descriptionKz: 'Табиғи мақта талшықтары бар жылытатын ішкиім',
    displayOrder: 5,
  },
  {
    slug: 'kids',
    nameRu: 'Детская одежда',
    nameKz: 'Балалар киімі',
    descriptionRu: 'Гипоаллергенный детский трикотаж для мальчиков и девочек',
    descriptionKz: 'Ұлдар мен қыздарға арналған гипоаллергенді балалар трикотажы',
    displayOrder: 6,
  },
  {
    slug: 'home-textiles',
    nameRu: 'Домашний текстиль',
    nameKz: 'Үй тоқымасы',
    descriptionRu: 'Хлопковые полотенца, простыни и пледы индийского производства',
    descriptionKz: 'Үндістанда өндірілген мақта сүлгілері, жаймалары және көрпелері',
    displayOrder: 7,
  },
];
