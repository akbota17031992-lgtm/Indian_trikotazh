import type { IProductRepository, ProductFilterParams } from '../../../use-cases/ports/product.repository.port.js';
import { Product } from '../../../domain/entities/product.entity.js';
import { ProductVariant } from '../../../domain/entities/variant.entity.js';
import { ProductImage } from '../../../domain/entities/image.entity.js';
import { Money } from '../../../domain/value-objects/money.vo.js';
import { Sku } from '../../../domain/value-objects/sku.vo.js';
import { SEED_PRODUCTS, SEED_VARIANTS, SEED_INVENTORIES } from './seed-data.js';
import type { ClothingSize, GenderTarget, Season } from '@india-trikotaj/shared';

export class InMemoryProductRepository implements IProductRepository {
  private readonly products: Map<string, Product>;
  private readonly variants: Map<string, ProductVariant>;
  private readonly inventoryMap: Map<string, number>; // key: `${storeId}:${variantId}` -> available

  constructor() {
    this.products = new Map<string, Product>();
    this.variants = new Map<string, ProductVariant>();
    this.inventoryMap = new Map<string, number>();

    // 1. Seed Inventory lookup
    for (const inv of SEED_INVENTORIES) {
      this.inventoryMap.set(`${inv.storeId}:${inv.variantId}`, inv.quantity - inv.reservedQuantity);
    }

    // 2. Seed Variants
    for (const v of SEED_VARIANTS) {
      const variantEntity = new ProductVariant(
        v.id,
        v.productId,
        new Sku(v.sku),
        v.barcode,
        v.size as ClothingSize,
        v.colorRu,
        v.colorKz,
        v.colorHex,
        new Money(v.priceKzt),
        null,
        180,
        v.isActive,
        new Date(),
        new Date()
      );
      this.variants.set(v.id, variantEntity);
    }

    // 3. Seed Products
    for (const p of SEED_PRODUCTS) {
      const productVariants = Array.from(this.variants.values()).filter(v => v.productId === p.id);
      const primaryImage = new ProductImage(
        `img-${p.id}-01`,
        p.id,
        null,
        `/images/products/${p.slug}/card.webp`,
        `/images/products/${p.slug}/thumb.webp`,
        `/images/products/${p.slug}/card.webp`,
        `/images/products/${p.slug}/full.webp`,
        p.nameRu,
        p.nameKz,
        true,
        1,
        true,
        new Date()
      );

      const productEntity = new Product(
        p.id,
        p.categoryId,
        p.slug,
        p.nameRu,
        p.nameKz,
        p.descriptionRu,
        p.descriptionKz,
        p.materialRu,
        p.materialKz,
        p.season as Season,
        p.gender as GenderTarget,
        new Money(p.basePriceKzt),
        null,
        p.tags,
        'active',
        p.isPublished,
        p.isFeatured,
        'Индия',
        'Үндістан',
        productVariants,
        [primaryImage],
        undefined,
        5.0,
        0,
        {},
        new Date(),
        new Date()
      );

      this.products.set(p.id, productEntity);
    }
  }

  public async findFiltered(filters: ProductFilterParams): Promise<{ products: Product[]; total: number }> {
    let list = Array.from(this.products.values()).filter(p => p.isPublished && p.status === 'active');

    // Category filter (by id or slug)
    const categoryQuery = filters.category || filters.categoryId;
    if (categoryQuery) {
      list = list.filter(p => {
        if (p.categoryId === categoryQuery) return true;
        if (categoryQuery === 't-shirts' && p.categoryId === 'cat-01') return true;
        if (categoryQuery === 'long-sleeves' && p.categoryId === 'cat-02') return true;
        if (categoryQuery === 'robes' && p.categoryId === 'cat-03') return true;
        if (categoryQuery === 'pajamas' && p.categoryId === 'cat-04') return true;
        if (categoryQuery === 'thermal-underwear' && p.categoryId === 'cat-05') return true;
        if (categoryQuery === 'kids-clothing' && p.categoryId === 'cat-06') return true;
        if (categoryQuery === 'home-textiles' && p.categoryId === 'cat-07') return true;
        return false;
      });
    }

    if (filters.gender) {
      list = list.filter(p => p.gender === filters.gender || p.gender === 'unisex');
    }

    if (filters.season) {
      list = list.filter(p => p.season === filters.season || p.season === 'all_season');
    }

    // Branch inventory filter (inStock at branch)
    if (filters.storeId && filters.inStock) {
      list = list.filter(product => {
        return product.variants.some(variant => {
          const avail = this.inventoryMap.get(`${filters.storeId}:${variant.id}`) ?? 0;
          return avail > 0;
        });
      });
    }

    // Search query filter
    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      list = list.filter(p =>
        p.nameRu.toLowerCase().includes(q) ||
        p.nameKz.toLowerCase().includes(q) ||
        p.descriptionRu.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    const total = list.length;

    // Sorting
    if (filters.sort === 'price_asc') {
      list.sort((a, b) => a.basePrice.amountKzt - b.basePrice.amountKzt);
    } else if (filters.sort === 'price_desc') {
      list.sort((a, b) => b.basePrice.amountKzt - a.basePrice.amountKzt);
    }

    // Pagination
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 20));
    const offset = (page - 1) * limit;

    const paginated = list.slice(offset, offset + limit);

    return { products: paginated, total };
  }

  public async findById(id: string): Promise<Product | null> {
    return this.products.get(id) || null;
  }

  public async findBySlug(slug: string): Promise<Product | null> {
    for (const p of this.products.values()) {
      if (p.slug === slug) return p;
    }
    return null;
  }

  public async findVariantById(variantId: string): Promise<ProductVariant | null> {
    return this.variants.get(variantId) || null;
  }

  public async findVariantsByProductId(productId: string): Promise<ProductVariant[]> {
    return Array.from(this.variants.values()).filter(v => v.productId === productId && v.isActive);
  }
}
