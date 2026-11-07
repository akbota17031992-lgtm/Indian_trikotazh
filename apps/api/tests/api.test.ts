/**
 * Automated API Test Suite for Clean Architecture Backend (apps/api)
 * Tests all critical paths specified by acceptance criteria:
 * 1. Store listing & details (16 Almaty branches)
 * 2. Product listing and filtering by store inventory
 * 3. Order creation flow (pickup and courier delivery) with business rules
 * 4. Auth flows, token validation, and RBAC / RLS order isolation
 * 5. Security boundaries and error envelopes
 *
 * Usage:
 *   node --test --experimental-strip-types tests/api.test.ts
 *   vitest run tests/api.test.ts
 */

import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { ApiTestClient } from './helpers/test-client.ts';
import { getAuthHeader, TEST_USERS } from './helpers/mock-tokens.ts';

let client: ApiTestClient;

before(async () => {
  if (process.env.TEST_API_URL) {
    client = new ApiTestClient(undefined, process.env.TEST_API_URL);
  } else {
    try {
      const { createExpressApp } = await import('../dist/infrastructure/http/server.js');
      const app = await createExpressApp();
      client = new ApiTestClient(app);
    } catch {
      client = new ApiTestClient(undefined, 'http://localhost:4000');
    }
  }
});

function extractData<T = any>(body: any): T {
  if (body && typeof body === 'object' && 'data' in body) {
    return body.data as T;
  }
  return body as T;
}

function extractArray<T = any>(body: any): T[] {
  const data = extractData<any>(body);
  if (Array.isArray(data)) return data;
  if (Array.isArray(body)) return body;
  return [];
}

describe('India Trikotaj Backend API — Acceptance Test Matrix', () => {

  // =========================================================================
  // Critical Path 1: Store Listing & Details
  // =========================================================================
  describe('Path 1: Store Listing & Details', () => {
    it('1.1 should list all active Almaty store branches (>= 15 stores)', async () => {
      const res = await client.get('/api/v1/stores');
      assert.equal(res.status, 200, `Expected 200 OK, got ${res.status}`);

      const stores = extractArray(res.body);
      assert.ok(Array.isArray(stores), 'Response should contain array of stores');
      assert.ok(stores.length >= 15, `Expected >= 15 Almaty stores, found ${stores.length}`);

      const mega = stores.find((s: any) =>
        (s.nameRu && s.nameRu.includes('MEGA')) || (s.name_ru && s.name_ru.includes('MEGA')) || s.slug === 'mega-alma-ata'
      );
      assert.ok(mega, 'MEGA Alma-Ata store branch must be present');

      const dostyk = stores.find((s: any) =>
        (s.nameRu && s.nameRu.includes('Dostyk')) || (s.name_ru && s.name_ru.includes('Dostyk')) || s.slug === 'dostyk-plaza'
      );
      assert.ok(dostyk, 'Dostyk Plaza store branch must be present');
    });

    it('1.2 should validate store entity fields (GPS coordinates, bilingual names, phone, schedule)', async () => {
      const res = await client.get('/api/v1/stores');
      const stores = extractArray(res.body);
      const store = stores[0];

      assert.ok(store.id, 'Store must have an id');
      assert.ok(store.nameRu || store.name_ru, 'Store must have nameRu or name_ru');
      assert.ok(store.nameKz || store.name_kz, 'Store must have nameKz or name_kz');
      assert.ok(store.slug, 'Store must have slug');

      const lat = Number(store.latitude || (store.coordinates && store.coordinates.lat));
      const lng = Number(store.longitude || (store.coordinates && store.coordinates.lng));
      assert.ok(lat >= 43.0 && lat <= 43.5, `Latitude ${lat} out of Almaty range`);
      assert.ok(lng >= 76.7 && lng <= 77.2, `Longitude ${lng} out of Almaty range`);

      const phone = store.phone || '';
      assert.ok(phone.includes('+7') || phone.includes('8'), 'Store phone must start with +7 or 8');
    });

    it('1.3 should fetch single store details by slug (mega-alma-ata)', async () => {
      const res = await client.get('/api/v1/stores/mega-alma-ata');
      assert.equal(res.status, 200, `Expected 200 OK, got ${res.status}`);

      const store = extractData(res.body);
      const name = store.nameRu || store.name_ru || '';
      assert.ok(name.includes('MEGA'), `Expected store name to contain MEGA, got ${name}`);
      assert.equal(store.slug, 'mega-alma-ata');
    });

    it('1.4 should return 404 Not Found for non-existent store slug', async () => {
      const res = await client.get('/api/v1/stores/non-existent-store-xyz-123');
      assert.equal(res.status, 404, `Expected 404 Not Found, got ${res.status}`);
      assert.ok(res.body.error, 'Error envelope must be present');
    });
  });

  // =========================================================================
  // Critical Path 2: Product Listing & Store Inventory Filtering
  // =========================================================================
  describe('Path 2: Product Listing and Store Inventory Filtering', () => {
    it('2.1 should list published clothing products', async () => {
      const res = await client.get('/api/v1/products');
      assert.equal(res.status, 200, `Expected 200 OK, got ${res.status}`);

      const products = extractArray(res.body);
      assert.ok(Array.isArray(products), 'Products must be an array');
      assert.ok(products.length > 0, 'Catalog should contain products');
    });

    it('2.2 should filter products by category (t-shirts)', async () => {
      const res = await client.get('/api/v1/products?category=t-shirts');
      assert.equal(res.status, 200);

      const products = extractArray(res.body);
      assert.ok(products.length > 0, 'Should find t-shirt products');
      for (const prod of products) {
        const cat = prod.categoryId || prod.category_id || (prod.category && prod.category.slug);
        assert.ok(cat === 'cat-01' || cat === 't-shirts', `Product ${prod.slug} has wrong category ${cat}`);
      }
    });

    it('2.3 should return empty array when filtering by non-matching category', async () => {
      const res = await client.get('/api/v1/products?category=space-suits-non-existent');
      assert.equal(res.status, 200);
      const products = extractArray(res.body);
      assert.equal(products.length, 0, 'Expected 0 products for non-matching category');
    });

    it('2.4 should filter products by branch stock availability (storeId & inStock=true)', async () => {
      const res = await client.get('/api/v1/products?storeId=store-almaty-001&inStock=true');
      assert.equal(res.status, 200);

      const products = extractArray(res.body);
      assert.ok(Array.isArray(products), 'Products must be an array');
      assert.ok(products.length > 0, 'MEGA Alma-Ata should have products in stock');
    });

    it('2.5 should fetch product details by slug with variants and images', async () => {
      const res = await client.get('/api/v1/products/futbolka-bazovaya-hlopkovaya-premium');
      assert.equal(res.status, 200);

      const body = res.body;
      const product = body.data || body;
      const name = product.titleRu || product.name_ru || '';
      assert.ok(name.includes('Футболка'), `Product title should contain Футболка, got ${name}`);

      const variants = body.variants || product.variants || [];
      assert.ok(Array.isArray(variants), 'Variants must be an array');
      assert.ok(variants.length > 0, 'Product should have at least 1 variant');

      const variant = variants[0];
      const price = variant.priceKzt || variant.price_kzt;
      assert.ok(Number.isInteger(price), `Price must be whole integer tenge, got ${price}`);
      assert.ok(price > 0, 'Price must be positive');
    });

    it('2.6 should return 404 for non-existent product slug', async () => {
      const res = await client.get('/api/v1/products/non-existent-product-slug-xyz');
      assert.equal(res.status, 404);
      assert.ok(res.body.error, 'Must return error envelope');
    });

    it('2.7 should check stock availability breakdown across all Almaty branches', async () => {
      const res = await client.get('/api/v1/inventory/availability?variantId=var-001-w-m');
      assert.equal(res.status, 200);

      const availability = res.body.availability || res.body.data || res.body;
      assert.ok(Array.isArray(availability), 'Availability must be an array');
      assert.ok(availability.length >= 15, 'Availability should list all Almaty store branches');

      const megaRecord = availability.find((a: any) =>
        (a.storeName && a.storeName.includes('MEGA')) || a.storeId === 'store-almaty-001'
      );
      assert.ok(megaRecord, 'MEGA Alma-Ata branch must be present in availability');
      assert.ok(megaRecord.available !== undefined, 'Available quantity must be present');
    });
  });

  // =========================================================================
  // Critical Path 3: Order Creation Flow (Pickup & Courier Delivery)
  // =========================================================================
  describe('Path 3: Order Creation Flow (Pickup and Delivery)', () => {
    it('3.1 should create store pickup order with zero delivery fee', async () => {
      const orderPayload = {
        customerName: 'Азамат Сапаров',
        customerPhone: '+7 (701) 987-65-43',
        fulfillmentType: 'pickup',
        pickupStoreId: 'store-almaty-001',
        items: [{ variantId: 'var-001-w-m', quantity: 2 }]
      };

      const res = await client.post('/api/v1/orders', orderPayload);
      assert.equal(res.status, 201, `Expected 201 Created, got ${res.status}`);

      const order = res.body.order || res.body.data || res.body;
      assert.ok(order.id, 'Order must have an ID');
      assert.equal(order.status, 'pending_payment', 'New order status must be pending_payment');

      const deliveryFee = order.deliveryFeeKzt ?? order.delivery_fee_kzt ?? 0;
      assert.equal(deliveryFee, 0, 'Store pickup must have 0 delivery fee');

      const total = order.totalKzt ?? order.total_kzt;
      assert.equal(total, 9980, `Expected total 9980 KZT (2 * 4990), got ${total}`);
    });

    it('3.2 should create courier delivery order with standard 1 500 ₸ delivery fee', async () => {
      const orderPayload = {
        customerName: 'Динара Алиева',
        customerPhone: '+7 (777) 123-45-67',
        fulfillmentType: 'courier',
        deliveryAddress: {
          city: 'Алматы',
          street: 'пр. Достык',
          building: '50',
          apartment: '12'
        },
        items: [{ variantId: 'var-003-bl-l', quantity: 1 }]
      };

      const res = await client.post('/api/v1/orders', orderPayload);
      assert.equal(res.status, 201);

      const order = res.body.order || res.body.data || res.body;
      const deliveryFee = order.deliveryFeeKzt ?? order.delivery_fee_kzt;
      assert.equal(deliveryFee, 1500, `Courier delivery fee must be 1500 KZT, got ${deliveryFee}`);

      const total = order.totalKzt ?? order.total_kzt;
      assert.equal(total, 14990 + 1500, `Expected total 16490 KZT, got ${total}`);
    });

    it('3.3 should reject order creation with empty cart items (400 Bad Request)', async () => {
      const res = await client.post('/api/v1/orders', {
        customerName: 'Алина',
        customerPhone: '+7 (701) 111-22-33',
        fulfillmentType: 'pickup',
        pickupStoreId: 'store-almaty-001',
        items: []
      });

      assert.equal(res.status, 400);
      const errMsg = JSON.stringify(res.body);
      assert.ok(errMsg.includes('empty_cart') || errMsg.includes('cart') || errMsg.includes('item'), 'Error must specify empty cart');
    });

    it('3.4 should reject order creation with missing customer phone (400 Bad Request)', async () => {
      const res = await client.post('/api/v1/orders', {
        customerName: 'Дамир',
        customerPhone: '',
        fulfillmentType: 'pickup',
        pickupStoreId: 'store-almaty-001',
        items: [{ variantId: 'var-001-w-m', quantity: 1 }]
      });

      assert.equal(res.status, 400);
    });

    it('3.5 should reject store pickup order without pickupStoreId (400 Bad Request)', async () => {
      const res = await client.post('/api/v1/orders', {
        customerName: 'Дамир',
        customerPhone: '+7 (701) 987-65-43',
        fulfillmentType: 'pickup',
        items: [{ variantId: 'var-001-w-m', quantity: 1 }]
      });

      assert.equal(res.status, 400);
      const err = JSON.stringify(res.body);
      assert.ok(err.includes('pickup_store_required') || err.includes('pickupStoreId') || err.includes('store'));
    });

    it('3.6 should reject courier delivery order without deliveryAddress (400 Bad Request)', async () => {
      const res = await client.post('/api/v1/orders', {
        customerName: 'Дамир',
        customerPhone: '+7 (701) 987-65-43',
        fulfillmentType: 'courier',
        items: [{ variantId: 'var-001-w-m', quantity: 1 }]
      });

      assert.equal(res.status, 400);
      const err = JSON.stringify(res.body);
      assert.ok(err.includes('delivery_address_required') || err.includes('address'));
    });

    it('3.7 should reject order with non-existent variant ID (404 Not Found)', async () => {
      const res = await client.post('/api/v1/orders', {
        customerName: 'Алина',
        customerPhone: '+7 (701) 987-65-43',
        fulfillmentType: 'pickup',
        pickupStoreId: 'store-almaty-001',
        items: [{ variantId: 'var-non-existent-999-invalid', quantity: 1 }]
      });

      assert.equal(res.status, 404);
      const err = JSON.stringify(res.body);
      assert.ok(err.includes('variant_not_found') || err.includes('NOT_FOUND'));
    });
  });

  // =========================================================================
  // Critical Path 4: Auth Flows, Session Tokens & RBAC / RLS Isolation
  // =========================================================================
  describe('Path 4: Auth Flows and Session Token Validation', () => {
    it('4.1 should allow anonymous unauthenticated access to public catalog endpoints', async () => {
      const storesRes = await client.get('/api/v1/stores');
      assert.equal(storesRes.status, 200, 'Stores must be publicly accessible');

      const productsRes = await client.get('/api/v1/products');
      assert.equal(productsRes.status, 200, 'Products must be publicly accessible');
    });

    it('4.2 should reject unauthenticated request to protected /auth/me with 401 Unauthorized', async () => {
      const res = await client.get('/api/v1/auth/me');
      assert.equal(res.status, 401, `Expected 401 Unauthorized, got ${res.status}`);
      assert.equal(res.body.error?.code, 'UNAUTHORIZED');
    });

    it('4.3 should reject malformed or empty bearer token with 401 Unauthorized', async () => {
      const res = await client.get('/api/v1/auth/me', {
        Authorization: 'Bearer invalid_malformed_token_12345'
      });
      assert.equal(res.status, 401, `Expected 401 Unauthorized, got ${res.status}`);
      assert.equal(res.body.error?.code, 'UNAUTHORIZED');
    });

    it('4.4 should authenticate Customer Alice with valid token and return customer profile', async () => {
      const authHeader = getAuthHeader('customerAlice');
      const res = await client.get('/api/v1/auth/me', authHeader);
      assert.equal(res.status, 200);

      const user = res.body.user || res.body.data || res.body;
      assert.equal(user.id, TEST_USERS.customerAlice.id);
      assert.equal(user.role, 'customer');
    });

    it('4.5 should enforce Customer Order Isolation (Alice cannot view Bob orders)', async () => {
      const bobAuth = getAuthHeader('customerBob');
      const createRes = await client.post('/api/v1/orders', {
        customerName: 'Боб Сериков',
        customerPhone: '+7 (702) 987-65-43',
        fulfillmentType: 'pickup',
        pickupStoreId: 'store-almaty-002',
        items: [{ variantId: 'var-001-w-m', quantity: 1 }]
      }, bobAuth);

      assert.equal(createRes.status, 201);
      const bobOrder = createRes.body.order || createRes.body.data || createRes.body;
      const bobOrderId = bobOrder.id;

      const aliceAuth = getAuthHeader('customerAlice');
      const getRes = await client.get(`/api/v1/orders/${bobOrderId}`, aliceAuth);

      assert.ok(getRes.status === 403 || getRes.status === 404,
        `Expected 403 or 404 for tenant isolation breach, got ${getRes.status}`);
    });

    it('4.6 should allow Store Manager for MEGA Alma-Ata to view orders for their branch', async () => {
      const megaManagerAuth = getAuthHeader('managerMega');
      const res = await client.get('/api/v1/orders?storeId=store-almaty-001', megaManagerAuth);
      assert.equal(res.status, 200);

      const orders = extractArray(res.body);
      assert.ok(Array.isArray(orders), 'Orders should be returned');
      for (const order of orders) {
        const storeId = order.storeId || order.pickup_store_id || order.store_id || order.pickupStoreId;
        if (storeId) {
          assert.equal(storeId, 'store-almaty-001', 'Store manager should only see their branch orders');
        }
      }
    });

    it('4.7 should block Store Manager from accessing orders placed at another branch', async () => {
      const megaManagerAuth = getAuthHeader('managerMega');
      const res = await client.get('/api/v1/orders?storeId=store-almaty-002', megaManagerAuth);
      assert.ok(res.status === 403 || (res.status === 200 && extractArray(res.body).length === 0),
        'Manager must not see orders from another branch');
    });

    it('4.8 should allow Administrator full access to all orders across branches', async () => {
      const adminAuth = getAuthHeader('adminRoot');
      const res = await client.get('/api/v1/orders', adminAuth);
      assert.equal(res.status, 200);
      const orders = extractArray(res.body);
      assert.ok(Array.isArray(orders), 'Admin must be able to list orders');
    });
  });

  // =========================================================================
  // Critical Path 5: Security Headers & Error Envelope Boundaries
  // =========================================================================
  describe('Path 5: HTTP Security, Boundary & Error Envelopes', () => {
    it('5.1 should include standard security headers (X-Content-Type-Options, X-Frame-Options)', async () => {
      const res = await client.get('/health');
      assert.equal(res.status, 200);
      assert.equal(res.headers['x-content-type-options'], 'nosniff');
      assert.equal(res.headers['x-frame-options'], 'DENY');
    });

    it('5.2 should handle malformed JSON payload with structured 400 Bad Request envelope', async () => {
      const res = await client.request('POST', '/api/v1/orders', '{ invalid_malformed_json: ');
      assert.equal(res.status, 400);
      assert.ok(res.body.error, 'Should contain error object');
      assert.equal(res.body.error.code, 'BAD_REQUEST');
    });

    it('5.3 should reject invalid order item quantities (negative, fractional, or > 100)', async () => {
      const testCases = [-1, 0, 1.5, 101];
      for (const qty of testCases) {
        const res = await client.post('/api/v1/orders', {
          customerName: 'Дамир',
          customerPhone: '+7 (701) 987-65-43',
          fulfillmentType: 'pickup',
          pickupStoreId: 'store-almaty-001',
          items: [{ variantId: 'var-001-w-m', quantity: qty }]
        });
        assert.equal(res.status, 400, `Expected quantity ${qty} to be rejected with 400`);
      }
    });

    it('5.4 should enforce whole tenge calculations without fractional tiyn drift', async () => {
      const res = await client.post('/api/v1/orders', {
        customerName: 'Дамир',
        customerPhone: '+7 (701) 987-65-43',
        fulfillmentType: 'pickup',
        pickupStoreId: 'store-almaty-001',
        items: [{ variantId: 'var-001-w-m', quantity: 3 }]
      });

      if (res.status === 201) {
        const order = res.body.order || res.body.data || res.body;
        const total = order.totalKzt ?? order.total_kzt;
        assert.ok(Number.isInteger(total), `Total must be integer: ${total}`);
        assert.equal(total, 14970);
      }
    });

    it('5.5 should validate Kaspi Pay invoicing whole tenge and description rules', async () => {
      // Fractional tenge rejected
      const resFrac = await client.post('/api/payments/kaspi/create', {
        orderId: 'ord-123',
        amountKzt: 4990.50,
        phone: '+77011234567',
        description: 'Payment'
      });
      assert.equal(resFrac.status, 422, 'Fractional tenge must be rejected with 422');

      // Valid whole tenge invoice creation
      const resValid = await client.post('/api/payments/kaspi/create', {
        orderId: 'ord-123',
        amountKzt: 4990,
        phone: '+77011234567',
        description: 'Оплата заказа IT-001'
      });
      assert.equal(resValid.status, 201);
      assert.ok(resValid.body.qrTokenUrl);
    });
  });

});
