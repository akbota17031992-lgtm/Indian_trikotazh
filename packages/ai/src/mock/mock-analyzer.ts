import crypto from 'node:crypto';
import { CATEGORY_TEMPLATES, type CategoryTemplate } from './templates.js';
import type { AiClothingMetadata } from '../types/metadata.js';
import type { DraftVariant } from '../types/draft.js';

export class MockProductAnalyzer {
  /**
   * Resolves category template from slug, Russian name, or fallback to 't-shirts'
   */
  public resolveCategory(hint?: string): CategoryTemplate {
    if (!hint || typeof hint !== 'string') {
      return CATEGORY_TEMPLATES['t-shirts']!;
    }

    const clean = hint.trim().toLowerCase();

    // Check direct slug match
    if (CATEGORY_TEMPLATES[clean]) {
      return CATEGORY_TEMPLATES[clean]!;
    }

    // Map common Russian names, slugs, and variations
    const mapping: Record<string, string> = {
      'футболки': 't-shirts',
      'футболка': 't-shirts',
      't-shirts': 't-shirts',
      'лонгсливы': 'long-sleeves',
      'лонгслив': 'long-sleeves',
      'long-sleeves': 'long-sleeves',
      'халаты': 'robes',
      'халат': 'robes',
      'robes': 'robes',
      'пижамы': 'pajamas',
      'пижама': 'pajamas',
      'pajamas': 'pajamas',
      'термобелье': 'thermal-underwear',
      'термобельё': 'thermal-underwear',
      'thermal-underwear': 'thermal-underwear',
      'детская одежда': 'kids-clothing',
      'детское': 'kids-clothing',
      'kids-clothing': 'kids-clothing',
      'kids': 'kids-clothing',
      'домашний текстиль': 'home-textiles',
      'текстиль': 'home-textiles',
      'home-textiles': 'home-textiles',
    };

    const targetSlug = mapping[clean];
    if (targetSlug && CATEGORY_TEMPLATES[targetSlug]) {
      return CATEGORY_TEMPLATES[targetSlug]!;
    }

    // Default unknown category hints to 't-shirts' per Requirement B14.3
    return CATEGORY_TEMPLATES['t-shirts']!;
  }

  /**
   * Generates deterministic, realistic metadata based on image hash and category
   */
  public generateMetadata(
    imageBuffer: Buffer,
    targetCategoryHint?: string
  ): AiClothingMetadata {
    const template = this.resolveCategory(targetCategoryHint);

    let hashInt = 0;
    if (imageBuffer && imageBuffer.length > 0) {
      const hash = crypto.createHash('sha256').update(imageBuffer).digest();
      hashInt = hash.readUInt32BE(0);
    }

    const colorIdx = hashInt % template.defaultColors.length;
    const subcatIdx = (hashInt >> 2) % template.subcategories.length;
    const priceIdx = (hashInt >> 4) % template.suggestedPricesKzt.length;

    const selectedColor = template.defaultColors[colorIdx] ?? 'Белый';
    const selectedSubcat = template.subcategories[subcatIdx] ?? 'Базовые';
    const selectedPrice = template.suggestedPricesKzt[priceIdx] ?? 4990;

    const colors = [
      selectedColor,
      ...(template.defaultColors.length > 1
        ? [template.defaultColors[(colorIdx + 1) % template.defaultColors.length]!]
        : []),
    ];

    return {
      name_ru: template.titleGeneratorRu(selectedSubcat, selectedColor),
      name_kz: template.titleGeneratorKz(selectedSubcat, selectedColor),
      description_ru: template.descRu,
      description_kz: template.descKz,
      category: template.canonicalRu,
      subcategory: selectedSubcat,
      colors,
      material: '100% хлопок',
      season: 'all-season',
      gender: 'unisex',
      tags: template.tags,
      suggestedPriceKzt: selectedPrice,
    };
  }

  /**
   * Generates default clothing size variants (S, M, L) with unique SKUs
   */
  public generateDefaultVariants(
    draftId: string,
    metadata: AiClothingMetadata
  ): DraftVariant[] {
    const defaultColor = metadata.colors[0] || 'Белый';
    const idSuffix = draftId.includes('_') ? draftId.slice(-4) : draftId.substring(0, 4);

    return [
      {
        size: 'S',
        color: defaultColor,
        sku: `IT-DRAFT-${idSuffix}-S`,
        priceKzt: metadata.suggestedPriceKzt,
      },
      {
        size: 'M',
        color: defaultColor,
        sku: `IT-DRAFT-${idSuffix}-M`,
        priceKzt: metadata.suggestedPriceKzt,
      },
      {
        size: 'L',
        color: defaultColor,
        sku: `IT-DRAFT-${idSuffix}-L`,
        priceKzt: metadata.suggestedPriceKzt,
      },
    ];
  }
}
