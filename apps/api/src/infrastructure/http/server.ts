import express, { type Express, type Request, type Response } from 'express';
import { corsMiddleware } from './middlewares/cors.middleware.js';
import { securityHeadersMiddleware } from './middlewares/security-headers.middleware.js';
import { requestLoggerMiddleware } from './middlewares/request-logger.middleware.js';
import { errorHandlerMiddleware } from './middlewares/error-handler.middleware.js';
import { authMiddleware } from './middlewares/auth.middleware.js';
import { idempotencyMiddleware } from './middlewares/idempotency.middleware.js';
import { createV1Router } from './routes.js';
import { dbPool } from '../db/pool.js';
import { RepositoryContainer } from '../../adapters/repositories/repository.container.js';

export async function createExpressApp(): Promise<Express> {
  const app = express();

  // 1. Core Security & Logging Middlewares
  app.use(securityHeadersMiddleware);
  app.use(corsMiddleware);
  app.use(requestLoggerMiddleware);

  // 2. Request Body Parsers (10MB limit enforcement with rawBody retention for webhook verification)
  app.use(
    express.json({
      limit: '10mb',
      verify: (req, _res, buf) => {
        (req as any).rawBody = buf;
      },
    })
  );
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // 3. Auth & Idempotency
  app.use(authMiddleware);
  app.use(idempotencyMiddleware);

  // 4. Initialize Database Repositories (Postgres with automatic In-Memory fallback)
  let isDbLive = false;
  try {
    isDbLive = await dbPool.testConnection();
  } catch {
    isDbLive = false;
  }
  const repoContainer = new RepositoryContainer(isDbLive ? dbPool : null);

  // 5. Health Check Endpoint
  app.get('/health', async (req: Request, res: Response) => {
    let dbStatus = 'in-memory-fallback';
    try {
      const isLive = await dbPool.testConnection();
      if (isLive) dbStatus = 'connected';
    } catch {
      dbStatus = 'in-memory-fallback';
    }

    res.status(200).json({
      status: 'ok',
      service: 'india-trikotaj-api',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      database: dbStatus,
    });
  });

  // 6. Mount API routes
  const v1Router = createV1Router(repoContainer);
  app.use('/api/v1', v1Router);
  app.use('/api/payments', v1Router); // Kaspi Pay direct alias

  // 7. 404 Handler for Unmatched Endpoints
  app.use('*', (req: Request, res: Response) => {
    res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: `Endpoint ${req.method} ${req.originalUrl} not found`,
        traceId: (req as any).traceId || 'trace-unknown',
      },
    });
  });

  // 8. Global Error Handler
  app.use(errorHandlerMiddleware);

  return app;
}
