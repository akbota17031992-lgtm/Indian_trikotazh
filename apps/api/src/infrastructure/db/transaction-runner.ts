import type { ITransactionRunner } from '../../use-cases/ports/transaction-runner.port.js';
import type { DatabasePool } from './pool.js';

export class PostgresTransactionRunner implements ITransactionRunner {
  private readonly pool: DatabasePool;

  constructor(pool: DatabasePool) {
    this.pool = pool;
  }

  public async runTransaction<T>(work: () => Promise<T>): Promise<T> {
    return this.pool.withTransaction(async () => {
      return await work();
    });
  }
}
