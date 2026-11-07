import { describe, it, expect } from 'vitest';
import { BackgroundRemover, removeBackgroundGraceful } from '../image/background-remover.js';

describe('Background Removal & Fallback Pipeline', () => {
  const remover = new BackgroundRemover();
  const sampleGarmentBuffer = Buffer.from('india-trikotaj-cotton-tshirt-bytes');

  it('engages graceful fallback in mock mode without crashing (Test 13.5)', async () => {
    const result = await remover.removeBackground(sampleGarmentBuffer, false, { mockMode: true });

    expect(result.buffer).toBeDefined();
    expect(result.fallbackApplied).toBe(true);
    expect(result.backgroundRemoved).toBe(false);
  });

  it('preserves existing alpha channel on transparent images in fallback mode (B13.1)', async () => {
    const transparentSample = Buffer.from('transparent-png-data');
    const result = await remover.removeBackground(transparentSample, true, { mockMode: true });

    expect(result.buffer).toBeDefined();
    expect(result.backgroundRemoved).toBe(true);
    expect(result.fallbackApplied).toBe(true);
  });

  it('handles offline / missing rembg execution without throwing', async () => {
    // When rembg is absent or fails, execute and confirm zero unhandled exceptions
    const result = await remover.removeBackground(sampleGarmentBuffer, false, { timeoutMs: 1000 });
    expect(result.buffer).toBeDefined();
    expect(result.fallbackApplied).toBe(true);
  });

  it('works through top-level removeBackgroundGraceful helper function', async () => {
    const processed = await removeBackgroundGraceful(sampleGarmentBuffer, false, { mockMode: true });
    expect(processed).toBeDefined();
    expect(processed.length).toBeGreaterThan(0);
  });
});
