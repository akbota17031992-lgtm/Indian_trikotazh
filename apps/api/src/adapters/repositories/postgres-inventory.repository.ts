import type { DatabasePool } from '../../infrastructure/db/pool.js';
import type { IInventoryRepository } from '../../use-cases/ports/inventory.repository.port.js';
import { StoreInventory } from '../../domain/entities/inventory.entity.js';
import type { VariantStoreAvailability } from '@india-trikotaj/shared';

export class PostgresInventoryRepository implements IInventoryRepository {
  private readonly db: DatabasePool;

  constructor(db: DatabasePool) {
    this.db = db;
  }

  public async findByStoreAndVariant(storeId: string, variantId: string): Promise<StoreInventory | null> {
    const result = await this.db.query(
      'SELECT * FROM public.inventory_levels WHERE store_id = $1 AND variant_id = $2',
      [storeId, variantId]
    );
    return result.rows[0] ? this.mapRowToEntity(result.rows[0]) : null;
  }

  public async findByStoreId(storeId: string): Promise<StoreInventory[]> {
    const result = await this.db.query(
      'SELECT * FROM public.inventory_levels WHERE store_id = $1',
      [storeId]
    );
    return result.rows.map((r: any) => this.mapRowToEntity(r));
  }

  public async getVariantAvailability(variantId: string): Promise<VariantStoreAvailability[]> {
    const query = `
      SELECT
        s.id as store_id,
        s.name_ru as store_name,
        s.name_kz as store_name_kz,
        s.address_ru as address,
        s.district_ru as district,
        COALESCE(il.quantity, 0) as quantity,
        COALESCE(il.reserved_quantity, 0) as reserved_quantity,
        GREATEST(0, COALESCE(il.quantity, 0) - COALESCE(il.reserved_quantity, 0)) as available,
        (GREATEST(0, COALESCE(il.quantity, 0) - COALESCE(il.reserved_quantity, 0)) <= COALESCE(il.low_stock_threshold, 3)) as is_low_stock
      FROM public.stores s
      LEFT JOIN public.inventory_levels il ON il.store_id = s.id AND il.variant_id = $1
      WHERE s.is_active = true
      ORDER BY s.name_ru ASC
    `;
    const result = await this.db.query(query, [variantId]);
    return result.rows.map((r: any) => {
      const available = parseInt(r.available, 10);
      const res: any = {
        storeId: r.store_id,
        storeName: r.store_name,
        storeNameRu: r.store_name,
        storeNameKz: r.store_name_kz || r.store_name,
        storeAddressRu: r.address,
        availableQuantity: available,
        available,
        isLowStock: Boolean(r.is_low_stock),
        inStock: available > 0,
        address: r.address,
        district: r.district
      };
      return res as VariantStoreAvailability;
    });
  }

  public async reserveStock(
    storeId: string,
    variantId: string,
    quantity: number,
    referenceId?: string
  ): Promise<boolean> {
    try {
      const res = await this.db.query(
        'SELECT public.reserve_stock($1, $2, $3, $4) as success',
        [storeId, variantId, quantity, referenceId || 'order-reservation']
      );
      return Boolean(res.rows[0]?.success);
    } catch {
      return false;
    }
  }

  public async releaseStock(
    storeId: string,
    variantId: string,
    quantity: number,
    referenceId?: string
  ): Promise<boolean> {
    try {
      const res = await this.db.query(
        'SELECT public.release_stock($1, $2, $3, $4) as success',
        [storeId, variantId, quantity, referenceId || 'order-release']
      );
      return Boolean(res.rows[0]?.success);
    } catch {
      return false;
    }
  }

  public async commitStockDeduction(
    storeId: string,
    variantId: string,
    quantity: number,
    referenceId?: string
  ): Promise<boolean> {
    try {
      const res = await this.db.query(
        'SELECT public.commit_stock_deduction($1, $2, $3, $4) as success',
        [storeId, variantId, quantity, referenceId || 'order-sale']
      );
      return Boolean(res.rows[0]?.success);
    } catch {
      return false;
    }
  }

  private mapRowToEntity(row: any): StoreInventory {
    const qty = parseInt(row.quantity || '0', 10);
    const reserved = parseInt(row.reserved_quantity || '0', 10);
    return new StoreInventory(
      row.id,
      row.store_id,
      row.variant_id,
      qty,
      reserved,
      row.low_stock_threshold ? parseInt(row.low_stock_threshold, 10) : 3,
      new Date(row.updated_at || Date.now())
    );
  }
}
