import { z } from 'zod';
import { HexColorSchema, BarcodeSchema, MoneyKztSchema } from './common.js';

export const ClothingSizeSchema = z.enum([
  'XS',
  'S',
  'M',
  'L',
  'XL',
  '2XL',
  '3XL',
  '4XL',
  '5XL',
  '86-92',
  '98-104',
  '110-116',
  '122-128',
  '134-140',
  '146-152',
  'OneSize',
]);

export const GenderTargetSchema = z.enum([
  'unisex',
  'men',
  'women',
  'boys',
  'girls',
  'kids_unisex',
]);

export const SeasonSchema = z.enum(['all_season', 'summer', 'winter', 'demi_season']);

export const ProductStatusSchema = z.enum(['draft', 'active', 'archived']);

export const ProductImageSchema = z.object({
  id: z.string().uuid(),
  productId: z.string().uuid(),
  variantId: z.string().uuid().nullable().optional(),
  url: z.string().url(),
  thumbnailUrl: z.string().url(),
  cardUrl: z.string().url(),
  fullUrl: z.string().url(),
  altRu: z.string().nullable().optional(),
  altKz: z.string().nullable().optional(),
  isPrimary: z.boolean().default(false),
  displayOrder: z.number().int().default(0),
  backgroundRemoved: z.boolean().default(false),
  createdAt: z.string().datetime(),
});

export const ProductVariantSchema = z.object({
  id: z.string().uuid(),
  productId: z.string().uuid(),
  sku: z.string().min(1),
  barcode: BarcodeSchema,
  size: ClothingSizeSchema,
  colorRu: z.string().min(1),
  colorKz: z.string().min(1),
  colorHex: HexColorSchema,
  priceKzt: MoneyKztSchema,
  oldPriceKzt: MoneyKztSchema.nullable().optional(),
  weightGrams: z.number().int().positive().nullable().optional(),
  isActive: z.boolean().default(true),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const ProductSchema = z.object({
  id: z.string().uuid(),
  categoryId: z.string().uuid(),
  slug: z.string().min(1),
  titleRu: z.string().min(1),
  titleKz: z.string().min(1),
  descriptionRu: z.string().min(1),
  descriptionKz: z.string().min(1),
  materialRu: z.string().min(1),
  materialKz: z.string().min(1),
  season: SeasonSchema.default('all_season'),
  gender: GenderTargetSchema.default('unisex'),
  tags: z.array(z.string()).default([]),
  status: ProductStatusSchema.default('active'),
  isFeatured: z.boolean().default(false),
  basePriceKzt: MoneyKztSchema,
  discountPriceKzt: MoneyKztSchema.nullable().optional(),
  countryOfOriginRu: z.string().default('Индия'),
  countryOfOriginKz: z.string().default('Үндістан'),
  variants: z.array(ProductVariantSchema).default([]),
  images: z.array(ProductImageSchema).default([]),
  averageRating: z.number().min(0).max(5).default(0),
  reviewsCount: z.number().int().default(0),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const ProductFilterQuerySchema = z.object({
  categoryId: z.string().uuid().optional(),
  gender: GenderTargetSchema.optional(),
  season: SeasonSchema.optional(),
  storeId: z.string().uuid().optional(),
  inStock: z
    .preprocess((val) => {
      if (val === undefined || val === null || val === '') return undefined;
      if (val === 'true' || val === '1' || val === 1 || val === true) return true;
      if (val === 'false' || val === '0' || val === 0 || val === false) return false;
      return val;
    }, z.boolean().optional())
    .optional(),
  minPrice: z.coerce.number().int().optional(),
  maxPrice: z.coerce.number().int().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sort: z.enum(['price_asc', 'price_desc', 'newest', 'popular']).default('newest'),
});
