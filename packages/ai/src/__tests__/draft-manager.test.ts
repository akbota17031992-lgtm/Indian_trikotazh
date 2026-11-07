import { describe, it, expect } from 'vitest';
import { ProductDraftManager } from '../draft/draft-manager.js';
import type { ProductDraft } from '../types/draft.js';

describe('ProductDraftManager State Machine & Lifecycle Invariants', () => {
  const createMockDraft = (id = 'draft_1730000000_abc12'): ProductDraft => ({
    id,
    status: 'draft',
    metadata: {
      name_ru: 'Футболка хлопок Индийский Трикотаж',
      name_kz: 'Үнді трикотажы мақта футболкасы',
      description_ru: '100% натуральный индийский хлопок',
      description_kz: '100% табиғи үнді мақтасы',
      category: 'Футболки',
      subcategory: 'Базовые',
      colors: ['Белый', 'Черный'],
      material: '100% хлопок',
      season: 'all-season',
      gender: 'unisex',
      tags: ['хлопок', 'индия'],
      suggestedPriceKzt: 4990,
    },
    images: {
      thumbnail: Buffer.alloc(150 * 150, 0x11),
      card: Buffer.alloc(400 * 500, 0x22),
      full: Buffer.alloc(1200 * 1500, 0x33),
    },
    variants: [
      { size: 'S', color: 'Белый', sku: 'IT-DRAFT-bc12-S', priceKzt: 4990 },
      { size: 'M', color: 'Белый', sku: 'IT-DRAFT-bc12-M', priceKzt: 4990 },
      { size: 'L', color: 'Белый', sku: 'IT-DRAFT-bc12-L', priceKzt: 4990 },
    ],
  });

  it('saves draft in editable "draft" state and retrieves by id', () => {
    const manager = new ProductDraftManager();
    const draft = createMockDraft();
    manager.saveDraft(draft);

    const retrieved = manager.getDraft(draft.id);
    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe(draft.id);
    expect(retrieved?.status).toBe('draft');
  });

  it('allows seller to update titles, descriptions, and whole tenge price (15.2, 15.3)', () => {
    const manager = new ProductDraftManager();
    const draft = createMockDraft();
    manager.saveDraft(draft);

    const updated = manager.updateDraft(draft.id, {
      name_ru: 'Футболка хлопок премиум (отредактировано)',
      description_ru: 'Специальная серия',
      suggestedPriceKzt: 5990,
    });

    expect(updated.metadata.name_ru).toBe('Футболка хлопок премиум (отредактировано)');
    expect(updated.metadata.description_ru).toBe('Специальная серия');
    expect(updated.metadata.suggestedPriceKzt).toBe(5990);
  });

  it('preserves generated image variants and existing metadata during partial updates (B15.5)', () => {
    const manager = new ProductDraftManager();
    const draft = createMockDraft();
    manager.saveDraft(draft);

    const origThumbnailLen = draft.images.thumbnail.length;
    const origCategory = draft.metadata.category;

    const updated = manager.updateDraft(draft.id, {
      name_ru: 'Обновленное название',
    });

    expect(updated.images.thumbnail.length).toBe(origThumbnailLen);
    expect(updated.metadata.category).toBe(origCategory);
    expect(updated.metadata.name_ru).toBe('Обновленное название');
  });

  it('rejects price updates with non-integer tenge or negative amount (B15.1)', () => {
    const manager = new ProductDraftManager();
    const draft = createMockDraft();
    manager.saveDraft(draft);

    expect(() => manager.updateDraft(draft.id, { suggestedPriceKzt: -500 })).toThrow(
      'suggested_price_must_be_whole_tenge'
    );

    expect(() => manager.updateDraft(draft.id, { suggestedPriceKzt: 4990.75 })).toThrow(
      'suggested_price_must_be_whole_tenge'
    );

    expect(() => manager.updateDraft(draft.id, { suggestedPriceKzt: 0 })).toThrow(
      'suggested_price_must_be_whole_tenge'
    );
  });

  it('throws "draft_not_found" when updating non-existent draft (B15.2)', () => {
    const manager = new ProductDraftManager();
    expect(() => manager.updateDraft('non-existent-id', { name_ru: 'Новое имя' })).toThrow(
      'draft_not_found'
    );
  });

  it('transitions draft to "published" and assigns productId starting with "prod_" (15.4)', () => {
    const manager = new ProductDraftManager();
    const draft = createMockDraft('draft_1730000000_xyz99');
    manager.saveDraft(draft);

    const publishResult = manager.publishDraft(draft.id);
    expect(publishResult.productId).toBe('prod_1730000000_xyz99');
    expect(publishResult.publishedAt).toBeDefined();

    const publishedDraft = manager.getDraft(draft.id);
    expect(publishedDraft?.status).toBe('published');
    expect(publishedDraft?.publishedProductId).toBe('prod_1730000000_xyz99');
  });

  it('prevents double-publishing a draft with "draft_already_published" (15.5)', () => {
    const manager = new ProductDraftManager();
    const draft = createMockDraft();
    manager.saveDraft(draft);

    manager.publishDraft(draft.id);
    expect(() => manager.publishDraft(draft.id)).toThrow('draft_already_published');
  });

  it('prevents modifying a published draft with "cannot_modify_published_draft" (15.5)', () => {
    const manager = new ProductDraftManager();
    const draft = createMockDraft();
    manager.saveDraft(draft);

    manager.publishDraft(draft.id);
    expect(() => manager.updateDraft(draft.id, { name_ru: 'Запрещенное изменение' })).toThrow(
      'cannot_modify_published_draft'
    );
  });

  it('throws "draft_not_found" when publishing non-existent draft (B15.4)', () => {
    const manager = new ProductDraftManager();
    expect(() => manager.publishDraft('non-existent-draft')).toThrow('draft_not_found');
  });
});
