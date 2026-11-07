import { Result, ok } from '../../domain/types/result.js';
import type { IStoreRepository } from '../ports/store.repository.port.js';
import { GeoCoordinates } from '../../domain/value-objects/coordinates.vo.js';
import type { Store } from '../../domain/entities/store.entity.js';

export interface ListStoresInput {
  activeOnly?: boolean;
  district?: string;
  userCoordinates?: { latitude: number; longitude: number };
}

export class ListStoresUseCase {
  private readonly storeRepo: IStoreRepository;

  constructor(storeRepo: IStoreRepository) {
    this.storeRepo = storeRepo;
  }

  async execute(input: ListStoresInput = {}): Promise<Result<Store[], never>> {
    const stores = await this.storeRepo.findAll({
      district: input.district,
      activeOnly: input.activeOnly ?? true
    });

    if (input.userCoordinates) {
      const userGeo = new GeoCoordinates(input.userCoordinates.latitude, input.userCoordinates.longitude);
      stores.sort((a, b) => a.distanceFrom(userGeo) - b.distanceFrom(userGeo));
    }

    return ok(stores);
  }
}
