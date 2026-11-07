export interface Category {
  id: string;
  parentId: string | null;
  slug: string;
  nameRu: string;
  nameKz: string;
  descriptionRu?: string | null;
  descriptionKz?: string | null;
  imageUrl?: string | null;
  displayOrder: number;
  isActive: boolean;
  children?: Category[];
  createdAt: string;
  updatedAt: string;
}
