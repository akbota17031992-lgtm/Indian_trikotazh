import type { DatabasePool } from '../../infrastructure/db/pool.js';
import type { IStoreRepository } from '../../use-cases/ports/store.repository.port.js';
import type { IProductRepository } from '../../use-cases/ports/product.repository.port.js';
import type { IInventoryRepository } from '../../use-cases/ports/inventory.repository.port.js';
import type { IOrderRepository } from '../../use-cases/ports/order.repository.port.js';
import type { IUserRepository } from '../../use-cases/ports/user.repository.port.js';
import type { IPromotionRepository } from '../../use-cases/ports/promotion.repository.port.js';
import type { ITransactionRunner } from '../../use-cases/ports/transaction-runner.port.js';

import { PostgresStoreRepository } from './postgres-store.repository.js';
import { PostgresProductRepository } from './postgres-product.repository.js';
import { PostgresInventoryRepository } from './postgres-inventory.repository.js';
import { PostgresOrderRepository } from './postgres-order.repository.js';
import { PostgresTransactionRunner } from '../../infrastructure/db/transaction-runner.js';

import { InMemoryStoreRepository } from './in-memory/in-memory-store.repository.js';
import { InMemoryProductRepository } from './in-memory/in-memory-product.repository.js';
import { InMemoryInventoryRepository } from './in-memory/in-memory-inventory.repository.js';
import { InMemoryOrderRepository } from './in-memory/in-memory-order.repository.js';
import { InMemoryUserRepository } from './in-memory/in-memory-user.repository.js';
import { InMemoryPromotionRepository } from './in-memory/in-memory-promotion.repository.js';

class InMemoryTransactionRunner implements ITransactionRunner {
  public async runTransaction<T>(work: () => Promise<T>): Promise<T> {
    return await work();
  }
}

export class RepositoryContainer {
  readonly storeRepo: IStoreRepository;
  readonly productRepo: IProductRepository;
  readonly inventoryRepo: IInventoryRepository;
  readonly orderRepo: IOrderRepository;
  readonly userRepo: IUserRepository;
  readonly promoRepo: IPromotionRepository;
  readonly txRunner: ITransactionRunner;
  readonly isLiveDatabase: boolean;

  constructor(pool: DatabasePool | null) {
    if (pool) {
      this.isLiveDatabase = true;
      this.storeRepo = new PostgresStoreRepository(pool);
      this.productRepo = new PostgresProductRepository(pool);
      this.inventoryRepo = new PostgresInventoryRepository(pool);
      this.orderRepo = new PostgresOrderRepository(pool);
      this.userRepo = new InMemoryUserRepository();
      this.promoRepo = new InMemoryPromotionRepository();
      this.txRunner = new PostgresTransactionRunner(pool);
    } else {
      this.isLiveDatabase = false;
      this.storeRepo = new InMemoryStoreRepository();
      this.productRepo = new InMemoryProductRepository();
      this.inventoryRepo = new InMemoryInventoryRepository();
      this.orderRepo = new InMemoryOrderRepository();
      this.userRepo = new InMemoryUserRepository();
      this.promoRepo = new InMemoryPromotionRepository();
      this.txRunner = new InMemoryTransactionRunner();
    }
  }
}
