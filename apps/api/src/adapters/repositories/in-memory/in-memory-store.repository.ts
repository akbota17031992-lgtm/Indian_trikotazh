import type { IStoreRepository } from '../../../use-cases/ports/store.repository.port.js';
import { Store } from '../../../domain/entities/store.entity.js';
import { GeoCoordinates } from '../../../domain/value-objects/coordinates.vo.js';
import { KazakhstanPhoneNumber } from '../../../domain/value-objects/phone-number.vo.js';
import { StoreSchedule } from '../../../domain/value-objects/schedule.vo.js';
import { SEED_STORES, type SeedStore } from './seed-data.js';

export class InMemoryStoreRepository implements IStoreRepository {
  private readonly stores: Map<string, Store>;

  constructor() {
    this.stores = new Map<string, Store>();
    for (const s of SEED_STORES) {
      const storeEntity = this.mapSeedToEntity(s);
      this.stores.set(storeEntity.id, storeEntity);
    }
  }

  public async findAll(options?: { district?: string; activeOnly?: boolean }): Promise<Store[]> {
    let list = Array.from(this.stores.values());
    if (options?.activeOnly !== false) {
      list = list.filter((s) => s.isActive);
    }
    if (options?.district) {
      list = list.filter(
        (s) => s.districtRu === options.district || s.districtKz === options.district
      );
    }
    return list;
  }

  public async findById(id: string): Promise<Store | null> {
    return this.stores.get(id) || null;
  }

  public async findBySlug(slug: string): Promise<Store | null> {
    for (const store of this.stores.values()) {
      if (store.slug === slug) return store;
    }
    return null;
  }

  private mapSeedToEntity(s: SeedStore): Store {
    let phoneVO: KazakhstanPhoneNumber;
    try {
      phoneVO = KazakhstanPhoneNumber.from(s.phone);
    } catch {
      phoneVO = new KazakhstanPhoneNumber('+77272322501');
    }

    return new Store(
      s.id,
      s.slug,
      s.nameRu,
      s.nameKz,
      s.districtRu,
      s.districtKz,
      s.addressRu,
      s.addressKz,
      new GeoCoordinates(s.latitude, s.longitude),
      phoneVO,
      `${s.slug}@india-trikotaj.kz`,
      new StoreSchedule(
        StoreSchedule.defaultAlmatyDaily().days,
        s.scheduleRu,
        s.scheduleKz
      ),
      null,
      {
        hasFittingRooms: true,
        hasParking: true,
        acceptsKaspiQr: true,
        hasWheelchairAccess: false
      },
      s.isActive,
      new Date(),
      new Date()
    );
  }
}
