import type { MobileProduct } from '../types';

export const MOBILE_PRODUCTS: MobileProduct[] = [
  {
    id: 'prod-001',
    slug: 'mens-classic-cotton-tshirt',
    titleRu: 'Мужская базовая футболка (100% индийский хлопок)',
    titleKz: 'Ерлерге арналған базалық футболка (100% үнді мақтасы)',
    priceKzt: 4500,
    imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&q=80',
    category: 't-shirts',
    compositionRu: '100% гребенной индийский хлопок, плотность 190 г/м²',
    compositionKz: '100% үнді тарақты мақтасы, тығыздығы 190 г/м²',
    descriptionRu: 'Классическая футболка прямого кроя из премиального индийского хлопка. Не линяет при стирке, идеально дышит в жаркую погоду.',
    descriptionKz: 'Премиум үнді мақтасынан тігілген тік пішімді классикалық футболка. Жуғанда оңбайды, ыстық ауа райында тыныс алады.',
    stockByStore: {
      'store-almaty-001': 24, // MEGA Alma-Ata
      'store-almaty-002': 18, // Dostyk Plaza
      'store-almaty-003': 35, // Тастак-2
    },
  },
  {
    id: 'prod-002',
    slug: 'womens-summer-cotton-tunic',
    titleRu: 'Женская туника с индийским орнаментом',
    titleKz: 'Үнді ою-өрнегі бар әйелдер туникасы',
    priceKzt: 8900,
    imageUrl: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800&q=80',
    category: 'tunics',
    compositionRu: '100% натуральный батист и трикотаж, Индия',
    compositionKz: '100% табиғи бәтес және трикотаж, Үндістан',
    descriptionRu: 'Лёгкая дышащая туника свободного кроя. Традиционные индийские принты и высочайший комфорт для дома и прогулок.',
    descriptionKz: 'Жеңіл тыныс алатын еркін пішімді туника. Дәстүрлі үнді өрнектері және үйге, қыдыруға арналған жоғары жайлылық.',
    stockByStore: {
      'store-almaty-001': 12,
      'store-almaty-002': 15,
      'store-almaty-003': 20,
    },
  },
  {
    id: 'prod-003',
    slug: 'cotton-home-pajama-set',
    titleRu: 'Домашний комплект пижамы из индийского трикотажа',
    titleKz: 'Үнді трикотажынан жасалған үй пижамасы жиынтығы',
    priceKzt: 9500,
    imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&q=80',
    category: 'pajamas',
    compositionRu: '95% хлопок, 5% эластан для комфортной посадки',
    compositionKz: '95% мақта, 5% эластан ыңғайлы кию үшін',
    descriptionRu: 'Уютный домашний костюм для сна и отдыха. Приятный к телу гипоаллергенный трикотаж из южных провинций Индии.',
    descriptionKz: 'Ұйқы мен демалысқа арналған жайлы үй костюмі. Үндістанның оңтүстік аймақтарынан әкелінген гипоаллергенді трикотаж.',
    stockByStore: {
      'store-almaty-001': 16,
      'store-almaty-002': 9,
      'store-almaty-003': 28,
    },
  },
  {
    id: 'prod-004',
    slug: 'organic-cotton-towel-set',
    titleRu: 'Набор полотенец из длинноволокнистого хлопка',
    titleKz: 'Ұзын талшықты мақтадан жасалған орамалдар жиынтығы',
    priceKzt: 7200,
    imageUrl: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&q=80',
    category: 'textiles',
    compositionRu: '100% органический хлопок махровый, 550 г/м²',
    compositionKz: '100% органикалық түкті мақта, 550 г/м²',
    descriptionRu: 'Экстра-впитывающие махровые полотенца для ванной. Шелковистая текстура индийского эко-хлопка.',
    descriptionKz: 'Жоғары ылғал сіңіргіш түкті ванна орамалдары. Үнді эко-мақтасының жібектей құрылымы.',
    stockByStore: {
      'store-almaty-001': 30,
      'store-almaty-002': 22,
      'store-almaty-003': 40,
    },
  },
];

