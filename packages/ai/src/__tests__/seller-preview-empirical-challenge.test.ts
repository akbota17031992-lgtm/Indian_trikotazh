import { describe, it, expect } from 'vitest';
import { ProductDraftManager } from '../draft/draft-manager.js';
import { AiProductIngestionService } from '../service/ingestion-service.js';
import {
  ingestProductImage,
  updateDraft,
  publishDraft,
  getDraft,
} from '../index.js';
import type { ProductDraft } from '../types/draft.js';

describe('CHALLENGER EMPIRICAL VERIFICATION: Seller Preview State Machine & Financial Invariants', () => {
  const createTestDraft = (id = `draft_empirical_${Date.now()}`): ProductDraft => ({
    id,
    status: 'draft',
    metadata: {
      name_ru: 'Футболка классическая Индийский Трикотаж',
      name_kz: 'Классикалық үнді трикотажы футболкасы',
      description_ru: 'Мягкий премиальный трикотаж из 100% хлопка.',
      description_kz: '100% табиғи мақтадан жасалған жұмсақ трикотаж.',
      category: 'Футболки',
      subcategory: 'Базовые',
      colors: ['Көк', 'Ақ'],
      material: '100% хлопок',
      season: 'all-season',
      gender: 'unisex',
      tags: ['хлопок', 'трикотаж', 'алматы'],
      suggestedPriceKzt: 4990,
    },
    images: {
      thumbnail: Buffer.alloc(150 * 150, 0x11),
      card: Buffer.alloc(400 * 500, 0x22),
      full: Buffer.alloc(1200 * 1500, 0x33),
    },
    variants: [
      { size: 'S', color: 'Көк', sku: 'IT-EMP-S', priceKzt: 4990 },
      { size: 'M', color: 'Көк', sku: 'IT-EMP-M', priceKzt: 4990 },
      { size: 'L', color: 'Көк', sku: 'IT-EMP-L', priceKzt: 4990 },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // =========================================================================
  // SECTION 1: Whole-Tenge Financial Invariant Verification
  // =========================================================================
  describe('1. Financial Invariants (Whole-Tenge Retail Pricing Enforcement)', () => {
    it('1.1 should reject price updates with fractional tiyns (4990.50, 10.99, 0.01)', () => {
      const manager = new ProductDraftManager();
      const draft = createTestDraft();
      manager.saveDraft(draft);

      const fractionalTiynInputs = [
        4990.5,
        10.99,
        0.01,
        0.99,
        4990.01,
        5000.0001,
        14990.75,
        1e-5,
      ];

      for (const badPrice of fractionalTiynInputs) {
        expect(
          () => manager.updateDraft(draft.id, { suggestedPriceKzt: badPrice }),
          `Price ${badPrice} with fractional tiyns must be rejected with suggested_price_must_be_whole_tenge`
        ).toThrow('suggested_price_must_be_whole_tenge');
      }
    });

    it('1.2 should reject price updates with zero, negative, or degenerate amounts', () => {
      const manager = new ProductDraftManager();
      const draft = createTestDraft();
      manager.saveDraft(draft);

      const invalidAmounts = [
        0,
        -0,
        -1,
        -10,
        -4990,
        -4990.5,
        -1000000,
        NaN,
        Infinity,
        -Infinity,
      ];

      for (const invalidPrice of invalidAmounts) {
        expect(
          () => manager.updateDraft(draft.id, { suggestedPriceKzt: invalidPrice }),
          `Price ${invalidPrice} must be rejected with suggested_price_must_be_whole_tenge`
        ).toThrow('suggested_price_must_be_whole_tenge');
      }
    });

    it('1.3 should reject non-number types injected into suggestedPriceKzt', () => {
      const manager = new ProductDraftManager();
      const draft = createTestDraft();
      manager.saveDraft(draft);

      const badTypes = ['4990', null, undefined, {}, true];

      for (const badVal of badTypes) {
        if (badVal === undefined) continue; // undefined means omit update
        expect(() =>
          manager.updateDraft(draft.id, { suggestedPriceKzt: badVal as any })
        ).toThrow('suggested_price_must_be_whole_tenge');
      }
    });

    it('1.4 should accept strictly positive whole-tenge retail prices', () => {
      const manager = new ProductDraftManager();
      const draft = createTestDraft();
      manager.saveDraft(draft);

      const validPrices = [1, 50, 1000, 4990, 5490, 14990, 999999, 10000000];

      for (const validPrice of validPrices) {
        const updated = manager.updateDraft(draft.id, { suggestedPriceKzt: validPrice });
        expect(updated.metadata.suggestedPriceKzt).toBe(validPrice);
        expect(Number.isInteger(updated.metadata.suggestedPriceKzt)).toBe(true);
        expect(updated.metadata.suggestedPriceKzt).toBeGreaterThan(0);
      }
    });

    it('1.5 should enforce whole-tenge invariants on variant prices when updating variants', () => {
      const manager = new ProductDraftManager();
      const draft = createTestDraft();
      manager.saveDraft(draft);

      // Attempt update with fractional variant price
      expect(() =>
        manager.updateDraft(draft.id, {
          variants: [
            { size: 'M', color: 'Көк', sku: 'IT-EMP-M', priceKzt: 4990.5 },
          ],
        })
      ).toThrow();

      // Attempt update with zero variant price
      expect(() =>
        manager.updateDraft(draft.id, {
          variants: [
            { size: 'M', color: 'Көк', sku: 'IT-EMP-M', priceKzt: 0 },
          ],
        })
      ).toThrow();

      // Attempt update with negative variant price
      expect(() =>
        manager.updateDraft(draft.id, {
          variants: [
            { size: 'M', color: 'Көк', sku: 'IT-EMP-M', priceKzt: -500 },
          ],
        })
      ).toThrow();

      // Valid variant prices should succeed
      const updated = manager.updateDraft(draft.id, {
        variants: [
          { size: 'M', color: 'Көк', sku: 'IT-EMP-M', priceKzt: 5490 },
          { size: 'L', color: 'Көк', sku: 'IT-EMP-L', priceKzt: 5990 },
        ],
      });
      expect(updated.variants.length).toBe(2);
      expect(updated.variants[0].priceKzt).toBe(5490);
      expect(updated.variants[1].priceKzt).toBe(5990);
    });
  });

  // =========================================================================
  // SECTION 2: Seller Preview State Machine Transitions & Immutability
  // =========================================================================
  describe('2. Seller Preview State Machine Lifecycle', () => {
    it('2.1 draft starts in "draft" status with undefined publishedProductId', () => {
      const manager = new ProductDraftManager();
      const draft = createTestDraft('draft_init_001');
      manager.saveDraft(draft);

      const retrieved = manager.getDraft('draft_init_001');
      expect(retrieved).toBeDefined();
      expect(retrieved!.status).toBe('draft');
      expect(retrieved!.publishedProductId).toBeUndefined();
    });

    it('2.2 modifying non-existent draft ID throws "draft_not_found"', () => {
      const manager = new ProductDraftManager();
      expect(() =>
        manager.updateDraft('non_existent_draft_999', { name_ru: 'Test' })
      ).toThrow('draft_not_found');
    });

    it('2.3 publishing non-existent draft ID throws "draft_not_found"', () => {
      const manager = new ProductDraftManager();
      expect(() => manager.publishDraft('non_existent_draft_999')).toThrow(
        'draft_not_found'
      );
    });

    it('2.4 publishing transitions status to "published" and assigns product ID starting with "prod_"', () => {
      const manager = new ProductDraftManager();
      const draft = createTestDraft('draft_pub_12345');
      manager.saveDraft(draft);

      const pubRes = manager.publishDraft(draft.id);
      expect(pubRes.productId).toBe('prod_pub_12345');
      expect(pubRes.productId.startsWith('prod_')).toBe(true);
      expect(pubRes.publishedAt).toBeDefined();

      const published = manager.getDraft(draft.id);
      expect(published).toBeDefined();
      expect(published!.status).toBe('published');
      expect(published!.publishedProductId).toBe(pubRes.productId);
    });

    it('2.5 modifying a published draft throws "cannot_modify_published_draft"', () => {
      const manager = new ProductDraftManager();
      const draft = createTestDraft('draft_sealed_01');
      manager.saveDraft(draft);

      manager.publishDraft(draft.id);

      // Attempting any update should be blocked
      expect(() =>
        manager.updateDraft(draft.id, { name_ru: 'Новое имя после публикации' })
      ).toThrow('cannot_modify_published_draft');

      expect(() =>
        manager.updateDraft(draft.id, { suggestedPriceKzt: 7990 })
      ).toThrow('cannot_modify_published_draft');

      expect(() =>
        manager.updateDraft(draft.id, {
          variants: [{ size: 'XL', color: 'Ақ', sku: 'NEW', priceKzt: 4990 }],
        })
      ).toThrow('cannot_modify_published_draft');
    });

    it('2.6 re-publishing an already published draft throws "draft_already_published"', () => {
      const manager = new ProductDraftManager();
      const draft = createTestDraft('draft_double_pub');
      manager.saveDraft(draft);

      manager.publishDraft(draft.id);

      expect(() => manager.publishDraft(draft.id)).toThrow(
        'draft_already_published'
      );
    });

    it('2.7 discarding a draft transitions to "discarded" and blocks modification / publishing', () => {
      const manager = new ProductDraftManager();
      const draft = createTestDraft('draft_discard_01');
      manager.saveDraft(draft);

      manager.discardDraft(draft.id);
      expect(manager.getDraft(draft.id)!.status).toBe('discarded');

      // Modifying discarded draft throws
      expect(() =>
        manager.updateDraft(draft.id, { name_ru: 'Изменение' })
      ).toThrow('cannot_modify_discarded_draft');

      // Publishing discarded draft throws
      expect(() => manager.publishDraft(draft.id)).toThrow(
        'cannot_publish_discarded_draft'
      );
    });

    it('2.8 discarding an already published draft throws "cannot_modify_published_draft"', () => {
      const manager = new ProductDraftManager();
      const draft = createTestDraft('draft_pub_no_discard');
      manager.saveDraft(draft);

      manager.publishDraft(draft.id);

      expect(() => manager.discardDraft(draft.id)).toThrow(
        'cannot_modify_published_draft'
      );
    });
  });

  // =========================================================================
  // SECTION 3: Image Preservation & Partial Update Field Integrity
  // =========================================================================
  describe('3. Image Preservation & Partial Update Invariants', () => {
    it('3.1 preserves original image variants byte-for-byte during partial text updates', () => {
      const manager = new ProductDraftManager();
      const draft = createTestDraft('draft_img_preservation');
      manager.saveDraft(draft);

      const thumbSnapshot = Buffer.from(draft.images.thumbnail);
      const cardSnapshot = Buffer.from(draft.images.card);
      const fullSnapshot = Buffer.from(draft.images.full);

      const updated = manager.updateDraft(draft.id, {
        name_ru: 'Отредактированное название трикотажа',
        name_kz: 'Жаңартылған трикотаж атауы',
      });

      // Byte length preservation
      expect(updated.images.thumbnail.length).toBe(thumbSnapshot.length);
      expect(updated.images.card.length).toBe(cardSnapshot.length);
      expect(updated.images.full.length).toBe(fullSnapshot.length);

      // Buffer content identity
      expect(Buffer.compare(updated.images.thumbnail, thumbSnapshot)).toBe(0);
      expect(Buffer.compare(updated.images.card, cardSnapshot)).toBe(0);
      expect(Buffer.compare(updated.images.full, fullSnapshot)).toBe(0);
    });

    it('3.2 preserves original image variants during price updates', () => {
      const manager = new ProductDraftManager();
      const draft = createTestDraft('draft_price_img');
      manager.saveDraft(draft);

      const originalCard = Buffer.from(draft.images.card);

      const updated = manager.updateDraft(draft.id, {
        suggestedPriceKzt: 6490,
      });

      expect(updated.metadata.suggestedPriceKzt).toBe(6490);
      expect(Buffer.compare(updated.images.card, originalCard)).toBe(0);
    });

    it('3.3 preserves untouched metadata fields when only specific attributes are modified', () => {
      const manager = new ProductDraftManager();
      const draft = createTestDraft('draft_metadata_fields');
      manager.saveDraft(draft);

      const origMaterial = draft.metadata.material;
      const origSeason = draft.metadata.season;
      const origGender = draft.metadata.gender;
      const origCategory = draft.metadata.category;
      const origTags = [...draft.metadata.tags];

      const updated = manager.updateDraft(draft.id, {
        name_ru: 'Новое имя',
        suggestedPriceKzt: 5990,
      });

      expect(updated.metadata.material).toBe(origMaterial);
      expect(updated.metadata.season).toBe(origSeason);
      expect(updated.metadata.gender).toBe(origGender);
      expect(updated.metadata.category).toBe(origCategory);
      expect(updated.metadata.tags).toEqual(origTags);
    });

    it('3.4 preserves original draft ID across consecutive updates', () => {
      const manager = new ProductDraftManager();
      const draft = createTestDraft('draft_stable_id_42');
      manager.saveDraft(draft);

      manager.updateDraft(draft.id, { name_ru: 'Имя 1' });
      manager.updateDraft(draft.id, { suggestedPriceKzt: 5490 });
      const final = manager.updateDraft(draft.id, { description_ru: 'Описание' });

      expect(final.id).toBe('draft_stable_id_42');
    });
  });

  // =========================================================================
  // SECTION 4: AiProductIngestionService and Top-Level Public Interface
  // =========================================================================
  describe('4. AiProductIngestionService & Package Public Exports', () => {
    it('4.1 AiProductIngestionService instance correctly manages draft lifecycle', async () => {
      const service = new AiProductIngestionService();
      const rawImage = Buffer.from('test-image-for-service-lifecycle');

      const draft = await service.ingestImage(rawImage, 'image/jpeg', {
        mockMode: true,
        targetCategory: 'Футболки',
      });

      expect(draft.id.startsWith('draft_')).toBe(true);
      expect(draft.status).toBe('draft');

      // Update draft via service
      const updated = service.updateDraft(draft.id, {
        suggestedPriceKzt: 5490,
        name_ru: 'Футболка премиум из индийского хлопка',
      });
      expect(updated.metadata.suggestedPriceKzt).toBe(5490);

      // Fractional price rejection via service
      expect(() =>
        service.updateDraft(draft.id, { suggestedPriceKzt: 5490.5 })
      ).toThrow('suggested_price_must_be_whole_tenge');

      // Publish draft via service
      const pubRes = service.publishDraft(draft.id);
      expect(pubRes.productId.startsWith('prod_')).toBe(true);

      // Immutability verified via service
      expect(() =>
        service.updateDraft(draft.id, { name_ru: 'Cannot change' })
      ).toThrow('cannot_modify_published_draft');

      // Double-publish verified via service
      expect(() => service.publishDraft(draft.id)).toThrow(
        'draft_already_published'
      );
    });

    it('4.2 top-level exported functions (ingestProductImage, updateDraft, publishDraft, getDraft) work seamlessly', async () => {
      const rawImage = Buffer.from('test-image-for-top-level-api');

      // 1. Ingest via single object contract
      const draft = await ingestProductImage({
        imageBuffer: rawImage,
        mimeType: 'image/png',
        options: { mockMode: true },
      });
      expect(draft.id.startsWith('draft_')).toBe(true);

      // 2. Retrieve draft
      const fetched = getDraft(draft.id);
      expect(fetched).toBeDefined();
      expect(fetched!.id).toBe(draft.id);

      // 3. Update draft
      const updated = updateDraft(draft.id, {
        suggestedPriceKzt: 6990,
      });
      expect(updated.metadata.suggestedPriceKzt).toBe(6990);

      // 4. Invariant check on top-level helper
      expect(() =>
        updateDraft(draft.id, { suggestedPriceKzt: 6990.25 })
      ).toThrow('suggested_price_must_be_whole_tenge');

      // 5. Publish draft
      const pubRes = publishDraft(draft.id);
      expect(pubRes.productId.startsWith('prod_')).toBe(true);

      // 6. Sealed state verified on top-level helper
      expect(() =>
        updateDraft(draft.id, { name_ru: 'Sealed draft name' })
      ).toThrow('cannot_modify_published_draft');
    });
  });
});
