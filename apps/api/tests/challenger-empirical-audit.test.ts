import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { ApiTestClient } from './helpers/test-client.ts';
import { getAuthHeader } from './helpers/mock-tokens.ts';

describe('Challenger M3 R2 Deep Empirical Security Audit', () => {
  let app: any;
  let client: ApiTestClient;

  before(async () => {
    const { createExpressApp } = await import('../dist/infrastructure/http/server.js');
    app = await createExpressApp();
    client = new ApiTestClient(app);
  });

  // =========================================================================
  // 1. Cross-Tenant Order Isolation Deep Attack
  // =========================================================================
  describe('1. Cross-Tenant Order Isolation Deep Attack', () => {
    let aliceOrderId: string;
    let bobOrderId: string;

    it('1.1 should create order for Alice and Bob with respective tokens', async () => {
      const aliceAuth = getAuthHeader('customerAlice');
      const resAlice = await client.post(
        '/api/v1/orders',
        {
          customerName: 'Alice Smith',
          customerPhone: '+7 (701) 111-22-33',
          fulfillmentType: 'pickup',
          pickupStoreId: 'store-almaty-001',
          items: [{ variantId: 'var-001-w-m', quantity: 1 }],
        },
        aliceAuth
      );
      assert.equal(resAlice.status, 201);
      aliceOrderId = (resAlice.body.order || resAlice.body.data || resAlice.body).id;

      const bobAuth = getAuthHeader('customerBob');
      const resBob = await client.post(
        '/api/v1/orders',
        {
          customerName: 'Bob Jones',
          customerPhone: '+7 (702) 222-33-44',
          fulfillmentType: 'pickup',
          pickupStoreId: 'store-almaty-002',
          items: [{ variantId: 'var-002-bg-m', quantity: 1 }],
        },
        bobAuth
      );
      assert.equal(resBob.status, 201);
      bobOrderId = (resBob.body.order || resBob.body.data || resBob.body).id;
    });

    it('1.2 Alice cannot impersonate Bob by passing foreign userId in order creation payload', async () => {
      const aliceAuth = getAuthHeader('customerAlice');
      // Alice tries to forge Bob's userId
      const res = await client.post(
        '/api/v1/orders',
        {
          userId: 'usr-bob', // Forged ID
          customerName: 'Alice Trying Spoof',
          customerPhone: '+7 (701) 111-22-33',
          fulfillmentType: 'pickup',
          pickupStoreId: 'store-almaty-001',
          items: [{ variantId: 'var-001-w-m', quantity: 1 }],
        },
        aliceAuth
      );
      assert.equal(res.status, 201);
      const createdOrder = res.body.order || res.body.data || res.body;
      assert.equal(createdOrder.userId, 'usr-alice', 'Order userId MUST be bound to authenticated caller, not forged payload');
    });

    it('1.2b [ATTACK REGRESSION] Unauthenticated caller cannot attribute order to Bob via body.userId', async () => {
      // Attacker sends request without Authorization header, attempting to forge Bob's userId
      const res = await client.post('/api/v1/orders', {
        userId: 'usr-bob', // Untrusted body property
        customerName: 'Anonymous Spoof Attempt',
        customerPhone: '+7 (701) 999-88-77',
        fulfillmentType: 'pickup',
        pickupStoreId: 'store-almaty-001',
        items: [{ variantId: 'var-001-w-m', quantity: 1 }],
      });

      assert.equal(res.status, 201, 'Anonymous order creation should succeed as guest checkout');
      const createdOrder = res.body.order || res.body.data || res.body;

      // Invariant: Unauthenticated order MUST have userId: null regardless of body.userId
      assert.strictEqual(
        createdOrder.userId,
        null,
        `VULNERABILITY: Order was attributed to '${createdOrder.userId}' instead of null!`
      );

      // Verify that Bob's order history is NOT polluted by this unauthenticated order
      const bobAuth = getAuthHeader('customerBob');
      const bobOrdersRes = await client.get('/api/v1/orders', bobAuth);
      assert.equal(bobOrdersRes.status, 200);

      const bobOrders = Array.isArray(bobOrdersRes.body)
        ? bobOrdersRes.body
        : (bobOrdersRes.body.data || bobOrdersRes.body.orders);

      const foundSpoofed = bobOrders.find((o: any) => o.id === createdOrder.id);
      assert.strictEqual(
        foundSpoofed,
        undefined,
        'CRITICAL LEAK: Spoofed order placed by unauthenticated attacker appears in Bob private order history!'
      );
    });

    it('1.3 Store Manager of MEGA (store-001) cannot view Bob order placed at Dostyk (store-002)', async () => {
      const megaManagerAuth = getAuthHeader('managerMega');
      const res = await client.get(`/api/v1/orders/${bobOrderId}`, megaManagerAuth);
      assert.equal(res.status, 403, `Expected 403 Forbidden for cross-store manager access, got ${res.status}`);
      assert.equal(res.body.error?.code, 'FORBIDDEN');
    });

    it('1.4 Store Manager of Dostyk (store-002) CAN view Bob order placed at Dostyk', async () => {
      const dostykManagerAuth = getAuthHeader('managerDostyk');
      const res = await client.get(`/api/v1/orders/${bobOrderId}`, dostykManagerAuth);
      assert.equal(res.status, 200, `Expected 200 OK for assigned store manager, got ${res.status}`);
    });

    it('1.5 Customer listing orders receives strictly their own orders, never other customers', async () => {
      const aliceAuth = getAuthHeader('customerAlice');
      const res = await client.get('/api/v1/orders', aliceAuth);
      assert.equal(res.status, 200);
      const orders = Array.isArray(res.body) ? res.body : res.body.data || [];
      assert.ok(orders.length > 0);
      for (const ord of orders) {
        assert.equal(ord.userId, 'usr-alice', `Customer Alice received order belonging to ${ord.userId}`);
      }
    });
  });

  // =========================================================================
  // 2. Kaspi Pay HMAC Webhook Cryptographic Boundary Attacks
  // =========================================================================
  describe('2. Kaspi Pay HMAC Webhook Cryptographic Boundary Attacks', () => {
    const webhookSecret = process.env.KASPI_WEBHOOK_SECRET || 'test_kaspi_webhook_secret_key_12345';

    it('2.1 Tampered payload with valid signature of original payload MUST fail 401', async () => {
      const originalPayload = {
        invoiceId: 'inv-tamper-01',
        orderId: 'ord-test-01',
        status: 'SUCCESS',
        amount: 5000,
      };
      const rawBody = JSON.stringify(originalPayload);
      const validSig = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');

      // Attacker tampers with the status: changing to PAID or changing amount to 50000
      const tamperedPayload = {
        ...originalPayload,
        amount: 50000,
      };

      const res = await client.post('/api/payments/kaspi/callback', tamperedPayload, {
        'x-webhook-signature': `sha256=${validSig}`,
      });

      assert.equal(res.status, 401, 'Tampered payload with unmatching signature must return 401');
      assert.equal(res.body.error?.code, 'INVALID_SIGNATURE');
    });

    it('2.2 Timing attack / byte truncation in signature header MUST fail 401', async () => {
      const payload = { invoiceId: 'inv-trunc-01', status: 'SUCCESS' };
      const rawBody = JSON.stringify(payload);
      const validSig = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');

      // Shortened signature (32 chars instead of 64 hex chars)
      const truncatedSig = validSig.substring(0, 32);
      const res = await client.post('/api/payments/kaspi/callback', payload, {
        'x-webhook-signature': `sha256=${truncatedSig}`,
      });

      assert.equal(res.status, 401);
      assert.equal(res.body.error?.code, 'INVALID_SIGNATURE');
    });

    it('2.3 Webhook replay attack is idempotently deduplicated without duplicate side-effects', async () => {
      const payload = {
        invoiceId: `inv-replay-${Date.now()}`,
        orderId: 'ord-replay-test',
        status: 'SUCCESS',
        transactionId: `txn-${Date.now()}`,
      };
      const rawBody = JSON.stringify(payload);
      const sig = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');

      // First call
      const res1 = await client.post('/api/payments/kaspi/callback', payload, {
        'x-webhook-signature': `sha256=${sig}`,
      });
      assert.equal(res1.status, 200);
      assert.equal(res1.body.processed, true);

      // Duplicate replay call
      const res2 = await client.post('/api/payments/kaspi/callback', payload, {
        'x-webhook-signature': `sha256=${sig}`,
      });
      assert.equal(res2.status, 200);
      assert.equal(res2.body.deduplicated, true);
    });
  });

  // =========================================================================
  // 3. Extended SQL Injection & Parameter Tampering
  // =========================================================================
  describe('3. Extended SQL Injection & Parameter Tampering', () => {
    it('3.1 should safely handle complex SQL comments and UNION queries in search', async () => {
      const maliciousQueries = [
        "1' OR 1=1 #",
        "1' OR 1=1 /* comment */",
        "test' UNION ALL SELECT username, password FROM users--",
        "'; EXEC xp_cmdshell('dir');--",
        "1; WAITFOR DELAY '0:0:5'--",
      ];

      for (const q of maliciousQueries) {
        const res = await client.get(`/api/v1/products?search=${encodeURIComponent(q)}`);
        assert.equal(res.status, 200, `Query "${q}" caused unexpected status ${res.status}`);
      }
    });

    it('3.2 should safely handle district SQL injection in GET /api/v1/stores', async () => {
      const res = await client.get('/api/v1/stores?district=' + encodeURIComponent("' OR '1'='1"));
      assert.equal(res.status, 200);
      // Returns empty array or valid stores, never 500 error
      assert.ok(Array.isArray(res.body) || Array.isArray(res.body.data));
    });

    it('3.3 should safely reject directory traversal in slug parameters', async () => {
      const res = await client.get('/api/v1/products/' + encodeURIComponent('../../etc/passwd'));
      assert.equal(res.status, 404);
      assert.equal(res.body.error?.code, 'NOT_FOUND');
    });
  });

  // =========================================================================
  // 4. Boundary Limits & Strict Pagination Clamping
  // =========================================================================
  describe('4. Boundary Limits & Strict Pagination Clamping', () => {
    it('4.1 should clamp negative limit to 1 and limit > 100 to 100', async () => {
      const resNeg = await client.get('/api/v1/products?limit=-10&envelope=true');
      assert.equal(resNeg.status, 200);
      assert.equal(resNeg.body.meta?.limit, 1);

      const resGigantic = await client.get('/api/v1/products?limit=999999&envelope=true');
      assert.equal(resGigantic.status, 200);
      assert.equal(resGigantic.body.meta?.limit, 100);
    });

    it('4.2 should clamp NaN page or limit to defaults', async () => {
      const res = await client.get('/api/v1/products?page=notanumber&limit=garbage&envelope=true');
      assert.equal(res.status, 200);
      assert.equal(res.body.meta?.page, 1);
      assert.equal(res.body.meta?.limit, 20);
    });
  });
});
