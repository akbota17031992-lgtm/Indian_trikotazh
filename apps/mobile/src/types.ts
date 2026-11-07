import type { AlmatyStoreSeed } from '@india-trikotaj/shared';

export interface MobileProduct {
  id: string;
  slug: string;
  titleRu: string;
  titleKz: string;
  priceKzt: number;
  imageUrl: string;
  category: string;
  compositionRu: string;
  compositionKz: string;
  descriptionRu: string;
  descriptionKz: string;
  stockByStore: Record<string, number>;
}

export interface CartItem {
  product: MobileProduct;
  quantity: number;
  size: string;
}

export type TabType = 'catalog' | 'cart' | 'stores';

