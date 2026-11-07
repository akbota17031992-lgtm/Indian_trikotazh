import type { Request, Response, NextFunction } from 'express';
import { ListStoresUseCase } from '../../use-cases/stores/list-stores.use-case.js';
import { GetStoreBySlugUseCase } from '../../use-cases/stores/get-store-by-slug.use-case.js';
import { ApiResponsePresenter } from '../presenters/api-response.presenter.js';
import { LocalizedResponsePresenter } from '../presenters/localized-response.presenter.js';
import { NotFoundError } from '../../infrastructure/http/middlewares/error-handler.middleware.js';
import type { IStoreRepository } from '../../use-cases/ports/store.repository.port.js';

export class StoreController {
  private readonly listStoresUseCase: ListStoresUseCase;
  private readonly getStoreBySlugUseCase: GetStoreBySlugUseCase;

  constructor(storeRepo: IStoreRepository) {
    this.listStoresUseCase = new ListStoresUseCase(storeRepo);
    this.getStoreBySlugUseCase = new GetStoreBySlugUseCase(storeRepo);
  }

  public listStores = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const district = req.query.district as string | undefined;
      const result = await this.listStoresUseCase.execute({ district, activeOnly: true });
      if (result.success) {
        const formatted = result.data.map((s: any) => LocalizedResponsePresenter.formatStore(s));
        ApiResponsePresenter.sendCollection(res, formatted);
      }
    } catch (err) {
      next(err);
    }
  };

  public getStoreBySlugOrId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const slugOrId = String(req.params.slugOrId || '');
      const result = await this.getStoreBySlugUseCase.execute(slugOrId);
      if (!result.success) {
        throw new NotFoundError('Store', slugOrId);
      }
      ApiResponsePresenter.sendEntity(res, LocalizedResponsePresenter.formatStore(result.data));
    } catch (err) {
      next(err);
    }
  };
}
