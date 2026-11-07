import type { Promotion } from '../../domain/entities/promotion.entity.js';

export interface IPromotionRepository {
  findByCode(code: string): Promise<Promotion | null>;
  incrementUsage(id: string): Promise<void>;
}
