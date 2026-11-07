import type { IPromotionRepository } from '../../../use-cases/ports/promotion.repository.port.js';
import { Promotion } from '../../../domain/entities/promotion.entity.js';
import { Money } from '../../../domain/value-objects/money.vo.js';

export class InMemoryPromotionRepository implements IPromotionRepository {
  private readonly promotions: Map<string, Promotion>;

  constructor() {
    this.promotions = new Map<string, Promotion>();

    // Seed test promo codes
    const promo10 = new Promotion(
      'promo-welcome10',
      'WELCOME10',
      'Скидка 10% на первый заказ',
      'Алғашқы тапсырысқа 10% жеңілдік',
      'percentage',
      10,
      new Money(5000),
      new Money(5000),
      new Date(Date.now() - 24 * 60 * 60 * 1000),
      new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      1000,
      0,
      true
    );
    this.promotions.set(promo10.code, promo10);
  }

  public async findByCode(code: string): Promise<Promotion | null> {
    return this.promotions.get(code.toUpperCase()) || null;
  }

  public async incrementUsage(id: string): Promise<void> {
    for (const promo of this.promotions.values()) {
      if (promo.id === id) {
        promo.incrementUsage();
        break;
      }
    }
  }
}
