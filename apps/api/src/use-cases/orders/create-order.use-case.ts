import { Result, ok, err } from '../../domain/types/result.js';
import {
  ValidationError,
  NotFoundError,
  InsufficientStockError,
  DomainError
} from '../../domain/errors/domain-errors.js';
import { Order, type DomainDeliveryType } from '../../domain/entities/order.entity.js';
import { OrderItem } from '../../domain/entities/order-item.entity.js';
import { Money } from '../../domain/value-objects/money.vo.js';
import { KazakhstanPhoneNumber } from '../../domain/value-objects/phone-number.vo.js';
import type { IOrderRepository } from '../ports/order.repository.port.js';
import type { IProductRepository } from '../ports/product.repository.port.js';
import type { IInventoryRepository } from '../ports/inventory.repository.port.js';
import type { IStoreRepository } from '../ports/store.repository.port.js';
import type { IPromotionRepository } from '../ports/promotion.repository.port.js';
import type { ITransactionRunner } from '../ports/transaction-runner.port.js';
import type { PaymentMethod, DeliveryAddress } from '@india-trikotaj/shared';

export interface CreateOrderItemInput {
  variantId: string;
  quantity: number;
  reservedFromStoreId?: string;
}

export interface CreateOrderInput {
  userId?: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  fulfillmentType: DomainDeliveryType;
  pickupStoreId?: string | null;
  deliveryAddress?: DeliveryAddress | null;
  items: CreateOrderItemInput[];
  promotionCode?: string | null;
  paymentMethod?: PaymentMethod;
  customerComment?: string | null;
}

export class CreateOrderUseCase {
  private readonly orderRepo: IOrderRepository;
  private readonly productRepo: IProductRepository;
  private readonly inventoryRepo: IInventoryRepository;
  private readonly storeRepo: IStoreRepository;
  private readonly promoRepo?: IPromotionRepository;
  private readonly txRunner?: ITransactionRunner;

  constructor(
    orderRepo: IOrderRepository,
    productRepo: IProductRepository,
    inventoryRepo: IInventoryRepository,
    storeRepo: IStoreRepository,
    promoRepo?: IPromotionRepository,
    txRunner?: ITransactionRunner
  ) {
    this.orderRepo = orderRepo;
    this.productRepo = productRepo;
    this.inventoryRepo = inventoryRepo;
    this.storeRepo = storeRepo;
    this.promoRepo = promoRepo;
    this.txRunner = txRunner;
  }

  async execute(input: CreateOrderInput): Promise<Result<Order, DomainError>> {
    // 1. Validate Customer Name
    const cleanedName = (input.customerName || '').trim();
    if (cleanedName.length < 2) {
      return err(ValidationError.customerNameTooShort());
    }

    // 2. Validate Customer Phone
    let phoneVO: KazakhstanPhoneNumber;
    try {
      phoneVO = KazakhstanPhoneNumber.from(input.customerPhone);
    } catch {
      return err(ValidationError.invalidPhone(input.customerPhone));
    }

    // 3. Validate Cart Items Non-empty
    if (!input.items || input.items.length === 0) {
      return err(ValidationError.emptyCart());
    }

    // 4. Validate Quantities
    for (const item of input.items) {
      if (!Number.isInteger(item.quantity) || item.quantity <= 0 || item.quantity > 100) {
        return err(ValidationError.invalidQuantity(item.quantity));
      }
    }

    // 5. Validate Fulfillment Details
    const isPickup = input.fulfillmentType === 'pickup' || input.fulfillmentType === 'pickup_from_store';
    if (isPickup) {
      if (!input.pickupStoreId) {
        return err(ValidationError.pickupStoreRequired());
      }
      const store = await this.storeRepo.findById(input.pickupStoreId);
      if (!store) {
        return err(NotFoundError.store(input.pickupStoreId));
      }
    } else {
      if (!input.deliveryAddress || !input.deliveryAddress.street || !input.deliveryAddress.building) {
        return err(ValidationError.deliveryAddressRequired());
      }
    }

    // 6. Verify Variants & Fetch Authoritative Prices
    const defaultFulfillmentStoreId = input.pickupStoreId || 'store-almaty-001';
    const resolvedItems: Array<{
      variant: any;
      product: any;
      quantity: number;
      targetStoreId: string;
    }> = [];

    for (const item of input.items) {
      const variant = await this.productRepo.findVariantById(item.variantId);
      if (!variant) {
        return err(NotFoundError.variant(item.variantId));
      }
      const product = await this.productRepo.findById(variant.productId);
      if (!product) {
        return err(NotFoundError.product(variant.productId));
      }
      resolvedItems.push({
        variant,
        product,
        quantity: item.quantity,
        targetStoreId: item.reservedFromStoreId || defaultFulfillmentStoreId
      });
    }

    // 7. Stock Reservation Logic with Rollback
    const reserveWork = async () => {
      const reservedStores: Array<{ storeId: string; variantId: string; quantity: number }> = [];

      try {
        for (const item of resolvedItems) {
          const success = await this.inventoryRepo.reserveStock(
            item.targetStoreId,
            item.variant.id,
            item.quantity,
            'order-pending'
          );
          if (!success) {
            for (const r of reservedStores) {
              await this.inventoryRepo.releaseStock(r.storeId, r.variantId, r.quantity);
            }
            return err(new InsufficientStockError(item.targetStoreId, item.variant.id, item.quantity, 0));
          }
          reservedStores.push({
            storeId: item.targetStoreId,
            variantId: item.variant.id,
            quantity: item.quantity
          });
        }

        // Generate Order ID & Sequential Number
        const orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const randomSeq = String(Math.floor(1000 + Math.random() * 9000));
        const orderNumber = `IT-${datePart}-${randomSeq}`;

        const orderItems: OrderItem[] = resolvedItems.map((r, idx) => {
          return new OrderItem(
            `item_${orderId}_${idx + 1}`,
            orderId,
            r.variant.id,
            {
              titleRu: r.product.nameRu || r.product.titleRu || '',
              titleKz: r.product.nameKz || r.product.titleKz || '',
              sku: typeof r.variant.sku === 'object' ? r.variant.sku.value : r.variant.sku,
              size: r.variant.size,
              colorRu: r.variant.colorRu,
              colorKz: r.variant.colorKz,
              imageUrl: r.product.images?.[0]?.cardUrl
            },
            typeof r.variant.price === 'object' && 'amountKzt' in r.variant.price
              ? r.variant.price
              : new Money(typeof r.variant.priceKzt === 'number' ? r.variant.priceKzt : r.variant.price),
            r.quantity,
            r.targetStoreId
          );
        });

        let subtotalAmount = 0;
        for (const item of orderItems) {
          subtotalAmount += item.totalPrice.amountKzt;
        }
        const subtotal = new Money(subtotalAmount);

        // Promotions
        let discount = Money.zero();
        let promotionId: string | null = null;
        if (input.promotionCode && this.promoRepo) {
          const promo = await this.promoRepo.findByCode(input.promotionCode.trim().toUpperCase());
          if (promo && promo.isValidNow()) {
            discount = promo.calculateDiscount(subtotal);
            promotionId = promo.id;
            await this.promoRepo.incrementUsage(promo.id);
          }
        }

        const isCourier = input.fulfillmentType === 'courier';
        const deliveryFee = new Money(isCourier ? 1500 : 0);
        const grandTotal = new Money(Math.max(0, subtotal.amountKzt - discount.amountKzt + deliveryFee.amountKzt));

        const order = new Order(
          orderId,
          orderNumber,
          input.userId || null,
          cleanedName,
          phoneVO,
          input.customerEmail || null,
          'pending_payment',
          isPickup ? 'pickup' : 'courier',
          input.pickupStoreId || null,
          null,
          input.deliveryAddress || null,
          orderItems,
          subtotal,
          discount,
          deliveryFee,
          grandTotal,
          promotionId,
          input.promotionCode || null,
          input.paymentMethod || 'kaspi_gold',
          'pending',
          null,
          null,
          {},
          input.customerComment || null
        );

        const createdOrder = await this.orderRepo.create(order);
        return ok(createdOrder);
      } catch (error: any) {
        for (const r of reservedStores) {
          await this.inventoryRepo.releaseStock(r.storeId, r.variantId, r.quantity);
        }
        throw error;
      }
    };

    if (this.txRunner) {
      return await this.txRunner.runTransaction(reserveWork);
    }
    return await reserveWork();
  }
}
