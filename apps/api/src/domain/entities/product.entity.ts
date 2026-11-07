import { Money } from '../value-objects/money.vo.js';
import type { ProductVariant } from './variant.entity.js';
import type { ProductImage } from './image.entity.js';
import type { Category } from './category.entity.js';
import type { GenderTarget, Season, ProductStatus } from '@india-trikotaj/shared';

export class Product {
  readonly id: string;
  readonly categoryId: string;
  readonly slug: string;
  readonly nameRu: string;
  readonly nameKz: string;
  readonly descriptionRu: string;
  readonly descriptionKz: string;
  readonly materialRu: string;
  readonly materialKz: string;
  readonly season: Season;
  readonly gender: GenderTarget;
  readonly basePrice: Money;
  readonly discountPrice: Money | null;
  readonly tags: string[];
  readonly status: ProductStatus;
  readonly isPublished: boolean;
  readonly isFeatured: boolean;
  readonly countryOfOriginRu: string;
  readonly countryOfOriginKz: string;
  readonly variants: ProductVariant[];
  readonly images: ProductImage[];
  readonly category?: Category;
  readonly averageRating: number;
  readonly reviewsCount: number;
  readonly metadata: Record<string, unknown>;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(
    id: string,
    categoryId: string,
    slug: string,
    nameRu: string,
    nameKz: string,
    descriptionRu: string,
    descriptionKz: string,
    materialRu: string,
    materialKz: string,
    season: Season,
    gender: GenderTarget,
    basePrice: Money,
    discountPrice: Money | null = null,
    tags: string[] = [],
    status: ProductStatus = 'active',
    isPublished: boolean = true,
    isFeatured: boolean = false,
    countryOfOriginRu: string = 'Индия',
    countryOfOriginKz: string = 'Үндістан',
    variants: ProductVariant[] = [],
    images: ProductImage[] = [],
    category?: Category,
    averageRating: number = 0,
    reviewsCount: number = 0,
    metadata: Record<string, unknown> = {},
    createdAt: Date = new Date(),
    updatedAt: Date = new Date()
  ) {
    if (!nameRu || !nameRu.trim()) {
      throw new Error('Bilingual product title (ru) is required');
    }
    if (!nameKz || !nameKz.trim()) {
      throw new Error('Bilingual product title (kz) is required');
    }
    if (basePrice.amountKzt <= 0) {
      throw new Error('Product base price must be positive');
    }

    this.id = id;
    this.categoryId = categoryId;
    this.slug = slug;
    this.nameRu = nameRu;
    this.nameKz = nameKz;
    this.descriptionRu = descriptionRu;
    this.descriptionKz = descriptionKz;
    this.materialRu = materialRu;
    this.materialKz = materialKz;
    this.season = season;
    this.gender = gender;
    this.basePrice = basePrice;
    this.discountPrice = discountPrice;
    this.tags = tags;
    this.status = status;
    this.isPublished = isPublished;
    this.isFeatured = isFeatured;
    this.countryOfOriginRu = countryOfOriginRu;
    this.countryOfOriginKz = countryOfOriginKz;
    this.variants = variants;
    this.images = images;
    this.category = category;
    this.averageRating = averageRating;
    this.reviewsCount = reviewsCount;
    this.metadata = metadata;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  getEffectivePrice(): Money {
    return this.discountPrice && this.discountPrice.amountKzt < this.basePrice.amountKzt
      ? this.discountPrice
      : this.basePrice;
  }

  findVariant(variantIdOrSku: string): ProductVariant | undefined {
    return this.variants.find(
      v => v.id === variantIdOrSku || v.sku.value === variantIdOrSku.toUpperCase()
    );
  }

  getPrimaryImage(): ProductImage | undefined {
    return this.images.find(img => img.isPrimary) || this.images[0];
  }
}
