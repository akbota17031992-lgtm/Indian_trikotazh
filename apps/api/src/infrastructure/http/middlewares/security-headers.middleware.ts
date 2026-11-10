import type { Request, Response, NextFunction } from 'express';

export function securityHeadersMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Prevent Clickjacking / UI Redressing
  res.setHeader('X-Frame-Options', 'DENY');
  // Legacy XSS filter protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  // Enforce HSTS (Strict-Transport-Security) for 1 year with subdomains and preload
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  // Referrer privacy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  // Restrict browser permissions for sensitive hardware APIs
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  // Disallow Adobe Flash / PDF cross-domain policies
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  // Prevent Internet Explorer from executing downloads in site's context
  res.setHeader('X-Download-Options', 'noopen');
  // Base Content Security Policy for API responses
  res.setHeader('Content-Security-Policy', "default-src 'self'");

  // Strip x-powered-by header to prevent fingerprinting
  res.removeHeader('X-Powered-By');

  next();
}
