export class Category {
  readonly id: string;
  readonly parentId: string | null;
  readonly slug: string;
  readonly nameRu: string;
  readonly nameKz: string;
  readonly descriptionRu: string | null;
  readonly descriptionKz: string | null;
  readonly imageUrl: string | null;
  readonly sortOrder: number;
  readonly isActive: boolean;
  readonly children: Category[];
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(
    id: string,
    parentId: string | null,
    slug: string,
    nameRu: string,
    nameKz: string,
    descriptionRu: string | null = null,
    descriptionKz: string | null = null,
    imageUrl: string | null = null,
    sortOrder: number = 0,
    isActive: boolean = true,
    children: Category[] = [],
    createdAt: Date = new Date(),
    updatedAt: Date = new Date()
  ) {
    this.id = id;
    this.parentId = parentId;
    this.slug = slug;
    this.nameRu = nameRu;
    this.nameKz = nameKz;
    this.descriptionRu = descriptionRu;
    this.descriptionKz = descriptionKz;
    this.imageUrl = imageUrl;
    this.sortOrder = sortOrder;
    this.isActive = isActive;
    this.children = children;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  isRoot(): boolean {
    return this.parentId === null;
  }
}
