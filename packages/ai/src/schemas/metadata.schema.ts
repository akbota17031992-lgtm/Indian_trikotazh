import { z } from 'zod';

export const ApparelSeasonEnum = z.enum(['all-season', 'summer', 'winter', 'demi-season']);
export const ApparelGenderEnum = z.enum(['unisex', 'men', 'women', 'kids', 'boys', 'girls', 'baby']);

export const ColorItemSchema = z.object({
  name_ru: z.string().min(1, 'Color name_ru cannot be empty'),
  name_kz: z.string().min(1, 'Color name_kz cannot be empty'),
  hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional()
});

export const AiClothingMetadataSchema = z.object({
  name_ru: z.string().trim().min(1, 'name_ru cannot be empty'),
  name_kz: z.string().trim().min(1, 'name_kz cannot be empty'),
  description_ru: z.string().trim().min(1, 'description_ru cannot be empty'),
  description_kz: z.string().trim().min(1, 'description_kz cannot be empty'),
  category: z.string().min(1, 'category cannot be empty'),
  subcategory: z.string().default('Базовые'),
  colors: z.array(z.string().min(1)).min(1, 'At least one color is required'),
  material: z.string().default('100% хлопок'),
  season: z.string().default('all-season'),
  gender: z.string().default('unisex'),
  tags: z
    .array(z.string())
    .default([])
    .transform((tags) => {
      const clean = tags
        .map((t) => t.trim().toLowerCase())
        .filter((t) => t.length > 0);
      return Array.from(new Set(clean));
    }),
  suggestedPriceKzt: z
    .number({
      required_error: 'suggested_price_must_be_whole_tenge',
      invalid_type_error: 'suggested_price_must_be_whole_tenge',
    })
    .refine((val) => Number.isInteger(val) && val > 0, {
      message: 'suggested_price_must_be_whole_tenge',
    }),
});

export type ExtractedApparelMetadata = z.infer<typeof AiClothingMetadataSchema>;
