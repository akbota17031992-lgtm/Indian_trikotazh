import { Money } from '../value-objects/money.vo.js';
import { KazakhstanPhoneNumber } from '../value-objects/phone-number.vo.js';
import type { OrderItem } from './order-item.entity.js';
import { Result, ok, err } from '../types/result.js';
import { InvalidStateTransitionError } from '../errors/domain-errors.js';
import type {
  PaymentStatus,
  PaymentMethod,
  DeliveryAddress,
  StoreSummary
} from '@india-trikotaj/shared';

export type DomainOrderStatus =
  | 'pending'
  | 'pending_payment'
  | 'paid'
  | 'processing'
  | 'ready_for_pickup'
  | 'shipping'
  | 'in_transit'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type DomainDeliveryType = 'pickup' | 'pickup_from_store' | 'courier';

const VALID_TRANSITIONS: Record<DomainOrderStatus, DomainOrderStatus[]> = {
  pending: ['pending_payment', 'paid', 'cancelled'],
  pending_payment: ['paid', 'cancelled'],
  paid: ['processing', 'refunded'],
  processing: ['ready_for_pickup', 'shipping', 'in_transit', 'cancelled'],
  ready_for_pickup: ['delivered', 'cancelled'],
  shipping: ['delivered', 'cancelled'],
  in_transit: ['delivered', 'cancelled'],
  delivered: ['refunded'],
  cancelled: [],
  refunded: []
};

export class Order {
  readonly id: string;
  readonly orderNumber: string;
  readonly userId: string | null;
  customerName: string;
  customerPhone: KazakhstanPhoneNumber;
  customerEmail: string | null;
  status: DomainOrderStatus;
  readonly deliveryType: DomainDeliveryType;
  readonly pickupStoreId: string | null;
  readonly pickupStore: StoreSummary | null;
  readonly shippingAddress: DeliveryAddress | null;
  items: OrderItem[];
  subtotal: Money;
  discount: Money;
  deliveryFee: Money;
  total: Money;
  promotionId: string | null;
  promotionCode: string | null;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  kaspiInvoiceId: string | null;
  kaspiTransactionId: string | null;
  kaspiPaymentData: Record<string, unknown>;
  customerComment: string | null;
  adminNotes: string | null;
  readonly createdAt: Date;
  updatedAt: Date;

  constructor(
    id: string,
    orderNumber: string,
    userId: string | null,
    customerName: string,
    customerPhone: KazakhstanPhoneNumber,
    customerEmail: string | null,
    status: DomainOrderStatus,
    deliveryType: DomainDeliveryType,
    pickupStoreId: string | null = null,
    pickupStore: StoreSummary | null = null,
    shippingAddress: DeliveryAddress | null = null,
    items: OrderItem[] = [],
    subtotal: Money = Money.zero(),
    discount: Money = Money.zero(),
    deliveryFee: Money = Money.zero(),
    total: Money = Money.zero(),
    promotionId: string | null = null,
    promotionCode: string | null = null,
    paymentMethod: PaymentMethod = 'kaspi_gold',
    paymentStatus: PaymentStatus = 'pending',
    kaspiInvoiceId: string | null = null,
    kaspiTransactionId: string | null = null,
    kaspiPaymentData: Record<string, unknown> = {},
    customerComment: string | null = null,
    adminNotes: string | null = null,
    createdAt: Date = new Date(),
    updatedAt: Date = new Date()
  ) {
    this.id = id;
    this.orderNumber = orderNumber;
    this.userId = userId;
    this.customerName = customerName;
    this.customerPhone = customerPhone;
    this.customerEmail = customerEmail;
    this.status = status;
    this.deliveryType = deliveryType;
    this.pickupStoreId = pickupStoreId;
    this.pickupStore = pickupStore;
    this.shippingAddress = shippingAddress;
    this.items = items;
    this.subtotal = subtotal;
    this.discount = discount;
    this.deliveryFee = deliveryFee;
    this.total = total;
    this.promotionId = promotionId;
    this.promotionCode = promotionCode;
    this.paymentMethod = paymentMethod;
    this.paymentStatus = paymentStatus;
    this.kaspiInvoiceId = kaspiInvoiceId;
    this.kaspiTransactionId = kaspiTransactionId;
    this.kaspiPaymentData = kaspiPaymentData;
    this.customerComment = customerComment;
    this.adminNotes = adminNotes;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  canTransitionTo(targetStatus: DomainOrderStatus): boolean {
    const allowed = VALID_TRANSITIONS[this.status] || [];
    return allowed.includes(targetStatus);
  }

  transitionTo(targetStatus: DomainOrderStatus): Result<void, InvalidStateTransitionError> {
    if (!this.canTransitionTo(targetStatus)) {
      return err(new InvalidStateTransitionError(this.status, targetStatus, VALID_TRANSITIONS[this.status] || []));
    }
    this.status = targetStatus;
    this.updatedAt = new Date();
    return ok(undefined);
  }

  markPaid(transactionId?: string): Result<void, InvalidStateTransitionError> {
    const res = this.transitionTo('paid');
    if (res.success) {
      this.paymentStatus = 'paid';
      if (transactionId) this.kaspiTransactionId = transactionId;
    }
    return res;
  }

  cancel(): Result<void, InvalidStateTransitionError> {
    if (this.status === 'delivered' || this.status === 'refunded') {
      return err(InvalidStateTransitionError.cannotCancelFinalState(this.status));
    }
    return this.transitionTo('cancelled');
  }

  recalculate(): void {
    let subtotalAmount = 0;
    for (const item of this.items) {
      subtotalAmount += item.totalPrice.amountKzt;
    }
    this.subtotal = new Money(subtotalAmount);
    const feeAmount = this.deliveryType === 'courier' ? 1500 : 0;
    this.deliveryFee = new Money(feeAmount);
    const grandAmount = Math.max(0, this.subtotal.amountKzt - this.discount.amountKzt + this.deliveryFee.amountKzt);
    this.total = new Money(grandAmount);
    this.updatedAt = new Date();
  }
}
