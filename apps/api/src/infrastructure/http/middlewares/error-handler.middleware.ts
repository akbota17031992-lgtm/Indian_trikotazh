import type { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import type { ApiErrorResponse, FieldErrorDetail } from '@india-trikotaj/shared';
import { DomainError } from '../../../domain/errors/domain-errors.js';

export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details?: FieldErrorDetail[] | Record<string, unknown>;

  constructor(
    statusCode: number,
    code: string,
    message: string,
    details?: FieldErrorDetail[] | Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, identifier?: string) {
    super(
      404,
      'NOT_FOUND',
      identifier ? `${resource} with identifier "${identifier}" not found` : `${resource} not found`
    );
  }
}

export class InsufficientStockError extends AppError {
  constructor(variantId: string, requested: number, available: number) {
    super(
      409,
      'INSUFFICIENT_STOCK',
      `Insufficient stock for variant ${variantId}. Requested: ${requested}, Available: ${available}`
    );
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: FieldErrorDetail[]) {
    super(400, 'VALIDATION_ERROR', message, details);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, 'CONFLICT', message);
  }
}

export const errorHandlerMiddleware: ErrorRequestHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const traceId = (req as any).traceId || `trace-${Date.now()}`;

  // 1. JSON Parse Syntax Error (Boundary B11.1)
  if (err instanceof SyntaxError && 'body' in err && (err as any).status === 400) {
    const errorResponse: ApiErrorResponse = {
      error: {
        code: 'BAD_REQUEST',
        message: 'Malformed JSON payload in request body',
        traceId,
      },
    };
    res.status(400).json(errorResponse);
    return;
  }

  // 2. Payload Too Large (Boundary B11.2)
  if (err.type === 'entity.too.large' || err.status === 413) {
    const errorResponse: ApiErrorResponse = {
      error: {
        code: 'PAYLOAD_TOO_LARGE',
        message: 'Request payload exceeded maximum size limit (10MB)',
        traceId,
      },
    };
    res.status(413).json(errorResponse);
    return;
  }

  // 3. Zod Perimeter Validation Error
  if (err instanceof ZodError) {
    const details: FieldErrorDetail[] = err.errors.map((e: any) => ({
      field: e.path.join('.'),
      message: e.message,
      code: e.code,
    }));
    const errorResponse: ApiErrorResponse = {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request payload validation failed',
        details,
        traceId,
      },
    };
    res.status(400).json(errorResponse);
    return;
  }

  // 4. Domain Errors
  if (err instanceof DomainError) {
    let statusCode = 400;
    if (err.code === 'NOT_FOUND') statusCode = 404;
    else if (err.code === 'INSUFFICIENT_STOCK') statusCode = 409;
    else if (err.code === 'CONFLICT') statusCode = 409;
    else if (err.code === 'UNAUTHORIZED') statusCode = 401;
    else if (err.code === 'FORBIDDEN') statusCode = 403;

    const errorResponse: ApiErrorResponse = {
      error: {
        code: err.code,
        message: err.message,
        details: err.details as any,
        traceId,
      },
    };
    res.status(statusCode).json(errorResponse);
    return;
  }

  // 5. Custom AppError
  if (err instanceof AppError) {
    const errorResponse: ApiErrorResponse = {
      error: {
        code: err.code,
        message: err.message,
        details: err.details as any,
        traceId,
      },
    };
    res.status(err.statusCode).json(errorResponse);
    return;
  }

  // 6. Database Connection Timeout Error (Boundary B10.3)
  if (err.code === 'ETIMEDOUT' || (err.message && err.message.includes('timeout'))) {
    const errorResponse: ApiErrorResponse = {
      error: {
        code: 'DATABASE_TIMEOUT',
        message: 'Database temporarily unavailable',
        traceId,
      },
    };
    res.status(503).json(errorResponse);
    return;
  }

  // 7. PostgreSQL Foreign Key Violation (Feature 10.5, code 23503)
  if (err.code === '23503') {
    const errorResponse: ApiErrorResponse = {
      error: {
        code: 'FOREIGN_KEY_VIOLATION',
        message: 'Referenced foreign record does not exist',
        traceId,
      },
    };
    res.status(400).json(errorResponse);
    return;
  }

  // 8. PostgreSQL Unique Constraint Violation (Boundary B10.4, code 23505)
  if (err.code === '23505') {
    const errorResponse: ApiErrorResponse = {
      error: {
        code: 'CONFLICT',
        message: 'Record with identical unique identifier already exists',
        traceId,
      },
    };
    res.status(409).json(errorResponse);
    return;
  }

  // 9. Unhandled Internal Server Crash
  if (process.env.NODE_ENV !== 'test') {
    console.error(`[UnhandledError] [${traceId}]`, err);
  }
  const internalError: ApiErrorResponse = {
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected internal error occurred. Please contact support.',
      traceId,
    },
  };
  res.status(500).json(internalError);
};
