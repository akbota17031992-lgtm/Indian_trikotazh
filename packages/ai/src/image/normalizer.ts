export const MAX_DIM = 1500;
export const MIN_DIM = 100;
export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export interface NormalizedImageResult {
  buffer: Buffer;
  originalWidth: number;
  originalHeight: number;
  clampedWidth: number;
  clampedHeight: number;
  hasAlpha: boolean;
}

export function clampImageDimensions(
  width: number,
  height: number
): { width: number; height: number } {
  const scale = Math.min(MAX_DIM / Math.max(width, height), 1);
  return {
    width: Math.max(MIN_DIM, Math.round(width * scale)),
    height: Math.max(MIN_DIM, Math.round(height * scale)),
  };
}

export function hasAlphaChannel(mime: string): boolean {
  return mime === 'image/png' || mime === 'image/webp';
}

export async function validateAndNormalizeImage(
  imageBuffer: Buffer | Uint8Array,
  mimeType: string
): Promise<NormalizedImageResult> {
  if (!imageBuffer || imageBuffer.length === 0) {
    throw new Error('empty_image_buffer');
  }

  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    throw new Error(`unsupported_image_mime: ${mimeType}`);
  }

  const buffer = Buffer.isBuffer(imageBuffer) ? imageBuffer : Buffer.from(imageBuffer);
  const hasAlpha = hasAlphaChannel(mimeType);

  // If sharp is available at runtime, probe actual dimensions and apply EXIF auto-rotate
  let origWidth = 800;
  let origHeight = 1000;
  let normalizedBuffer = buffer;

  try {
    const sharpModule = await import('sharp').then((m) => m.default || m).catch(() => null);
    if (sharpModule) {
      const meta = await sharpModule(buffer, { failOn: 'none' }).metadata();
      if (meta.width && meta.height) {
        origWidth = meta.width;
        origHeight = meta.height;
      }
      const { width: targetW, height: targetH } = clampImageDimensions(origWidth, origHeight);
      normalizedBuffer = await sharpModule(buffer)
        .rotate()
        .resize(targetW, targetH, { fit: 'inside', withoutEnlargement: true })
        .toBuffer();
    }
  } catch {
    // If sharp fails or is absent, keep buffer intact and use default estimates
  }

  const { width: clampedWidth, height: clampedHeight } = clampImageDimensions(
    origWidth,
    origHeight
  );

  return {
    buffer: normalizedBuffer,
    originalWidth: origWidth,
    originalHeight: origHeight,
    clampedWidth,
    clampedHeight,
    hasAlpha,
  };
}
