import { Result, ok, err } from '../../domain/types/result.js';
import { NotFoundError, ForbiddenError } from '../../domain/errors/domain-errors.js';
import type { IOrderRepository } from '../ports/order.repository.port.js';
import type { Order } from '../../domain/entities/order.entity.js';

export interface GetOrderByIdInput {
  orderId: string;
  requestingUserId?: string;
  isStaff?: boolean;
}

export class GetOrderByIdUseCase {
  private readonly orderRepo: IOrderRepository;

  constructor(orderRepo: IOrderRepository) {
    this.orderRepo = orderRepo;
  }

  async execute(input: GetOrderByIdInput): Promise<Result<Order, NotFoundError | ForbiddenError>> {
    const order = (await this.orderRepo.findById(input.orderId)) ||
                  (await this.orderRepo.findByOrderNumber(input.orderId));

    if (!order) {
      return err(NotFoundError.order(input.orderId));
    }

    if (input.requestingUserId && !input.isStaff) {
      if (order.userId && order.userId !== input.requestingUserId) {
        return err(new ForbiddenError('You are not authorized to view this order'));
      }
    }

    return ok(order);
  }
}
