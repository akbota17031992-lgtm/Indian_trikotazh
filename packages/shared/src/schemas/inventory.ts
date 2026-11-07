import { z } from 'zod';

export const StoreInventorySchema = z.object({
  id: z.string().uuid(),
  storeId: z.string().uuid(),
  variantId: z.string().uuid(),
  quantity: z.number().int().nonnegative(),
  reservedQuantity: z.number().int().nonnegative(),
  availableQuantity: z.number().int().nonnegative(),
  lowStockThreshold: z.number().int().nonnegative().default(3),
  updatedAt: z.string().datetime(),
});

export const VariantStoreAvailabilitySchema = z.object({
  storeId: z.string().uuid(),
  storeNameRu: z.string(),
  storeNameKz: z.string(),
  storeAddressRu: z.string(),
  availableQuantity: z.number().int().nonnegative(),
  inStock: z.boolean(),
  isLowStock: z.boolean(),
});

export const InventoryReserveInputSchema = z.object({
  storeId: z.string().uuid(),
  orderId: z.string().uuid(),
  items: z
    .array(
      z.object({
        variantId: z.string().uuid(),
        quantity: z.number().int().positive(),
      })
    )
    .min(1),
});
