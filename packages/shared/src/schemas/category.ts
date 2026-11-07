import { z } from 'zod';

export const CategorySchema = z.object({
  id: z.string().uuid(),
  parentId: z.string().uuid().nullable().optional(),
  slug: z.string().min(1),
  nameRu: z.string().min(1),
  nameKz: z.string().min(1),
  descriptionRu: z.string().nullable().optional(),
  descriptionKz: z.string().nullable().optional(),
  imageUrl: z.string().url().nullable().optional(),
  displayOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const CategoryCreateInputSchema = CategorySchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const CategoryUpdateInputSchema = CategoryCreateInputSchema.partial();
