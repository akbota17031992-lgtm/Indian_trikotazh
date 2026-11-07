import { describe, it, expect } from 'vitest';
import { MockProductAnalyzer } from '../mock/mock-analyzer.js';

describe('MockProductAnalyzer', () => {
  const analyzer = new MockProductAnalyzer();
  const sampleBuffer = Buffer.from('india-trikotaj-sample-garment-image-bytes');

  it('generates deterministic metadata for identical image buffer and category hint', () => {
    const meta1 = analyzer.generateMetadata(sampleBuffer, 'Футболки');
    const meta2 = analyzer.generateMetadata(sampleBuffer, 'Футболки');

    expect(meta1.name_ru).toBe(meta2.name_ru);
    expect(meta1.category).toBe(meta2.category);
    expect(meta1.suggestedPriceKzt).toBe(meta2.suggestedPriceKzt);
    expect(meta1.colors).toEqual(meta2.colors);
  });

  it('covers all 7 core clothing categories via slugs and Russian display names', () => {
    const categoriesToTest = [
      { hint: 't-shirts', expectedRu: 'Футболки' },
      { hint: 'Футболки', expectedRu: 'Футболки' },
      { hint: 'long-sleeves', expectedRu: 'Лонгсливы' },
      { hint: 'Лонгсливы', expectedRu: 'Лонгсливы' },
      { hint: 'robes', expectedRu: 'Халаты' },
      { hint: 'Халаты', expectedRu: 'Халаты' },
      { hint: 'pajamas', expectedRu: 'Пижамы' },
      { hint: 'Пижамы', expectedRu: 'Пижамы' },
      { hint: 'thermal-underwear', expectedRu: 'Термобелье' },
      { hint: 'Термобелье', expectedRu: 'Термобелье' },
      { hint: 'kids-clothing', expectedRu: 'Детская одежда' },
      { hint: 'Детская одежда', expectedRu: 'Детская одежда' },
      { hint: 'home-textiles', expectedRu: 'Домашний текстиль' },
      { hint: 'Домашний текстиль', expectedRu: 'Домашний текстиль' },
    ];

    for (const testCase of categoriesToTest) {
      const meta = analyzer.generateMetadata(sampleBuffer, testCase.hint);
      expect(meta.category).toBe(testCase.expectedRu);
      expect(meta.name_ru).toContain('Индийский Трикотаж');
      expect(meta.name_kz).toContain('Үнді трикотажы');
      expect(meta.description_ru).toContain('хлопка');
      expect(meta.description_kz).toContain('мақта');
    }
  });

  it('defaults unrecognized category hints to "Футболки" per B14.3', () => {
    const meta = analyzer.generateMetadata(sampleBuffer, 'НеизвестнаяКатегория');
    expect(meta.category).toBe('Футболки');
    expect(meta.name_ru).toContain('Индийский Трикотаж');
  });

  it('defaults undefined or empty category hint to "Футболки"', () => {
    const metaEmpty = analyzer.generateMetadata(sampleBuffer, '');
    expect(metaEmpty.category).toBe('Футболки');

    const metaUndef = analyzer.generateMetadata(sampleBuffer, undefined);
    expect(metaUndef.category).toBe('Футболки');
  });

  it('generates 3 default clothing size variants (S, M, L) with unique SKUs and matching prices', () => {
    const metadata = analyzer.generateMetadata(sampleBuffer, 'Футболки');
    const draftId = 'draft_1730000000_abcd1';
    const variants = analyzer.generateDefaultVariants(draftId, metadata);

    expect(variants.length).toBe(3);
    expect(variants.map((v) => v.size)).toEqual(['S', 'M', 'L']);

    for (const variant of variants) {
      expect(variant.sku).toContain('IT-DRAFT-');
      expect(variant.sku.endsWith(`-${variant.size}`)).toBe(true);
      expect(variant.priceKzt).toBe(metadata.suggestedPriceKzt);
      expect(Number.isInteger(variant.priceKzt)).toBe(true);
      expect(variant.priceKzt).toBeGreaterThanOrEqual(1000);
    }
  });
});
