import { GeoCoordinates } from '../value-objects/coordinates.vo.js';
import { KazakhstanPhoneNumber } from '../value-objects/phone-number.vo.js';
import { StoreSchedule } from '../value-objects/schedule.vo.js';

export interface StoreFeatures {
  hasFittingRooms: boolean;
  hasParking: boolean;
  acceptsKaspiQr: boolean;
  hasWheelchairAccess: boolean;
}

export class Store {
  readonly id: string;
  readonly slug: string;
  readonly nameRu: string;
  readonly nameKz: string;
  readonly districtRu: string;
  readonly districtKz: string;
  readonly addressRu: string;
  readonly addressKz: string;
  readonly coordinates: GeoCoordinates;
  readonly phone: KazakhstanPhoneNumber;
  readonly email: string | null;
  readonly schedule: StoreSchedule;
  readonly imageUrl: string | null;
  readonly features: StoreFeatures;
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(
    id: string,
    slug: string,
    nameRu: string,
    nameKz: string,
    districtRu: string,
    districtKz: string,
    addressRu: string,
    addressKz: string,
    coordinates: GeoCoordinates,
    phone: KazakhstanPhoneNumber,
    email: string | null,
    schedule: StoreSchedule,
    imageUrl: string | null,
    features: StoreFeatures,
    isActive: boolean,
    createdAt: Date = new Date(),
    updatedAt: Date = new Date()
  ) {
    this.id = id;
    this.slug = slug;
    this.nameRu = nameRu;
    this.nameKz = nameKz;
    this.districtRu = districtRu;
    this.districtKz = districtKz;
    this.addressRu = addressRu;
    this.addressKz = addressKz;
    this.coordinates = coordinates;
    this.phone = phone;
    this.email = email;
    this.schedule = schedule;
    this.imageUrl = imageUrl;
    this.features = features;
    this.isActive = isActive;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  distanceFrom(userCoords: GeoCoordinates): number {
    return this.coordinates.distanceTo(userCoords);
  }

  isOpenNow(date = new Date()): boolean {
    return this.isActive && this.schedule.isOpenAt(date);
  }
}
