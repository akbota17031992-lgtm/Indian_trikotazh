import { validateAndNormalizeImage } from './normalizer.js';
import { BackgroundRemover } from './background-remover.js';
import { SharpImageResizer } from './resizer.js';
import type { ProcessImageOptions, ProcessedImagesOutput } from '../types/image.js';

export class ImagePipeline {
  private bgRemover: BackgroundRemover;
  private resizer: SharpImageResizer;

  constructor(customPythonBin?: string) {
    this.bgRemover = new BackgroundRemover(customPythonBin);
    this.resizer = new SharpImageResizer();
  }

  async process(
    imageBuffer: Buffer | Uint8Array,
    mimeType: string,
    options: ProcessImageOptions = {}
  ): Promise<ProcessedImagesOutput> {
    // 1. Validate, normalize dimensions, and auto-orient
    const normalized = await validateAndNormalizeImage(imageBuffer, mimeType);

    // 2. Background removal (rembg or graceful Sharp fallback)
    let processedBuffer = normalized.buffer;
    let bgRemoved = false;
    let fallbackApplied = false;

    if (options.removeBg !== false) {
      const bgResult = await this.bgRemover.removeBackground(
        normalized.buffer,
        normalized.hasAlpha,
        {
          mockMode: options.mockMode,
          timeoutMs: options.timeoutMs,
        }
      );
      processedBuffer = bgResult.buffer;
      bgRemoved = bgResult.backgroundRemoved;
      fallbackApplied = bgResult.fallbackApplied;
    }

    // 3. Concurrently generate WebP variants
    const variants = await this.resizer.generateVariants(processedBuffer, options.mockMode);

    return {
      thumbnail: variants.thumbnail,
      card: variants.card,
      full: variants.full,
      metadata: {
        originalWidth: normalized.originalWidth,
        originalHeight: normalized.originalHeight,
        clampedWidth: normalized.clampedWidth,
        clampedHeight: normalized.clampedHeight,
        hasAlpha: normalized.hasAlpha,
        backgroundRemoved: bgRemoved,
        fallbackApplied,
      },
    };
  }
}
