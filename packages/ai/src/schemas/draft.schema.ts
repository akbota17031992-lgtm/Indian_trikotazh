import { z } from 'zod';
import { AiClothingMetadataSchema } from './metadata.schema.js';

export const ProductVariantDraftSchema = z.object({
  size: z.string().min(1, 'Size is required'),
  color: z.string().min(1, 'Color is required'),
  sku: z.string().min(1, 'SKU is required'),
  priceKzt: z
    .number()
    .refine((val) => Number.isInteger(val) && val > 0, {
      message: 'suggested_price_must_be_whole_tenge',
    }),
  stockByStore: z.record(z.number().int().nonnegative()).optional(),
});

export const ProcessedProductDraftSchema = z.object({
  id: z.string().startsWith('draft_'),
  status: z.enum(['draft', 'published', 'discarded']),
  publishedProductId: z.string().optional(),
  metadata: AiClothingMetadataSchema,
  images: z.object({
    thumbnail: z.custom<Buffer>((b) => Buffer.isBuffer(b) || b instanceof Uint8Array),
    card: z.custom<Buffer>((b) => Buffer.isBuffer(b) || b instanceof Uint8Array),
    full: z.custom<Buffer>((b) => Buffer.isBuffer(b) || b instanceof Uint8Array),
  }),
  variants: z.array(ProductVariantDraftSchema).min(1),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const DraftUpdateSchema = z.object({
  name_ru: z.string().min(1).optional(),
  name_kz: z.string().min(1).optional(),
  description_ru: z.string().min(1).optional(),
  description_kz: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  subcategory: z.string().optional(),
  colors: z.array(z.string().min(1)).optional(),
  material: z.string().optional(),
  season: z.string().optional(),
  gender: z.string().optional(),
  tags: z.array(z.string()).optional(),
  suggestedPriceKzt: z
    .number({
      invalid_type_error: 'suggested_price_must_be_whole_tenge',
    })
    .refine((val) => Number.isInteger(val) && val > 0, {
      message: 'suggested_price_must_be_whole_tenge',
    })
    .optional(),
  variants: z.array(ProductVariantDraftSchema).optional(),
});
