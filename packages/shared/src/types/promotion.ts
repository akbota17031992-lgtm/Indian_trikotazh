export type DiscountType = 'percentage' | 'fixed_amount';

export interface Promotion {
  id: string;
  code: string;
  titleRu: string;
  titleKz: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderKzt: number;
  maxDiscountKzt?: number | null;
  validFrom: string;
  validTo: string;
  usageLimit?: number | null;
  usageCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
