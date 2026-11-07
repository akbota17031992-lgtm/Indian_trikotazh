import type { AiClothingMetadata } from './metadata.js';
import type { ImageVariants } from './image.js';

export type DraftStatus = 'draft' | 'published' | 'discarded';

export interface DraftVariant {
  size: string;
  color: string;
  sku: string;
  priceKzt: number;
  stockByStore?: Record<string, number>;
}

export interface ProductDraft {
  id: string; // 'draft_<timestamp>_<random>'
  status: DraftStatus;
  metadata: AiClothingMetadata;
  images: ImageVariants;
  variants: DraftVariant[];
  publishedProductId?: string; // 'prod_<id>'
  createdAt?: string;
  updatedAt?: string;
}

export type ProcessedProductDraft = ProductDraft;

export interface DraftUpdateInput {
  name_ru?: string;
  name_kz?: string;
  description_ru?: string;
  description_kz?: string;
  category?: string;
  subcategory?: string;
  colors?: string[];
  material?: string;
  season?: string;
  gender?: string;
  tags?: string[];
  suggestedPriceKzt?: number;
  variants?: DraftVariant[];
}

export interface PublishDraftResult {
  productId: string;
  publishedAt: string;
}
