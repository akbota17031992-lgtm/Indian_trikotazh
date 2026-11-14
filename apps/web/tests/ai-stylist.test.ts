import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { analyzeStyleAndMatchOutfit } from '../src/lib/stylist-service.ts';

describe('AI Fashion Stylist Test Suite', () => {
  it('1.1 should return warm-autumn styling analysis for warm-autumn demo profile', () => {
    const data = analyzeStyleAndMatchOutfit({
      demoProfileId: 'warm-autumn',
      selectedBranchId: 'store-almaty-001',
    });

    assert.equal(data.colorType.key, 'warm-autumn');
    assert.ok(data.colorType.nameRu.includes('Тёплая Осень'));
    assert.ok(data.colorType.palette.length >= 4);
    assert.ok(data.matchedProducts.length >= 2);
    assert.ok(data.totalLookPriceKzt > 0);
    assert.ok(data.discountedPriceKzt < data.totalLookPriceKzt);
  });

  it('1.2 should return cool-winter styling analysis for cool-winter demo profile', () => {
    const data = analyzeStyleAndMatchOutfit({
      demoProfileId: 'cool-winter',
      selectedBranchId: 'store-almaty-002',
    });

    assert.equal(data.colorType.key, 'cool-winter');
    assert.ok(data.colorType.nameRu.includes('Контрастная Зима'));
    assert.ok(data.matchedProducts.length >= 2);
  });

  it('1.3 should enforce 5% bundle discount calculation without fractions', () => {
    const data = analyzeStyleAndMatchOutfit({
      demoProfileId: 'bright-spring',
    });

    assert.equal(data.bundleDiscountPercent, 5);
    const expected = Math.round(data.totalLookPriceKzt * 0.95);
    assert.equal(data.discountedPriceKzt, expected);
  });

  it('1.4 should check branch inventory presence for matched products', () => {
    const data = analyzeStyleAndMatchOutfit({
      demoProfileId: 'soft-summer',
      selectedBranchId: 'store-almaty-001',
    });

    for (const item of data.matchedProducts) {
      assert.ok(typeof item.inSelectedBranch === 'boolean');
      assert.ok(typeof item.availableBranchesCount === 'number');
      assert.ok(item.availableBranchesCount > 0);
    }
  });
});
