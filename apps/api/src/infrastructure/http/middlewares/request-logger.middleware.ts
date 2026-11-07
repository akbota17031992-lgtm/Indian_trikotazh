import type { Request, Response, NextFunction } from 'express';
import crypto from 'node:crypto';

export function requestLoggerMiddleware(req: Request, res: Response, next: NextFunction): void {
  const traceId = (req.headers['x-trace-id'] as string) || crypto.randomUUID();
  (req as any).traceId = traceId;
  res.setHeader('X-Trace-Id', traceId);

  const startTime = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    if (process.env.NODE_ENV !== 'test') {
      console.log(`[HTTP] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms [${traceId}]`);
    }
  });

  next();
}
