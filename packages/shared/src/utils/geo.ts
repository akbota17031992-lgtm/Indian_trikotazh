/**
 * Geolocation & Distance utilities for Almaty stores
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface AlmatyDistrictOption {
  id: string;
  nameRu: string;
  nameKz: string;
}

export const ALMATY_DISTRICTS: readonly AlmatyDistrictOption[] = [
  { id: 'all', nameRu: 'Все районы', nameKz: 'Барлық аудандар' },
  { id: 'bostandyk', nameRu: 'Бостандыкский', nameKz: 'Бостандық' },
  { id: 'medeu', nameRu: 'Медеуский', nameKz: 'Медеу' },
  { id: 'almaly', nameRu: 'Алмалинский', nameKz: 'Алмалы' },
  { id: 'auezov', nameRu: 'Ауэзовский', nameKz: 'Әуезов' },
  { id: 'zhetysu', nameRu: 'Жетысуский', nameKz: 'Жетісу' },
  { id: 'turksib', nameRu: 'Турксибский', nameKz: 'Түрксіб' },
  { id: 'nauryzbay', nameRu: 'Наурызбайский', nameKz: 'Наурызбай' },
  { id: 'alatau', nameRu: 'Алатауский', nameKz: 'Алатау' },
];

export interface LandmarkPreset {
  id: string;
  nameRu: string;
  nameKz: string;
  latitude: number;
  longitude: number;
}

export const ALMATY_LANDMARKS: readonly LandmarkPreset[] = [
  {
    id: 'center-arbat',
    nameRu: 'Центр (Арбат / ЦУМ)',
    nameKz: 'Орталық (Арбат / ЦУМ)',
    latitude: 43.2625,
    longitude: 76.944,
  },
  {
    id: 'samal-dostyk',
    nameRu: 'Самал / Достык',
    nameKz: 'Самал / Достық',
    latitude: 43.231,
    longitude: 76.956,
  },
  {
    id: 'orbita-mega',
    nameRu: 'Орбита / Розыбакиева',
    nameKz: 'Орбита / Розыбакиев',
    latitude: 43.2035,
    longitude: 76.8925,
  },
  {
    id: 'aksay-sain',
    nameRu: 'Аксай / Шаляпина',
    nameKz: 'Ақсай / Шаляпин',
    latitude: 43.226,
    longitude: 76.845,
  },
  {
    id: 'almaty-1',
    nameRu: 'Алматы-1 / Вокзал',
    nameKz: 'Алматы-1 / Вокзал',
    latitude: 43.341,
    longitude: 76.953,
  },
];

/**
 * Calculates great-circle distance between two coordinates in kilometers using the Haversine formula.
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.round(d * 10) / 10;
}

