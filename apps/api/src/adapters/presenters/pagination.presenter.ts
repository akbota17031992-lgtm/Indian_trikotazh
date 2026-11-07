import type { PaginationMeta } from '@india-trikotaj/shared';

export class PaginationPresenter {
  public static createMeta(page: number, limit: number, total: number): PaginationMeta {
    const totalPages = Math.ceil(total / limit) || 1;
    return {
      page,
      limit,
      total,
      totalPages,
      hasMore: page < totalPages,
    };
  }
}
