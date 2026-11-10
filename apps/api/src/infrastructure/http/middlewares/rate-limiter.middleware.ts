import type { Request, Response, NextFunction } from 'express';
import { AppError } from './error-handler.middleware.js';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

export interface RateLimiterOptions {
  windowMs: number; // Window size in milliseconds
  maxRequests: number; // Max allowed requests per window
  message?: string;
  keyGenerator?: (req: Request) => string;
}

export class InMemoryRateLimiter {
  private records = new Map<string, RateLimitRecord>();
  private readonly windowMs: number;
  private readonly maxRequests: number;
  private readonly message: string;
  private readonly keyGenerator: (req: Request) => string;
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(options: RateLimiterOptions) {
    this.windowMs = options.windowMs;
    this.maxRequests = options.maxRequests;
    this.message = options.message || 'Превышен лимит запросов. Пожалуйста, повторите попытку позже.';
    this.keyGenerator =
      options.keyGenerator ||
      ((req: Request): string => {
        const forwarded = req.headers['x-forwarded-for'];
        let ip = 'unknown-client';
        if (Array.isArray(forwarded) && forwarded.length > 0 && typeof forwarded[0] === 'string') {
          ip = forwarded[0];
        } else if (typeof forwarded === 'string' && forwarded.length > 0) {
          ip = forwarded.split(',')[0]?.trim() || 'unknown-client';
        } else if (req.socket.remoteAddress) {
          ip = req.socket.remoteAddress;
        }
        return ip;
      });

    // Background cleanup of stale entries every 2 minutes
    this.cleanupTimer = setInterval(() => this.cleanup(), 120_000);
    if (this.cleanupTimer && typeof this.cleanupTimer.unref === 'function') {
      this.cleanupTimer.unref();
    }
  }

  public middleware = (req: Request, res: Response, next: NextFunction): void => {
    const key = this.keyGenerator(req);
    const now = Date.now();
    let record = this.records.get(key);

    if (!record || now > record.resetTime) {
      record = { count: 1, resetTime: now + this.windowMs };
      this.records.set(key, record);
    } else {
      record.count += 1;
    }

    const remaining = Math.max(0, this.maxRequests - record.count);
    const resetSeconds = Math.ceil((record.resetTime - now) / 1000);

    // Standard RFC RateLimit headers
    res.setHeader('RateLimit-Limit', this.maxRequests.toString());
    res.setHeader('RateLimit-Remaining', remaining.toString());
    res.setHeader('RateLimit-Reset', resetSeconds.toString());

    if (record.count > this.maxRequests) {
      res.setHeader('Retry-After', resetSeconds.toString());
      throw new AppError(429, 'RATE_LIMIT_EXCEEDED', this.message);
    }

    next();
  };

  private cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.records.entries()) {
      if (now > record.resetTime) {
        this.records.delete(key);
      }
    }
  }
}

// Global API Rate Limiter: 300 requests per minute per IP
export const globalApiRateLimiter = new InMemoryRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 300,
  message: 'Слишком много запросов к API. Пожалуйста, подождите 1 минуту.',
}).middleware;

// Strict Rate Limiter for Checkout & Invoicing: 30 requests per minute per IP
export const strictMutationRateLimiter = new InMemoryRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 30,
  message: 'Превышен лимит создания заказов и платежей. Пожалуйста, подождите 1 минуту.',
}).middleware;
