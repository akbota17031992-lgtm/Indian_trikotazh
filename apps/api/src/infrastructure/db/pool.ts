import pg from 'pg';

export interface DbConfig {
  connectionString?: string;
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
  max?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}

export class DatabasePool {
  private static instance: DatabasePool | null = null;
  private pool: pg.Pool | null = null;
  private isConnected = false;
  private config: DbConfig;

  private constructor(config: DbConfig) {
    this.config = config;
  }

  public static getInstance(config?: DbConfig): DatabasePool {
    if (!DatabasePool.instance) {
      const dbConfig: DbConfig = config || {
        connectionString: process.env.DATABASE_URL,
        host: process.env.PGHOST || 'localhost',
        port: Number(process.env.PGPORT || 5432),
        user: process.env.PGUSER || 'postgres',
        password: process.env.PGPASSWORD || 'postgres',
        database: process.env.PGDATABASE || 'india_trikotaj',
        max: 20, // Feature 10.3 requirement: max 20 connections
        idleTimeoutMillis: 30000, // Feature 10.3 requirement: 30s idle timeout
        connectionTimeoutMillis: 5000,
      };
      DatabasePool.instance = new DatabasePool(dbConfig);
    }
    return DatabasePool.instance;
  }

  public getPool(): pg.Pool {
    if (!this.pool) {
      this.pool = new pg.Pool(this.config);
      this.pool.on('error', (err: Error) => {
        if (process.env.NODE_ENV !== 'test') {
          console.error('[DatabasePool] Unexpected pool error on idle client:', err.message);
        }
      });
    }
    return this.pool;
  }

  public async testConnection(): Promise<boolean> {
    try {
      const client = await this.getPool().connect();
      try {
        await client.query('SELECT 1');
        this.isConnected = true;
        return true;
      } finally {
        client.release();
      }
    } catch {
      this.isConnected = false;
      return false;
    }
  }

  public async query<R extends pg.QueryResultRow = any>(
    text: string,
    params?: any[]
  ): Promise<pg.QueryResult<R>> {
    return this.getPool().query<R>(text, params);
  }

  public async withTransaction<T>(fn: (client: pg.PoolClient) => Promise<T>): Promise<T> {
    const client = await this.getPool().connect();
    try {
      await client.query('BEGIN');
      const result = await fn(client);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  public async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      this.isConnected = false;
    }
  }

  public getStatus(): { isConnected: boolean; max: number; idleTimeoutMillis: number } {
    return {
      isConnected: this.isConnected,
      max: this.config.max || 20,
      idleTimeoutMillis: this.config.idleTimeoutMillis || 30000,
    };
  }
}

export const dbPool = DatabasePool.getInstance();
