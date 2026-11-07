import { Result, ok, err } from '../../domain/types/result.js';
import { NotFoundError } from '../../domain/errors/domain-errors.js';
import type { IInventoryRepository } from '../ports/inventory.repository.port.js';
import type { IProductRepository } from '../ports/product.repository.port.js';
import type { VariantStoreAvailability } from '@india-trikotaj/shared';

export interface VariantAvailabilityOutput {
  variantId: string;
  totalAvailable: number;
  stores: VariantStoreAvailability[];
}

export class CheckVariantAvailabilityUseCase {
  private readonly inventoryRepo: IInventoryRepository;
  private readonly productRepo: IProductRepository;

  constructor(
    inventoryRepo: IInventoryRepository,
    productRepo: IProductRepository
  ) {
    this.inventoryRepo = inventoryRepo;
    this.productRepo = productRepo;
  }

  async execute(variantId: string): Promise<Result<VariantAvailabilityOutput, NotFoundError>> {
    const variant = await this.productRepo.findVariantById(variantId);
    if (!variant) {
      return err(NotFoundError.variant(variantId));
    }

    const stores = await this.inventoryRepo.getVariantAvailability(variantId);
    const totalAvailable = stores.reduce((sum, s) => sum + s.availableQuantity, 0);

    return ok({
      variantId,
      totalAvailable,
      stores
    });
  }
}
