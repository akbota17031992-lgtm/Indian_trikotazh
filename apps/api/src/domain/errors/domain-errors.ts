/**
 * Domain Error Hierarchy
 */
export abstract class DomainError extends Error {
  abstract readonly code: string;
  readonly details?: Record<string, unknown>;

  constructor(message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = this.constructor.name;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class NotFoundError extends DomainError {
  readonly code = 'NOT_FOUND';

  static product(identifier: string): NotFoundError {
    return new NotFoundError(`Product not found: ${identifier}`, { identifier, entity: 'Product' });
  }

  static variant(identifier: string): NotFoundError {
    return new NotFoundError(`Product variant not found: ${identifier}`, { identifier, entity: 'ProductVariant' });
  }

  static store(identifier: string): NotFoundError {
    return new NotFoundError(`Store branch not found: ${identifier}`, { identifier, entity: 'Store' });
  }

  static order(identifier: string): NotFoundError {
    return new NotFoundError(`Order not found: ${identifier}`, { identifier, entity: 'Order' });
  }

  static user(identifier: string): NotFoundError {
    return new NotFoundError(`User profile not found: ${identifier}`, { identifier, entity: 'User' });
  }

  static promotion(code: string): NotFoundError {
    return new NotFoundError(`Promotion code not found: ${code}`, { code, entity: 'Promotion' });
  }
}

export class InsufficientStockError extends DomainError {
  readonly code = 'INSUFFICIENT_STOCK';
  readonly storeId: string;
  readonly variantId: string;
  readonly requested: number;
  readonly available: number;

  constructor(
    storeId: string,
    variantId: string,
    requested: number,
    available: number
  ) {
    super(`Insufficient stock for variant ${variantId} at store ${storeId}: requested ${requested}, available ${available}`, {
      storeId,
      variantId,
      requested,
      available
    });
    this.storeId = storeId;
    this.variantId = variantId;
    this.requested = requested;
    this.available = available;
  }
}

export class ValidationError extends DomainError {
  readonly code = 'VALIDATION_ERROR';
  readonly field?: string;

  constructor(message: string, field?: string, details?: Record<string, unknown>) {
    super(message, { field, ...details });
    this.field = field;
  }

  static emptyCart(): ValidationError {
    return new ValidationError('Cart cannot be empty', 'items');
  }

  static customerNameTooShort(): ValidationError {
    return new ValidationError('Customer name must contain at least 2 non-whitespace characters', 'customerName');
  }

  static invalidPhone(phone: string): ValidationError {
    return new ValidationError(`Invalid Kazakhstan phone number: ${phone}`, 'customerPhone');
  }

  static pickupStoreRequired(): ValidationError {
    return new ValidationError('Pickup store selection is required for store pickup orders', 'pickupStoreId');
  }

  static deliveryAddressRequired(): ValidationError {
    return new ValidationError('Valid delivery address is required for courier delivery orders', 'deliveryAddress');
  }

  static invalidQuantity(qty: number): ValidationError {
    return new ValidationError(`Quantity must be a positive integer between 1 and 100 (received: ${qty})`, 'quantity');
  }
}

export class InvalidStateTransitionError extends DomainError {
  readonly code = 'INVALID_STATE_TRANSITION';
  readonly currentStatus: string;
  readonly attemptedStatus: string;
  readonly allowedTransitions: string[];

  constructor(
    currentStatus: string,
    attemptedStatus: string,
    allowedTransitions: string[]
  ) {
    super(`Cannot transition order from '${currentStatus}' to '${attemptedStatus}'. Allowed transitions: [${allowedTransitions.join(', ')}]`, {
      currentStatus,
      attemptedStatus,
      allowedTransitions
    });
    this.currentStatus = currentStatus;
    this.attemptedStatus = attemptedStatus;
    this.allowedTransitions = allowedTransitions;
  }

  static cannotCancelFinalState(status: string): InvalidStateTransitionError {
    return new InvalidStateTransitionError(status, 'cancelled', []);
  }
}

export class ConflictError extends DomainError {
  readonly code = 'CONFLICT';
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, details);
  }
}

export class UnauthorizedError extends DomainError {
  readonly code = 'UNAUTHORIZED';
  constructor(message = 'Authentication required') {
    super(message);
  }
}

export class ForbiddenError extends DomainError {
  readonly code = 'FORBIDDEN';
  constructor(message = 'Access forbidden') {
    super(message);
  }
}
