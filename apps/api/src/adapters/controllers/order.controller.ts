import type { Request, Response, NextFunction } from 'express';
import { CreateOrderUseCase } from '../../use-cases/orders/create-order.use-case.js';
import { GetOrderByIdUseCase } from '../../use-cases/orders/get-order-by-id.use-case.js';
import { ApiResponsePresenter } from '../presenters/api-response.presenter.js';
import { LocalizedResponsePresenter } from '../presenters/localized-response.presenter.js';
import {
  AppError,
  NotFoundError,
} from '../../infrastructure/http/middlewares/error-handler.middleware.js';
import type { IOrderRepository } from '../../use-cases/ports/order.repository.port.js';
import type { IProductRepository } from '../../use-cases/ports/product.repository.port.js';
import type { IInventoryRepository } from '../../use-cases/ports/inventory.repository.port.js';
import type { IStoreRepository } from '../../use-cases/ports/store.repository.port.js';
import type { IPromotionRepository } from '../../use-cases/ports/promotion.repository.port.js';
import type { ITransactionRunner } from '../../use-cases/ports/transaction-runner.port.js';
import type { DomainDeliveryType } from '../../domain/entities/order.entity.js';

export class OrderController {
  private readonly createOrderUseCase: CreateOrderUseCase;
  private readonly getOrderByIdUseCase: GetOrderByIdUseCase;
  private readonly orderRepo: IOrderRepository;

  constructor(
    orderRepo: IOrderRepository,
    productRepo: IProductRepository,
    inventoryRepo: IInventoryRepository,
    storeRepo: IStoreRepository,
    promoRepo?: IPromotionRepository,
    txRunner?: ITransactionRunner
  ) {
    this.createOrderUseCase = new CreateOrderUseCase(
      orderRepo,
      productRepo,
      inventoryRepo,
      storeRepo,
      promoRepo,
      txRunner
    );
    this.getOrderByIdUseCase = new GetOrderByIdUseCase(orderRepo);
    this.orderRepo = orderRepo;
  }

  public createOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const b = req.body || {};
      const authenticatedUser = (req as any).user;

      const rawType = b.fulfillmentType || b.deliveryType || 'pickup';
      const fulfillmentType: DomainDeliveryType =
        rawType === 'courier' ? 'courier' : (rawType === 'pickup_from_store' ? 'pickup_from_store' : 'pickup');

      const pickupStoreId = b.pickupStoreId || b.storeId || null;
      const deliveryAddress = b.deliveryAddress || b.shippingAddress || null;

      // Security: User identity attribution MUST strictly bind to authenticatedUser.id or null.
      // Never trust client-supplied userId from untrusted request body (OWASP API1 / API2 prevention).
      const boundUserId = authenticatedUser?.id || null;

      const result = await this.createOrderUseCase.execute({
        userId: boundUserId,
        customerName: b.customerName,
        customerPhone: b.customerPhone,
        customerEmail: b.customerEmail || null,
        fulfillmentType,
        pickupStoreId,
        deliveryAddress,
        items: b.items || [],
        promotionCode: b.promotionCode || null,
        paymentMethod: b.paymentMethod || 'kaspi_gold',
        customerComment: b.customerComment || null
      });

      if (!result.success) {
        throw result.error;
      }

      const formatted = LocalizedResponsePresenter.formatOrder(result.data);
      ApiResponsePresenter.sendOrderCreated(res, formatted);
    } catch (err) {
      next(err);
    }
  };

  public getOrderById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = String(req.params.id || '');
      const authenticatedUser = (req as any).user;

      if (!authenticatedUser || !authenticatedUser.id) {
        throw new AppError(401, 'UNAUTHORIZED', 'Authentication token required');
      }

      const isStaff =
        authenticatedUser.role === 'admin' ||
        authenticatedUser.role === 'staff' ||
        authenticatedUser.role === 'store_manager' ||
        authenticatedUser.role === 'manager';

      const result = await this.getOrderByIdUseCase.execute({
        orderId: id,
        requestingUserId: authenticatedUser.id,
        isStaff,
      });

      if (!result.success) {
        if (result.error.code === 'FORBIDDEN') {
          throw new AppError(403, 'FORBIDDEN', result.error.message);
        }
        throw new NotFoundError('Order', id);
      }

      const order = result.data;

      // Customer isolation check
      if (authenticatedUser.role === 'customer') {
        if (!order.userId || order.userId !== authenticatedUser.id) {
          throw new AppError(403, 'FORBIDDEN', 'You are not authorized to view this order');
        }
      }

      // Store manager branch isolation check
      if (authenticatedUser.role === 'store_manager' || authenticatedUser.role === 'manager') {
        const assignedStore = authenticatedUser.storeId || authenticatedUser.assignedStoreId;
        const orderStore = order.pickupStoreId || (order as any).storeId || (order as any).pickup_store_id;
        if (assignedStore && orderStore && orderStore !== assignedStore) {
          throw new AppError(403, 'FORBIDDEN', 'Manager cannot access orders for another branch');
        }
      }

      const formatted = LocalizedResponsePresenter.formatOrder(order);
      res.status(200).json(formatted);
    } catch (err) {
      next(err);
    }
  };

  public listOrders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as any).user;
      if (!user || !user.id) {
        throw new AppError(401, 'UNAUTHORIZED', 'Authentication token required');
      }

      const storeIdParam = typeof req.query.storeId === 'string' ? req.query.storeId : undefined;

      // RBAC validation
      if (user.role === 'store_manager' || user.role === 'manager') {
        const assignedStore = user.storeId || user.assignedStoreId;
        if (storeIdParam && assignedStore && storeIdParam !== assignedStore) {
          throw new AppError(403, 'FORBIDDEN', 'Manager cannot access orders for another branch');
        }
      }

      let orders = await this.orderRepo.findAll({
        storeId: storeIdParam || ((user.role === 'store_manager' || user.role === 'manager') ? (user.storeId || user.assignedStoreId) : undefined)
      });

      if (user.role === 'customer') {
        orders = orders.filter(o => o.userId === user.id);
      } else if (user.role === 'store_manager' || user.role === 'manager') {
        const assignedStore = user.storeId || user.assignedStoreId;
        if (assignedStore) {
          orders = orders.filter(o => {
            const orderStore = o.pickupStoreId || (o as any).storeId || (o as any).pickup_store_id;
            return !orderStore || orderStore === assignedStore;
          });
        }
      } else if (user.role !== 'admin' && user.role !== 'staff') {
        throw new AppError(403, 'FORBIDDEN', 'Insufficient permissions');
      }

      const formatted = orders.map(o => LocalizedResponsePresenter.formatOrder(o));
      res.status(200).json(formatted);
    } catch (err) {
      next(err);
    }
  };
}
