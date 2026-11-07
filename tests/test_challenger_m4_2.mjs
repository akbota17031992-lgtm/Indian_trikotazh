/**
 * Standalone Empirical Challenger Verification Script (M4-2)
 * Seller Preview State Machine & Financial Invariants Audit
 */

import assert from 'node:assert/strict';

console.log('================================================================');
console.log('  CHALLENGER M4-2 EMPIRICAL AUDIT HARNESS');
console.log('  Testing Seller Preview State Machine & Financial Invariants');
console.log('================================================================\n');

// 1. Audit MockAiPipelineService from tests/e2e/helpers/ai-mock.ts
console.log('--- 1. Auditing MockAiPipelineService (tests/e2e/helpers/ai-mock.ts) ---');
const { MockAiPipelineService } = await import('./e2e/helpers/ai-mock.ts');
const mockService = new MockAiPipelineService();

const sampleBuf = Buffer.from('test-image-mock');
const mockDraft = await mockService.ingestImage(sampleBuf, 'image/jpeg');

assert.equal(mockDraft.status, 'draft', 'Newly ingested draft status must be "draft"');
assert.ok(mockDraft.id.startsWith('draft_'), 'Draft ID must start with draft_');

// Invariant 1.1: Fractional tiyns rejected
let threwTiyn = false;
try {
  mockService.updateDraft(mockDraft.id, { suggestedPriceKzt: 4990.50 });
} catch (e) {
  threwTiyn = true;
  assert.equal(e.message, 'suggested_price_must_be_whole_tenge');
}
assert.ok(threwTiyn, 'MockAiPipelineService must reject fractional tiyn 4990.50');
console.log('  [PASS] Fractional tiyns rejected with suggested_price_must_be_whole_tenge');

// Invariant 1.2: Negative price rejected
let threwNegative = false;
try {
  mockService.updateDraft(mockDraft.id, { suggestedPriceKzt: -500 });
} catch (e) {
  threwNegative = true;
  assert.equal(e.message, 'suggested_price_must_be_whole_tenge');
}
assert.ok(threwNegative, 'MockAiPipelineService must reject negative price -500');
console.log('  [PASS] Negative price rejected with suggested_price_must_be_whole_tenge');

// Invariant 1.3: Zero price (Finding in MockAiPipelineService)
let threwZeroInMock = false;
try {
  mockService.updateDraft(mockDraft.id, { suggestedPriceKzt: 0 });
} catch (e) {
  threwZeroInMock = true;
}
if (!threwZeroInMock) {
  console.log('  [FINDING - E2E Mock Helper Defect]: MockAiPipelineService uses `if (updates.suggestedPriceKzt)` (line 90), which evaluates to false when suggestedPriceKzt === 0, thereby silently skipping the invariant check!');
} else {
  console.log('  [PASS] Zero price rejected');
}

// Invariant 1.4: Non-existent draft update
let threwNotFound = false;
try {
  mockService.updateDraft('ghost_id', { name_ru: 'Test' });
} catch (e) {
  threwNotFound = true;
  assert.equal(e.message, 'draft_not_found');
}
assert.ok(threwNotFound, 'Must throw draft_not_found for unknown draft update');
console.log('  [PASS] Updating non-existent draft throws draft_not_found');

// Invariant 1.5: Non-existent draft publish
let threwPubNotFound = false;
try {
  mockService.publishDraft('ghost_id');
} catch (e) {
  threwPubNotFound = true;
  assert.equal(e.message, 'draft_not_found');
}
assert.ok(threwPubNotFound, 'Must throw draft_not_found for unknown draft publish');
console.log('  [PASS] Publishing non-existent draft throws draft_not_found');

// Invariant 1.6: Publishing assigns prod_ and transitions to published
const pubResult = mockService.publishDraft(mockDraft.id);
assert.ok(pubResult.productId.startsWith('prod_'), 'Published product ID must start with prod_');
assert.equal(mockService.getDraft(mockDraft.id).status, 'published');
console.log(`  [PASS] Publishing assigns productId "${pubResult.productId}" and marks status as published`);

// Invariant 1.7: Published draft modification prevented
let threwModPublished = false;
try {
  mockService.updateDraft(mockDraft.id, { name_ru: 'Changed' });
} catch (e) {
  threwModPublished = true;
  assert.equal(e.message, 'cannot_modify_published_draft');
}
assert.ok(threwModPublished, 'Modifying published draft must throw cannot_modify_published_draft');
console.log('  [PASS] Modifying published draft throws cannot_modify_published_draft');

// Invariant 1.8: Double-publishing prevented
let threwDoublePub = false;
try {
  mockService.publishDraft(mockDraft.id);
} catch (e) {
  threwDoublePub = true;
  assert.equal(e.message, 'draft_already_published');
}
assert.ok(threwDoublePub, 'Re-publishing draft must throw draft_already_published');
console.log('  [PASS] Double publishing draft throws draft_already_published');

// 2. Audit Core Production Implementation (packages/ai ProductDraftManager)
console.log('\n--- 2. Auditing Production ProductDraftManager (packages/ai) ---');
const { ProductDraftManager } = await import('../packages/ai/dist/draft/draft-manager.js');
const draftManager = new ProductDraftManager();

const coreDraft = {
  id: 'draft_core_test_101',
  status: 'draft',
  metadata: {
    name_ru: 'Футболка Индийский Трикотаж',
    name_kz: 'Үнді трикотажы футболкасы',
    description_ru: '100% хлопок',
    description_kz: '100% мақта',
    category: 'Футболки',
    subcategory: 'Базовые',
    colors: ['Белый'],
    material: '100% хлопок',
    season: 'all-season',
    gender: 'unisex',
    tags: ['трикотаж'],
    suggestedPriceKzt: 4990,
  },
  images: {
    thumbnail: Buffer.alloc(150 * 150, 0xAA),
    card: Buffer.alloc(400 * 500, 0xBB),
    full: Buffer.alloc(1200 * 1500, 0xCC),
  },
  variants: [
    { size: 'M', color: 'Белый', sku: 'IT-CORE-M', priceKzt: 4990 },
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

draftManager.saveDraft(coreDraft);

// Verify Zero Price in Core Implementation
let threwZeroInCore = false;
try {
  draftManager.updateDraft(coreDraft.id, { suggestedPriceKzt: 0 });
} catch (e) {
  threwZeroInCore = true;
  assert.equal(e.message, 'suggested_price_must_be_whole_tenge');
}
assert.ok(threwZeroInCore, 'ProductDraftManager must reject suggestedPriceKzt: 0');
console.log('  [PASS] ProductDraftManager correctly throws suggested_price_must_be_whole_tenge for price: 0');

// Verify Fractional Tiyns in Core Implementation
const testTiyns = [4990.50, 10.99, 0.01, 14990.99, 0.5];
for (const tiyn of testTiyns) {
  assert.throws(
    () => draftManager.updateDraft(coreDraft.id, { suggestedPriceKzt: tiyn }),
    /suggested_price_must_be_whole_tenge/,
    `Core must reject fractional tiyn ${tiyn}`
  );
}
console.log(`  [PASS] ProductDraftManager correctly rejected all fractional tiyn amounts (${testTiyns.join(', ')})`);

// Verify Negative amounts in Core Implementation
const testNegatives = [-1, -500, -4990, -0.01];
for (const neg of testNegatives) {
  assert.throws(
    () => draftManager.updateDraft(coreDraft.id, { suggestedPriceKzt: neg }),
    /suggested_price_must_be_whole_tenge/,
    `Core must reject negative amount ${neg}`
  );
}
console.log(`  [PASS] ProductDraftManager correctly rejected all negative amounts (${testNegatives.join(', ')})`);

// Verify Non-existent draft
assert.throws(
  () => draftManager.updateDraft('non_existent', { name_ru: 'Test' }),
  /draft_not_found/
);
assert.throws(
  () => draftManager.publishDraft('non_existent'),
  /draft_not_found/
);
console.log('  [PASS] ProductDraftManager throws draft_not_found for updates and publishes of non-existent drafts');

// Verify Image Preservation on Partial Updates
const thumbBefore = Buffer.from(coreDraft.images.thumbnail);
const cardBefore = Buffer.from(coreDraft.images.card);
const fullBefore = Buffer.from(coreDraft.images.full);

const updatedDraft = draftManager.updateDraft(coreDraft.id, {
  name_ru: 'Обновленная футболка супер-премиум',
  suggestedPriceKzt: 5990,
});

assert.equal(Buffer.compare(updatedDraft.images.thumbnail, thumbBefore), 0, 'Thumbnail image must be preserved byte-for-byte');
assert.equal(Buffer.compare(updatedDraft.images.card, cardBefore), 0, 'Card image must be preserved byte-for-byte');
assert.equal(Buffer.compare(updatedDraft.images.full, fullBefore), 0, 'Full image must be preserved byte-for-byte');
assert.equal(updatedDraft.metadata.material, '100% хлопок', 'Untouched metadata field material must be preserved');
assert.equal(updatedDraft.metadata.season, 'all-season', 'Untouched metadata field season must be preserved');
assert.equal(updatedDraft.metadata.suggestedPriceKzt, 5990, 'Updated price must take effect');
console.log('  [PASS] Partial updates strictly preserve images (thumbnail, card, full) and untouched metadata fields');

// Verify Publish & Immutability
const corePubRes = draftManager.publishDraft(coreDraft.id);
assert.equal(corePubRes.productId, 'prod_core_test_101', 'Product ID must be prod_core_test_101');
assert.ok(corePubRes.productId.startsWith('prod_'), 'Product ID must start with prod_');
assert.equal(draftManager.getDraft(coreDraft.id).status, 'published');

// Cannot modify published draft
assert.throws(
  () => draftManager.updateDraft(coreDraft.id, { name_ru: 'Modification attempt' }),
  /cannot_modify_published_draft/
);
// Cannot double publish
assert.throws(
  () => draftManager.publishDraft(coreDraft.id),
  /draft_already_published/
);
console.log('  [PASS] Publishing seals draft: assigned prod_ prefix, blocked edits with cannot_modify_published_draft, blocked double-publish with draft_already_published');

console.log('\n================================================================');
console.log('  ALL EMPIRICAL CHALLENGER ASSERTIONS PASSED');
console.log('================================================================\n');
