import { Result, ok, err } from '../../domain/types/result.js';
import { NotFoundError } from '../../domain/errors/domain-errors.js';
import type { IProductRepository } from '../ports/product.repository.port.js';
import type { Product } from '../../domain/entities/product.entity.js';
import type { ProductVariant } from '../../domain/entities/variant.entity.js';

export interface ProductDetailOutput {
  product: Product;
  variants: ProductVariant[];
}

export class GetProductBySlugUseCase {
  private readonly productRepo: IProductRepository;

  constructor(productRepo: IProductRepository) {
    this.productRepo = productRepo;
  }

  async execute(slug: string): Promise<Result<ProductDetailOutput, NotFoundError>> {
    if (!slug || !slug.trim()) {
      return err(NotFoundError.product(slug));
    }

    const trimmed = slug.trim();
    if (trimmed.includes('..') || trimmed.includes('/') || trimmed.includes('\\')) {
      return err(NotFoundError.product(slug));
    }

    let product = await this.productRepo.findBySlug(trimmed);
    if (!product) {
      product = await this.productRepo.findById(trimmed);
    }
    if (!product) {
      return err(NotFoundError.product(slug));
    }

    const variants = await this.productRepo.findVariantsByProductId(product.id);
    return ok({ product, variants });
  }
}
