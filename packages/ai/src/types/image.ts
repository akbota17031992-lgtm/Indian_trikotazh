export interface ImageVariants {
  thumbnail: Buffer;
  card: Buffer;
  full: Buffer;
}

export interface ImagePresetConfig {
  width: number;
  height: number;
  fit: 'cover' | 'inside';
  withoutEnlargement?: boolean;
  position?: 'center' | 'entropy' | 'attention';
  quality: number;
  effort: number;
  alphaQuality?: number;
}

export interface ProcessImageOptions {
  removeBg?: boolean;
  mockMode?: boolean;
  timeoutMs?: number;
}

export interface ProcessedImagesOutput {
  thumbnail: Buffer;
  card: Buffer;
  full: Buffer;
  metadata?: {
    originalWidth: number;
    originalHeight: number;
    clampedWidth: number;
    clampedHeight: number;
    hasAlpha: boolean;
    backgroundRemoved: boolean;
    fallbackApplied: boolean;
  };
}
