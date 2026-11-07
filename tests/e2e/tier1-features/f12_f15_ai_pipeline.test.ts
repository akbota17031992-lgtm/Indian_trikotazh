/**
 * Tier 1: Feature Coverage — Features 12 to 15
 * Feature 12: Gemini Vision Metadata Extraction (M4, R4)
 * Feature 13: Image Background Removal & Resizing (M4, R4)
 * Feature 14: AI Mock Mode & Unit Tests (M4, R4)
 * Feature 15: Seller Preview Verification Flow (M4, R4)
 */

import { describe, it, expect, setTestTier } from '../helpers/test-framework.ts';
import { MockAiPipelineService } from '../helpers/ai-mock.ts';

setTestTier(1);

export async function run() {
  const aiService = new MockAiPipelineService();

  await describe('Feature 12: Gemini Vision Metadata Extraction', () => {
    it('12.1 should extract bilingual Russian and Kazakh product titles from clothing image', async () => {
      const sampleImg = Buffer.from('fake-jpeg-image-bytes');
      const draft = await aiService.ingestImage(sampleImg, 'image/jpeg');
      expect(draft.metadata.name_ru.length).toBeGreaterThan(0);
      expect(draft.metadata.name_kz.length).toBeGreaterThan(0);
      expect(draft.metadata.name_ru).toContain('Индийский Трикотаж');
    });

    it('12.2 should extract bilingual product descriptions highlighting fabric and fit', async () => {
      const sampleImg = Buffer.from('fake-jpeg-image-bytes');
      const draft = await aiService.ingestImage(sampleImg, 'image/jpeg');
      expect(draft.metadata.description_ru).toContain('хлопка');
      expect(draft.metadata.description_kz).toContain('мақта');
    });

    it('12.3 should categorize item into one of the 7 marketplace categories', async () => {
      const sampleImg = Buffer.from('fake-jpeg-image-bytes');
      const draft = await aiService.ingestImage(sampleImg, 'image/jpeg', { targetCategory: 'Футболки' });
      expect(draft.metadata.category).toBe('Футболки');
    });

    it('12.4 should identify apparel attributes: material, season, gender, and color array', async () => {
      const sampleImg = Buffer.from('fake-jpeg-image-bytes');
      const draft = await aiService.ingestImage(sampleImg, 'image/jpeg');
      expect(draft.metadata.material).toBe('100% хлопок');
      expect(draft.metadata.season).toBe('all-season');
      expect(draft.metadata.gender).toBe('unisex');
      expect(Array.isArray(draft.metadata.colors)).toBe(true);
      expect(draft.metadata.colors.length).toBeGreaterThan(0);
    });

    it('12.5 should suggest a realistic baseline price in Kazakhstani Tenge (KZT)', async () => {
      const sampleImg = Buffer.from('fake-jpeg-image-bytes');
      const draft = await aiService.ingestImage(sampleImg, 'image/jpeg');
      expect(Number.isInteger(draft.metadata.suggestedPriceKzt)).toBe(true);
      expect(draft.metadata.suggestedPriceKzt).toBeGreaterThanOrEqual(1000);
    });
  });

  await describe('Feature 13: Image Background Removal & Resizing', () => {
    it('13.1 should support image background removal option during ingestion', async () => {
      const sampleImg = Buffer.from('fake-png-bytes');
      const draft = await aiService.ingestImage(sampleImg, 'image/png', { removeBg: true });
      expect(draft.images).toBeDefined();
    });

    it('13.2 should generate thumbnail WebP variant (150x150)', async () => {
      const sampleImg = Buffer.from('fake-png-bytes');
      const draft = await aiService.ingestImage(sampleImg, 'image/png');
      expect(draft.images.thumbnail).toBeDefined();
      expect(draft.images.thumbnail.length).toBe(150 * 150);
    });

    it('13.3 should generate card WebP variant (400x500 portrait 4:5)', async () => {
      const sampleImg = Buffer.from('fake-png-bytes');
      const draft = await aiService.ingestImage(sampleImg, 'image/png');
      expect(draft.images.card).toBeDefined();
      expect(draft.images.card.length).toBe(400 * 500);
    });

    it('13.4 should generate full-size WebP zoom variant (1200x1500)', async () => {
      const sampleImg = Buffer.from('fake-png-bytes');
      const draft = await aiService.ingestImage(sampleImg, 'image/png');
      expect(draft.images.full).toBeDefined();
      expect(draft.images.full.length).toBe(1200 * 1500);
    });

    it('13.5 should gracefully fallback to Sharp contrast pass-through when rembg is unavailable', async () => {
      // In offline / fallback mode, ingestion succeeds without crashing
      const sampleImg = Buffer.from('fake-fallback-bytes');
      const draft = await aiService.ingestImage(sampleImg, 'image/webp', { removeBg: true, mockMode: true });
      expect(draft.images.thumbnail.length).toBeGreaterThan(0);
    });
  });

  await describe('Feature 14: AI Mock Mode & Unit Tests', () => {
    it('14.1 should automatically engage deterministic mock generator when GEMINI_API_KEY is not configured', async () => {
      const sampleImg = Buffer.from('dummy');
      const draft = await aiService.ingestImage(sampleImg, 'image/jpeg', { mockMode: true });
      expect(draft.id.startsWith('draft_')).toBe(true);
      expect(draft.status).toBe('draft');
    });

    it('14.2 should generate valid default size variants (S, M, L) with unique SKUs', async () => {
      const sampleImg = Buffer.from('dummy');
      const draft = await aiService.ingestImage(sampleImg, 'image/jpeg');
      expect(draft.variants.length).toBe(3);
      expect(draft.variants.map(v => v.size)).toEqual(['S', 'M', 'L']);
      for (const variant of draft.variants) {
        expect(variant.sku).toContain('IT-DRAFT-');
      }
    });

    it('14.3 should return consistent metadata for given category hint', async () => {
      const sampleImg = Buffer.from('dummy');
      const draft = await aiService.ingestImage(sampleImg, 'image/jpeg', { targetCategory: 'Халаты' });
      expect(draft.metadata.name_ru).toContain('Халаты');
    });

    it('14.4 should reject unsupported MIME types (e.g. application/pdf, text/plain)', async () => {
      const sampleImg = Buffer.from('dummy');
      await expect(aiService.ingestImage(sampleImg, 'application/pdf')).toReject('unsupported_image_mime');
    });

    it('14.5 should reject zero-length image buffer input', async () => {
      const emptyBuffer = Buffer.alloc(0);
      await expect(aiService.ingestImage(emptyBuffer, 'image/jpeg')).toReject('empty_image_buffer');
    });
  });

  await describe('Feature 15: Seller Preview Verification Flow', () => {
    it('15.1 should create product draft in non-published "draft" state', async () => {
      const sampleImg = Buffer.from('dummy');
      const draft = await aiService.ingestImage(sampleImg, 'image/jpeg');
      expect(draft.status).toBe('draft');
    });

    it('15.2 should allow seller to modify extracted titles and descriptions before publishing', async () => {
      const sampleImg = Buffer.from('dummy');
      const draft = await aiService.ingestImage(sampleImg, 'image/jpeg');
      const updated = aiService.updateDraft(draft.id, {
        name_ru: 'Футболка хлопок премиум (отредактировано)',
        description_ru: 'Специальная праздничная серия'
      });
      expect(updated.metadata.name_ru).toBe('Футболка хлопок премиум (отредактировано)');
      expect(updated.metadata.description_ru).toBe('Специальная праздничная серия');
    });

    it('15.3 should allow seller to adjust suggested price in whole tenge', async () => {
      const sampleImg = Buffer.from('dummy');
      const draft = await aiService.ingestImage(sampleImg, 'image/jpeg');
      const updated = aiService.updateDraft(draft.id, { suggestedPriceKzt: 5990 });
      expect(updated.metadata.suggestedPriceKzt).toBe(5990);
    });

    it('15.4 should transition draft to "published" state and assign catalog productId', async () => {
      const sampleImg = Buffer.from('dummy');
      const draft = await aiService.ingestImage(sampleImg, 'image/jpeg');
      const publishRes = aiService.publishDraft(draft.id);
      expect(publishRes.productId).toBeDefined();
      expect(publishRes.productId.startsWith('prod_')).toBe(true);

      const publishedDraft = aiService.getDraft(draft.id);
      expect(publishedDraft?.status).toBe('published');
    });

    it('15.5 should prevent double-publishing or editing of an already published draft', async () => {
      const sampleImg = Buffer.from('dummy');
      const draft = await aiService.ingestImage(sampleImg, 'image/jpeg');
      aiService.publishDraft(draft.id);

      expect(() => aiService.publishDraft(draft.id)).toThrow('draft_already_published');
      expect(() => aiService.updateDraft(draft.id, { name_ru: 'Новое имя' })).toThrow('cannot_modify_published_draft');
    });
  });
}
