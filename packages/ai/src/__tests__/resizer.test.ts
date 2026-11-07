import { describe, it, expect } from 'vitest';
import { SharpImageResizer, generateImageVariants } from '../image/resizer.js';
import { IMAGE_VARIANTS_CONFIG } from '../image/presets.js';

describe('Sharp WebP Image Resizer', () => {
  const resizer = new SharpImageResizer();
  const sampleBuffer = Buffer.from('sample-garment-image-bytes');

  it('defines the 3 canonical apparel presets with correct aspect ratios and limits', () => {
    // Thumbnail 1:1
    expect(IMAGE_VARIANTS_CONFIG.thumbnail.width).toBe(150);
    expect(IMAGE_VARIANTS_CONFIG.thumbnail.height).toBe(150);
    expect(IMAGE_VARIANTS_CONFIG.thumbnail.width / IMAGE_VARIANTS_CONFIG.thumbnail.height).toBe(1.0);

    // Card 4:5 fashion aspect ratio
    expect(IMAGE_VARIANTS_CONFIG.card.width).toBe(400);
    expect(IMAGE_VARIANTS_CONFIG.card.height).toBe(500);
    expect(IMAGE_VARIANTS_CONFIG.card.width / IMAGE_VARIANTS_CONFIG.card.height).toBe(0.8);

    // Full 1200x1500 max zoom
    expect(IMAGE_VARIANTS_CONFIG.full.width).toBe(1200);
    expect(IMAGE_VARIANTS_CONFIG.full.height).toBe(1500);
    expect(IMAGE_VARIANTS_CONFIG.full.withoutEnlargement).toBe(true);
  });

  it('generates exact simulated buffer lengths in mock mode matching E2E assertions', async () => {
    const variants = await resizer.generateVariants(sampleBuffer, true);

    expect(variants.thumbnail).toBeDefined();
    expect(variants.thumbnail.length).toBe(150 * 150);

    expect(variants.card).toBeDefined();
    expect(variants.card.length).toBe(400 * 500);

    expect(variants.full).toBeDefined();
    expect(variants.full.length).toBe(1200 * 1500);
  });

  it('works through top-level generateImageVariants helper function', async () => {
    const variants = await generateImageVariants(sampleBuffer, true);
    expect(variants.thumbnail.length).toBe(150 * 150);
    expect(variants.card.length).toBe(400 * 500);
    expect(variants.full.length).toBe(1200 * 1500);
  });

  it('handles corrupt image buffer without crashing by falling back gracefully', async () => {
    const corruptBuffer = Buffer.from('not-a-valid-image');
    const variants = await resizer.generateVariants(corruptBuffer, false);

    expect(variants.thumbnail).toBeDefined();
    expect(variants.thumbnail.length).toBeGreaterThan(0);
    expect(variants.card).toBeDefined();
    expect(variants.card.length).toBeGreaterThan(0);
    expect(variants.full).toBeDefined();
    expect(variants.full.length).toBeGreaterThan(0);
  });
});
