import { describe, it, expect } from 'vitest';
import { AiClothingMetadataSchema, ColorItemSchema } from '../schemas/metadata.schema.js';
import { DraftUpdateSchema } from '../schemas/draft.schema.js';

describe('Metadata & Draft Schema Validation', () => {
  it('validates a complete, authentic apparel metadata record', () => {
    const validData = {
      name_ru: 'Футболка базовая темно-синяя Индийский Трикотаж',
      name_kz: 'Үнді трикотажы қара-көк түсті базалық футболкасы',
      description_ru: 'Мягкий премиальный индийский трикотаж из натурального 100% хлопка.',
      description_kz: '100% табиғи мақтадан жасалған жұмсақ премиум үнді трикотажы.',
      category: 'Футболки',
      subcategory: 'Базовые',
      colors: ['Темно-синий', 'Белый'],
      material: '100% хлопок',
      season: 'all-season',
      gender: 'unisex',
      tags: ['  хлопок ', 'ХЛОПОК', '', 'индия', 'базовая'],
      suggestedPriceKzt: 4990,
    };

    const parsed = AiClothingMetadataSchema.parse(validData);
    expect(parsed.name_ru).toBe('Футболка базовая темно-синяя Индийский Трикотаж');
    expect(parsed.suggestedPriceKzt).toBe(4990);
    // Tags sanitization: lowercase, trimmed, deduplicated, empty removed
    expect(parsed.tags).toEqual(['хлопок', 'индия', 'базовая']);
  });

  it('rejects suggested price with decimal tiyns (suggested_price_must_be_whole_tenge)', () => {
    const decimalData = {
      name_ru: 'Футболка Индийский Трикотаж',
      name_kz: 'Үнді трикотажы футболкасы',
      description_ru: '100% хлопок',
      description_kz: '100% мақта',
      category: 'Футболки',
      colors: ['Белый'],
      suggestedPriceKzt: 4990.5,
    };

    expect(() => AiClothingMetadataSchema.parse(decimalData)).toThrow('suggested_price_must_be_whole_tenge');
  });

  it('rejects negative or zero suggested price', () => {
    const negativeData = {
      name_ru: 'Футболка',
      name_kz: 'Футболка',
      description_ru: '100% хлопок',
      description_kz: '100% мақта',
      category: 'Футболки',
      colors: ['Белый'],
      suggestedPriceKzt: -500,
    };

    expect(() => AiClothingMetadataSchema.parse(negativeData)).toThrow('suggested_price_must_be_whole_tenge');

    const zeroData = { ...negativeData, suggestedPriceKzt: 0 };
    expect(() => AiClothingMetadataSchema.parse(zeroData)).toThrow('suggested_price_must_be_whole_tenge');
  });

  it('rejects empty or whitespace-only product titles', () => {
    const emptyTitle = {
      name_ru: '   ',
      name_kz: 'Футболка',
      description_ru: '100% хлопок',
      description_kz: '100% мақта',
      category: 'Футболки',
      colors: ['Белый'],
      suggestedPriceKzt: 3990,
    };

    expect(() => AiClothingMetadataSchema.parse(emptyTitle)).toThrow();
  });

  it('rejects empty color arrays', () => {
    const emptyColors = {
      name_ru: 'Футболка Индийский Трикотаж',
      name_kz: 'Үнді трикотажы футболкасы',
      description_ru: '100% хлопок',
      description_kz: '100% мақта',
      category: 'Футболки',
      colors: [],
      suggestedPriceKzt: 3990,
    };

    expect(() => AiClothingMetadataSchema.parse(emptyColors)).toThrow();
  });

  it('preserves native Kazakh Cyrillic alphabet glyphs', () => {
    const kazakhData = {
      name_ru: 'Халат махровый Индийский Трикотаж',
      name_kz: 'Үнді трикотажы әдемі шапаны (Ә, І, Ң, Ғ, Ү, Ұ, Қ, Ө, Һ)',
      description_ru: '100% хлопок высшего качества',
      description_kz: '100% табиғи үнді мақтасынан жасалған жайлы үй шапаны',
      category: 'Халаты',
      colors: ['Көк', 'Ақ'],
      suggestedPriceKzt: 11990,
    };

    const parsed = AiClothingMetadataSchema.parse(kazakhData);
    expect(parsed.name_kz).toContain('Ә, І, Ң, Ғ, Ү, Ұ, Қ, Ө, Һ');
  });

  it('validates partial updates in DraftUpdateSchema while enforcing price invariants', () => {
    const validUpdate = {
      name_ru: 'Новое название',
      suggestedPriceKzt: 5990,
    };
    const parsed = DraftUpdateSchema.parse(validUpdate);
    expect(parsed.suggestedPriceKzt).toBe(5990);

    const invalidPriceUpdate = {
      suggestedPriceKzt: 4990.75,
    };
    expect(() => DraftUpdateSchema.parse(invalidPriceUpdate)).toThrow('suggested_price_must_be_whole_tenge');
  });

  it('validates ColorItemSchema with hex codes', () => {
    const validColor = {
      name_ru: 'Темно-синий',
      name_kz: 'Қара-көк',
      hex: '#0A192F',
    };
    const parsed = ColorItemSchema.parse(validColor);
    expect(parsed.hex).toBe('#0A192F');

    const invalidHex = {
      name_ru: 'Красный',
      name_kz: 'Қызыл',
      hex: 'not-a-hex',
    };
    expect(() => ColorItemSchema.parse(invalidHex)).toThrow();
  });
});
