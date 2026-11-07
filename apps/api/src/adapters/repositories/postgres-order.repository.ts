import type { DatabasePool } from '../../infrastructure/db/pool.js';
import type { IOrderRepository } from '../../use-cases/ports/order.repository.port.js';
import { Order } from '../../domain/entities/order.entity.js';
import { OrderItem } from '../../domain/entities/order-item.entity.js';
import { Money } from '../../domain/value-objects/money.vo.js';
import { KazakhstanPhoneNumber } from '../../domain/value-objects/phone-number.vo.js';
import type { OrderStatus, PaymentStatus, DeliveryType, PaymentMethod } from '@india-trikotaj/shared';

export class PostgresOrderRepository implements IOrderRepository {
  private readonly db: DatabasePool;

  constructor(db: DatabasePool) {
    this.db = db;
  }

  public async create(order: Order): Promise<Order> {
    return this.db.withTransaction(async (client) => {
      const orderInsertSql = `
        INSERT INTO public.orders (
          id, order_number, user_id, customer_name, customer_phone, customer_email,
          status, delivery_type, pickup_store_id, shipping_address,
          subtotal_kzt, discount_kzt, delivery_fee_kzt, total_kzt,
          promotion_id, payment_method, payment_status,
          kaspi_invoice_id, kaspi_transaction_id, kaspi_payment_data,
          customer_comment, admin_notes
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10,
          $11, $12, $13, $14,
          $15, $16, $17,
          $18, $19, $20,
          $21, $22
        ) RETURNING *
      `;

      const params = [
        order.id,
        order.orderNumber,
        order.userId,
        order.customerName,
        order.customerPhone.toE164(),
        order.customerEmail,
        order.status,
        order.deliveryType,
        order.pickupStoreId,
        order.shippingAddress ? JSON.stringify(order.shippingAddress) : null,
        order.subtotal.amountKzt,
        order.discount.amountKzt,
        order.deliveryFee.amountKzt,
        order.total.amountKzt,
        order.promotionId,
        order.paymentMethod,
        order.paymentStatus,
        order.kaspiInvoiceId,
        order.kaspiTransactionId,
        JSON.stringify(order.kaspiPaymentData || {}),
        order.customerComment,
        order.adminNotes
      ];

      await client.query(orderInsertSql, params);

      for (const item of order.items) {
        const itemSql = `
          INSERT INTO public.order_items (
            id, order_id, variant_id, sku, product_name, size, color,
            product_snapshot, unit_price_kzt, quantity, total_kzt
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
          )
        `;
        await client.query(itemSql, [
          item.id,
          order.id,
          item.variantId,
          item.productSnapshot.sku,
          item.productSnapshot.titleRu,
          item.productSnapshot.size,
          item.productSnapshot.colorRu,
          JSON.stringify(item.productSnapshot),
          item.unitPrice.amountKzt,
          item.quantity,
          item.totalPrice.amountKzt
        ]);
      }

      return order;
    });
  }

  public async findById(id: string): Promise<Order | null> {
    const res = await this.db.query('SELECT * FROM public.orders WHERE id = $1', [id]);
    if (!res.rows[0]) return null;
    const items = await this.findItemsByOrderId(id);
    return this.mapRowToEntity(res.rows[0], items);
  }

  public async findByOrderNumber(orderNumber: string): Promise<Order | null> {
    const res = await this.db.query('SELECT * FROM public.orders WHERE order_number = $1', [orderNumber]);
    if (!res.rows[0]) return null;
    const items = await this.findItemsByOrderId(res.rows[0].id);
    return this.mapRowToEntity(res.rows[0], items);
  }

  public async findByUserId(userId: string): Promise<Order[]> {
    const res = await this.db.query('SELECT * FROM public.orders WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    const orders: Order[] = [];
    for (const row of res.rows) {
      const items = await this.findItemsByOrderId(row.id);
      orders.push(this.mapRowToEntity(row, items));
    }
    return orders;
  }

  public async findAll(options?: { storeId?: string }): Promise<Order[]> {
    let sql = 'SELECT * FROM public.orders WHERE 1=1';
    const params: any[] = [];
    if (options?.storeId) {
      params.push(options.storeId);
      sql += ` AND pickup_store_id = $${params.length}`;
    }
    sql += ' ORDER BY created_at DESC';

    const res = await this.db.query(sql, params);
    const orders: Order[] = [];
    for (const row of res.rows) {
      const items = await this.findItemsByOrderId(row.id);
      orders.push(this.mapRowToEntity(row, items));
    }
    return orders;
  }

  public async update(order: Order): Promise<Order> {
    const sql = `
      UPDATE public.orders SET
        status = $1,
        payment_status = $2,
        kaspi_invoice_id = $3,
        kaspi_transaction_id = $4,
        updated_at = NOW()
      WHERE id = $5
    `;
    await this.db.query(sql, [
      order.status,
      order.paymentStatus,
      order.kaspiInvoiceId,
      order.kaspiTransactionId,
      order.id
    ]);
    return order;
  }

  public async updateStatus(
    id: string,
    status: OrderStatus,
    paymentStatus?: PaymentStatus
  ): Promise<Order | null> {
    let sql = 'UPDATE public.orders SET status = $1, updated_at = NOW()';
    const params: any[] = [status];

    if (paymentStatus) {
      params.push(paymentStatus);
      sql += `, payment_status = $${params.length}`;
    }
    params.push(id);
    sql += ` WHERE id = $${params.length} RETURNING *`;

    const res = await this.db.query(sql, params);
    if (!res.rows[0]) return null;
    const items = await this.findItemsByOrderId(id);
    return this.mapRowToEntity(res.rows[0], items);
  }

  public async updateKaspiPayment(
    orderId: string,
    data: { invoiceId?: string; status: string; paymentMode?: string; transactionId?: string }
  ): Promise<Order | null> {
    const normalizedStatus = (data.status || '').toUpperCase();
    let targetOrderStatus: string | null = null;
    let targetPaymentStatus: string | null = null;

    if (normalizedStatus === 'PAID' || normalizedStatus === 'SUCCESS') {
      targetOrderStatus = 'paid';
      targetPaymentStatus = 'paid';
    } else if (normalizedStatus === 'FAILED' || normalizedStatus === 'CANCELLED') {
      targetOrderStatus = 'cancelled';
      targetPaymentStatus = 'failed';
    } else if (normalizedStatus === 'REFUNDED') {
      targetOrderStatus = 'refunded';
      targetPaymentStatus = 'refunded';
    } else if (normalizedStatus === 'PENDING' || normalizedStatus === 'PROCESSING') {
      targetOrderStatus = 'pending_payment';
      targetPaymentStatus = 'pending';
    }

    const sql = `
      UPDATE public.orders SET
        kaspi_invoice_id = COALESCE($1, kaspi_invoice_id),
        kaspi_transaction_id = COALESCE($2, kaspi_transaction_id),
        kaspi_payment_mode = COALESCE($3, kaspi_payment_mode),
        status = CASE
          WHEN $4::text = 'cancelled' AND status NOT IN ('pending', 'pending_payment') THEN status
          WHEN $4::text = 'paid' AND status NOT IN ('pending', 'pending_payment') THEN status
          WHEN $4::text = 'refunded' AND status NOT IN ('paid', 'delivered') THEN status
          WHEN $4::text = 'pending_payment' AND status <> 'pending' THEN status
          WHEN $4::text IS NOT NULL THEN $4::text
          ELSE status
        END,
        payment_status = CASE
          WHEN $4::text = 'cancelled' AND status NOT IN ('pending', 'pending_payment') THEN payment_status
          WHEN $5::text IS NOT NULL THEN $5::text
          ELSE payment_status
        END,
        updated_at = NOW()
      WHERE id = $6
      RETURNING *
    `;

    const res = await this.db.query(sql, [
      data.invoiceId || null,
      data.transactionId || null,
      data.paymentMode || null,
      targetOrderStatus,
      targetPaymentStatus,
      orderId,
    ]);

    if (!res.rows[0]) return null;
    const items = await this.findItemsByOrderId(orderId);
    return this.mapRowToEntity(res.rows[0], items);
  }

  private async findItemsByOrderId(orderId: string): Promise<OrderItem[]> {
    const res = await this.db.query('SELECT * FROM public.order_items WHERE order_id = $1', [orderId]);
    return res.rows.map((r: any) => {
      const snap = typeof r.product_snapshot === 'string'
        ? JSON.parse(r.product_snapshot)
        : (r.product_snapshot || {});

      return new OrderItem(
        r.id,
        r.order_id,
        r.variant_id,
        {
          titleRu: snap.titleRu || r.product_name,
          titleKz: snap.titleKz || r.product_name,
          sku: r.sku,
          size: r.size,
          colorRu: r.color,
          colorKz: snap.colorKz || r.color,
          imageUrl: snap.imageUrl
        },
        new Money(Math.round(parseFloat(r.unit_price_kzt || '0'))),
        parseInt(r.quantity || '1', 10),
        r.reserved_from_store_id || 'store-almaty-001'
      );
    });
  }

  private mapRowToEntity(row: any, items: OrderItem[]): Order {
    let phoneVO: KazakhstanPhoneNumber;
    try {
      phoneVO = KazakhstanPhoneNumber.from(row.customer_phone);
    } catch {
      phoneVO = new KazakhstanPhoneNumber('+77011234567');
    }

    const shippingAddr = typeof row.shipping_address === 'string'
      ? JSON.parse(row.shipping_address)
      : row.shipping_address;

    return new Order(
      row.id,
      row.order_number,
      row.user_id,
      row.customer_name,
      phoneVO,
      row.customer_email,
      row.status as OrderStatus,
      (row.delivery_type || 'pickup') as DeliveryType,
      row.pickup_store_id,
      null,
      shippingAddr,
      items,
      new Money(Math.round(parseFloat(row.subtotal_kzt || '0'))),
      new Money(Math.round(parseFloat(row.discount_kzt || '0'))),
      new Money(Math.round(parseFloat(row.delivery_fee_kzt || '0'))),
      new Money(Math.round(parseFloat(row.total_kzt || '0'))),
      row.promotion_id,
      null,
      (row.payment_method || 'kaspi_gold') as PaymentMethod,
      (row.payment_status || 'pending') as PaymentStatus,
      row.kaspi_invoice_id,
      row.kaspi_transaction_id,
      typeof row.kaspi_payment_data === 'string' ? JSON.parse(row.kaspi_payment_data) : (row.kaspi_payment_data || {}),
      row.customer_comment,
      row.admin_notes,
      new Date(row.created_at || Date.now()),
      new Date(row.updated_at || Date.now())
    );
  }
}
