import { z } from 'zod';

export const CreateReviewInputSchema = z.object({
  productId: z.string().uuid(),
  authorName: z.string().min(2, 'Атыңызды жазыңыз / Укажите имя'),
  rating: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  comment: z.string().min(5, 'Пікір тым қысқа / Отзыв слишком короткий').max(1000),
  pros: z.string().max(500).optional().nullable(),
  cons: z.string().max(500).optional().nullable(),
});
