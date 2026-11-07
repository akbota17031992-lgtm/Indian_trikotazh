import type { StoreInventory } from '../../domain/entities/inventory.entity.js';
import type { VariantStoreAvailability } from '@india-trikotaj/shared';

export interface IInventoryRepository {
  findByStoreAndVariant(storeId: string, variantId: string): Promise<StoreInventory | null>;
  findByStoreId(storeId: string): Promise<StoreInventory[]>;
  getVariantAvailability(variantId: string): Promise<VariantStoreAvailability[]>;
  reserveStock(storeId: string, variantId: string, quantity: number, referenceId?: string): Promise<boolean>;
  releaseStock(storeId: string, variantId: string, quantity: number, referenceId?: string): Promise<boolean>;
  commitStockDeduction(storeId: string, variantId: string, quantity: number, referenceId?: string): Promise<boolean>;
}
