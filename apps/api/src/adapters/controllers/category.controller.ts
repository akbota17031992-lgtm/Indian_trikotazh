import type { Request, Response, NextFunction } from 'express';
import { ApiResponsePresenter } from '../presenters/api-response.presenter.js';
import { SEED_CATEGORIES } from '../repositories/in-memory/seed-data.js';

export class CategoryController {
  public listCategories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const formatted = SEED_CATEGORIES.map((c) => ({
        id: c.id,
        nameRu: c.nameRu,
        nameKz: c.nameKz,
        name_ru: c.nameRu,
        name_kz: c.nameKz,
        slug: c.slug,
        sortOrder: c.sortOrder,
        sort_order: c.sortOrder,
        isActive: c.isActive,
        is_active: c.isActive,
      }));
      const hasEnvelope = req.query.envelope === 'true';
      ApiResponsePresenter.sendCollection(res, formatted, undefined, hasEnvelope);
    } catch (err) {
      next(err);
    }
  };
}
