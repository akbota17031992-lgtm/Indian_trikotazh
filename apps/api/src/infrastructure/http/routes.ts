import { Router } from 'express';
import type { RepositoryContainer } from '../../adapters/repositories/repository.container.js';
import { StoreController } from '../../adapters/controllers/store.controller.js';
import { CategoryController } from '../../adapters/controllers/category.controller.js';
import { ProductController } from '../../adapters/controllers/product.controller.js';
import { InventoryController } from '../../adapters/controllers/inventory.controller.js';
import { OrderController } from '../../adapters/controllers/order.controller.js';
import { AuthController } from '../../adapters/controllers/auth.controller.js';
import { PaymentController } from '../../adapters/controllers/payment.controller.js';
import { CreateKaspiInvoiceUseCase } from '../../use-cases/payments/create-kaspi-invoice.use-case.js';
import { ProcessKaspiWebhookUseCase } from '../../use-cases/payments/process-kaspi-webhook.use-case.js';
import { PaymentGatewayFactory } from '../../adapters/gateways/kaspi/payment-gateway.factory.js';
import { requireAuth } from './middlewares/auth.middleware.js';
import { strictMutationRateLimiter } from './middlewares/rate-limiter.middleware.js';

export function createV1Router(repoContainer: RepositoryContainer): Router {
  const router = Router();

  const storeController = new StoreController(repoContainer.storeRepo);
  const categoryController = new CategoryController();
  const productController = new ProductController(repoContainer.productRepo);
  const inventoryController = new InventoryController(repoContainer.inventoryRepo, repoContainer.productRepo);
  const orderController = new OrderController(
    repoContainer.orderRepo,
    repoContainer.productRepo,
    repoContainer.inventoryRepo,
    repoContainer.storeRepo,
    repoContainer.promoRepo,
    repoContainer.txRunner
  );
  const authController = new AuthController(repoContainer.userRepo);
  const paymentGateway = PaymentGatewayFactory.create();
  const createKaspiInvoiceUseCase = new CreateKaspiInvoiceUseCase(paymentGateway, repoContainer.orderRepo);
  const processKaspiWebhookUseCase = new ProcessKaspiWebhookUseCase(
    paymentGateway,
    repoContainer.orderRepo,
    repoContainer.inventoryRepo
  );
  const paymentController = new PaymentController(createKaspiInvoiceUseCase, processKaspiWebhookUseCase);

  // Store routes
  router.get('/stores', storeController.listStores);
  router.get('/stores/:slugOrId', storeController.getStoreBySlugOrId);

  // Category routes
  router.get('/categories', categoryController.listCategories);

  // Product routes
  router.get('/products', productController.listProducts);
  router.get('/products/:slug', productController.getProductBySlug);

  // Inventory routes
  router.get('/inventory/availability', inventoryController.getAvailability);
  router.get('/inventory/stores/:storeId', inventoryController.getStoreStock);

  // Order routes
  router.get('/orders', requireAuth, orderController.listOrders);
  router.post('/orders', strictMutationRateLimiter, orderController.createOrder);
  router.get('/orders/:id', requireAuth, orderController.getOrderById);

  // Auth routes
  router.get('/auth/me', requireAuth, authController.getMe);

  // Kaspi Pay routes (both direct and prefixed) protected with strict rate limiting
  router.post('/kaspi/create', strictMutationRateLimiter, paymentController.createKaspiInvoice);
  router.post('/kaspi/callback', strictMutationRateLimiter, paymentController.handleKaspiWebhook);
  router.post('/payments/kaspi/create', strictMutationRateLimiter, paymentController.createKaspiInvoice);
  router.post('/payments/kaspi/callback', strictMutationRateLimiter, paymentController.handleKaspiWebhook);

  return router;
}
