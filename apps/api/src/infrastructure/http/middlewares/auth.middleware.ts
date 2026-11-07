import type { Request, Response, NextFunction } from 'express';
import { AppError } from './error-handler.middleware.js';

export interface AuthenticatedUser {
  id: string;
  phone?: string;
  email?: string;
  role: 'customer' | 'staff' | 'store_manager' | 'manager' | 'admin';
  storeId?: string | null;
  assignedStoreId?: string | null;
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    // Unauthenticated request proceeds without req.user; protected routes enforce requireAuth
    next();
    return;
  }

  if (!authHeader.startsWith('Bearer ')) {
    throw new AppError(401, 'UNAUTHORIZED', 'Invalid authorization format. Bearer token required');
  }

  const token = authHeader.substring(7).trim();
  if (!token) {
    throw new AppError(401, 'UNAUTHORIZED', 'Invalid or expired token');
  }

  // Restrict mock tokens to non-production environments
  if (process.env.NODE_ENV !== 'production') {
    if (token === 'mock-admin-token') {
      (req as any).user = {
        id: 'usr-admin-root',
        role: 'admin',
        email: 'admin@india-trikotaj.kz',
      };
      next();
      return;
    }
    if (token === 'mock-customer-token') {
      (req as any).user = {
        id: 'usr-cust-001',
        role: 'customer',
        phone: '+77011234567',
      };
      next();
      return;
    }
    if (token.startsWith('mock-')) {
      const parts = token.split('-');
      if (parts.length >= 3) {
        try {
          const base64Payload = parts.slice(2).join('-');
          const jsonStr = Buffer.from(base64Payload, 'base64').toString('utf-8');
          const parsed = JSON.parse(jsonStr);
          if (parsed && typeof parsed === 'object' && parsed.id && parsed.role) {
            (req as any).user = parsed;
            next();
            return;
          }
        } catch {
          // Malformed mock token payload falls through to 401
        }
      }
      throw new AppError(401, 'UNAUTHORIZED', 'Invalid or expired token');
    }
  }

  // Unrecognized, expired, or production mock tokens are rejected
  throw new AppError(401, 'UNAUTHORIZED', 'Invalid or expired token');
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!(req as any).user) {
    throw new AppError(401, 'UNAUTHORIZED', 'Authentication token required');
  }
  next();
}

export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user as AuthenticatedUser | undefined;
    if (!user) {
      throw new AppError(401, 'UNAUTHORIZED', 'Authentication token required');
    }
    if (!allowedRoles.includes(user.role)) {
      throw new AppError(403, 'FORBIDDEN', 'Insufficient administrative permissions');
    }
    next();
  };
}
