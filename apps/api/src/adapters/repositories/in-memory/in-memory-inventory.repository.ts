import type { IInventoryRepository } from '../../../use-cases/ports/inventory.repository.port.js';
import { StoreInventory } from '../../../domain/entities/inventory.entity.js';
import type { VariantStoreAvailability } from '@india-trikotaj/shared';
import { SEED_STORES, SEED_INVENTORIES } from './seed-data.js';

export class InMemoryInventoryRepository implements IInventoryRepository {
  private readonly inventory: Map<string, StoreInventory>; // key: `${storeId}:${variantId}`

  constructor() {
    this.inventory = new Map<string, StoreInventory>();

    for (const inv of SEED_INVENTORIES) {
      const key = `${inv.storeId}:${inv.variantId}`;
      const invEntity = new StoreInventory(
        `inv-${inv.storeId}-${inv.variantId}`,
        inv.storeId,
        inv.variantId,
        inv.quantity,
        inv.reservedQuantity,
        3,
        new Date()
      );
      this.inventory.set(key, invEntity);
    }
  }

  public async findByStoreAndVariant(storeId: string, variantId: string): Promise<StoreInventory | null> {
    const key = `${storeId}:${variantId}`;
    return this.inventory.get(key) || null;
  }

  public async findByStoreId(storeId: string): Promise<StoreInventory[]> {
    return Array.from(this.inventory.values()).filter(i => i.storeId === storeId);
  }

  public async getVariantAvailability(variantId: string): Promise<VariantStoreAvailability[]> {
    return SEED_STORES.map((store) => {
      const key = `${store.id}:${variantId}`;
      const inv = this.inventory.get(key);
      const available = inv ? inv.availableQuantity : 0;
      const lowStock = inv ? inv.isLowStock() : false;

      const result: any = {
        storeId: store.id,
        storeName: store.nameRu,
        storeNameRu: store.nameRu,
        storeNameKz: store.nameKz,
        storeAddressRu: store.addressRu,
        address: store.addressRu,
        district: store.districtRu,
        availableQuantity: available,
        available,
        inStock: available > 0,
        isLowStock: lowStock,
      };

      return result as VariantStoreAvailability;
    });
  }

  public async reserveStock(
    storeId: string,
    variantId: string,
    quantity: number,
    referenceId?: string
  ): Promise<boolean> {
    const key = `${storeId}:${variantId}`;
    let inv = this.inventory.get(key);

    if (!inv) {
      inv = new StoreInventory(
        `inv-${storeId}-${variantId}`,
        storeId,
        variantId,
        20,
        0,
        3,
        new Date()
      );
      this.inventory.set(key, inv);
    }

    const res = inv.reserve(quantity);
    return res.success;
  }

  public async releaseStock(
    storeId: string,
    variantId: string,
    quantity: number,
    referenceId?: string
  ): Promise<boolean> {
    const key = `${storeId}:${variantId}`;
    const inv = this.inventory.get(key);
    if (!inv) return true;

    const res = inv.release(quantity);
    return res.success;
  }

  public async commitStockDeduction(
    storeId: string,
    variantId: string,
    quantity: number,
    referenceId?: string
  ): Promise<boolean> {
    const key = `${storeId}:${variantId}`;
    const inv = this.inventory.get(key);
    if (!inv) return false;

    const res = inv.commitDeduction(quantity);
    return res.success;
  }
}
