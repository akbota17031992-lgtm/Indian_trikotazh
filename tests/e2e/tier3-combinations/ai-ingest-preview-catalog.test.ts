/**
 * Tier 3: Cross-Feature Combinations — Pairwise Interaction 2
 * Features: AI Photo Ingestion + Vision Extraction + Image Resizing + Seller Preview + Catalog Publishing
 */

import { describe, it, expect, setTestTier } from '../helpers/test-framework.ts';
import { MockAiPipelineService } from '../helpers/ai-mock.ts';
import type { Product, ProductVariant } from '../helpers/contracts.ts';

setTestTier(3);

export async function run() {
  const ai = new MockAiPipelineService();

  await describe('Combination 2: AI Ingest -> Resizing -> Seller Preview -> Catalog Publish', () => {
    let draftId: string;

    it('3.7 should ingest raw clothing image buffer and extract bilingual metadata', async () => {
      const fakeImage = Buffer.from('india-trikotaj-tshirt-photo-raw');
      const draft = await ai.ingestImage(fakeImage, 'image/jpeg', {
        removeBg: true,
        targetCategory: 'Футболки',
        mockMode: true
      });

      draftId = draft.id;
      expect(draft.id).toBeDefined();
      expect(draft.metadata.name_ru).toContain('Футболка');
      expect(draft.metadata.name_kz).toContain('футболкасы');
      expect(draft.status).toBe('draft');
    });

    it('3.8 should verify three generated image variants (thumbnail, card, full) exist and have proper dimensions', () => {
      const draft = ai.getDraft(draftId);
      expect(draft).toBeDefined();
      expect(draft!.images.thumbnail.length).toBe(150 * 150);
      expect(draft!.images.card.length).toBe(400 * 500);
      expect(draft!.images.full.length).toBe(1200 * 1500);
    });

    it('3.9 should allow seller to inspect extracted metadata and adjust price and names', () => {
      const updated = ai.updateDraft(draftId, {
        name_ru: 'Футболка хлопок премиум синяя',
        name_kz: 'Премиум көк мақта футболкасы',
        suggestedPriceKzt: 5490,
        variants: [
          { size: 'M', color: 'Көк', sku: 'IT-TSH-BLU-M', priceKzt: 5490 },
          { size: 'L', color: 'Көк', sku: 'IT-TSH-BLU-L', priceKzt: 5490 },
          { size: 'XL', color: 'Көк', sku: 'IT-TSH-BLU-XL', priceKzt: 5490 }
        ]
      });

      expect(updated.metadata.name_ru).toBe('Футболка хлопок премиум синяя');
      expect(updated.metadata.suggestedPriceKzt).toBe(5490);
      expect(updated.variants.length).toBe(3);
    });

    it('3.10 should publish the verified draft into the public store catalog', () => {
      const publishRes = ai.publishDraft(draftId);
      expect(publishRes.productId).toBeDefined();
      expect(publishRes.publishedAt).toBeDefined();

      const publishedDraft = ai.getDraft(draftId);
      expect(publishedDraft?.status).toBe('published');
    });

    it('3.11 should construct public product entity from published draft with variants', () => {
      const draft = ai.getDraft(draftId)!;
      const productEntity: Product = {
        id: draft.publishedProductId!,
        category_id: 'cat-01',
        name_ru: draft.metadata.name_ru,
        name_kz: draft.metadata.name_kz,
        slug: 'futbolka-hlopok-premium-sinyaya',
        description_ru: draft.metadata.description_ru,
        description_kz: draft.metadata.description_kz,
        material_ru: draft.metadata.material,
        material_kz: '100% мақта',
        season: 'all-season',
        gender: 'unisex',
        base_price_kzt: draft.metadata.suggestedPriceKzt,
        is_published: true,
        tags: draft.metadata.tags
      };

      expect(productEntity.id).toBe(draft.publishedProductId);
      expect(productEntity.is_published).toBe(true);
      expect(productEntity.base_price_kzt).toBe(5490);
    });

    it('3.12 should block further modifications to the published draft', () => {
      expect(() => ai.updateDraft(draftId, { name_ru: 'Another name' })).toThrow('cannot_modify_published_draft');
    });
  });
}
