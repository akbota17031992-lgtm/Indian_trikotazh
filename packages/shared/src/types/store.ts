import type { GeoCoordinates, StoreSchedule } from './common.js';

export interface StoreAddress {
  cityRu: 'Алматы';
  cityKz: 'Алматы';
  districtRu: string; // e.g. "Бостандыкский район"
  districtKz: string; // e.g. "Бостандық ауданы"
  addressRu: string; // e.g. "ул. Розыбакиева, 247А, ТРЦ MEGA Alma-Ata, 2 этаж"
  addressKz: string; // e.g. "Розыбакиев к-сі, 247А, MEGA Alma-Ata СОО, 2 қабат"
  postalCode?: string;
}

export interface StoreFeatures {
  hasFittingRooms: boolean;
  hasParking: boolean;
  acceptsKaspiQr: boolean;
  hasWheelchairAccess: boolean;
}

export interface Store {
  id: string;
  slug: string;
  nameRu: string;
  nameKz: string;
  districtRu: string;
  districtKz: string;
  addressRu: string;
  addressKz: string;
  latitude: number;
  longitude: number;
  phone: string;
  email?: string | null;
  openHoursRu: string;
  openHoursKz: string;
  schedule: StoreSchedule;
  imageUrl?: string | null;
  features: StoreFeatures;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StoreSummary {
  id: string;
  slug: string;
  nameRu: string;
  nameKz: string;
  districtRu: string;
  addressRu: string;
  phone: string;
  openHoursRu: string;
  isActive: boolean;
}
