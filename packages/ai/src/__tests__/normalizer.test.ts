import { describe, it, expect } from 'vitest';
import {
  clampImageDimensions,
  hasAlphaChannel,
  validateAndNormalizeImage,
} from '../image/normalizer.js';

describe('Image Normalizer & Dimension Clamper', () => {
  it('clamps extreme high resolutions to MAX_DIM = 1500 while preserving aspect ratio (B12.1)', () => {
    const highRes = clampImageDimensions(8000, 6000);
    expect(highRes.width).toBe(1500);
    expect(highRes.height).toBe(1125);

    const squareHigh = clampImageDimensions(4000, 4000);
    expect(squareHigh.width).toBe(1500);
    expect(squareHigh.height).toBe(1500);
  });

  it('clamps extreme low resolutions up to MIN_DIM = 100 (B12.1)', () => {
    const lowRes = clampImageDimensions(50, 50);
    expect(lowRes.width).toBe(100);
    expect(lowRes.height).toBe(100);

    const tinyRect = clampImageDimensions(80, 40);
    expect(tinyRect.width).toBe(100);
    expect(tinyRect.height).toBe(100);
  });

  it('leaves standard resolution dimensions untouched when within bounds', () => {
    const standard = clampImageDimensions(800, 1000);
    expect(standard.width).toBe(800);
    expect(standard.height).toBe(1000);
  });

  it('detects alpha channels based on image MIME type (B13.1)', () => {
    expect(hasAlphaChannel('image/png')).toBe(true);
    expect(hasAlphaChannel('image/webp')).toBe(true);
    expect(hasAlphaChannel('image/jpeg')).toBe(false);
  });

  it('rejects empty image buffer with "empty_image_buffer" (B13.4)', async () => {
    const emptyBuf = Buffer.alloc(0);
    await expect(validateAndNormalizeImage(emptyBuf, 'image/jpeg')).rejects.toThrow('empty_image_buffer');
  });

  it('rejects unsupported MIME types with "unsupported_image_mime"', async () => {
    const sample = Buffer.from('fake-pdf');
    await expect(validateAndNormalizeImage(sample, 'application/pdf')).rejects.toThrow('unsupported_image_mime: application/pdf');
    await expect(validateAndNormalizeImage(sample, 'text/plain')).rejects.toThrow('unsupported_image_mime: text/plain');
  });

  it('normalizes valid image buffer and returns clamped dimensions and alpha info', async () => {
    const sample = Buffer.from('valid-sample-image-bytes');
    const result = await validateAndNormalizeImage(sample, 'image/png');

    expect(result.buffer).toBeDefined();
    expect(result.hasAlpha).toBe(true);
    expect(result.clampedWidth).toBeGreaterThanOrEqual(100);
    expect(result.clampedWidth).toBeLessThanOrEqual(1500);
    expect(result.clampedHeight).toBeGreaterThanOrEqual(100);
    expect(result.clampedHeight).toBeLessThanOrEqual(1500);
  });
});
