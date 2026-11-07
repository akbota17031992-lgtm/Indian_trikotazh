export class ProductImage {
  readonly id: string;
  readonly productId: string;
  readonly variantId: string | null;
  readonly url: string;
  readonly thumbnailUrl: string;
  readonly cardUrl: string;
  readonly fullUrl: string;
  readonly altRu: string | null;
  readonly altKz: string | null;
  readonly isPrimary: boolean;
  readonly displayOrder: number;
  readonly backgroundRemoved: boolean;
  readonly createdAt: Date;

  constructor(
    id: string,
    productId: string,
    variantId: string | null,
    url: string,
    thumbnailUrl: string,
    cardUrl: string,
    fullUrl: string,
    altRu: string | null = null,
    altKz: string | null = null,
    isPrimary: boolean = false,
    displayOrder: number = 0,
    backgroundRemoved: boolean = false,
    createdAt: Date = new Date()
  ) {
    this.id = id;
    this.productId = productId;
    this.variantId = variantId;
    this.url = url;
    this.thumbnailUrl = thumbnailUrl;
    this.cardUrl = cardUrl;
    this.fullUrl = fullUrl;
    this.altRu = altRu;
    this.altKz = altKz;
    this.isPrimary = isPrimary;
    this.displayOrder = displayOrder;
    this.backgroundRemoved = backgroundRemoved;
    this.createdAt = createdAt;
  }
}
