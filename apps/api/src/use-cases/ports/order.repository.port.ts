import type { Order } from '../../domain/entities/order.entity.js';
import type { OrderStatus, PaymentStatus } from '@india-trikotaj/shared';

export interface IOrderRepository {
  create(order: Order): Promise<Order>;
  findById(id: string): Promise<Order | null>;
  findByOrderNumber(orderNumber: string): Promise<Order | null>;
  findByUserId(userId: string): Promise<Order[]>;
  findAll(options?: { storeId?: string }): Promise<Order[]>;
  update(order: Order): Promise<Order>;
  updateStatus(id: string, status: OrderStatus, paymentStatus?: PaymentStatus): Promise<Order | null>;
  updateKaspiPayment(
    orderId: string,
    data: { invoiceId?: string; status: string; paymentMode?: string; transactionId?: string }
  ): Promise<Order | null>;
}
