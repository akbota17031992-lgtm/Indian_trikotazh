import { Result, ok } from '../../domain/types/result.js';
import type { IProductRepository, ProductFilterParams } from '../ports/product.repository.port.js';
import type { Product } from '../../domain/entities/product.entity.js';

export interface PaginatedProductsOutput {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class ListProductsUseCase {
  private readonly productRepo: IProductRepository;

  constructor(productRepo: IProductRepository) {
    this.productRepo = productRepo;
  }

  async execute(params: ProductFilterParams = {}): Promise<Result<PaginatedProductsOutput, never>> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));

    const { products, total } = await this.productRepo.findFiltered({
      ...params,
      page,
      limit
    });

    const totalPages = Math.ceil(total / limit) || 1;

    return ok({
      products,
      total,
      page,
      limit,
      totalPages
    });
  }
}
