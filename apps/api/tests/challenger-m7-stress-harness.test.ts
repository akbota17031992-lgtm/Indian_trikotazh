/**
 * EMPIRICAL CHALLENGER STRESS HARNESS — Milestone 7
 * India Trikotaj Marketplace Phase 1 (MVP)
 *
 * Auditor: challenger_m7_2 (Adversarial Hardening & Concurrency Challenger)
 * Tests empirical invariants under stress:
 * 1. High-concurrency inventory reservation (zero overselling under race conditions).
 * 2. Kaspi webhook HMAC tampering, replay attacks, and timing safe verification.
 * 3. Injection vectors: XSS, path traversal, prototype pollution, JSON nesting bombs.
 * 4. Monetary integrity: tiyn injection, currency tampering, fractional rounding checks.
 */

import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { ApiTestClient } from './helpers/test-client.ts';
import { getAuthHeader } from './helpers/mock-tokens.ts';
import {
  Money,
  KazakhstanPhoneNumber,
  StoreInventory,
  Order,
  OrderItem,
  InsufficientStockError,
  ValidationError,
} from '../dist/domain/index.js';
import {
  CreateOrderUseCase,
} from '../dist/use-cases/index.js';
import {
  CreateKaspiInvoiceUseCase,
  ProcessKaspiWebhookUseCase,
} from '../dist/use-cases/payments/index.js';
import {
  InMemoryInventoryRepository,
  InMemoryOrderRepository,
  InMemoryProductRepository,
  InMemoryStoreRepository,
} from '../dist/adapters/index.js';
import {
  MockKaspiPaymentAdapter,
  ApiPayKzPaymentAdapter,
} from '../dist/adapters/gateways/kaspi/index.js';
import { formatKZT, parseKZT } from '@india-trikotaj/shared';

describe('CHALLENGER M7-2 EMPIRICAL STRESS & ADVERSARIAL HARNESS', () => {
  let app: any;
  let client: ApiTestClient;

  before(async () => {
    const { createExpressApp } = await import('../dist/infrastructure/http/server.js');
    app = await createExpressApp();
    client = new ApiTestClient(app);
  });

  // =========================================================================
  // 1. HIGH-CONCURRENCY INVENTORY RESERVATION DURING PEAK RUSH (ZERO OVERSELLING)
  // =========================================================================
  describe('1. High-Concurrency Stock Reservation & Race Conditions', () => {
    it('1.1 [PEAK RUSH] 100 simultaneous concurrent orders competing for 5 scarce units must yield exactly 5 successes and 95 failures with zero overselling', async () => {
      const invRepo = new InMemoryInventoryRepository();
      const storeRepo = new InMemoryStoreRepository();
      const productRepo = new InMemoryProductRepository();
      const orderRepo = new InMemoryOrderRepository();
      const useCase = new CreateOrderUseCase(orderRepo, productRepo, invRepo, storeRepo);

      const storeId = 'store-almaty-001';
      const variantId = 'var-003-bl-l';

      // Seed scarce inventory with exactly 5 available units
      const initialStock = 5;
      const scarceInv = new StoreInventory('inv-scarce-01', storeId, variantId, initialStock, 0, 2);
      (invRepo as any).inventory.set(`${storeId}:${variantId}`, scarceInv);

      // Create 100 concurrent checkout attempts simultaneously via Promise.all
      const totalAttempts = 100;
      const orderInputs = Array.from({ length: totalAttempts }, (_, i) => ({
        customerName: `Rush Buyer ${i + 1}`,
        customerPhone: `+7 (701) ${String(100 + i).padStart(3, '0')}-00-00`,
        fulfillmentType: 'pickup' as const,
        pickupStoreId: storeId,
        items: [{ variantId, quantity: 1, reservedFromStoreId: storeId }],
      }));

      // Fire all 100 requests concurrently
      const results = await Promise.all(orderInputs.map((input) => useCase.execute(input)));

      const successfulOrders = results.filter((r) => r.success);
      const failedOrders = results.filter((r) => !r.success);

      // Invariants
      assert.equal(successfulOrders.length, 5, `Expected exactly 5 successful orders, got ${successfulOrders.length}`);
      assert.equal(failedOrders.length, 95, `Expected exactly 95 rejected orders, got ${failedOrders.length}`);

      // Verify all failed orders received InsufficientStockError
      for (const failed of failedOrders) {
        if (!failed.success) {
          assert.equal(failed.error.code, 'INSUFFICIENT_STOCK');
        }
      }

      // Verify repository state: available must be 0, reserved must be 5
      const finalInv = await invRepo.findByStoreAndVariant(storeId, variantId);
      assert.ok(finalInv);
      assert.equal(finalInv.quantity, 5, 'Total quantity must remain 5');
      assert.equal(finalInv.reservedQuantity, 5, 'Reserved quantity must equal total quantity (5)');
      assert.equal(finalInv.availableQuantity, 0, 'Available quantity must be exactly 0 (no oversell)');
      assert.ok(finalInv.reservedQuantity <= finalInv.quantity, 'Reserved quantity must never exceed quantity');
    });

    it('1.2 [CROSS-STORE CONCURRENCY] Separate inventory pools across branches must remain isolated under concurrent load', async () => {
      const invRepo = new InMemoryInventoryRepository();
      const store1 = 'store-almaty-001'; // MEGA Alma-Ata
      const store2 = 'store-almaty-002'; // Dostyk Plaza
      const variantId = 'var-cross-store-01';

      // Store 1 has 3 units, Store 2 has 7 units
      const inv1 = new StoreInventory('inv-s1', store1, variantId, 3, 0, 2);
      const inv2 = new StoreInventory('inv-s2', store2, variantId, 7, 0, 2);
      (invRepo as any).inventory.set(`${store1}:${variantId}`, inv1);
      (invRepo as any).inventory.set(`${store2}:${variantId}`, inv2);

      // Fire 50 concurrent requests to Store 1 and 50 concurrent requests to Store 2 simultaneously
      const reqsStore1 = Array.from({ length: 50 }, (_, i) =>
        invRepo.reserveStock(store1, variantId, 1, `req-s1-${i}`)
      );
      const reqsStore2 = Array.from({ length: 50 }, (_, i) =>
        invRepo.reserveStock(store2, variantId, 1, `req-s2-${i}`)
      );

      const [res1, res2] = await Promise.all([
        Promise.all(reqsStore1),
        Promise.all(reqsStore2),
      ]);

      const successS1 = res1.filter(Boolean).length;
      const successS2 = res2.filter(Boolean).length;

      assert.equal(successS1, 3, `Store 1 must reserve exactly 3 units, got ${successS1}`);
      assert.equal(successS2, 7, `Store 2 must reserve exactly 7 units, got ${successS2}`);

      const finalS1 = await invRepo.findByStoreAndVariant(store1, variantId);
      const finalS2 = await invRepo.findByStoreAndVariant(store2, variantId);

      assert.equal(finalS1?.reservedQuantity, 3);
      assert.equal(finalS1?.availableQuantity, 0);
      assert.equal(finalS2?.reservedQuantity, 7);
      assert.equal(finalS2?.availableQuantity, 0);
    });

    it('1.3 [INTERLEAVED CONCURRENCY] Parallel cancellations releasing stock while new customers reserve must preserve conservation of inventory', async () => {
      const invRepo = new InMemoryInventoryRepository();
      const storeId = 'store-almaty-001';
      const variantId = 'var-interleaved-01';

      // Initial: 10 units total, 5 currently reserved (5 available)
      const inv = new StoreInventory('inv-int-1', storeId, variantId, 10, 5, 2);
      (invRepo as any).inventory.set(`${storeId}:${variantId}`, inv);

      // 5 customers cancel (release 1 unit each)
      const releases = Array.from({ length: 5 }, (_, i) =>
        invRepo.releaseStock(storeId, variantId, 1, `rel-${i}`)
      );

      // Simultaneously, 25 new customers try to reserve 1 unit each
      const reserves = Array.from({ length: 25 }, (_, i) =>
        invRepo.reserveStock(storeId, variantId, 1, `res-${i}`)
      );

      // Run all releases and reserves concurrently
      const [, reserveResults] = await Promise.all([
        Promise.all(releases),
        Promise.all(reserves),
      ]);

      const successfulReserves = reserveResults.filter(Boolean).length;
      // Total available was 5 + 5 released = 10 units available to be reserved
      assert.equal(successfulReserves, 10, `Expected 10 total successful reservations, got ${successfulReserves}`);

      const finalInv = await invRepo.findByStoreAndVariant(storeId, variantId);
      assert.ok(finalInv);
      assert.equal(finalInv.reservedQuantity, 10);
      assert.equal(finalInv.availableQuantity, 0);
      assert.equal(finalInv.quantity, 10);
    });

    it('1.4 [MULTI-ITEM BUNDLE ROLLBACK] High concurrency on multi-item orders rolls back partial reservations if any item is exhausted', async () => {
      const invRepo = new InMemoryInventoryRepository();
      const storeRepo = new InMemoryStoreRepository();
      const productRepo = new InMemoryProductRepository();
      const orderRepo = new InMemoryOrderRepository();
      const useCase = new CreateOrderUseCase(orderRepo, productRepo, invRepo, storeRepo);

      const storeId = 'store-almaty-001';
      const varPlentiful = 'var-001-w-m'; // 20 units
      const varScarce = 'var-003-bl-l';   // Only 2 units!

      const invPlentiful = new StoreInventory('inv-bp', storeId, varPlentiful, 20, 0, 3);
      const invScarce = new StoreInventory('inv-bs', storeId, varScarce, 2, 0, 1);
      (invRepo as any).inventory.set(`${storeId}:${varPlentiful}`, invPlentiful);
      (invRepo as any).inventory.set(`${storeId}:${varScarce}`, invScarce);

      // 15 concurrent orders each requesting [1 of plentiful, 1 of scarce]
      const orderAttempts = Array.from({ length: 15 }, (_, i) => ({
        customerName: `Bundle Buyer ${i + 1}`,
        customerPhone: `+7 (702) ${String(200 + i).padStart(3, '0')}-00-00`,
        fulfillmentType: 'pickup' as const,
        pickupStoreId: storeId,
        items: [
          { variantId: varPlentiful, quantity: 1, reservedFromStoreId: storeId },
          { variantId: varScarce, quantity: 1, reservedFromStoreId: storeId },
        ],
      }));

      const results = await Promise.all(orderAttempts.map((input) => useCase.execute(input)));

      const successful = results.filter((r) => r.success);
      const failed = results.filter((r) => !r.success);

      assert.equal(successful.length, 2, 'Only 2 bundle orders must succeed because scarce item has 2 units');
      assert.equal(failed.length, 13, '13 bundle orders must fail');

      // CRITICAL ROLLBACK CHECK: The plentiful item must have ONLY 2 reserved, NOT 15!
      const finalPlentiful = await invRepo.findByStoreAndVariant(storeId, varPlentiful);
      const finalScarce = await invRepo.findByStoreAndVariant(storeId, varScarce);

      assert.equal(finalPlentiful?.reservedQuantity, 2, 'Plentiful item reservation must be rolled back to 2, not leaked!');
      assert.equal(finalPlentiful?.availableQuantity, 18);
      assert.equal(finalScarce?.reservedQuantity, 2);
      assert.equal(finalScarce?.availableQuantity, 0);
    });
  });

  // =========================================================================
  // 2. KASPI WEBHOOK HMAC TAMPERING, REPLAY ATTACKS & TIMING-SAFE VERIFICATION
  // =========================================================================
  describe('2. Kaspi Webhook HMAC Tampering & Cryptographic Verification', () => {
    const webhookSecret = 'adversarial_challenger_secret_m7_999';
    let gateway: MockKaspiPaymentAdapter;
    let liveAdapter: ApiPayKzPaymentAdapter;

    before(() => {
      gateway = new MockKaspiPaymentAdapter(webhookSecret);
      liveAdapter = new ApiPayKzPaymentAdapter({ webhookSecret });
    });

    it('2.1 [64-BIT-FLIP ORACLE] Modifying every single hex character from 0 to 63 in signature must invalidate signature 100% of the time', () => {
      const payload = {
        invoiceId: 'inv-oracle-01',
        orderId: 'ord-oracle-01',
        amount: 14990,
        status: 'SUCCESS',
        transactionId: 'txn-oracle-01',
      };
      const signed = gateway.createSignedWebhook(payload);
      const rawSig = signed.signatureHeader.slice(7); // remove "sha256="
      assert.equal(rawSig.length, 64, 'Raw HMAC signature must be 64 hex characters');

      // Mutate each of the 64 characters one by one
      for (let i = 0; i < 64; i++) {
        const originalChar = rawSig[i];
        const mutatedChar = originalChar === 'a' ? 'b' : (originalChar === '0' ? '1' : '0');
        const tamperedSig = rawSig.substring(0, i) + mutatedChar + rawSig.substring(i + 1);
        const tamperedHeader = `sha256=${tamperedSig}`;

        const validMock = gateway.verifyWebhookSignature(signed.rawBody, tamperedHeader);
        const validLive = liveAdapter.verifyWebhookSignature(signed.rawBody, tamperedHeader);

        assert.equal(validMock, false, `MockKaspiPaymentAdapter accepted tampered bit at index ${i}!`);
        assert.equal(validLive, false, `ApiPayKzPaymentAdapter accepted tampered bit at index ${i}!`);
      }
    });

    it('2.2 [PAYLOAD TAMPERING] Modifying amount, status, or injecting unauthorized properties must fail verification', () => {
      const basePayload = {
        invoiceId: 'inv-tamper-audit',
        orderId: 'ord-tamper-audit',
        amount: 25000,
        status: 'SUCCESS',
        transactionId: 'txn-tamper-01',
      };
      const signed = gateway.createSignedWebhook(basePayload);

      // Attack vectors:
      const attackVariations = [
        signed.rawBody.replace('25000', '2500'), // Amount lowered
        signed.rawBody.replace('25000', '0'),    // Zero amount
        signed.rawBody.replace('SUCCESS', 'PAID'), // Status altered
        signed.rawBody.replace('ord-tamper-audit', 'ord-spoofed'), // Order ID switched
        signed.rawBody.slice(0, -1) + ',"injectedAdmin":true}', // Extra JSON key injected
        ' ' + signed.rawBody, // Preceding whitespace
        signed.rawBody + ' ', // Trailing whitespace
      ];

      for (const tamperedBody of attackVariations) {
        assert.equal(
          gateway.verifyWebhookSignature(tamperedBody, signed.signatureHeader),
          false,
          `Tampered body was incorrectly accepted: ${tamperedBody}`
        );
        assert.equal(
          liveAdapter.verifyWebhookSignature(tamperedBody, signed.signatureHeader),
          false,
          `Live adapter accepted tampered body: ${tamperedBody}`
        );
      }
    });

    it('2.3 [SIGNATURE BOUNDARIES] Truncated, malformed, non-hex, and control characters must be rejected', () => {
      const payload = { invoiceId: 'inv-edge', status: 'SUCCESS' };
      const rawBody = JSON.stringify(payload);

      const adversarialHeaders = [
        null,
        undefined,
        '',
        '   ',
        'sha256=',
        'sha256=' + 'a'.repeat(63), // 63 chars (1 too short)
        'sha256=' + 'a'.repeat(65), // 65 chars (1 too long)
        'sha256=' + 'a'.repeat(32), // 32 chars (MD5 length)
        'sha1=' + 'a'.repeat(64),   // Unsupported algo prefix
        'md5=' + 'a'.repeat(64),
        'sha256=GGGG' + 'a'.repeat(60), // Non-hex characters
        'sha256=abcdef\x00' + 'a'.repeat(57), // Injected null byte
        'sha256=' + 'a'.repeat(60) + '\r\n\t ', // Injected control chars
      ];

      for (const badHeader of adversarialHeaders) {
        assert.equal(
          gateway.verifyWebhookSignature(rawBody, badHeader as any),
          false,
          `Should reject malformed header: ${String(badHeader)}`
        );
        assert.equal(
          liveAdapter.verifyWebhookSignature(rawBody, badHeader as any),
          false,
          `Live adapter should reject malformed header: ${String(badHeader)}`
        );
      }
    });

    it('2.4 [TIMING ATTACK SAFETY] Timing safe equal handles differing length buffers safely without unhandled errors', () => {
      // Direct verification of crypto.timingSafeEqual contract
      const validBuffer = crypto.createHmac('sha256', webhookSecret).update('test').digest();
      assert.equal(validBuffer.length, 32);

      // Different length buffers in Node crypto.timingSafeEqual throw if lengths differ
      // Gateway code must catch or prevent this and return false safely
      const shortBuffer = Buffer.alloc(16);
      const longBuffer = Buffer.alloc(48);

      assert.equal(gateway.verifyWebhookSignature('test', 'sha256=' + shortBuffer.toString('hex')), false);
      assert.equal(gateway.verifyWebhookSignature('test', 'sha256=' + longBuffer.toString('hex')), false);
      assert.equal(liveAdapter.verifyWebhookSignature('test', 'sha256=' + shortBuffer.toString('hex')), false);
      assert.equal(liveAdapter.verifyWebhookSignature('test', 'sha256=' + longBuffer.toString('hex')), false);
    });

    it('2.5 [REPLAY ATTACK UNDER HIGH LOAD] 50 concurrent duplicate webhooks must commit inventory deduction exactly ONCE and deduplicate 49', async () => {
      const orderRepo = new InMemoryOrderRepository();
      const invRepo = new InMemoryInventoryRepository();
      const processUseCase = new ProcessKaspiWebhookUseCase(gateway, orderRepo, invRepo);

      const storeId = 'store-almaty-001';
      const variantId = 'var-replay-test';

      // Initial inventory: 10 total, 2 reserved
      const initialInv = new StoreInventory('inv-rep-1', storeId, variantId, 10, 2, 2);
      (invRepo as any).inventory.set(`${storeId}:${variantId}`, initialInv);

      // Create pending order
      const orderId = 'ord-replay-burst-01';
      const phoneVo = KazakhstanPhoneNumber.from('+7 (701) 888-99-00');
      const order = new Order(
        orderId,
        'IT-BURST-01',
        null,
        'Replay Target',
        phoneVo,
        null,
        'pending_payment',
        'pickup',
        storeId,
        null,
        null,
        [
          new OrderItem(
            'item-burst-1',
            orderId,
            variantId,
            { titleRu: 'Test Item', titleKz: 'Тест', sku: 'SKU-BURST', size: 'M', colorRu: 'Черный', colorKz: 'Қара' },
            new Money(5000),
            2,
            storeId
          ),
        ]
      );
      await orderRepo.create(order);

      const payload = {
        invoiceId: 'inv-burst-99',
        orderId,
        status: 'SUCCESS',
        transactionId: 'txn-burst-99',
      };
      const signed = gateway.createSignedWebhook(payload);

      // Fire 50 identical webhook deliveries concurrently via Promise.all
      const attempts = Array.from({ length: 50 }, () =>
        processUseCase.execute({
          rawBody: Buffer.from(signed.rawBody),
          signatureHeader: signed.signatureHeader,
          payload,
        })
      );

      const webhookResults = await Promise.all(attempts);

      const processedCount = webhookResults.filter((r) => r.processed).length;
      const deduplicatedCount = webhookResults.filter((r) => r.deduplicated).length;

      assert.equal(processedCount, 1, `Expected exactly 1 processed event, got ${processedCount}`);
      assert.equal(deduplicatedCount, 49, `Expected exactly 49 deduplicated events, got ${deduplicatedCount}`);

      // Verify order payment state
      const finalOrder = await orderRepo.findById(orderId);
      assert.equal(finalOrder?.status, 'paid');
      assert.equal(finalOrder?.paymentStatus, 'paid');

      // CRITICAL: Stock committed deduction was applied ONCE (quantity reduced by 2, reserved reduced by 2)
      // If deduplication failed, quantity would be reduced 50x (10 - 100 = negative quantity)!
      const finalInv = await invRepo.findByStoreAndVariant(storeId, variantId);
      assert.ok(finalInv);
      assert.equal(finalInv.quantity, 8, `Expected quantity=8 (10 - 2), got ${finalInv.quantity}`);
      assert.equal(finalInv.reservedQuantity, 0, `Expected reservedQuantity=0 (2 - 2), got ${finalInv.reservedQuantity}`);
    });
  });

  // =========================================================================
  // 3. INJECTION VECTORS: XSS, PATH TRAVERSAL, PROTOTYPE POLLUTION, JSON BOMBS
  // =========================================================================
  describe('3. Injection Vectors & Parser Security Hardening', () => {
    it('3.1 [PATH TRAVERSAL] Should strictly reject directory traversal in product & store slug endpoints', async () => {
      const traversalPayloads = [
        '../../etc/passwd',
        '..%2F..%2Fetc%2Fpasswd',
        '..\\..\\windows\\system32\\cmd.exe',
        '..%5C..%5Cwindows%5Csystem32%2Fcalc.exe',
        '%2e%2e%2f%2e%2e%2fconfig.json',
      ];

      for (const payload of traversalPayloads) {
        const resProduct = await client.get(`/api/v1/products/${payload}`);
        assert.ok(
          resProduct.status === 404 || resProduct.status === 400,
          `Expected 404/400 for product slug traversal "${payload}", got ${resProduct.status}`
        );

        const resStore = await client.get(`/api/v1/stores/${payload}`);
        assert.ok(
          resStore.status === 404 || resStore.status === 400,
          `Expected 404/400 for store slug traversal "${payload}", got ${resStore.status}`
        );
      }
    });

    it('3.2 [PROTOTYPE POLLUTION] JSON body containing __proto__ or constructor must NOT pollute Object.prototype', async () => {
      const maliciousPayload = JSON.stringify({
        __proto__: { pollutedKey: 'attacker_value', isAdmin: true },
        constructor: { prototype: { pollProto: true } },
        customerName: 'Hacker Name',
        customerPhone: '+7 (701) 123-45-67',
        fulfillmentType: 'pickup',
        pickupStoreId: 'store-almaty-001',
        items: [{ variantId: 'var-001-w-m', quantity: 1 }],
      });

      const res = await client.request('POST', '/api/v1/orders', maliciousPayload, {
        'Content-Type': 'application/json',
      });

      // Verify Object prototype was not polluted globally
      assert.equal((Object.prototype as any).pollutedKey, undefined);
      assert.equal((Object.prototype as any).isAdmin, undefined);
      assert.equal((Object.prototype as any).pollProto, undefined);
      assert.equal(({} as any).pollutedKey, undefined);
      assert.equal(({} as any).isAdmin, undefined);
    });

    it('3.3 [JSON NESTING BOMB] Deeply nested JSON object (depth > 40) is safely processed without crashing node process', async () => {
      // Build 50-level nested JSON string: {"nest":{"nest":...}}
      let nestedStr = '{"leaf":"value"}';
      for (let i = 0; i < 50; i++) {
        nestedStr = `{"nest":${nestedStr}}`;
      }

      const res = await client.request('POST', '/api/v1/orders', nestedStr, {
        'Content-Type': 'application/json',
      });

      // Server must handle gracefully (400 validation error), not crash or hang
      assert.ok(res.status >= 400 && res.status < 500, `Expected 4xx response, got ${res.status}`);
      assert.ok(res.body.error);
    });

    it('3.4 [XSS PAYLOAD SANITIZATION] HTML/XSS script vectors in order inputs are stored as plain text literals without evaluation', async () => {
      const xssVectors = [
        '<script>alert("xss")</script>',
        '<img src=x onerror=alert(document.cookie)>',
        '<svg/onload=alert(1)>',
        '"><script src="//evil.com/x.js"></script>',
      ];

      for (const vector of xssVectors) {
        const res = await client.post('/api/v1/orders', {
          customerName: vector,
          customerPhone: '+7 (701) 777-66-55',
          customerComment: vector,
          fulfillmentType: 'pickup',
          pickupStoreId: 'store-almaty-001',
          items: [{ variantId: 'var-001-w-m', quantity: 1 }],
        });

        assert.equal(res.status, 201);
        const order = res.body.order || res.body.data || res.body;
        // Text is treated strictly as data string literal
        assert.equal(order.customerName, vector);
      }
    });

    it('3.5 [SQL INJECTION PARAMETERS] Raw SQL metacharacters in search queries must not cause 500 or expose DB structure', async () => {
      const sqliAttacks = [
        "' OR '1'='1",
        "'; DROP TABLE products; --",
        "1 UNION ALL SELECT null, null, null, null--",
        "' OR 1=1; SELECT * FROM user_roles; --",
        "\" OR \"\"=\"",
        "1' AND SLEEP(0.01)--",
      ];

      for (const attack of sqliAttacks) {
        const res = await client.get(`/api/v1/products?search=${encodeURIComponent(attack)}`);
        assert.equal(res.status, 200, `SQLi attack "${attack}" returned unexpected status ${res.status}`);
        assert.ok(Array.isArray(res.body) || Array.isArray(res.body.data));
      }
    });
  });

  // =========================================================================
  // 4. MONETARY INTEGRITY: TIYN INJECTION, CURRENCY TAMPERING & ROUNDING
  // =========================================================================
  describe('4. Monetary Integrity, Tiyn Rejection & Financial Calculations', () => {
    it('4.1 [TIYN REJECTION IN DOMAIN] Money value object strictly rejects fractional tiyns, negative amounts, NaN and Infinity', () => {
      const fractionalTiyns = [
        14990.5,
        14990.01,
        0.99,
        0.00001,
        1e-8,
        -0.5,
        100.3333333,
      ];

      for (const amt of fractionalTiyns) {
        assert.throws(
          () => new Money(amt),
          /must be a whole integer/,
          `Money allowed fractional tiyn: ${amt}`
        );
      }

      const invalidValues = [NaN, Infinity, -Infinity, null, undefined, '14990'];
      for (const val of invalidValues) {
        assert.throws(
          () => new Money(val as any),
          /must be a whole integer/,
          `Money allowed invalid value: ${val}`
        );
      }

      assert.throws(() => new Money(-100), /cannot be negative/);
    });

    it('4.2 [TIYN REJECTION IN KASPI INVOICING] POST /api/payments/kaspi/create rejects fractional tenge with HTTP 422', async () => {
      const invalidInvoiceAmounts = [4990.5, 14990.01, 0.99, 100.1];

      for (const amountKzt of invalidInvoiceAmounts) {
        const res = await client.post('/api/payments/kaspi/create', {
          orderId: 'ord-tiyn-check',
          amountKzt,
          phone: '+77011234567',
          description: 'Tiyn attack',
        });

        assert.equal(
          res.status,
          422,
          `Invoicing endpoint accepted fractional amount ${amountKzt}! Status was ${res.status}`
        );
        assert.equal(res.body.error?.code, 'amount_must_be_whole_tenge');
      }
    });

    it('4.3 [ORDER QUANTITY INTEGRITY] POST /api/v1/orders rejects fractional, negative, zero, and overflowing item quantities', async () => {
      const badQuantities = [1.5, 0.5, -1, 0, 101, 1000];

      for (const qty of badQuantities) {
        const res = await client.post('/api/v1/orders', {
          customerName: 'Quantity Attacker',
          customerPhone: '+7 (701) 555-44-33',
          fulfillmentType: 'pickup',
          pickupStoreId: 'store-almaty-001',
          items: [{ variantId: 'var-001-w-m', quantity: qty }],
        });

        assert.equal(
          res.status,
          400,
          `Order creation accepted invalid quantity ${qty}! Status was ${res.status}`
        );
      }
    });

    it('4.4 [DISCOUNT FLOOR INVARIANT] Discount exceeding subtotal must clamp total to 0 ₸ and never negative tenge', () => {
      const subtotal = new Money(5000);
      const discount = new Money(12000); // 12 000 ₸ discount on 5 000 ₸ subtotal
      const deliveryFee = new Money(0);  // Store pickup

      const grandTotalAmount = Math.max(0, subtotal.amountKzt - discount.amountKzt + deliveryFee.amountKzt);
      const grandTotal = new Money(grandTotalAmount);

      assert.equal(grandTotal.amountKzt, 0);
      assert.equal(grandTotal.format(), '0\u00A0₸');
    });

    it('4.5 [FLOATING POINT PRECISION INVARIANCE] Multi-item addition and multiplication never suffer IEEE-754 precision drift', () => {
      // Classic JS float bug: 0.1 + 0.2 !== 0.3
      // In retail KZT, prices are always integer tenge
      const unitPrice = new Money(4990);
      const qty = 7;
      const lineTotal = unitPrice.multiply(qty);

      assert.equal(lineTotal.amountKzt, 34930);
      assert.equal(Number.isInteger(lineTotal.amountKzt), true);

      // Multi-line basket test: 100 items of 333 ₸
      let total = Money.zero();
      for (let i = 0; i < 100; i++) {
        total = total.add(new Money(333));
      }
      assert.equal(total.amountKzt, 33300);
      assert.equal(total.format(), '33\u00A0300\u00A0₸');
    });

    it('4.6 [CURRENCY FORMATTING INTEGRITY] formatKZT enforces non-breaking space and national tenge symbol', () => {
      assert.equal(formatKZT(14990), '14\u00A0990\u00A0₸');
      assert.equal(formatKZT(1000000), '1\u00A0000\u00A0000\u00A0₸');
      assert.equal(formatKZT(0), '0\u00A0₸');
      assert.equal(formatKZT(null), '0\u00A0₸');
      assert.equal(formatKZT(undefined), '0\u00A0₸');

      // Rounding retail behavior
      assert.equal(formatKZT(4990.4), '4\u00A0990\u00A0₸');
      assert.equal(formatKZT(4990.6), '4\u00A0991\u00A0₸');

      // Parsing verification
      assert.equal(parseKZT('14\u00A0990\u00A0₸'), 14990);
      assert.equal(parseKZT('1 000 000 ₸'), 1000000);
    });
  });

  // =========================================================================
  // 5. EMPIRICAL ADVERSARIAL STRESS: CUSTOMER ATTRIBUTION, LATE WEBHOOK RACE, HTTP HMAC ORACLE
  // =========================================================================
  describe('5. Adversarial Hardening & Concurrency Races (M7-R2)', () => {
    it('5.1 [SPOOFING CONCURRENCY] 50 concurrent unauthenticated order creations with forged body.userId ("usr-bob", "usr-alice", "admin-1") must 100% have userId === null and 0% leak into Bob or Alice order list', async () => {
      // 1. Create baseline legitimate orders for Alice and Bob
      const aliceAuth = getAuthHeader('customerAlice');
      const bobAuth = getAuthHeader('customerBob');

      const resAliceLegit = await client.post(
        '/api/v1/orders',
        {
          customerName: 'Alice Legit',
          customerPhone: '+7 (701) 111-22-33',
          fulfillmentType: 'pickup',
          pickupStoreId: 'store-almaty-001',
          items: [{ variantId: 'var-001-w-l', quantity: 1 }],
        },
        aliceAuth
      );
      assert.equal(resAliceLegit.status, 201);
      const aliceLegitOrderId = (resAliceLegit.body.order || resAliceLegit.body.data || resAliceLegit.body).id;

      const resBobLegit = await client.post(
        '/api/v1/orders',
        {
          customerName: 'Bob Legit',
          customerPhone: '+7 (702) 222-33-44',
          fulfillmentType: 'pickup',
          pickupStoreId: 'store-almaty-001',
          items: [{ variantId: 'var-001-w-l', quantity: 1 }],
        },
        bobAuth
      );
      assert.equal(resBobLegit.status, 201);
      const bobLegitOrderId = (resBobLegit.body.order || resBobLegit.body.data || resBobLegit.body).id;

      // 2. Prepare 50 concurrent unauthenticated spoofing attacks
      // Cycle through 13 available variants in store-almaty-001 so every variant has sufficient stock
      const storeVariants = [
        'var-001-w-m', 'var-001-w-l', 'var-001-w-s', 'var-001-b-m', 'var-001-b-l',
        'var-002-bg-s', 'var-002-bg-m', 'var-003-bl-l', 'var-003-bl-xl',
        'var-004-pk-s', 'var-004-pk-m', 'var-005-gr-m', 'var-005-gr-l',
      ];
      const targetUserIds = ['usr-bob', 'usr-alice', 'admin-1'];

      const attackPayloads = Array.from({ length: 50 }, (_, i) => ({
        userId: targetUserIds[i % targetUserIds.length],
        customerName: `Spoof Attacker ${i + 1}`,
        customerPhone: `+7 (701) ${String(300 + i).padStart(3, '0')}-00-00`,
        fulfillmentType: 'pickup' as const,
        pickupStoreId: 'store-almaty-001',
        items: [{ variantId: storeVariants[i % storeVariants.length], quantity: 1 }],
      }));

      // Fire all 50 unauthenticated requests simultaneously
      const results = await Promise.all(
        attackPayloads.map((payload) => client.post('/api/v1/orders', payload))
      );

      // Verify 100% of the 50 orders succeeded with 201 and have userId === null
      const createdOrderIds: string[] = [];
      for (let i = 0; i < results.length; i++) {
        const res = results[i];
        assert.equal(res.status, 201, `Order ${i + 1} failed with status ${res.status}: ${JSON.stringify(res.body)}`);
        const order = res.body.order || res.body.data || res.body;
        assert.ok(order.id, `Order ${i + 1} did not return an ID`);
        createdOrderIds.push(order.id);

        // INVARIANT 1: userId MUST be strictly null (OWASP API1/API2 prevention)
        assert.strictEqual(
          order.userId,
          null,
          `CRITICAL VULNERABILITY: Attack payload ${i + 1} spoofed userId as '${order.userId}' instead of null!`
        );
      }

      assert.equal(createdOrderIds.length, 50, 'All 50 unauthenticated orders must be created');

      // 3. Verify Bob's private order list contains ONLY his legitimate order
      const bobOrdersRes = await client.get('/api/v1/orders', bobAuth);
      assert.equal(bobOrdersRes.status, 200);
      const bobOrders = Array.isArray(bobOrdersRes.body)
        ? bobOrdersRes.body
        : (bobOrdersRes.body.data || bobOrdersRes.body.orders || []);

      // Verify Bob's list has his legitimate order
      const bobLegitFound = bobOrders.find((o: any) => o.id === bobLegitOrderId);
      assert.ok(bobLegitFound, "Bob's legitimate order must be present in Bob's orders");

      // Verify zero of the 50 spoofed orders leaked into Bob's list
      for (const spoofedId of createdOrderIds) {
        const leakFound = bobOrders.find((o: any) => o.id === spoofedId);
        assert.strictEqual(
          leakFound,
          undefined,
          `CRITICAL PRIVACY LEAK: Unauthenticated order ${spoofedId} leaked into Bob's order history!`
        );
      }

      // 4. Verify Alice's private order list contains ONLY her legitimate order
      const aliceOrdersRes = await client.get('/api/v1/orders', aliceAuth);
      assert.equal(aliceOrdersRes.status, 200);
      const aliceOrders = Array.isArray(aliceOrdersRes.body)
        ? aliceOrdersRes.body
        : (aliceOrdersRes.body.data || aliceOrdersRes.body.orders || []);

      const aliceLegitFound = aliceOrders.find((o: any) => o.id === aliceLegitOrderId);
      assert.ok(aliceLegitFound, "Alice's legitimate order must be present in Alice's orders");

      for (const spoofedId of createdOrderIds) {
        const leakFound = aliceOrders.find((o: any) => o.id === spoofedId);
        assert.strictEqual(
          leakFound,
          undefined,
          `CRITICAL PRIVACY LEAK: Unauthenticated order ${spoofedId} leaked into Alice's order history!`
        );
      }

      // 5. Verify direct IDOR access via GET /api/v1/orders/:id returns 403 Forbidden
      const probeOrderId = createdOrderIds[0];
      const idorBobRes = await client.get(`/api/v1/orders/${probeOrderId}`, bobAuth);
      assert.equal(idorBobRes.status, 403, `Expected 403 Forbidden for customer Bob accessing anonymous order, got ${idorBobRes.status}`);

      const idorAliceRes = await client.get(`/api/v1/orders/${probeOrderId}`, aliceAuth);
      assert.equal(idorAliceRes.status, 403, `Expected 403 Forbidden for customer Alice accessing anonymous order, got ${idorAliceRes.status}`);
    });

    it('5.2 [CONCURRENT LATE CANCELLATION RACE] Webhook late cancellation race condition: late CANCELLED webhook arriving concurrently with Customer B reservation must NOT revert Order A paid status and must NOT corrupt inventory', async () => {
      const orderRepo = new InMemoryOrderRepository();
      const invRepo = new InMemoryInventoryRepository();
      const storeRepo = new InMemoryStoreRepository();
      const productRepo = new InMemoryProductRepository();
      const gateway = new MockKaspiPaymentAdapter('race_test_secret_123');
      const processUseCase = new ProcessKaspiWebhookUseCase(gateway, orderRepo, invRepo);
      const createOrderUseCase = new CreateOrderUseCase(orderRepo, productRepo, invRepo, storeRepo);

      const storeId = 'store-almaty-001';
      const variantId = 'var-003-bl-l';

      // 1. Seed scarce inventory pool: total 3 units, 0 reserved, 3 available
      const scarceInv = new StoreInventory('inv-race-01', storeId, variantId, 3, 0, 1);
      (invRepo as any).inventory.set(`${storeId}:${variantId}`, scarceInv);

      // Customer A reserves 1 unit
      const resOrderA = await createOrderUseCase.execute({
        customerName: 'Customer A',
        customerPhone: '+7 (701) 111-22-33',
        fulfillmentType: 'pickup',
        pickupStoreId: storeId,
        items: [{ variantId, quantity: 1, reservedFromStoreId: storeId }],
      });
      assert.equal(resOrderA.success, true);
      const orderA = resOrderA.data;

      // Order A is paid via Kaspi webhook SUCCESS
      const successPayload = {
        invoiceId: 'inv-orderA-success',
        orderId: orderA.id,
        amount: 4990,
        status: 'SUCCESS',
        transactionId: 'txn-orderA-success',
      };
      const signedSuccess = gateway.createSignedWebhook(successPayload);
      const resSuccess = await processUseCase.execute({
        rawBody: Buffer.from(signedSuccess.rawBody),
        signatureHeader: signedSuccess.signatureHeader,
        payload: successPayload,
      });
      assert.equal(resSuccess.success, true);

      // Verify Order A is paid: stock committed (quantity=2, reserved=0, available=2)
      const paidOrderA = await orderRepo.findById(orderA.id);
      assert.equal(paidOrderA?.status, 'paid');
      assert.equal(paidOrderA?.paymentStatus, 'paid');

      const invAfterPay = await invRepo.findByStoreAndVariant(storeId, variantId);
      assert.equal(invAfterPay?.quantity, 2);
      assert.equal(invAfterPay?.reservedQuantity, 0);
      assert.equal(invAfterPay?.availableQuantity, 2);

      // 2. CONCURRENCY RACE:
      // Simultaneously:
      //   - Customer B reserves the remaining 2 scarce units
      //   - Stale/late CANCELLED webhook for Order A arrives concurrently
      //   - Customer C attempts to reserve 1 unit (competing for scarce stock)
      const lateCancelPayload = {
        invoiceId: 'inv-orderA-late-cancel',
        orderId: orderA.id,
        amount: 4990,
        status: 'CANCELLED',
        transactionId: 'txn-orderA-late-cancel',
      };
      const signedCancel = gateway.createSignedWebhook(lateCancelPayload);

      const [resCustomerB, resLateCancel, resCustomerC] = await Promise.all([
        createOrderUseCase.execute({
          customerName: 'Customer B',
          customerPhone: '+7 (701) 222-33-44',
          fulfillmentType: 'pickup',
          pickupStoreId: storeId,
          items: [{ variantId, quantity: 2, reservedFromStoreId: storeId }],
        }),
        processUseCase.execute({
          rawBody: Buffer.from(signedCancel.rawBody),
          signatureHeader: signedCancel.signatureHeader,
          payload: lateCancelPayload,
        }),
        createOrderUseCase.execute({
          customerName: 'Customer C',
          customerPhone: '+7 (701) 333-44-55',
          fulfillmentType: 'pickup',
          pickupStoreId: storeId,
          items: [{ variantId, quantity: 1, reservedFromStoreId: storeId }],
        }),
      ]);

      // INVARIANT 1: Late CANCELLED webhook MUST be safely ignored
      assert.equal(resLateCancel.success, true);
      assert.equal(resLateCancel.ignored, true);
      assert.equal(resLateCancel.processed, false);

      // INVARIANT 2: Order A status must REMAIN 'paid'
      const finalOrderA = await orderRepo.findById(orderA.id);
      assert.equal(finalOrderA?.status, 'paid', 'Order A status must not be reverted by late cancellation');
      assert.equal(finalOrderA?.paymentStatus, 'paid');

      // INVARIANT 3: Customer B reservation of the 2 remaining units is preserved
      assert.equal(resCustomerB.success, true, 'Customer B reservation must succeed');

      // INVARIANT 4: Customer C must be REJECTED (stock was NOT illegally released to allow overselling)
      assert.equal(resCustomerC.success, false, 'Customer C must be rejected due to insufficient stock');
      if (!resCustomerC.success) {
        assert.equal(resCustomerC.error.code, 'INSUFFICIENT_STOCK');
      }

      // INVARIANT 5: Repository state must remain perfectly conserved
      const finalInv = await invRepo.findByStoreAndVariant(storeId, variantId);
      assert.ok(finalInv);
      assert.equal(finalInv.quantity, 2, 'Total quantity must remain 2');
      assert.equal(finalInv.reservedQuantity, 2, 'Reserved quantity must be exactly 2 (Customer B)');
      assert.equal(finalInv.availableQuantity, 0, 'Available quantity must be exactly 0 (no oversell)');
    });

    it('5.3 [64-BIT-FLIP HTTP ORACLE] Every single bit-flip (0 to 63) in HMAC signature submitted to POST /api/payments/kaspi/callback strictly returns HTTP 401 INVALID_SIGNATURE', async () => {
      const webhookSecret = process.env.KASPI_WEBHOOK_SECRET || 'test_kaspi_webhook_secret_key_12345';
      const payload = {
        invoiceId: 'inv-http-oracle-01',
        orderId: 'ord-http-oracle-01',
        amount: 4990,
        status: 'SUCCESS',
        transactionId: 'txn-http-oracle-01',
      };
      const rawBody = JSON.stringify(payload);
      const validSig = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
      assert.equal(validSig.length, 64, 'Valid HMAC signature must be 64 hex characters');

      // First verify that the untampered signature succeeds or is processed
      const resUntampered = await client.post('/api/payments/kaspi/callback', payload, {
        'x-webhook-signature': `sha256=${validSig}`,
      });
      assert.equal(resUntampered.status, 200, `Untampered webhook failed with status ${resUntampered.status}`);

      // Now iterate through all 64 hex characters (index 0 to 63), flip each one, and verify 401
      for (let i = 0; i < 64; i++) {
        const originalChar = validSig[i];
        const mutatedChar = originalChar === 'a' ? 'b' : (originalChar === '0' ? '1' : '0');
        const tamperedSig = validSig.substring(0, i) + mutatedChar + validSig.substring(i + 1);

        const res = await client.post('/api/payments/kaspi/callback', payload, {
          'x-webhook-signature': `sha256=${tamperedSig}`,
        });

        assert.equal(
          res.status,
          401,
          `HTTP endpoint accepted tampered HMAC signature at bit index ${i}! Status was ${res.status}`
        );
        assert.equal(
          res.body.error?.code,
          'INVALID_SIGNATURE',
          `Expected INVALID_SIGNATURE error code at bit index ${i}, got: ${res.body.error?.code}`
        );
      }
    });
  });
});

