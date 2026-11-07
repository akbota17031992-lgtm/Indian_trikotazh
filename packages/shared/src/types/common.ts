export type Locale = 'ru' | 'kz';
export type Currency = 'KZT';

export interface LocalizedString {
  ru: string;
  kz: string;
}

export interface Money {
  amount: number; // Integer in KZT (e.g. 14990)
  currency: Currency;
}

export interface GeoCoordinates {
  latitude: number;
  longitude: number;
}

export interface ScheduleDay {
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday, 1 = Monday, ...
  openTime: string; // "10:00"
  closeTime: string; // "22:00"
  isClosed: boolean;
}

export interface StoreSchedule {
  days: ScheduleDay[];
  displayTextRu: string; // "Пн-Вс: 10:00 - 22:00"
  displayTextKz: string; // "Дс-Жс: 10:00 - 22:00"
}

export type Result<T, E = Error> = { success: true; data: T } | { success: false; error: E };

export type GenderTarget = 'unisex' | 'men' | 'women' | 'boys' | 'girls' | 'kids_unisex';
export type Season = 'all_season' | 'summer' | 'winter' | 'demi_season';

export type ClothingSize =
  | 'XS'
  | 'S'
  | 'M'
  | 'L'
  | 'XL'
  | '2XL'
  | '3XL'
  | '4XL'
  | '5XL'
  | '86-92'
  | '98-104'
  | '110-116'
  | '122-128'
  | '134-140'
  | '146-152'
  | 'OneSize';
