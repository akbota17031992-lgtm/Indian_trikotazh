import type { Product } from '../../domain/entities/product.entity.js';
import type { ProductVariant } from '../../domain/entities/variant.entity.js';

export interface ProductFilterParams {
  category?: string;
  categoryId?: string;
  gender?: string;
  season?: string;
  storeId?: string;
  inStock?: boolean;
  search?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

export interface IProductRepository {
  findFiltered(filters: ProductFilterParams): Promise<{ products: Product[]; total: number }>;
  findById(id: string): Promise<Product | null>;
  findBySlug(slug: string): Promise<Product | null>;
  findVariantById(variantId: string): Promise<ProductVariant | null>;
  findVariantsByProductId(productId: string): Promise<ProductVariant[]>;
}
