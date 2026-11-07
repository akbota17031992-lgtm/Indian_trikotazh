import { z } from 'zod';
import { validateKazakhstanPhone } from '../utils/phone.js';

export const LocaleSchema = z.enum(['ru', 'kz']);

export const CurrencySchema = z.literal('KZT');

export const KazakhstanPhoneSchema = z
  .string()
  .min(10, 'Телефон номері тым қысқа / Номер телефона слишком короткий')
  .max(25, 'Телефон номері тым ұзын / Номер телефона слишком длинный')
  .refine(
    (val) => validateKazakhstanPhone(val),
    'Қазақстанның дұрыс телефон нөмірін енгізіңіз (+7 7XX XXX-XX-XX) / Укажите корректный номер телефона Казахстана'
  );

export const HexColorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, 'Түс коды #RRGGBB форматында болуы тиіс');

export const BarcodeSchema = z
  .string()
  .regex(/^[0-9]{13}$/, 'Штрих-код 13 саннан тұруы тиіс (EAN-13)');

export const MoneyKztSchema = z.number().int().nonnegative('Сома 0-ден кем болмауы керек');

export const GeoCoordinatesSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export const ScheduleDaySchema = z.object({
  dayOfWeek: z.union([
    z.literal(0),
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
    z.literal(6),
  ]),
  openTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/),
  closeTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/),
  isClosed: z.boolean(),
});

export const StoreScheduleSchema = z.object({
  days: z.array(ScheduleDaySchema),
  displayTextRu: z.string().min(1),
  displayTextKz: z.string().min(1),
});
