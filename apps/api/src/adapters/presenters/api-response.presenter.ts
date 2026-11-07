import type { Response } from 'express';
import type { ApiResponse, PaginationMeta } from '@india-trikotaj/shared';

export class ApiResponsePresenter {
  public static sendCollection<T>(
    res: Response,
    items: T[],
    meta?: PaginationMeta,
    envelope = false
  ): Response {
    if (envelope) {
      const payload: ApiResponse<T[]> = {
        data: items,
        meta,
      };
      return res.status(200).json(payload);
    }
    return res.status(200).json(items);
  }

  public static sendEntity<T>(res: Response, item: T, statusCode = 200): Response {
    return res.status(statusCode).json(item);
  }

  public static sendProductDetail(res: Response, product: any, variants: any[]): Response {
    return res.status(200).json({
      data: product,
      variants,
    });
  }

  public static sendOrderCreated(res: Response, order: any): Response {
    return res.status(201).json({
      order,
      data: order,
    });
  }
}
