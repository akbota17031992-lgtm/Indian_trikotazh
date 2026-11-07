export class Review {
  readonly id: string;
  readonly productId: string;
  readonly userId: string;
  readonly authorName: string;
  readonly rating: 1 | 2 | 3 | 4 | 5;
  readonly comment: string;
  readonly pros: string | null;
  readonly cons: string | null;
  readonly isVerified: boolean;
  status: 'pending' | 'approved' | 'rejected';
  readonly createdAt: Date;

  constructor(
    id: string,
    productId: string,
    userId: string,
    authorName: string,
    rating: 1 | 2 | 3 | 4 | 5,
    comment: string,
    pros: string | null = null,
    cons: string | null = null,
    isVerified: boolean = false,
    status: 'pending' | 'approved' | 'rejected' = 'pending',
    createdAt: Date = new Date()
  ) {
    if (rating < 1 || rating > 5) {
      throw new Error(`Rating must be between 1 and 5 (received: ${rating})`);
    }
    this.id = id;
    this.productId = productId;
    this.userId = userId;
    this.authorName = authorName;
    this.rating = rating;
    this.comment = comment;
    this.pros = pros;
    this.cons = cons;
    this.isVerified = isVerified;
    this.status = status;
    this.createdAt = createdAt;
  }

  approve(): void {
    this.status = 'approved';
  }

  reject(): void {
    this.status = 'rejected';
  }
}
