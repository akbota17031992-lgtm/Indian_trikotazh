import { describe, it, expect } from 'vitest';
import {
  AiProductIngestionService,
  ingestProductImage,
  updateDraft,
  publishDraft,
  getDraft,
} from '../index.js';

describe('AI Product Ingestion Service & Unified Public API', () => {
  const sampleImage = Buffer.from('india-trikotaj-sample-cotton-tshirt-bytes');

  it('ingests photo via AiProductIngestionService and produces complete draft (Feature 12-14)', async () => {
    const service = new AiProductIngestionService();
    const draft = await service.ingestImage(sampleImage, 'image/jpeg', {
      mockMode: true,
      targetCategory: 'Футболки',
    });

    expect(draft.id).toBeDefined();
    expect(draft.id.startsWith('draft_')).toBe(true);
    expect(draft.status).toBe('draft');

    // Bilingual metadata
    expect(draft.metadata.name_ru).toContain('Индийский Трикотаж');
    expect(draft.metadata.name_kz).toContain('Үнді трикотажы');
    expect(draft.metadata.description_ru).toContain('хлопка');
    expect(draft.metadata.description_kz).toContain('мақта');
    expect(draft.metadata.category).toBe('Футболки');
    expect(draft.metadata.material).toBe('100% хлопок');
    expect(Number.isInteger(draft.metadata.suggestedPriceKzt)).toBe(true);
    expect(draft.metadata.suggestedPriceKzt).toBeGreaterThanOrEqual(1000);

    // Image variants
    expect(draft.images.thumbnail).toBeDefined();
    expect(draft.images.thumbnail.length).toBe(150 * 150);
    expect(draft.images.card).toBeDefined();
    expect(draft.images.card.length).toBe(400 * 500);
    expect(draft.images.full).toBeDefined();
    expect(draft.images.full.length).toBe(1200 * 1500);

    // Clothing size variants
    expect(draft.variants.length).toBe(3);
    expect(draft.variants.map((v) => v.size)).toEqual(['S', 'M', 'L']);
  });

  it('fulfills PROJECT.md Contract 3 via standalone ingestProductImage with single-object argument', async () => {
    const draft = await ingestProductImage({
      imageBuffer: sampleImage,
      mimeType: 'image/png',
      options: { mockMode: true, targetCategory: 'Халаты' },
    });

    expect(draft.id.startsWith('draft_')).toBe(true);
    expect(draft.metadata.name_ru).toContain('Халаты');
    expect(draft.metadata.category).toBe('Халаты');
  });

  it('supports positional arguments overload (imageBuffer, mimeType, options)', async () => {
    const draft = await ingestProductImage(sampleImage, 'image/webp', {
      mockMode: true,
      targetCategory: 'Пижамы',
    });

    expect(draft.id.startsWith('draft_')).toBe(true);
    expect(draft.metadata.category).toBe('Пижамы');
  });

  it('rejects zero-length image buffer with "empty_image_buffer"', async () => {
    const emptyBuf = Buffer.alloc(0);
    await expect(ingestProductImage(emptyBuf, 'image/jpeg')).rejects.toThrow('empty_image_buffer');
  });

  it('rejects unsupported MIME type with "unsupported_image_mime"', async () => {
    await expect(ingestProductImage(sampleImage, 'application/pdf')).rejects.toThrow(
      'unsupported_image_mime: application/pdf'
    );
  });

  it('executes full end-to-end seller preview and publish flow', async () => {
    // 1. Ingest
    const draft = await ingestProductImage(sampleImage, 'image/jpeg', { mockMode: true });

    // 2. Seller modifies title and retail price
    const updated = updateDraft(draft.id, {
      name_ru: 'Футболка премиум индийский хлопок (Отредактировано)',
      suggestedPriceKzt: 5490,
    });
    expect(updated.metadata.name_ru).toBe('Футболка премиум индийский хлопок (Отредактировано)');
    expect(updated.metadata.suggestedPriceKzt).toBe(5490);

    // 3. Seller publishes draft
    const publishRes = publishDraft(draft.id);
    expect(publishRes.productId).toBeDefined();
    expect(publishRes.productId.startsWith('prod_')).toBe(true);

    // 4. Invariants after publish
    const stored = getDraft(draft.id);
    expect(stored?.status).toBe('published');
    expect(stored?.publishedProductId).toBe(publishRes.productId);

    // 5. Subsequent modifications blocked
    expect(() => updateDraft(draft.id, { name_ru: 'Another title' })).toThrow(
      'cannot_modify_published_draft'
    );
    expect(() => publishDraft(draft.id)).toThrow('draft_already_published');
  });
});
