export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export interface Review {
  id: string;
  productId: string;
  userId: string;
  orderId?: string | null;
  authorName: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment?: string | null;
  pros?: string | null;
  cons?: string | null;
  isVerified: boolean;
  status: ReviewStatus;
  createdAt: string;
  updatedAt: string;
}
