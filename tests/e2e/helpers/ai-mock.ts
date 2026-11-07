/**
 * India Trikotaj E2E Testing Suite — AI Processing Pipeline Mock & Validator
 * Conforms to R4, packages/ai contract, and Gemini Vision OpenAPI schema
 */

import type { ProcessedProductDraft } from './contracts.ts';

export interface AiIngestionOptions {
  removeBg?: boolean;
  targetCategory?: string;
  mockMode?: boolean;
}

export class MockAiPipelineService {
  private drafts = new Map<string, ProcessedProductDraft & { id: string; status: 'draft' | 'published'; publishedProductId?: string }>();

  /**
   * Process product photo and extract bilingual structured metadata
   */
  async ingestImage(
    imageBuffer: Buffer | Uint8Array,
    mimeType: string,
    options: AiIngestionOptions = { removeBg: true, mockMode: true }
  ): Promise<ProcessedProductDraft & { id: string; status: 'draft' }> {
    if (!imageBuffer || imageBuffer.length === 0) {
      throw new Error('empty_image_buffer');
    }

    const validMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validMimes.includes(mimeType)) {
      throw new Error(`unsupported_image_mime: ${mimeType}`);
    }

    const draftId = `draft_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Deterministic extraction based on category hint or fallback
    const category = options.targetCategory || 'Футболки';
    const draft: ProcessedProductDraft & { id: string; status: 'draft' } = {
      id: draftId,
      status: 'draft',
      metadata: {
        name_ru: `Футболка ${category} Индийский Трикотаж`,
        name_kz: `Үнді трикотажы ${category} футболкасы`,
        description_ru: 'Мягкий премиальный индийский трикотаж из натурального 100% хлопка.',
        description_kz: '100% табиғи мақтадан жасалған жұмсақ премиум үнді трикотажы.',
        category: 'Футболки',
        subcategory: 'Базовые',
        colors: ['Белый', 'Черный'],
        material: '100% хлопок',
        season: 'all-season',
        gender: 'unisex',
        tags: ['трикотаж', 'хлопок', 'индия', 'базовая'],
        suggestedPriceKzt: 4990
      },
      images: {
        thumbnail: Buffer.alloc(150 * 150, 0x11), // 150x150 simulated WebP
        card: Buffer.alloc(400 * 500, 0x22),      // 400x500 simulated WebP
        full: Buffer.alloc(1200 * 1500, 0x33)     // 1200x1500 simulated WebP
      },
      variants: [
        { size: 'S', color: 'Белый', sku: `IT-DRAFT-${draftId.slice(-4)}-S`, priceKzt: 4990 },
        { size: 'M', color: 'Белый', sku: `IT-DRAFT-${draftId.slice(-4)}-M`, priceKzt: 4990 },
        { size: 'L', color: 'Белый', sku: `IT-DRAFT-${draftId.slice(-4)}-L`, priceKzt: 4990 }
      ]
    };

    this.drafts.set(draftId, draft);
    return draft;
  }

  /**
   * Seller preview verification: update draft fields
   */
  updateDraft(
    draftId: string,
    updates: Partial<ProcessedProductDraft['metadata']> & { variants?: ProcessedProductDraft['variants'] }
  ): ProcessedProductDraft & { id: string; status: 'draft' } {
    const draft = this.drafts.get(draftId);
    if (!draft) {
      throw new Error('draft_not_found');
    }
    if (draft.status !== 'draft') {
      throw new Error('cannot_modify_published_draft');
    }

    if (updates.name_ru) draft.metadata.name_ru = updates.name_ru;
    if (updates.name_kz) draft.metadata.name_kz = updates.name_kz;
    if (updates.description_ru) draft.metadata.description_ru = updates.description_ru;
    if (updates.description_kz) draft.metadata.description_kz = updates.description_kz;
    if (updates.suggestedPriceKzt) {
      if (!Number.isInteger(updates.suggestedPriceKzt) || updates.suggestedPriceKzt <= 0) {
        throw new Error('suggested_price_must_be_whole_tenge');
      }
      draft.metadata.suggestedPriceKzt = updates.suggestedPriceKzt;
    }
    if (updates.variants) draft.variants = updates.variants;

    return draft as ProcessedProductDraft & { id: string; status: 'draft' };
  }

  /**
   * Publish draft to catalog
   */
  publishDraft(draftId: string): { productId: string; publishedAt: string } {
    const draft = this.drafts.get(draftId);
    if (!draft) {
      throw new Error('draft_not_found');
    }
    if (draft.status !== 'draft') {
      throw new Error('draft_already_published');
    }

    const productId = `prod_${draftId.replace('draft_', '')}`;
    draft.status = 'published';
    draft.publishedProductId = productId;

    return {
      productId,
      publishedAt: new Date().toISOString()
    };
  }

  getDraft(id: string) {
    return this.drafts.get(id);
  }
}
