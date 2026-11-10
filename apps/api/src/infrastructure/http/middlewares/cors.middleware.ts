import type { Request, Response, NextFunction } from 'express';

const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:8081',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'https://indiatrikotaj.kz',
  'https://www.indiatrikotaj.kz',
  'https://admin.indiatrikotaj.kz',
];

function isOriginAllowed(origin: string, configuredOrigins: string[]): boolean {
  if (configuredOrigins.includes('*')) return true;
  if (configuredOrigins.includes(origin)) return true;

  // Allow subdomains in production (*.indiatrikotaj.kz)
  try {
    const url = new URL(origin);
    if (url.hostname.endsWith('.indiatrikotaj.kz') || url.hostname === 'indiatrikotaj.kz') {
      return true;
    }
    // Allow local development ports dynamically
    if (
      process.env.NODE_ENV !== 'production' &&
      (url.hostname === 'localhost' || url.hostname === '127.0.0.1')
    ) {
      return true;
    }
  } catch {
    return false;
  }

  return false;
}

export function corsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const configured = (process.env.CORS_ORIGIN || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  const allowedOrigins = configured.length > 0 ? configured : DEFAULT_ALLOWED_ORIGINS;
  const origin = req.headers.origin;

  if (origin && isOriginAllowed(origin, allowedOrigins)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Vary', 'Origin');
  } else if (!origin) {
    // Non-browser or same-origin requests (e.g. mobile app native HTTP, curl, server-to-server)
    res.setHeader('Access-Control-Allow-Origin', '*');
  } else {
    // Untrusted cross-origin request: do not grant credentialed access
    res.setHeader('Access-Control-Allow-Origin', allowedOrigins[0] || 'null');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Webhook-Signature, Idempotency-Key, Accept-Language, X-Client-Version'
  );
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  next();
}
