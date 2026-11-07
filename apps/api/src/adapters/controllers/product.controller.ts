import type { Request, Response, NextFunction } from 'express';
import { ListProductsUseCase } from '../../use-cases/products/list-products.use-case.js';
import { GetProductBySlugUseCase } from '../../use-cases/products/get-product-by-slug.use-case.js';
import { ApiResponsePresenter } from '../presenters/api-response.presenter.js';
import { LocalizedResponsePresenter } from '../presenters/localized-response.presenter.js';
import { NotFoundError } from '../../infrastructure/http/middlewares/error-handler.middleware.js';
import type { IProductRepository } from '../../use-cases/ports/product.repository.port.js';

export class ProductController {
  private readonly listProductsUseCase: ListProductsUseCase;
  private readonly getProductBySlugUseCase: GetProductBySlugUseCase;

  constructor(productRepo: IProductRepository) {
    this.listProductsUseCase = new ListProductsUseCase(productRepo);
    this.getProductBySlugUseCase = new GetProductBySlugUseCase(productRepo);
  }

  public listProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const categoryParam = typeof req.query.category === 'string' ? req.query.category : undefined;
      const categoryIdParam = typeof req.query.categoryId === 'string' ? req.query.categoryId : undefined;
      const genderParam = typeof req.query.gender === 'string' ? req.query.gender : undefined;
      const seasonParam = typeof req.query.season === 'string' ? req.query.season : undefined;
      const storeIdParam = typeof req.query.storeId === 'string' ? req.query.storeId : undefined;
      const inStockParam = req.query.inStock === 'true' || req.query.inStock === '1';
      const searchParam = typeof req.query.search === 'string' ? req.query.search : undefined;
      const sortParam = typeof req.query.sort === 'string' ? req.query.sort : undefined;
      const pageParam = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limitParam = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

      const result = await this.listProductsUseCase.execute({
        category: categoryParam || categoryIdParam,
        gender: genderParam,
        season: seasonParam,
        storeId: storeIdParam,
        inStock: inStockParam,
        search: searchParam,
        sort: sortParam,
        page: pageParam,
        limit: limitParam,
      });

      if (result.success) {
        const formatted = result.data.products.map((p: any) => LocalizedResponsePresenter.formatProduct(p));
        const hasEnvelope = req.query.envelope === 'true';

        ApiResponsePresenter.sendCollection(
          res,
          formatted,
          {
            page: result.data.page,
            limit: result.data.limit,
            total: result.data.total,
            totalPages: result.data.totalPages,
            hasMore: result.data.page < result.data.totalPages,
          },
          hasEnvelope
        );
      }
    } catch (err) {
      next(err);
    }
  };

  public getProductBySlug = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const slug = String(req.params.slug || '');
      if (!slug || slug.trim() === '') {
        throw new NotFoundError('Product', slug);
      }

      const result = await this.getProductBySlugUseCase.execute(slug);
      if (!result.success) {
        throw new NotFoundError('Product', slug);
      }

      const formattedProduct = LocalizedResponsePresenter.formatProduct(result.data.product);
      const formattedVariants = result.data.variants.map((v) => LocalizedResponsePresenter.formatVariant(v));

      ApiResponsePresenter.sendProductDetail(res, formattedProduct, formattedVariants);
    } catch (err) {
      next(err);
    }
  };
}
