import { z } from 'zod';
import { MoneyKztSchema } from './common.js';

export const ApplyPromotionInputSchema = z.object({
  code: z
    .string()
    .min(3)
    .max(20)
    .transform((c) => c.toUpperCase().trim()),
  orderSubtotalKzt: MoneyKztSchema,
});
