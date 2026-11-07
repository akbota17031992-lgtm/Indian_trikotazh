import type { Request, Response, NextFunction } from 'express';

interface CachedResponse {
  statusCode: number;
  body: any;
  headers: Record<string, string>;
  createdAt: number;
}

const idempotencyStore = new Map<string, CachedResponse>();
const EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours TTL

export function idempotencyMiddleware(req: Request, res: Response, next: NextFunction): void {
  const key = req.headers['idempotency-key'] as string;
  if (!key || req.method === 'GET' || req.method === 'OPTIONS') {
    next();
    return;
  }

  const cached = idempotencyStore.get(key);
  if (cached) {
    if (Date.now() - cached.createdAt < EXPIRY_MS) {
      for (const [headerName, headerVal] of Object.entries(cached.headers)) {
        res.setHeader(headerName, headerVal);
      }
      res.setHeader('X-Cache-Lookup', 'HIT');
      res.status(cached.statusCode).json(cached.body);
      return;
    }
    idempotencyStore.delete(key);
  }

  const originalJson = res.json.bind(res);
  res.json = (body: any) => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      idempotencyStore.set(key, {
        statusCode: res.statusCode,
        body,
        headers: { 'Content-Type': 'application/json' },
        createdAt: Date.now(),
      });
    }
    return originalJson(body);
  };

  next();
}
