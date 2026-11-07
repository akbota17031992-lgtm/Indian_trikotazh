import { z } from 'zod';
import { GeoCoordinatesSchema, StoreScheduleSchema, KazakhstanPhoneSchema } from './common.js';

export const StoreAddressSchema = z.object({
  cityRu: z.literal('Алматы'),
  cityKz: z.literal('Алматы'),
  districtRu: z.string().min(1),
  districtKz: z.string().min(1),
  addressRu: z.string().min(1),
  addressKz: z.string().min(1),
  postalCode: z.string().optional(),
});

export const StoreFeaturesSchema = z.object({
  hasFittingRooms: z.boolean().default(true),
  hasParking: z.boolean().default(true),
  acceptsKaspiQr: z.boolean().default(true),
  hasWheelchairAccess: z.boolean().default(false),
});

export const StoreSchema = z.object({
  id: z.string().uuid(),
  slug: z.string().min(1),
  nameRu: z.string().min(1),
  nameKz: z.string().min(1),
  districtRu: z.string().min(1),
  districtKz: z.string().min(1),
  addressRu: z.string().min(1),
  addressKz: z.string().min(1),
  latitude: z.number(),
  longitude: z.number(),
  phone: KazakhstanPhoneSchema,
  email: z.string().email().nullable().optional(),
  openHoursRu: z.string().min(1),
  openHoursKz: z.string().min(1),
  schedule: StoreScheduleSchema,
  imageUrl: z.string().url().nullable().optional(),
  features: StoreFeaturesSchema,
  isActive: z.boolean().default(true),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const StoreCreateInputSchema = StoreSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const StoreUpdateInputSchema = StoreCreateInputSchema.partial();
