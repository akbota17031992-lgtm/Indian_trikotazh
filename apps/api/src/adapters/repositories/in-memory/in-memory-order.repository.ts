import type { IOrderRepository } from '../../../use-cases/ports/order.repository.port.js';
import { Order } from '../../../domain/entities/order.entity.js';
import type { OrderStatus, PaymentStatus } from '@india-trikotaj/shared';

export class InMemoryOrderRepository implements IOrderRepository {
  private readonly orders: Map<string, Order>;

  constructor() {
    this.orders = new Map<string, Order>();
  }

  public async create(order: Order): Promise<Order> {
    this.orders.set(order.id, order);
    return order;
  }

  public async findById(id: string): Promise<Order | null> {
    return this.orders.get(id) || null;
  }

  public async findByOrderNumber(orderNumber: string): Promise<Order | null> {
    for (const order of this.orders.values()) {
      if (order.orderNumber === orderNumber) return order;
    }
    return null;
  }

  public async findByUserId(userId: string): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(o => o.userId === userId);
  }

  public async findAll(options?: { storeId?: string }): Promise<Order[]> {
    let list = Array.from(this.orders.values());
    if (options?.storeId) {
      list = list.filter(o => o.pickupStoreId === options.storeId);
    }
    return list;
  }

  public async update(order: Order): Promise<Order> {
    this.orders.set(order.id, order);
    return order;
  }

  public async updateStatus(
    id: string,
    status: OrderStatus,
    paymentStatus?: PaymentStatus
  ): Promise<Order | null> {
    const order = this.orders.get(id);
    if (!order) return null;

    order.status = status;
    if (paymentStatus) {
      order.paymentStatus = paymentStatus;
    }
    order.updatedAt = new Date();
    this.orders.set(id, order);
    return order;
  }

  public async updateKaspiPayment(
    orderId: string,
    data: { invoiceId?: string; status: string; paymentMode?: string; transactionId?: string }
  ): Promise<Order | null> {
    const order = this.orders.get(orderId);
    if (!order) return null;

    if (data.invoiceId) order.kaspiInvoiceId = data.invoiceId;
    if (data.transactionId) order.kaspiTransactionId = data.transactionId;
    if (data.paymentMode) (order as any).kaspiPaymentMode = data.paymentMode;

    const normalizedStatus = (data.status || '').toUpperCase();
    if (normalizedStatus === 'PAID' || normalizedStatus === 'SUCCESS') {
      if (order.status === 'pending' || order.status === 'pending_payment') {
        order.status = 'paid';
      }
      order.paymentStatus = 'paid';
    } else if (normalizedStatus === 'FAILED' || normalizedStatus === 'CANCELLED') {
      // Defensive guard: never transition non-pending order to cancelled
      if (order.status === 'pending' || order.status === 'pending_payment') {
        order.status = 'cancelled';
        order.paymentStatus = 'failed';
      }
    } else if (normalizedStatus === 'REFUNDED') {
      if (order.status === 'paid' || order.status === 'delivered') {
        order.status = 'refunded';
        order.paymentStatus = 'refunded';
      }
    } else if (normalizedStatus === 'PENDING' || normalizedStatus === 'PROCESSING') {
      if (order.status === 'pending') {
        order.status = 'pending_payment';
      }
      order.paymentStatus = 'pending';
    }
    order.updatedAt = new Date();
    this.orders.set(orderId, order);
    return order;
  }
}
