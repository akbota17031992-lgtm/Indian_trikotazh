import type { IPaymentGateway } from '../ports/payment-gateway.port.js';
import type { IOrderRepository } from '../ports/order.repository.port.js';
import type { IInventoryRepository } from '../ports/inventory.repository.port.js';
import { AppError } from '../../infrastructure/http/middlewares/error-handler.middleware.js';

export interface ProcessKaspiWebhookInput {
  rawBody: Buffer | string | undefined;
  signatureHeader: string | string[] | undefined;
  payload: any;
}

export interface ProcessKaspiWebhookResult {
  success: boolean;
  processed?: boolean;
  deduplicated?: boolean;
  ignored?: boolean;
}

export class ProcessKaspiWebhookUseCase {
  private readonly processedEvents = new Set<string>();

  constructor(
    private readonly paymentGateway: IPaymentGateway,
    private readonly orderRepo: IOrderRepository,
    private readonly inventoryRepo: IInventoryRepository
  ) {}

  public async execute(input: ProcessKaspiWebhookInput): Promise<ProcessKaspiWebhookResult> {
    // 1. Signature header guard: handle missing or multi-value header
    if (!input.signatureHeader) {
      throw new AppError(401, 'MISSING_SIGNATURE', 'Missing webhook signature');
    }

    const rawHeader = Array.isArray(input.signatureHeader)
      ? input.signatureHeader[0]
      : input.signatureHeader;

    if (!rawHeader || typeof rawHeader !== 'string' || rawHeader.trim() === '') {
      throw new AppError(401, 'MISSING_SIGNATURE', 'Missing webhook signature');
    }

    // 2. Raw body guard
    if (
      input.rawBody === undefined ||
      input.rawBody === null ||
      (typeof input.rawBody === 'string' && input.rawBody.length === 0) ||
      (Buffer.isBuffer(input.rawBody) && input.rawBody.length === 0)
    ) {
      throw new AppError(401, 'INVALID_SIGNATURE', 'Empty or missing raw request body');
    }

    // 3. Cryptographic HMAC-SHA256 signature verification (constant-time, 32-byte buffers)
    const isValid = this.paymentGateway.verifyWebhookSignature(input.rawBody, rawHeader.trim());
    if (!isValid) {
      throw new AppError(401, 'INVALID_SIGNATURE', 'HMAC signature verification failed');
    }

    // 4. Normalize incoming payload: supports both direct and nested event structure
    const p = input.payload || {};
    const invoiceId = p.invoiceId || p.invoice?.id || '';
    const orderId = p.orderId || p.invoice?.external_order_id || '';
    const rawStatus = (p.status || p.invoice?.status || '').toString().toUpperCase();
    const transactionId = p.transactionId || p.invoice?.id || invoiceId;

    // 5. Idempotent Deduplication by (invoiceId:status)
    const dedupeKey = `${invoiceId}:${rawStatus}`;
    if (this.processedEvents.has(dedupeKey)) {
      return { success: true, deduplicated: true };
    }

    // Bound memory set size to prevent memory leaks in high-load services
    if (this.processedEvents.size > 20000) {
      this.processedEvents.clear();
    }
    this.processedEvents.add(dedupeKey);

    // 6. Order status update & Inventory coordination
    const order = orderId ? await this.orderRepo.findById(orderId) : null;

    if (rawStatus === 'SUCCESS' || rawStatus === 'PAID') {
      // Idempotent no-op if order is already paid
      if (order && (order.status === 'paid' || order.paymentStatus === 'paid')) {
        return { success: true, processed: true, deduplicated: true };
      }

      // Invariant guard: an order in terminal/cancelled state cannot transition to paid
      if (order && !order.canTransitionTo('paid')) {
        return { success: true, processed: false, ignored: true };
      }

      if (orderId) {
        await this.orderRepo.updateKaspiPayment(orderId, {
          invoiceId,
          transactionId,
          status: 'paid',
        });
      }

      // Transition reserved stock to committed deduction
      if (order?.items && order.items.length > 0) {
        for (const item of order.items) {
          const storeId = item.reservedFromStoreId || order.pickupStoreId;
          if (storeId && item.variantId) {
            await this.inventoryRepo.commitStockDeduction(
              storeId,
              item.variantId,
              item.quantity,
              order.id
            );
          }
        }
      }
    } else if (rawStatus === 'FAILED' || rawStatus === 'CANCELLED') {
      // Invariant guard: Webhook cancellation is ONLY permitted for pending orders.
      // If order is paid, processing, shipping, delivered, or refunded, safely ignore event:
      // never revert order status and never release committed inventory.
      if (order && order.status !== 'pending' && order.status !== 'pending_payment') {
        return { success: true, processed: false, ignored: true };
      }

      if (orderId) {
        await this.orderRepo.updateKaspiPayment(orderId, {
          invoiceId,
          transactionId,
          status: 'cancelled',
        });
      }

      // Release reserved stock back to available store inventory
      if (order?.items && order.items.length > 0) {
        for (const item of order.items) {
          const storeId = item.reservedFromStoreId || order.pickupStoreId;
          if (storeId && item.variantId) {
            await this.inventoryRepo.releaseStock(
              storeId,
              item.variantId,
              item.quantity,
              order.id
            );
          }
        }
      }
    } else if (rawStatus === 'REFUNDED') {
      if (order && !order.canTransitionTo('refunded')) {
        return { success: true, processed: false, ignored: true };
      }

      if (orderId) {
        await this.orderRepo.updateKaspiPayment(orderId, {
          invoiceId,
          transactionId,
          status: 'refunded',
        });
      }
    }

    return { success: true, processed: true };
  }

  public clearDeduplication(): void {
    this.processedEvents.clear();
  }
}
