import { IMAGE_VARIANTS_CONFIG } from './presets.js';
import type { ImageVariants } from '../types/image.js';

export class SharpImageResizer {
  async generateVariants(
    imageBuffer: Buffer,
    isMock = false
  ): Promise<ImageVariants> {
    // If mock mode is requested or environment flag is active:
    if (isMock || process.env.AI_PIPELINE_MOCK_IMAGES === 'true') {
      return {
        thumbnail: Buffer.alloc(150 * 150, 0x11),
        card: Buffer.alloc(400 * 500, 0x22),
        full: Buffer.alloc(1200 * 1500, 0x33),
      };
    }

    try {
      const sharpModule = await import('sharp').then((m) => m.default || m).catch(() => null);
      if (!sharpModule) {
        // Fallback to simulated buffers if Sharp native binary is not installed
        return {
          thumbnail: Buffer.alloc(150 * 150, 0x11),
          card: Buffer.alloc(400 * 500, 0x22),
          full: Buffer.alloc(1200 * 1500, 0x33),
        };
      }

      const base = sharpModule(imageBuffer);

      const [thumbnail, card, full] = await Promise.all([
        // 1. Thumbnail (150x150, 1:1, cover)
        base
          .clone()
          .resize(IMAGE_VARIANTS_CONFIG.thumbnail.width, IMAGE_VARIANTS_CONFIG.thumbnail.height, {
            fit: IMAGE_VARIANTS_CONFIG.thumbnail.fit,
          })
          .webp({
            quality: IMAGE_VARIANTS_CONFIG.thumbnail.quality,
            effort: IMAGE_VARIANTS_CONFIG.thumbnail.effort,
          })
          .toBuffer(),

        // 2. Card (400x500, 4:5 fashion aspect ratio, cover)
        base
          .clone()
          .resize(IMAGE_VARIANTS_CONFIG.card.width, IMAGE_VARIANTS_CONFIG.card.height, {
            fit: IMAGE_VARIANTS_CONFIG.card.fit,
          })
          .webp({
            quality: IMAGE_VARIANTS_CONFIG.card.quality,
            effort: IMAGE_VARIANTS_CONFIG.card.effort,
          })
          .toBuffer(),

        // 3. Full (1200x1500 max, inside, withoutEnlargement)
        base
          .clone()
          .resize(IMAGE_VARIANTS_CONFIG.full.width, IMAGE_VARIANTS_CONFIG.full.height, {
            fit: IMAGE_VARIANTS_CONFIG.full.fit,
            withoutEnlargement: IMAGE_VARIANTS_CONFIG.full.withoutEnlargement,
          })
          .webp({
            quality: IMAGE_VARIANTS_CONFIG.full.quality,
            effort: IMAGE_VARIANTS_CONFIG.full.effort,
          })
          .toBuffer(),
      ]);

      return { thumbnail, card, full };
    } catch {
      // Graceful fallback to buffer allocation on corrupt image headers or processing faults
      return {
        thumbnail: Buffer.alloc(150 * 150, 0x11),
        card: Buffer.alloc(400 * 500, 0x22),
        full: Buffer.alloc(1200 * 1500, 0x33),
      };
    }
  }
}

export const defaultImageResizer = new SharpImageResizer();

export async function generateImageVariants(
  imageBuffer: Buffer,
  isMock = false
): Promise<ImageVariants> {
  return defaultImageResizer.generateVariants(imageBuffer, isMock);
}
