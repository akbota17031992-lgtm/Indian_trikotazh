import type { Request, Response, NextFunction } from 'express';
import { CheckVariantAvailabilityUseCase } from '../../use-cases/inventory/check-variant-availability.use-case.js';
import type { IInventoryRepository } from '../../use-cases/ports/inventory.repository.port.js';
import type { IProductRepository } from '../../use-cases/ports/product.repository.port.js';
import { ValidationError, NotFoundError } from '../../infrastructure/http/middlewares/error-handler.middleware.js';

export class InventoryController {
  private readonly checkAvailabilityUseCase: CheckVariantAvailabilityUseCase;
  private readonly inventoryRepo: IInventoryRepository;

  constructor(
    inventoryRepo: IInventoryRepository,
    productRepo: IProductRepository
  ) {
    this.checkAvailabilityUseCase = new CheckVariantAvailabilityUseCase(inventoryRepo, productRepo);
    this.inventoryRepo = inventoryRepo;
  }

  public getAvailability = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const variantId = typeof req.query.variantId === 'string' ? req.query.variantId : '';
      if (!variantId) {
        throw new ValidationError('Query parameter "variantId" is required');
      }

      const result = await this.checkAvailabilityUseCase.execute(variantId);
      if (!result.success) {
        throw new NotFoundError('Variant', variantId);
      }

      res.status(200).json(result.data.stores);
    } catch (err) {
      next(err);
    }
  };

  public getStoreStock = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const storeId = String(req.params.storeId || '');
      const stock = await this.inventoryRepo.findByStoreId(storeId);
      res.status(200).json(stock);
    } catch (err) {
      next(err);
    }
  };
}
