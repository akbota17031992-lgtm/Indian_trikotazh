import type { KaspiPaymentMode } from '@india-trikotaj/shared';
import { validateKazakhstanPhone } from '@india-trikotaj/shared';
import type { IPaymentGateway, PaymentInvoiceResult } from '../ports/payment-gateway.port.js';
import type { IOrderRepository } from '../ports/order.repository.port.js';
import { AppError } from '../../infrastructure/http/middlewares/error-handler.middleware.js';

export interface CreateKaspiInvoiceDTO {
  orderId: string;
  amount?: number;
  amountKzt?: number;
  phone?: string;
  customerPhone?: string;
  paymentMode?: KaspiPaymentMode;
  description?: string;
  returnUrl?: string;
  idempotencyKey?: string;
}

export class CreateKaspiInvoiceUseCase {
  constructor(
    private readonly paymentGateway: IPaymentGateway,
    private readonly orderRepo: IOrderRepository
  ) {}

  public async execute(input: CreateKaspiInvoiceDTO): Promise<PaymentInvoiceResult> {
    const finalAmount = input.amount !== undefined ? input.amount : input.amountKzt;

    // 1. Invariant: Whole tenge validation (reject fractional tiyn and non-positive)
    if (finalAmount === undefined || !Number.isInteger(finalAmount) || finalAmount <= 0) {
      throw new AppError(422, 'amount_must_be_whole_tenge', 'Kaspi Pay only accepts whole tenge amounts');
    }

    const isExplicitQr = input.paymentMode === 'QR';
    const mode: KaspiPaymentMode = input.paymentMode || 'QR';
    const isPush = mode !== 'QR';
    const description = input.description || '';

    // 2. Invariant: Description length check (QR <= 100, Push/default <= 60)
    if (isExplicitQr) {
      if (description.length > 100) {
        throw new AppError(422, 'description_too_long', 'Payment description exceeds maximum of 100 characters for QR');
      }
    } else {
      if (description.length > 60) {
        throw new AppError(422, 'description_too_long', 'Payment description exceeds maximum of 60 characters for Kaspi Pay');
      }
    }

    // 3. Invariant: Phone number validation
    const resolvedPhone = (input.phone || input.customerPhone || '').trim();
    if (isPush) {
      if (!resolvedPhone || !validateKazakhstanPhone(resolvedPhone)) {
        throw new AppError(422, 'invalid_kazakhstan_phone', 'Valid Kazakhstan phone number is required for phone push invoices');
      }
    } else if (resolvedPhone !== '') {
      if (!validateKazakhstanPhone(resolvedPhone)) {
        throw new AppError(422, 'invalid_kazakhstan_phone', 'Invalid Kazakhstan phone number format');
      }
    }

    // 4. Order existence check & idempotency check against order state
    if (input.orderId) {
      const order = await this.orderRepo.findById(input.orderId);
      if (order) {
        if (order.status === 'paid' || order.paymentStatus === 'paid') {
          throw new AppError(409, 'ORDER_ALREADY_PAID', 'Order has already been paid');
        }
      }
    }

    // 5. Call Gateway to issue invoice
    const invoiceResult = await this.paymentGateway.createInvoice({
      orderId: input.orderId,
      amountKzt: finalAmount,
      phone: resolvedPhone || undefined,
      paymentMode: mode,
      description,
      returnUrl: input.returnUrl,
      idempotencyKey: input.idempotencyKey,
    });

    // 6. Update order with pending payment status and provider invoice ID
    if (input.orderId) {
      await this.orderRepo.updateKaspiPayment(input.orderId, {
        invoiceId: invoiceResult.providerInvoiceId,
        status: 'pending',
        paymentMode: mode,
      });
    }

    return invoiceResult;
  }
}
