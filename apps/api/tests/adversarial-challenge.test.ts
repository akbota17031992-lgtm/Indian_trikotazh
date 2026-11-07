import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { EventEmitter } from 'node:events';
import crypto from 'node:crypto';
import { ApiTestClient } from './helpers/test-client.ts';
import { getAuthHeader, TEST_USERS } from './helpers/mock-tokens.ts';

describe('Adversarial Security & Boundary Challenges (challenger_m3_2)', () => {
  let app: any;
  let client: ApiTestClient;

  before(async () => {
    const { createExpressApp } = await import('../dist/infrastructure/http/server.js');
    app = await createExpressApp();
    client = new ApiTestClient(app);
  });

  // =========================================================================
  // Challenge 1: Cross-Tenant Order Isolation & Unauthenticated Order Leak
  // =========================================================================
  describe('Challenge 1: Authorization & Cross-Tenant Order Isolation', () => {
    let bobOrderId: string;

    it('1.1 should create order as customer Bob', async () => {
      const bobAuth = getAuthHeader('customerBob');
      const res = await client.post(
        '/api/v1/orders',
        {
          customerName: 'Bob Customer',
          customerPhone: '+7 (702) 111-22-33',
          fulfillmentType: 'pickup',
          pickupStoreId: 'store-almaty-001',
          items: [{ variantId: 'var-001-w-m', quantity: 1 }],
        },
        bobAuth
      );

      assert.equal(res.status, 201);
      const order = res.body.order || res.body.data || res.body;
      bobOrderId = order.id;
      assert.ok(bobOrderId, 'Bob order ID must exist');
    });

    it('1.2 should block Alice from viewing Bob order (Customer Isolation)', async () => {
      const aliceAuth = getAuthHeader('customerAlice');
      const res = await client.get(`/api/v1/orders/${bobOrderId}`, aliceAuth);

      assert.ok(
        res.status === 403 || res.status === 404,
        `Expected 403 or 404 when Alice accesses Bob order, got ${res.status}`
      );
    });

    it('1.3 [ATTACK] Unauthenticated caller accessing Bob order via GET /api/v1/orders/:id', async () => {
      // An anonymous user with NO Authorization header
      const res = await client.get(`/api/v1/orders/${bobOrderId}`);

      // Security requirement: Must NOT return Bob's order with 200 OK
      // Should be 401 Unauthorized or 403 Forbidden or 404 Not Found
      assert.notEqual(
        res.status,
        200,
        `VULNERABILITY DETECTED: Anonymous user can view Bob order ${bobOrderId}! Status: ${res.status}`
      );
    });

    it('1.4 [ATTACK] Unauthenticated caller enumerating all orders via GET /api/v1/orders', async () => {
      // An anonymous user with NO Authorization header
      const res = await client.get('/api/v1/orders');

      // Security requirement: Listing all orders must require authentication (admin/manager)
      // Must NOT return full list of orders to anonymous caller!
      assert.notEqual(
        res.status,
        200,
        `VULNERABILITY DETECTED: Anonymous user can list all orders in the marketplace! Status: ${res.status}`
      );
    });

    it('1.5 [ATTACK] Unauthenticated caller attempting customer attribution spoofing via body.userId', async () => {
      const res = await client.post('/api/v1/orders', {
        userId: 'usr-bob',
        customerName: 'Spoof Attempt',
        customerPhone: '+7 (702) 999-00-11',
        fulfillmentType: 'pickup',
        pickupStoreId: 'store-almaty-001',
        items: [{ variantId: 'var-001-w-m', quantity: 1 }],
      });

      assert.equal(res.status, 201);
      const order = res.body.order || res.body.data || res.body;
      assert.strictEqual(
        order.userId,
        null,
        'Anonymous order userId must be null and ignore body.userId'
      );
    });
  });

  // =========================================================================
  // Challenge 2: Kaspi Pay Webhook Security & Signature Verification
  // =========================================================================
  describe('Challenge 2: Kaspi Pay Webhook Cryptographic Verification', () => {
    let pendingOrderId: string;

    it('2.1 should create an order in pending_payment state', async () => {
      const res = await client.post('/api/v1/orders', {
        customerName: 'Kaspi Tester',
        customerPhone: '+7 (705) 555-55-55',
        fulfillmentType: 'pickup',
        pickupStoreId: 'store-almaty-001',
        items: [{ variantId: 'var-001-w-m', quantity: 1 }],
      });
      assert.equal(res.status, 201);
      const order = res.body.order || res.body.data || res.body;
      pendingOrderId = order.id;
      assert.equal(order.status, 'pending_payment');
    });

    it('2.2 [ATTACK] Webhook callback without X-Webhook-Signature header must be rejected', async () => {
      // Attacker attempts to mark order as paid without merchant secret
      const fakeWebhookPayload = {
        invoiceId: 'inv-fake-999',
        orderId: pendingOrderId,
        status: 'SUCCESS',
        transactionId: 'txn-fake-999',
      };

      const res = await client.post('/api/payments/kaspi/callback', fakeWebhookPayload);

      // Security requirement: Missing signature header MUST be rejected (401 Unauthorized)
      assert.equal(
        res.status,
        401,
        `VULNERABILITY DETECTED: Kaspi webhook accepted callback without signature header! Status was ${res.status}`
      );
    });

    it('2.3 Webhook callback with forged/invalid HMAC signature must be rejected with 401', async () => {
      const fakeWebhookPayload = {
        invoiceId: 'inv-forged-999',
        orderId: pendingOrderId,
        status: 'SUCCESS',
        transactionId: 'txn-forged-999',
      };

      const forgedSignature = 'sha256=' + 'a'.repeat(64);
      const res = await client.post('/api/payments/kaspi/callback', fakeWebhookPayload, {
        'x-webhook-signature': forgedSignature,
      });

      assert.equal(res.status, 401, `Forged signature should return 401, got ${res.status}`);
      assert.equal(res.body.error?.code, 'INVALID_SIGNATURE');
    });

    it('2.4 Webhook callback with valid HMAC signature should be accepted with 200', async () => {
      const webhookSecret = process.env.KASPI_WEBHOOK_SECRET || 'test_kaspi_webhook_secret_key_12345';
      const validPayload = {
        invoiceId: `inv-valid-${Date.now()}`,
        orderId: pendingOrderId,
        status: 'SUCCESS',
        transactionId: `txn-valid-${Date.now()}`,
      };

      const rawBody = JSON.stringify(validPayload);
      const validSig = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');

      const res = await client.post('/api/payments/kaspi/callback', validPayload, {
        'x-webhook-signature': `sha256=${validSig}`,
      });

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
    });

    it('2.5 Invoicing must reject fractional tenge amounts with 422', async () => {
      const res = await client.post('/api/payments/kaspi/create', {
        orderId: 'ord-test-frac',
        amountKzt: 4990.75,
        phone: '+77011234567',
        description: 'Fractional test',
      });

      assert.equal(res.status, 422);
    });

    it('2.6 Invoicing must reject negative amounts with 422', async () => {
      const res = await client.post('/api/payments/kaspi/create', {
        orderId: 'ord-test-neg',
        amountKzt: -5000,
        phone: '+77011234567',
        description: 'Negative test',
      });

      assert.equal(res.status, 422);
    });

    it('2.7 Invoicing must reject descriptions longer than 60 characters with 422', async () => {
      const res = await client.post('/api/payments/kaspi/create', {
        orderId: 'ord-test-long',
        amountKzt: 5000,
        phone: '+77011234567',
        description: 'A'.repeat(61),
      });

      assert.equal(res.status, 422);
    });
  });

  // =========================================================================
  // Challenge 3: Security Bounds (Payload limits, Malformed JSON, Injections)
  // =========================================================================
  describe('Challenge 3: Security Bounds & Input Sanitization', () => {
    it('3.1 should reject malformed JSON with 400 Bad Request envelope', async () => {
      const res = await client.request('POST', '/api/v1/orders', '{ broken json: true ');
      assert.equal(res.status, 400);
      assert.ok(res.body.error);
      assert.equal(res.body.error.code, 'BAD_REQUEST');
    });

    it('3.2 SQL injection vectors in product search query must not cause 500 or leak data', async () => {
      const sqliPayloads = [
        "' OR 1=1--",
        "'; DROP TABLE products;--",
        "' UNION SELECT null, null, null--",
        "admin'--",
        "1' AND '1'='1",
      ];

      for (const payload of sqliPayloads) {
        const res = await client.get(`/api/v1/products?search=${encodeURIComponent(payload)}`);
        assert.equal(res.status, 200, `SQLi search payload "${payload}" should not 500`);
      }
    });

    it('3.3 SQL injection in sort parameter must not execute arbitrary SQL', async () => {
      const res = await client.get('/api/v1/products?sort=' + encodeURIComponent('; DROP TABLE products;--'));
      assert.equal(res.status, 200);
    });

    it('3.4 SQL injection in store slug parameter must return 404 Not Found without SQL error', async () => {
      const res = await client.get('/api/v1/stores/' + encodeURIComponent("' OR '1'='1"));
      assert.equal(res.status, 404);
      assert.equal(res.body.error?.code, 'NOT_FOUND');
    });

    it('3.5 XSS payload in order customer name and comment should be handled safely', async () => {
      const xssScript = '<script>alert("xss")</script>';
      const res = await client.post('/api/v1/orders', {
        customerName: xssScript,
        customerPhone: '+7 (701) 999-88-77',
        customerComment: '<img src=x onerror=alert(1)>',
        fulfillmentType: 'pickup',
        pickupStoreId: 'store-almaty-001',
        items: [{ variantId: 'var-001-w-m', quantity: 1 }],
      });

      assert.equal(res.status, 201);
      const order = res.body.order || res.body.data || res.body;
      assert.ok(order.id);
      // Order created successfully without crashing server
    });

    it('3.6 should reject oversized payload (>10MB) with 413 Payload Too Large', async () => {
      const http = await import('node:http');
      const net = await import('node:net');

      const socket = new net.Socket();
      const req = new http.IncomingMessage(socket);
      req.headers = {
        'content-type': 'application/json',
        'content-length': '11000000',
      };
      req.method = 'POST';
      req.url = '/api/v1/orders';

      const res = new http.ServerResponse(req);
      let capturedStatus = 200;
      let capturedBody: any = null;

      res.writeHead = (statusCode: number, ...args: any[]) => {
        capturedStatus = statusCode;
        return res;
      };

      const resultPromise = new Promise<{ status: number; body: any }>((resolve) => {
        let raw = '';
        res.write = (chunk: any) => {
          raw += chunk;
          return true;
        };
        res.end = (chunk?: any) => {
          if (chunk) raw += chunk;
          try {
            capturedBody = JSON.parse(raw);
          } catch {
            capturedBody = raw;
          }
          resolve({ status: res.statusCode || capturedStatus, body: capturedBody });
          return res;
        };
      });

      app(req, res);

      // Stream 11MB of JSON
      const chunk = Buffer.alloc(1024 * 1024, 'a');
      req.push('{"data":"');
      for (let i = 0; i < 11; i++) {
        req.push(chunk);
      }
      req.push('"}');
      req.push(null);

      const response = await resultPromise;
      assert.equal(response.status, 413, `Payload >10MB must be rejected with 413, got ${response.status}`);
      assert.equal(response.body?.error?.code, 'PAYLOAD_TOO_LARGE');
    });
  });

  // =========================================================================
  // Challenge 4: Endpoint Robustness & Boundary Validation
  // =========================================================================
  describe('Challenge 4: Endpoint Robustness & Pagination Clamping', () => {
    it('4.1 should return 404 for invalid store slug', async () => {
      const res = await client.get('/api/v1/stores/completely-non-existent-store-slug');
      assert.equal(res.status, 404);
      assert.equal(res.body.error?.code, 'NOT_FOUND');
    });

    it('4.2 should return 404 for invalid product slug', async () => {
      const res = await client.get('/api/v1/products/completely-non-existent-product-slug');
      assert.equal(res.status, 404);
      assert.equal(res.body.error?.code, 'NOT_FOUND');
    });

    it('4.3 should return 404 for unmatched API routes', async () => {
      const res = await client.get('/api/v1/unknown-endpoint-xyz');
      assert.equal(res.status, 404);
      assert.equal(res.body.error?.code, 'NOT_FOUND');
    });

    it('4.4 should clamp negative and zero page numbers to page=1', async () => {
      const resNeg = await client.get('/api/v1/products?page=-5&limit=10&envelope=true');
      assert.equal(resNeg.status, 200);
      assert.equal(resNeg.body.meta?.page, 1);

      const resZero = await client.get('/api/v1/products?page=0&limit=10&envelope=true');
      assert.equal(resZero.status, 200);
      assert.equal(resZero.body.meta?.page, 1);
    });

    it('4.5 should clamp limit exceeding 100 to limit=100', async () => {
      const resLarge = await client.get('/api/v1/products?limit=500&envelope=true');
      assert.equal(resLarge.status, 200);
      assert.ok(resLarge.body.meta?.limit <= 100, `Limit must be clamped <= 100, got ${resLarge.body.meta?.limit}`);
    });

    it('4.6 should reject order creation with missing customer phone (400 Bad Request)', async () => {
      const res = await client.post('/api/v1/orders', {
        customerName: 'Test Customer',
        customerPhone: '',
        fulfillmentType: 'pickup',
        pickupStoreId: 'store-almaty-001',
        items: [{ variantId: 'var-001-w-m', quantity: 1 }],
      });
      assert.equal(res.status, 400);
    });

    it('4.7 should reject order creation with empty items array (400 Bad Request)', async () => {
      const res = await client.post('/api/v1/orders', {
        customerName: 'Test Customer',
        customerPhone: '+7 (701) 123-45-67',
        fulfillmentType: 'pickup',
        pickupStoreId: 'store-almaty-001',
        items: [],
      });
      assert.equal(res.status, 400);
    });

    it('4.8 should reject invalid item quantities (negative, fractional, > 100)', async () => {
      const invalidQuantities = [-1, 0, 1.5, 101];
      for (const qty of invalidQuantities) {
        const res = await client.post('/api/v1/orders', {
          customerName: 'Test Customer',
          customerPhone: '+7 (701) 123-45-67',
          fulfillmentType: 'pickup',
          pickupStoreId: 'store-almaty-001',
          items: [{ variantId: 'var-001-w-m', quantity: qty }],
        });
        assert.equal(res.status, 400, `Expected quantity ${qty} to be rejected with 400`);
      }
    });
  });
});
