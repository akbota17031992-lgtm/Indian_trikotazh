import type { Store } from '../../domain/entities/store.entity.js';

export interface IStoreRepository {
  findAll(options?: { district?: string; activeOnly?: boolean }): Promise<Store[]>;
  findById(id: string): Promise<Store | null>;
  findBySlug(slug: string): Promise<Store | null>;
}
