import { z } from 'zod';
import { KazakhstanPhoneSchema } from './common.js';

export const DeliveryTypeSchema = z.enum(['pickup_from_store', 'courier']);

export const OrderStatusSchema = z.enum([
  'pending',
  'paid',
  'processing',
  'ready_for_pickup',
  'shipping',
  'delivered',
  'cancelled',
  'refunded',
]);

export const PaymentMethodSchema = z.enum([
  'kaspi_gold',
  'kaspi_red',
  'kaspi_kredit',
  'cash_on_delivery',
  'card_on_delivery',
  'kaspi_qr',
]);

export const PaymentStatusSchema = z.enum(['pending', 'authorized', 'paid', 'failed', 'refunded']);

export const DeliveryAddressSchema = z.object({
  city: z.literal('Алматы'),
  districtRu: z.string().min(1, 'Ауданды таңдаңыз / Выберите район'),
  districtKz: z.string().min(1),
  street: z.string().min(1, 'Көшені енгізіңіз / Укажите улицу'),
  building: z.string().min(1, 'Үй нөмірін енгізіңіз / Укажите номер дома'),
  apartment: z.string().optional().nullable(),
  floor: z.string().optional().nullable(),
  entrance: z.string().optional().nullable(),
  intercom: z.string().optional().nullable(),
  deliveryNotes: z.string().max(300).optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
});

export const OrderItemCreateSchema = z.object({
  variantId: z.string().uuid(),
  quantity: z.number().int().positive('Саны 1-ден кем болмауы керек'),
  reservedFromStoreId: z.string().uuid(),
});

export const CreateOrderInputSchema = z
  .object({
    customerName: z.string().min(2, 'Аты-жөніңізді енгізіңіз / Укажите имя'),
    customerPhone: KazakhstanPhoneSchema,
    customerEmail: z.string().email('Қате email / Некорректный email').optional().nullable(),
    deliveryType: DeliveryTypeSchema,
    storeId: z.string().uuid().optional().nullable(),
    shippingAddress: DeliveryAddressSchema.optional().nullable(),
    items: z.array(OrderItemCreateSchema).min(1, 'Себет бос болмауы керек / Корзина пуста'),
    paymentMethod: PaymentMethodSchema,
    promotionCode: z.string().optional().nullable(),
    customerComment: z.string().max(500).optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.deliveryType === 'pickup_from_store') {
        return Boolean(data.storeId);
      }
      if (data.deliveryType === 'courier') {
        return Boolean(data.shippingAddress);
      }
      return true;
    },
    {
      message:
        'Алып кету үшін дүкенді немесе курьер үшін мекенжайды таңдаңыз / Выберите филиал для самовывоза или адрес для доставки',
      path: ['deliveryType'],
    }
  );
