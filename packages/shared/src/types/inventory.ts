export interface StoreInventory {
  id: string;
  storeId: string;
  variantId: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number; // (quantity - reservedQuantity)
  lowStockThreshold: number;
  updatedAt: string;
}

export interface VariantStoreAvailability {
  storeId: string;
  storeNameRu: string;
  storeNameKz: string;
  storeAddressRu: string;
  availableQuantity: number;
  inStock: boolean;
  isLowStock: boolean;
}

export interface ProductAvailabilitySummary {
  variantId: string;
  totalAvailable: number;
  stores: VariantStoreAvailability[];
}

export type InventoryTransactionReason =
  | 'initial_load'
  | 'restock'
  | 'sale'
  | 'reservation'
  | 'reservation_cancellation'
  | 'return'
  | 'adjustment'
  | 'transfer';

export interface InventoryTransaction {
  id: string;
  storeId: string;
  variantId: string;
  changeQuantity: number;
  reason: InventoryTransactionReason;
  referenceId?: string | null;
  createdBy?: string | null;
  createdAt: string;
}
