import { createExpressApp } from './infrastructure/http/server.js';
import { dbPool } from './infrastructure/db/pool.js';

const PORT = Number(process.env.PORT || 4000);

export async function startServer() {
  const app = await createExpressApp();

  const server = app.listen(PORT, () => {
    console.log(`[India Trikotaj API] Server listening on port ${PORT}`);
  });

  const shutdown = async () => {
    console.log('[India Trikotaj API] Shutting down gracefully...');
    server.close(async () => {
      await dbPool.close();
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  return { app, server };
}

// Only start when invoked directly as main script
const isMainModule = process.argv[1]?.endsWith('index.ts') || process.argv[1]?.endsWith('index.js');
if (isMainModule) {
  startServer().catch((err) => {
    console.error('[India Trikotaj API] Fatal startup error:', err);
    process.exit(1);
  });
}
