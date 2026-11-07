import { CATALOG_PRODUCTS, type FullProductDetail } from './catalog-data';

export const DYNAMIC_PRODUCTS_STORAGE_KEY = 'indiatrikotaj_custom_products';

/**
 * Loads both static seed products and admin-created dynamic products
 */
export function getAllStoreProducts(): FullProductDetail[] {
  if (typeof window === 'undefined') {
    return CATALOG_PRODUCTS;
  }

  try {
    const raw = localStorage.getItem(DYNAMIC_PRODUCTS_STORAGE_KEY);
    if (!raw) return CATALOG_PRODUCTS;

    const dynamicProds: FullProductDetail[] = JSON.parse(raw);
    if (!Array.isArray(dynamicProds) || dynamicProds.length === 0) {
      return CATALOG_PRODUCTS;
    }

    // Merge dynamic products first so new items appear at the very top of the store
    const existingIds = new Set(dynamicProds.map(p => p.id));
    const filteredStatic = CATALOG_PRODUCTS.filter(p => !existingIds.has(p.id));

    return [...dynamicProds, ...filteredStatic];
  } catch (e) {
    console.error('Error loading dynamic products:', e);
    return CATALOG_PRODUCTS;
  }
}

/**
 * Saves a new product created in Admin to persistent localStorage
 */
export function saveDynamicProduct(newProduct: any) {
  if (typeof window === 'undefined') return;

  try {
    const currentList = getStoredDynamicProducts();

    // Map payload into full FullProductDetail structure
    const fullProd: FullProductDetail = {
      id: newProduct.id || `prod-${Date.now()}`,
      slug: newProduct.slug || `item-${Date.now()}`,
      category_id: newProduct.categorySlug || 'cat-01',
      categorySlug: newProduct.categorySlug || 'tunics',
      categoryNameRu:
        newProduct.categorySlug === 'tunics'
          ? 'Платья и туники'
          : newProduct.categorySlug === 'pajamas'
          ? 'Пижамы'
          : 'Футболки',
      categoryNameKz:
        newProduct.categorySlug === 'tunics'
          ? 'Көйлектер мен туникалар'
          : newProduct.categorySlug === 'pajamas'
          ? 'Пижамалар'
          : 'Футболкалар',
      nameRu: newProduct.nameRu,
      nameKz: newProduct.nameKz || newProduct.nameRu,
      descriptionRu:
        newProduct.descriptionRu ||
        'Натуральный качественный трикотаж из индийского хлопка фабричного производства.',
      descriptionKz:
        newProduct.descriptionKz ||
        'Үндістанда өндірілген сапалы үнді мақтасынан жасалған трикотаж бұйымы.',
      materialRu: newProduct.compositionRu || '100% индийский хлопок',
      materialKz: newProduct.compositionKz || '100% үнді мақтасы',
      gender: newProduct.gender || 'women',
      season: 'all-season',
      basePriceKzt: Number(newProduct.basePriceKzt) || 9990,
      imageUrl:
        newProduct.imageUrl ||
        'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&q=80',
      images:
        Array.isArray(newProduct.images) && newProduct.images.length > 0
          ? newProduct.images
          : [
              newProduct.imageUrl ||
                'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&q=80',
            ],
      tags: ['новинка', 'индия', 'хлопок', '2026'],
      defaultVariantId: `var-${Date.now()}`,
      defaultSize: 'M',
      defaultColorRu: 'Орнамент',
      defaultColorKz: 'Өрнек',
      stockByStore: newProduct.stockByBranch || {
        'store-almaty-001': 15,
        'store-almaty-002': 10,
      },
      variants: [
        {
          id: `var-${Date.now()}-m`,
          sku: `IT-${Date.now()}-M`,
          size: 'M',
          colorRu: 'Орнамент',
          colorKz: 'Өрнек',
          colorHex: '#3B82F6',
          priceKzt: Number(newProduct.basePriceKzt) || 9990,
          stockByStore: newProduct.stockByBranch || { 'store-almaty-001': 15 },
        },
      ],
    };

    // Filter out if existing then unshift to the top
    const updated = [fullProd, ...currentList.filter(p => p.id !== fullProd.id)];
    localStorage.setItem(DYNAMIC_PRODUCTS_STORAGE_KEY, JSON.stringify(updated));

    // Also dispatch custom event for immediate reactive refresh across tabs
    window.dispatchEvent(new Event('indiatrikotaj_products_updated'));
  } catch (e) {
    console.error('Error saving dynamic product:', e);
  }
}

export function getStoredDynamicProducts(): FullProductDetail[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(DYNAMIC_PRODUCTS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

