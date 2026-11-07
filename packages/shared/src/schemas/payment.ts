import { z } from 'zod';
import { KazakhstanPhoneSchema, MoneyKztSchema } from './common.js';

export const KaspiPaymentModeSchema = z.enum(['KaspiGold', 'KaspiRed', 'KaspiKredit', 'QR']);

export const KaspiSourceTypeSchema = z.enum([
  'GOLD',
  'RED',
  'LOAN',
  'BUSINESSACCOUNT',
  'BANKINTEGRATIONACCOUNT',
]);

export const KaspiInvoiceStatusSchema = z.enum([
  'pending',
  'processing',
  'paid',
  'cancelled',
  'expired',
  'refunded',
  'failed',
]);

export const KaspiCreateInvoiceInputSchema = z
  .object({
    orderId: z.string().uuid(),
    amountKzt: MoneyKztSchema.refine((n) => n > 0, 'Сома 0-ден көп болуы тиіс'),
    customerPhone: KazakhstanPhoneSchema.optional(),
    phone: KazakhstanPhoneSchema.optional(),
    paymentMode: KaspiPaymentModeSchema,
    description: z.string().min(1).max(100),
    returnUrl: z
      .string()
      .url('URL форматы қате / Некорректный формат URL')
      .refine(
        (url) => /^https?:\/\//i.test(url),
        'URL тек http немесе https протоколын қолдануы тиіс / URL должен использовать протокол http или https'
      ),
    simulate: z.boolean().optional(),
  })
  .refine((data) => Boolean(data.phone || data.customerPhone), {
    message: 'Телефон нөмірі қажет / Номер телефона обязателен',
    path: ['phone'],
  })
  .refine(
    (data) => {
      // ApiPay.kz requires <= 60 characters for phone push invoices
      if (data.paymentMode !== 'QR' && data.description.length > 60) {
        return false;
      }
      return true;
    },
    {
      message:
        'Kaspi push сипаттамасы 60 таңбадан аспауы керек / Описание счета Kaspi не может превышать 60 символов',
      path: ['description'],
    }
  )
  .transform((data) => {
    const resolvedPhone = (data.phone ?? data.customerPhone)!;
    return {
      ...data,
      phone: data.phone ?? resolvedPhone,
      customerPhone: data.customerPhone ?? resolvedPhone,
      get normalizedPhone(): string {
        return resolvedPhone;
      },
    };
  });

export const KaspiWebhookInvoicePayloadSchema = z.object({
  id: z.string(),
  external_order_id: z.string(),
  amount: z.number().int().positive(),
  status: z.enum(['processing', 'paid', 'cancelled', 'expired', 'refunded', 'failed']),
  phone_number: z.string().optional(),
  kaspi_source_type: KaspiSourceTypeSchema.optional(),
  paid_at: z.string().optional(),
  created_at: z.string(),
  is_sandbox: z.boolean().optional(),
});

export const KaspiWebhookPayloadSchema = z.object({
  event: z.enum(['invoice.status_changed', 'invoice.qr_scanned', 'invoice.refunded']),
  invoice: KaspiWebhookInvoicePayloadSchema,
  signature: z.string().min(1),
  timestamp: z.string(),
});

export const KaspiDirectWebhookCallbackSchema = z.object({
  invoiceId: z.string(),
  orderId: z.string(),
  amount: z.number().int().positive(),
  status: z.enum(['SUCCESS', 'FAILED', 'REFUNDED']),
  transactionId: z.string(),
  paymentMethod: z.string(),
  kaspiSourceType: KaspiSourceTypeSchema.optional(),
  isSandbox: z.boolean().optional(),
});

/**
 * Zod schema alias for Kaspi webhook callback to satisfy PROJECT.md interface contract line 52.
 */
export const KaspiWebhookCallbackSchema = KaspiWebhookPayloadSchema;

export const KaspiMockActionInputSchema = z.object({
  invoiceId: z.string(),
  action: z.enum(['complete', 'cancel', 'expire', 'refund']),
  paymentMode: KaspiPaymentModeSchema.optional(),
});
