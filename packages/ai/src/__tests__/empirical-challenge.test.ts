import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  clampImageDimensions,
  hasAlphaChannel,
  validateAndNormalizeImage,
  MAX_DIM,
  MIN_DIM,
} from '../image/normalizer.js';
import { IMAGE_VARIANTS_CONFIG } from '../image/presets.js';
import { validateImageIngestInput } from '../schemas/ingestion.schema.js';
import { AiClothingMetadataSchema } from '../schemas/metadata.schema.js';
import { ProductDraftManager } from '../draft/draft-manager.js';
import { MockProductAnalyzer } from '../mock/mock-analyzer.js';
import { GeminiVisionClient } from '../vision/gemini-client.js';
import {
  AiProductIngestionService,
  ingestProductImage,
  updateDraft,
  publishDraft,
  getDraft,
} from '../index.js';

describe('EMPIRICAL CHALLENGER STRESS SUITE: Milestone 4 Verification', () => {
  // =========================================================================
  // 1. Dimension Clamping (100px - 1500px) & Extreme Proportions
  // =========================================================================
  describe('Dimension Clamping Boundaries (B12.1)', () => {
    it('1.1 should clamp high-res portrait and landscape down to MAX_DIM = 1500 preserving ratio', () => {
      // 8000x6000 (landscape 4:3)
      const landscape = clampImageDimensions(8000, 6000);
      expect(landscape.width).toBe(1500);
      expect(landscape.height).toBe(1125);
      expect(landscape.width / landscape.height).toBeCloseTo(8000 / 6000, 2);

      // 6000x8000 (portrait 3:4)
      const portrait = clampImageDimensions(6000, 8000);
      expect(portrait.width).toBe(1125);
      expect(portrait.height).toBe(1500);
      expect(portrait.width / portrait.height).toBeCloseTo(6000 / 8000, 2);

      // 4000x4000 (square 1:1)
      const square = clampImageDimensions(4000, 4000);
      expect(square.width).toBe(1500);
      expect(square.height).toBe(1500);
    });

    it('1.2 should clamp low-res images up to MIN_DIM = 100', () => {
      // 50x50 icon
      const icon = clampImageDimensions(50, 50);
      expect(icon.width).toBe(100);
      expect(icon.height).toBe(100);

      // 80x40 tiny banner
      const banner = clampImageDimensions(80, 40);
      expect(banner.width).toBe(100);
      expect(banner.height).toBe(100);

      // 1x1 pixel edge case
      const singlePixel = clampImageDimensions(1, 1);
      expect(singlePixel.width).toBe(100);
      expect(singlePixel.height).toBe(100);
    });

    it('1.3 should leave dimensions within bounds [100, 1500] untouched', () => {
      const standard = clampImageDimensions(800, 1000);
      expect(standard.width).toBe(800);
      expect(standard.height).toBe(1000);

      const exactMin = clampImageDimensions(100, 100);
      expect(exactMin.width).toBe(100);
      expect(exactMin.height).toBe(100);

      const exactMax = clampImageDimensions(1500, 1500);
      expect(exactMax.width).toBe(1500);
      expect(exactMax.height).toBe(1500);
    });

    it('1.4 should clamp extreme asymmetrical aspect ratios (e.g. 10000x500 panorama / 500x10000 ribbon)', () => {
      // 10000x500 -> scale = 1500 / 10000 = 0.15 -> w: 1500, h: max(100, round(75)) = 100
      const panorama = clampImageDimensions(10000, 500);
      expect(panorama.width).toBe(1500);
      expect(panorama.height).toBe(100);

      // 500x10000 -> scale = 1500 / 10000 = 0.15 -> w: max(100, round(75)) = 100, h: 1500
      const ribbon = clampImageDimensions(500, 10000);
      expect(ribbon.width).toBe(100);
      expect(ribbon.height).toBe(1500);
    });

    it('1.5 should handle zero or sub-zero edge cases without NaN or infinite loops', () => {
      const zeroDim = clampImageDimensions(0, 0);
      expect(zeroDim.width).toBe(100);
      expect(zeroDim.height).toBe(100);
    });
  });

  // =========================================================================
  // 2. Aspect Ratio Invariants (B13.2, B13.3)
  // =========================================================================
  describe('Image Preset Aspect Ratios (B13.2, B13.3)', () => {
    it('2.1 card variant must maintain 4:5 fashion portrait aspect ratio (0.8)', () => {
      const { width, height } = IMAGE_VARIANTS_CONFIG.card;
      expect(width).toBe(400);
      expect(height).toBe(500);
      expect(width / height).toBe(0.8);
    });

    it('2.2 thumbnail variant must maintain 1:1 square aspect ratio (1.0)', () => {
      const { width, height } = IMAGE_VARIANTS_CONFIG.thumbnail;
      expect(width).toBe(150);
      expect(height).toBe(150);
      expect(width / height).toBe(1.0);
    });

    it('2.3 full variant must maintain 4:5 aspect ratio (0.8) with 1200x1500', () => {
      const { width, height } = IMAGE_VARIANTS_CONFIG.full;
      expect(width).toBe(1200);
      expect(height).toBe(1500);
      expect(width / height).toBe(0.8);
    });

    it('2.4 alpha channel detection matches expected image types', () => {
      expect(hasAlphaChannel('image/png')).toBe(true);
      expect(hasAlphaChannel('image/webp')).toBe(true);
      expect(hasAlphaChannel('image/jpeg')).toBe(false);
      expect(hasAlphaChannel('application/octet-stream')).toBe(false);
    });
  });

  // =========================================================================
  // 3. Empty Buffer and Input Rejection
  // =========================================================================
  describe('Buffer & Ingest Input Boundaries', () => {
    it('3.1 rejects zero-length Buffer with "empty_image_buffer"', () => {
      expect(() => validateImageIngestInput(Buffer.alloc(0), 'image/jpeg')).toThrow(
        'empty_image_buffer'
      );
    });

    it('3.2 rejects zero-length Uint8Array with "empty_image_buffer"', () => {
      expect(() => validateImageIngestInput(new Uint8Array(0), 'image/png')).toThrow(
        'empty_image_buffer'
      );
    });

    it('3.3 rejects null or undefined image buffer with "empty_image_buffer"', () => {
      expect(() => validateImageIngestInput(null as any, 'image/jpeg')).toThrow(
        'empty_image_buffer'
      );
      expect(() => validateImageIngestInput(undefined as any, 'image/jpeg')).toThrow(
        'empty_image_buffer'
      );
    });

    it('3.4 validateAndNormalizeImage rejects empty buffer async', async () => {
      await expect(validateAndNormalizeImage(Buffer.alloc(0), 'image/jpeg')).rejects.toThrow(
        'empty_image_buffer'
      );
    });
  });

  // =========================================================================
  // 4. Unsupported MIME Types Rejection
  // =========================================================================
  describe('MIME Type Rejection Matrix', () => {
    const invalidMimes = [
      'application/pdf',
      'image/gif',
      'image/svg+xml',
      'image/bmp',
      'text/html',
      'text/plain',
      'application/json',
      'application/octet-stream',
      '',
      'IMAGE/JPEG', // case-sensitive check
    ];

    for (const mime of invalidMimes) {
      it(`4.1 should reject invalid MIME type "${mime}"`, () => {
        const dummyBuf = Buffer.from('test-image-data');
        expect(() => validateImageIngestInput(dummyBuf, mime)).toThrow(
          `unsupported_image_mime: ${mime}`
        );
      });
    }

    it('4.2 should accept supported MIME types: image/jpeg, image/png, image/webp', () => {
      const dummyBuf = Buffer.from('test-image-data');
      for (const validMime of ['image/jpeg', 'image/png', 'image/webp'] as const) {
        const result = validateImageIngestInput(dummyBuf, validMime);
        expect(result.mime).toBe(validMime);
        expect(Buffer.isBuffer(result.buffer)).toBe(true);
      }
    });
  });

  // =========================================================================
  // 5. Large Buffer Stress (> 5MB)
  // =========================================================================
  describe('Large Buffer Stress Handling (B14.4)', () => {
    it('5.1 handles 5MB buffer without memory exhaustion', async () => {
      const fiveMbBuffer = Buffer.alloc(5 * 1024 * 1024, 0x5a);
      const service = new AiProductIngestionService();
      const draft = await service.ingestImage(fiveMbBuffer, 'image/jpeg', { mockMode: true });

      expect(draft.id).toBeDefined();
      expect(draft.status).toBe('draft');
      expect(draft.images.thumbnail.length).toBe(150 * 150);
      expect(draft.images.card.length).toBe(400 * 500);
      expect(draft.images.full.length).toBe(1200 * 1500);
    });

    it('5.2 handles 8MB buffer ingestion with deterministic metadata extraction', async () => {
      const eightMbBuffer = Buffer.alloc(8 * 1024 * 1024, 0x3c);
      const analyzer = new MockProductAnalyzer();
      const meta = analyzer.generateMetadata(eightMbBuffer, 'Халаты');

      expect(meta.category).toBe('Халаты');
      expect(meta.suggestedPriceKzt).toBeGreaterThanOrEqual(1000);
      expect(Number.isInteger(meta.suggestedPriceKzt)).toBe(true);
    });

    it('5.3 handles 10MB buffer through top-level ingestProductImage helper', async () => {
      const tenMbBuffer = Buffer.alloc(10 * 1024 * 1024, 0x7e);
      const draft = await ingestProductImage({
        imageBuffer: tenMbBuffer,
        mimeType: 'image/png',
        options: { mockMode: true },
      });

      expect(draft.id).toBeDefined();
      expect(draft.variants.length).toBe(3);
    });
  });

  // =========================================================================
  // 6. Gemini Vision Remote Failure & HTTP 429 Graceful Fallback (B12.2)
  // =========================================================================
  describe('Gemini Vision Fallback & HTTP 429 Resilience (B12.2)', () => {
    const originalFetch = globalThis.fetch;

    afterEach(() => {
      globalThis.fetch = originalFetch;
    });

    it('6.1 falls back to MockProductAnalyzer when HTTP 429 Rate Limit occurs', async () => {
      // Mock global fetch to simulate HTTP 429
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        text: async () => JSON.stringify({ error: { code: 429, message: 'Resource exhausted (quota)' } }),
      } as Response);

      const client = new GeminiVisionClient({ apiKey: 'active-test-key-12345' });
      expect(client.isLiveMode()).toBe(true);

      const sample = Buffer.from('test-photo-data');
      const metadata = await client.analyzeApparelPhoto(sample, 'image/jpeg', 'Футболки');

      // Valid metadata returned despite 429
      expect(metadata).toBeDefined();
      expect(metadata.category).toBe('Футболки');
      expect(metadata.name_ru).toContain('Индийский Трикотаж');
      expect(metadata.description_kz).toContain('мақта');
      expect(Number.isInteger(metadata.suggestedPriceKzt)).toBe(true);
    });

    it('6.2 falls back to MockProductAnalyzer when HTTP 500 Server Error occurs', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      } as Response);

      const client = new GeminiVisionClient({ apiKey: 'active-test-key-12345' });
      const sample = Buffer.from('test-photo-data');
      const metadata = await client.analyzeApparelPhoto(sample, 'image/jpeg', 'Пижамы');

      expect(metadata.category).toBe('Пижамы');
    });

    it('6.3 falls back when fetch throws network error (e.g. offline / DNS failure)', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('fetch failed: ENOTFOUND'));

      const client = new GeminiVisionClient({ apiKey: 'active-test-key-12345' });
      const sample = Buffer.from('test-photo-data');
      const metadata = await client.analyzeApparelPhoto(sample, 'image/jpeg', 'Лонгсливы');

      expect(metadata.category).toBe('Лонгсливы');
    });

    it('6.4 falls back when remote response contains empty candidate text', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ candidates: [] }),
      } as Response);

      const client = new GeminiVisionClient({ apiKey: 'active-test-key-12345' });
      const sample = Buffer.from('test-photo-data');
      const metadata = await client.analyzeApparelPhoto(sample, 'image/jpeg', 'Халаты');

      expect(metadata.category).toBe('Халаты');
    });

    it('6.5 instant fallback when apiKey is missing, empty, or equals "mock"', async () => {
      const clientMockKey = new GeminiVisionClient({ apiKey: 'mock' });
      expect(clientMockKey.isLiveMode()).toBe(false);

      const clientNoKey = new GeminiVisionClient({ apiKey: '' });
      expect(clientNoKey.isLiveMode()).toBe(false);

      const sample = Buffer.from('test-photo-data');
      const meta = await clientMockKey.analyzeApparelPhoto(sample, 'image/jpeg', 'Термобелье');
      expect(meta.category).toBe('Термобелье');
    });
  });

  // =========================================================================
  // 7. Wholesale Tenge & Price Invariants (Anti-Tiyn Protection, B15.1)
  // =========================================================================
  describe('Price Invariants & Anti-Tiyn Protection (B15.1)', () => {
    it('7.1 rejects decimal / fractional tiyns in metadata schema parse', () => {
      const template = {
        name_ru: 'Футболка',
        name_kz: 'Футболка',
        description_ru: 'Описание',
        description_kz: 'Сипаттама',
        category: 'Футболки',
        colors: ['Белый'],
      };

      const decimalPrices = [4990.5, 4990.01, 1000.99, 0.5];
      for (const price of decimalPrices) {
        expect(() =>
          AiClothingMetadataSchema.parse({ ...template, suggestedPriceKzt: price })
        ).toThrow('suggested_price_must_be_whole_tenge');
      }
    });

    it('7.2 rejects zero and negative prices in metadata schema parse', () => {
      const template = {
        name_ru: 'Футболка',
        name_kz: 'Футболка',
        description_ru: 'Описание',
        description_kz: 'Сипаттама',
        category: 'Футболки',
        colors: ['Белый'],
      };

      expect(() =>
        AiClothingMetadataSchema.parse({ ...template, suggestedPriceKzt: 0 })
      ).toThrow('suggested_price_must_be_whole_tenge');

      expect(() =>
        AiClothingMetadataSchema.parse({ ...template, suggestedPriceKzt: -100 })
      ).toThrow('suggested_price_must_be_whole_tenge');
    });

    it('7.3 rejects NaN, Infinity, and non-number types in draft manager updates', () => {
      const manager = new ProductDraftManager();
      const sample = Buffer.from('sample');
      const analyzer = new MockProductAnalyzer();
      const meta = analyzer.generateMetadata(sample, 'Футболки');

      const draft: any = {
        id: 'draft_test_123',
        status: 'draft',
        metadata: meta,
        images: { thumbnail: Buffer.alloc(10), card: Buffer.alloc(10), full: Buffer.alloc(10) },
        variants: [],
      };
      manager.saveDraft(draft);

      expect(() => manager.updateDraft('draft_test_123', { suggestedPriceKzt: NaN })).toThrow(
        'suggested_price_must_be_whole_tenge'
      );

      expect(() => manager.updateDraft('draft_test_123', { suggestedPriceKzt: Infinity })).toThrow(
        'suggested_price_must_be_whole_tenge'
      );

      expect(() => manager.updateDraft('draft_test_123', { suggestedPriceKzt: -1 })).toThrow(
        'suggested_price_must_be_whole_tenge'
      );

      expect(() => manager.updateDraft('draft_test_123', { suggestedPriceKzt: 4990.25 })).toThrow(
        'suggested_price_must_be_whole_tenge'
      );
    });

    it('7.4 accepts valid whole tenge integers', () => {
      const manager = new ProductDraftManager();
      const sample = Buffer.from('sample');
      const analyzer = new MockProductAnalyzer();
      const meta = analyzer.generateMetadata(sample, 'Футболки');

      const draft: any = {
        id: 'draft_test_whole',
        status: 'draft',
        metadata: meta,
        images: { thumbnail: Buffer.alloc(10), card: Buffer.alloc(10), full: Buffer.alloc(10) },
        variants: [],
      };
      manager.saveDraft(draft);

      const updated = manager.updateDraft('draft_test_whole', { suggestedPriceKzt: 7990 });
      expect(updated.metadata.suggestedPriceKzt).toBe(7990);
    });
  });

  // =========================================================================
  // 8. Tag Sanitization Boundaries (B12.4)
  // =========================================================================
  describe('Tag Sanitization Boundaries (B12.4)', () => {
    it('8.1 trims, lowercases, filters empty strings, and deduplicates tags', () => {
      const dirtyTags = ['  Хлопок ', 'ХЛОПОК', '', '   ', 'ИНДИЯ', 'индия', 'базовая', ' БАЗОВАЯ '];
      const parsed = AiClothingMetadataSchema.parse({
        name_ru: 'Футболка',
        name_kz: 'Футболка',
        description_ru: 'Описание',
        description_kz: 'Сипаттама',
        category: 'Футболки',
        colors: ['Белый'],
        suggestedPriceKzt: 4990,
        tags: dirtyTags,
      });

      expect(parsed.tags).toEqual(['хлопок', 'индия', 'базовая']);
    });

    it('8.2 preserves Kazakh Cyrillic characters in tags', () => {
      const kazakhTags = ['мақта', 'үнді трикотажы', 'жайлы'];
      const parsed = AiClothingMetadataSchema.parse({
        name_ru: 'Футболка',
        name_kz: 'Футболка',
        description_ru: 'Описание',
        description_kz: 'Сипаттама',
        category: 'Футболки',
        colors: ['Белый'],
        suggestedPriceKzt: 4990,
        tags: kazakhTags,
      });

      expect(parsed.tags).toEqual(['мақта', 'үнді трикотажы', 'жайлы']);
    });
  });

  // =========================================================================
  // 9. State Machine Transitions & Invariants (Feature 15)
  // =========================================================================
  describe('Product Draft State Machine Invariants', () => {
    it('9.1 enforces full lifecycle: draft -> update -> publish -> locked', () => {
      const manager = new ProductDraftManager();
      const draftId = 'draft_lifecycle_01';
      const sample = Buffer.from('sample');
      const analyzer = new MockProductAnalyzer();
      const meta = analyzer.generateMetadata(sample, 'Футболки');

      const draft: any = {
        id: draftId,
        status: 'draft',
        metadata: meta,
        images: { thumbnail: Buffer.alloc(10), card: Buffer.alloc(10), full: Buffer.alloc(10) },
        variants: analyzer.generateDefaultVariants(draftId, meta),
      };
      manager.saveDraft(draft);

      // Status is draft
      expect(manager.getDraft(draftId)?.status).toBe('draft');

      // Update in draft state succeeds
      manager.updateDraft(draftId, { name_ru: 'Новое имя' });
      expect(manager.getDraft(draftId)?.metadata.name_ru).toBe('Новое имя');

      // Publish draft
      const pub = manager.publishDraft(draftId);
      expect(pub.productId).toBe('prod_lifecycle_01');
      expect(manager.getDraft(draftId)?.status).toBe('published');

      // Update on published draft blocked
      expect(() => manager.updateDraft(draftId, { name_ru: 'Запрещено' })).toThrow(
        'cannot_modify_published_draft'
      );

      // Re-publish blocked
      expect(() => manager.publishDraft(draftId)).toThrow('draft_already_published');
    });

    it('9.2 enforces discard flow: draft -> discarded -> locked', () => {
      const manager = new ProductDraftManager();
      const draftId = 'draft_discard_01';
      const sample = Buffer.from('sample');
      const analyzer = new MockProductAnalyzer();
      const meta = analyzer.generateMetadata(sample, 'Футболки');

      const draft: any = {
        id: draftId,
        status: 'draft',
        metadata: meta,
        images: { thumbnail: Buffer.alloc(10), card: Buffer.alloc(10), full: Buffer.alloc(10) },
        variants: [],
      };
      manager.saveDraft(draft);

      manager.discardDraft(draftId);
      expect(manager.getDraft(draftId)?.status).toBe('discarded');

      // Updates blocked
      expect(() => manager.updateDraft(draftId, { name_ru: 'Fail' })).toThrow(
        'cannot_modify_discarded_draft'
      );

      // Publish blocked
      expect(() => manager.publishDraft(draftId)).toThrow('cannot_publish_discarded_draft');
    });

    it('9.3 throws draft_not_found for all operations on unknown draft IDs', () => {
      const manager = new ProductDraftManager();
      expect(() => manager.updateDraft('unknown_id', { name_ru: 'X' })).toThrow('draft_not_found');
      expect(() => manager.publishDraft('unknown_id')).toThrow('draft_not_found');
      expect(() => manager.discardDraft('unknown_id')).toThrow('draft_not_found');
      expect(manager.getDraft('unknown_id')).toBeUndefined();
    });
  });

  // =========================================================================
  // 10. High-Concurrency Stress
  // =========================================================================
  describe('Concurrent Ingestion Stress', () => {
    it('10.1 ingests 30 items concurrently with zero collision or corruption', async () => {
      const service = new AiProductIngestionService();
      const categories = [
        'Футболки',
        'Лонгсливы',
        'Халаты',
        'Пижамы',
        'Термобелье',
        'Детская одежда',
        'Домашний текстиль',
      ];

      const promises = Array.from({ length: 30 }, async (_, i) => {
        const buf = Buffer.alloc(1024, i + 1);
        const cat = categories[i % categories.length]!;
        return service.ingestImage(buf, 'image/jpeg', { mockMode: true, targetCategory: cat });
      });

      const drafts = await Promise.all(promises);

      // 30 unique draft IDs
      const idSet = new Set(drafts.map((d) => d.id));
      expect(idSet.size).toBe(30);

      // All 30 drafts exist in draftManager
      for (const draft of drafts) {
        const stored = service.getDraft(draft.id);
        expect(stored).toBeDefined();
        expect(stored?.metadata.category).toBeDefined();
        expect(stored?.variants.length).toBe(3);
      }
    });
  });

  // =========================================================================
  // 11. Contract 3 Call Signatures (PROJECT.md)
  // =========================================================================
  describe('Interface Contract 3 Overloads', () => {
    it('11.1 supports Contract 3 single-object input signature', async () => {
      const sample = Buffer.from('contract-test');
      const draft = await ingestProductImage({
        imageBuffer: sample,
        mimeType: 'image/png',
        options: { mockMode: true, targetCategory: 'Детская одежда' },
      });

      expect(draft.id).toBeDefined();
      expect(draft.metadata.category).toBe('Детская одежда');
      expect(draft.images.thumbnail).toBeDefined();
      expect(draft.images.card).toBeDefined();
      expect(draft.images.full).toBeDefined();
      expect(draft.variants.length).toBe(3);
    });

    it('11.2 supports positional arguments (buffer, mime, options)', async () => {
      const sample = Buffer.from('contract-test-2');
      const draft = await ingestProductImage(sample, 'image/jpeg', {
        mockMode: true,
        targetCategory: 'Домашний текстиль',
      });

      expect(draft.id).toBeDefined();
      expect(draft.metadata.category).toBe('Домашний текстиль');
    });
  });
});
