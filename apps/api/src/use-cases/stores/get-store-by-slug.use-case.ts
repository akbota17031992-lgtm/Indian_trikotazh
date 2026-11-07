import { Result, ok, err } from '../../domain/types/result.js';
import { NotFoundError } from '../../domain/errors/domain-errors.js';
import type { IStoreRepository } from '../ports/store.repository.port.js';
import type { Store } from '../../domain/entities/store.entity.js';

export class GetStoreBySlugUseCase {
  private readonly storeRepo: IStoreRepository;

  constructor(storeRepo: IStoreRepository) {
    this.storeRepo = storeRepo;
  }

  async execute(slugOrId: string): Promise<Result<Store, NotFoundError>> {
    if (!slugOrId || !slugOrId.trim()) {
      return err(NotFoundError.store(slugOrId));
    }
    const trimmed = slugOrId.trim();
    let store = await this.storeRepo.findBySlug(trimmed);
    if (!store) {
      store = await this.storeRepo.findById(trimmed);
    }
    if (!store) {
      return err(NotFoundError.store(slugOrId));
    }
    return ok(store);
  }
}
