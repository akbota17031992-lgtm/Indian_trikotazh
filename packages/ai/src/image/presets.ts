import type { ImagePresetConfig } from '../types/image.js';

export const IMAGE_VARIANTS_CONFIG = {
  thumbnail: {
    width: 150,
    height: 150,
    fit: 'cover',
    position: 'center',
    quality: 80,
    effort: 4,
    alphaQuality: 85,
  },
  card: {
    width: 400,
    height: 500, // 4:5 fashion aspect ratio
    fit: 'cover',
    position: 'center',
    quality: 85,
    effort: 4,
    alphaQuality: 90,
  },
  full: {
    width: 1200,
    height: 1500,
    fit: 'inside',
    withoutEnlargement: true,
    quality: 90,
    effort: 4,
    alphaQuality: 95,
  },
} as const satisfies Record<string, ImagePresetConfig>;
