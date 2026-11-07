import type { ClothingSize, GenderTarget, Season } from './common.js';
import type { Category } from './category.js';

export type ProductStatus = 'draft' | 'active' | 'archived';

export interface ProductImage {
  id: string;
  productId: string;
  variantId?: string | null;
  url: string;
  thumbnailUrl: string; // 150x150 WebP
  cardUrl: string; // 400x500 WebP
  fullUrl: string; // 1200x1500 WebP
  altRu?: string | null;
  altKz?: string | null;
  isPrimary: boolean;
  displayOrder: number;
  backgroundRemoved: boolean;
  createdAt: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  barcode: string; // EAN-13
  size: ClothingSize;
  colorRu: string;
  colorKz: string;
  colorHex: string; // #RRGGBB
  priceKzt: number; // Integer KZT
  oldPriceKzt?: number | null;
  weightGrams?: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  categoryId: string;
  category?: Category;
  slug: string;
  titleRu: string;
  titleKz: string;
  descriptionRu: string;
  descriptionKz: string;
  materialRu: string;
  materialKz: string;
  season: Season;
  gender: GenderTarget;
  tags: string[];
  status: ProductStatus;
  isFeatured: boolean;
  basePriceKzt: number;
  discountPriceKzt?: number | null;
  countryOfOriginRu: string;
  countryOfOriginKz: string;
  variants: ProductVariant[];
  images: ProductImage[];
  averageRating: number;
  reviewsCount: number;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}
