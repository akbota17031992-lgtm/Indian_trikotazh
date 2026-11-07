import type { DatabasePool } from '../../infrastructure/db/pool.js';
import type { IProductRepository, ProductFilterParams } from '../../use-cases/ports/product.repository.port.js';
import { Product } from '../../domain/entities/product.entity.js';
import { ProductVariant } from '../../domain/entities/variant.entity.js';
import { ProductImage } from '../../domain/entities/image.entity.js';
import { Money } from '../../domain/value-objects/money.vo.js';
import { Sku } from '../../domain/value-objects/sku.vo.js';
import type { ClothingSize, GenderTarget, Season, ProductStatus } from '@india-trikotaj/shared';

export class PostgresProductRepository implements IProductRepository {
  private readonly db: DatabasePool;

  constructor(db: DatabasePool) {
    this.db = db;
  }

  public async findFiltered(filters: ProductFilterParams): Promise<{ products: Product[]; total: number }> {
    const whereClauses: string[] = ['p.status = $1', 'p.is_published = $2'];
    const params: any[] = ['active', true];

    const categoryQuery = filters.category || filters.categoryId;
    if (categoryQuery) {
      params.push(categoryQuery);
      whereClauses.push(`(p.category_id::text = $${params.length} OR c.slug = $${params.length})`);
    }

    if (filters.gender) {
      params.push(filters.gender);
      whereClauses.push(`p.gender = $${params.length}`);
    }

    if (filters.season) {
      params.push(filters.season);
      whereClauses.push(`p.season = $${params.length}`);
    }

    if (filters.storeId && filters.inStock) {
      params.push(filters.storeId);
      whereClauses.push(`
        EXISTS (
          SELECT 1 FROM public.inventory_levels il
          JOIN public.product_variants pv ON pv.id = il.variant_id
          WHERE pv.product_id = p.id
            AND il.store_id::text = $${params.length}
            AND (il.quantity - il.reserved_quantity) > 0
        )
      `);
    }

    if (filters.search) {
      const sanitized = filters.search.replace(/([%_\\])/g, '\\$1');
      params.push(`%${sanitized}%`);
      whereClauses.push(`(p.name_ru ILIKE $${params.length} OR p.name_kz ILIKE $${params.length})`);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countSql = `
      SELECT COUNT(DISTINCT p.id) as total
      FROM public.products p
      LEFT JOIN public.categories c ON c.id = p.category_id
      ${whereSql}
    `;
    const countRes = await this.db.query(countSql, params);
    const total = parseInt(countRes.rows[0]?.total || '0', 10);

    let orderBySql = 'ORDER BY p.created_at DESC';
    if (filters.sort === 'price_asc') orderBySql = 'ORDER BY p.base_price_kzt ASC';
    if (filters.sort === 'price_desc') orderBySql = 'ORDER BY p.base_price_kzt DESC';

    const limit = Math.min(100, Math.max(1, filters.limit || 20));
    const page = Math.max(1, filters.page || 1);
    const offset = (page - 1) * limit;

    params.push(limit);
    const limitIndex = params.length;
    params.push(offset);
    const offsetIndex = params.length;

    const dataSql = `
      SELECT p.*
      FROM public.products p
      LEFT JOIN public.categories c ON c.id = p.category_id
      ${whereSql}
      ${orderBySql}
      LIMIT $${limitIndex} OFFSET $${offsetIndex}
    `;

    const dataRes = await this.db.query(dataSql, params);
    const products: Product[] = [];

    for (const row of dataRes.rows) {
      const variants = await this.findVariantsByProductId(row.id);
      products.push(this.mapRowToProduct(row, variants));
    }

    return { products, total };
  }

  public async findBySlug(slug: string): Promise<Product | null> {
    const result = await this.db.query('SELECT * FROM public.products WHERE slug = $1', [slug]);
    if (!result.rows[0]) return null;
    const variants = await this.findVariantsByProductId(result.rows[0].id);
    return this.mapRowToProduct(result.rows[0], variants);
  }

  public async findById(id: string): Promise<Product | null> {
    const result = await this.db.query('SELECT * FROM public.products WHERE id = $1', [id]);
    if (!result.rows[0]) return null;
    const variants = await this.findVariantsByProductId(result.rows[0].id);
    return this.mapRowToProduct(result.rows[0], variants);
  }

  public async findVariantById(variantId: string): Promise<ProductVariant | null> {
    const result = await this.db.query('SELECT * FROM public.product_variants WHERE id = $1', [variantId]);
    return result.rows[0] ? this.mapRowToVariant(result.rows[0]) : null;
  }

  public async findVariantsByProductId(productId: string): Promise<ProductVariant[]> {
    const result = await this.db.query(
      'SELECT * FROM public.product_variants WHERE product_id = $1 AND is_active = true ORDER BY id ASC',
      [productId]
    );
    return result.rows.map((r: any) => this.mapRowToVariant(r));
  }

  private mapRowToProduct(row: any, variants: ProductVariant[] = []): Product {
    const primaryImg = new ProductImage(
      `img-${row.id}-01`,
      row.id,
      null,
      row.image_url || `/images/products/${row.slug}/card.webp`,
      `/images/products/${row.slug}/thumb.webp`,
      `/images/products/${row.slug}/card.webp`,
      `/images/products/${row.slug}/full.webp`,
      row.name_ru || row.title_ru,
      row.name_kz || row.title_kz,
      true,
      1,
      true,
      new Date(row.created_at || Date.now())
    );

    return new Product(
      row.id,
      row.category_id,
      row.slug,
      row.name_ru || row.title_ru,
      row.name_kz || row.title_kz,
      row.description_ru || '',
      row.description_kz || '',
      row.material_ru || '',
      row.material_kz || '',
      (row.season || 'all_season') as Season,
      (row.gender || 'unisex') as GenderTarget,
      new Money(Math.round(parseFloat(row.base_price_kzt || '0'))),
      row.discount_price_kzt ? new Money(Math.round(parseFloat(row.discount_price_kzt))) : null,
      row.tags || [],
      (row.status || 'active') as ProductStatus,
      Boolean(row.is_published),
      Boolean(row.is_featured),
      'Индия',
      'Үндістан',
      variants,
      [primaryImg],
      undefined,
      5.0,
      0,
      row.metadata || {},
      new Date(row.created_at || Date.now()),
      new Date(row.updated_at || Date.now())
    );
  }

  private mapRowToVariant(row: any): ProductVariant {
    return new ProductVariant(
      row.id,
      row.product_id,
      new Sku(row.sku),
      row.barcode || row.sku,
      row.size as ClothingSize,
      row.color_ru,
      row.color_kz,
      row.color_hex || '#000000',
      new Money(Math.round(parseFloat(row.price_kzt || '0'))),
      row.old_price_kzt ? new Money(Math.round(parseFloat(row.old_price_kzt))) : null,
      row.weight_grams ? parseInt(row.weight_grams, 10) : null,
      Boolean(row.is_active),
      new Date(row.created_at || Date.now()),
      new Date(row.updated_at || Date.now())
    );
  }
}
