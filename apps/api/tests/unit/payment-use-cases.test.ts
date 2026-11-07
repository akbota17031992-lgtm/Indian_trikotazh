import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {
  MockKaspiPaymentAdapter,
  PaymentGatewayFactory,
  ApiPayKzPaymentAdapter,
} from '../../dist/adapters/gateways/kaspi/index.js';
import { InMemoryOrderRepository } from '../../dist/adapters/repositories/in-memory/in-memory-order.repository.js';
import { InMemoryInventoryRepository } from '../../dist/adapters/repositories/in-memory/in-memory-inventory.repository.js';
import {
  CreateKaspiInvoiceUseCase,
  ProcessKaspiWebhookUseCase,
} from '../../dist/use-cases/payments/index.js';
import {
  Order,
  OrderItem,
  Money,
  KazakhstanPhoneNumber,
  StoreInventory,
} from '../../dist/domain/index.js';
import { AppError } from '../../dist/infrastructure/http/middlewares/error-handler.middleware.js';



describe('Payment Use Cases & Kaspi Gateways (Clean Architecture)', () => {
  const webhookSecret = 'test_secret_for_unit_testing_12345';
  let gateway: MockKaspiPaymentAdapter;
  let orderRepo: InMemoryOrderRepository;
  let inventoryRepo: InMemoryInventoryRepository;
  let createInvoiceUseCase: CreateKaspiInvoiceUseCase;
  let processWebhookUseCase: ProcessKaspiWebhookUseCase;

  beforeEach(() => {
    gateway = new MockKaspiPaymentAdapter(webhookSecret);
    orderRepo = new InMemoryOrderRepository();
    inventoryRepo = new InMemoryInventoryRepository();
    createInvoiceUseCase = new CreateKaspiInvoiceUseCase(gateway, orderRepo);
    processWebhookUseCase = new ProcessKaspiWebhookUseCase(gateway, orderRepo, inventoryRepo);
  });

  describe('CreateKaspiInvoiceUseCase', () => {
    it('1.1 should create a valid dynamic QR invoice with 5-minute expiry', async () => {
      const result = await createInvoiceUseCase.execute({
        orderId: 'ord-test-qr-1',
        amountKzt: 14990,
        paymentMode: 'QR',
        description: 'Оплата заказа №1001 в India Trikotaj',
        returnUrl: 'https://indiatrikotaj.kz/orders/ord-test-qr-1',
      });

      assert.equal(result.statusCode, 201);
      assert.equal(result.orderId, 'ord-test-qr-1');
      assert.equal(result.status, 'pending');
      assert.equal(result.paymentMode, 'QR');
      assert.equal(result.isMock, true);
      assert.ok(result.qrTokenUrl?.includes('kaspi.kz/pay?qr='));
      assert.ok(result.qrImageUrl?.includes('.png'));

      const expiryDiff = new Date(result.expiresAt).getTime() - Date.now();
      assert.ok(expiryDiff > 4 * 60 * 1000 && expiryDiff <= 5 * 60 * 1000 + 1000);
    });

    it('1.2 should create a valid phone push invoice with 15-minute expiry', async () => {
      const result = await createInvoiceUseCase.execute({
        orderId: 'ord-test-push-1',
        amountKzt: 4990,
        phone: '+7 (701) 234-56-78',
        paymentMode: 'KaspiGold',
        description: 'Счет на оплату Kaspi Gold',
      });

      assert.equal(result.statusCode, 201);
      assert.equal(result.orderId, 'ord-test-push-1');
      assert.equal(result.status, 'processing');
      assert.equal(result.paymentMode, 'KaspiGold');
      assert.equal(result.phone, '+7 (701) 234-56-78');

      const expiryDiff = new Date(result.expiresAt).getTime() - Date.now();
      assert.ok(expiryDiff > 14 * 60 * 1000 && expiryDiff <= 15 * 60 * 1000 + 1000);
    });

    it('1.3 should reject fractional / decimal tenge amounts with 422 amount_must_be_whole_tenge', async () => {
      await assert.rejects(
        async () => {
          await createInvoiceUseCase.execute({
            orderId: 'ord-frac-1',
            amountKzt: 4990.5,
            phone: '+77011234567',
            paymentMode: 'QR',
            description: 'Fractional amount',
          });
        },
        (err: AppError) => {
          assert.equal(err.statusCode, 422);
          assert.equal(err.code, 'amount_must_be_whole_tenge');
          return true;
        }
      );
    });

    it('1.4 should reject non-positive amounts with 422 amount_must_be_whole_tenge', async () => {
      for (const invalidAmount of [0, -100, -0.01]) {
        await assert.rejects(
          async () => {
            await createInvoiceUseCase.execute({
              orderId: 'ord-zero',
              amountKzt: invalidAmount,
              paymentMode: 'QR',
              description: 'Zero/negative',
            });
          },
          (err: AppError) => {
            assert.equal(err.statusCode, 422);
            assert.equal(err.code, 'amount_must_be_whole_tenge');
            return true;
          }
        );
      }
    });

    it('1.5 should enforce description limits: QR allows 100 chars but rejects 101 chars', async () => {
      const exactly100 = 'A'.repeat(100);
      const res100 = await createInvoiceUseCase.execute({
        orderId: 'ord-desc-100',
        amountKzt: 5000,
        paymentMode: 'QR',
        description: exactly100,
      });
      assert.equal(res100.statusCode, 201);

      const tooLong101 = 'A'.repeat(101);
      await assert.rejects(
        async () => {
          await createInvoiceUseCase.execute({
            orderId: 'ord-desc-101',
            amountKzt: 5000,
            paymentMode: 'QR',
            description: tooLong101,
          });
        },
        (err: AppError) => {
          assert.equal(err.statusCode, 422);
          assert.equal(err.code, 'description_too_long');
          return true;
        }
      );
    });

    it('1.6 should enforce description limits: Push allows 60 chars but rejects 61 chars', async () => {
      const exactly60 = '123456789012345678901234567890123456789012345678901234567890';
      assert.equal(exactly60.length, 60);

      const res60 = await createInvoiceUseCase.execute({
        orderId: 'ord-desc-60',
        amountKzt: 5000,
        paymentMode: 'KaspiGold',
        phone: '+77011234567',
        description: exactly60,
      });
      assert.equal(res60.statusCode, 201);

      const tooLong61 = exactly60 + '!';
      await assert.rejects(
        async () => {
          await createInvoiceUseCase.execute({
            orderId: 'ord-desc-61',
            amountKzt: 5000,
            paymentMode: 'KaspiGold',
            phone: '+77011234567',
            description: tooLong61,
          });
        },
        (err: AppError) => {
          assert.equal(err.statusCode, 422);
          assert.equal(err.code, 'description_too_long');
          return true;
        }
      );
    });

    it('1.7 should validate Kazakhstan phone numbers and reject foreign/invalid phones', async () => {
      // Valid phones
      const validCases = ['+7 (701) 987-65-43', '87771234567', '+77051112233'];
      for (const ph of validCases) {
        const res = await createInvoiceUseCase.execute({
          orderId: `ord-phone-${ph.replace(/\D/g, '')}`,
          amountKzt: 1000,
          paymentMode: 'KaspiRed',
          phone: ph,
          description: 'Valid phone test',
        });
        assert.equal(res.statusCode, 201);
      }

      // Invalid phones
      const invalidCases = ['+1 (415) 555-2671', '+7 (495) 123-45-67', 'not-a-phone', '12345'];
      for (const badPh of invalidCases) {
        await assert.rejects(
          async () => {
            await createInvoiceUseCase.execute({
              orderId: 'ord-bad-phone',
              amountKzt: 1000,
              paymentMode: 'KaspiRed',
              phone: badPh,
              description: 'Bad phone test',
            });
          },
          (err: AppError) => {
            assert.equal(err.statusCode, 422);
            assert.equal(err.code, 'invalid_kazakhstan_phone');
            return true;
          }
        );
      }
    });

    it('1.8 should reject missing phone in push mode with 422 invalid_kazakhstan_phone', async () => {
      await assert.rejects(
        async () => {
          await createInvoiceUseCase.execute({
            orderId: 'ord-no-phone',
            amountKzt: 1000,
            paymentMode: 'KaspiRed',
            description: 'No phone push',
          });
        },
        (err: AppError) => {
          assert.equal(err.statusCode, 422);
          assert.equal(err.code, 'invalid_kazakhstan_phone');
          return true;
        }
      );
    });

    it('1.9 should reject duplicate idempotency keys with 409 duplicate_idempotency_key', async () => {
      const idempotencyKey = 'unique-key-abc-123';
      const first = await createInvoiceUseCase.execute({
        orderId: 'ord-idem-1',
        amountKzt: 3000,
        paymentMode: 'QR',
        description: 'First call',
        idempotencyKey,
      });
      assert.equal(first.statusCode, 201);

      await assert.rejects(
        async () => {
          await createInvoiceUseCase.execute({
            orderId: 'ord-idem-2',
            amountKzt: 3000,
            paymentMode: 'QR',
            description: 'Second call with same key',
            idempotencyKey,
          });
        },
        (err: AppError) => {
          assert.equal(err.statusCode, 409);
          assert.equal(err.code, 'duplicate_idempotency_key');
          return true;
        }
      );
    });

    it('1.10 should update order with kaspiInvoiceId and pending status when order exists', async () => {
      const phoneVo = KazakhstanPhoneNumber.from('+7 (701) 111-22-33');
      const order = new Order(
        'ord-real-001',
        'IT-REAL-001',
        null,
        'Ерлан',
        phoneVo,
        null,
        'pending',
        'pickup',
        'store-almaty-001'
      );
      await orderRepo.create(order);

      const res = await createInvoiceUseCase.execute({
        orderId: 'ord-real-001',
        amountKzt: 14990,
        paymentMode: 'QR',
        description: 'Real order invoice',
      });

      const updated = await orderRepo.findById('ord-real-001');
      assert.ok(updated);
      assert.equal(updated.kaspiInvoiceId, res.providerInvoiceId);
      assert.equal(updated.status, 'pending_payment');
    });

    it('1.11 should reject invoice creation if order is already paid with 409 ORDER_ALREADY_PAID', async () => {
      const phoneVo = KazakhstanPhoneNumber.from('+7 (701) 111-22-33');
      const paidOrder = new Order(
        'ord-already-paid',
        'IT-PAID-001',
        null,
        'Алия',
        phoneVo,
        null,
        'paid',
        'pickup',
        'store-almaty-001'
      );
      paidOrder.paymentStatus = 'paid';
      await orderRepo.create(paidOrder);

      await assert.rejects(
        async () => {
          await createInvoiceUseCase.execute({
            orderId: 'ord-already-paid',
            amountKzt: 10000,
            paymentMode: 'QR',
            description: 'Try double pay',
          });
        },
        (err: AppError) => {
          assert.equal(err.statusCode, 409);
          assert.equal(err.code, 'ORDER_ALREADY_PAID');
          return true;
        }
      );
    });
  });

  describe('ProcessKaspiWebhookUseCase', () => {
    it('2.1 should reject missing X-Webhook-Signature header with 401 MISSING_SIGNATURE', async () => {
      await assert.rejects(
        async () => {
          await processWebhookUseCase.execute({
            rawBody: Buffer.from('{"invoiceId":"inv-1"}'),
            signatureHeader: undefined,
            payload: { invoiceId: 'inv-1' },
          });
        },
        (err: AppError) => {
          assert.equal(err.statusCode, 401);
          assert.equal(err.code, 'MISSING_SIGNATURE');
          return true;
        }
      );
    });

    it('2.2 should reject empty or whitespace-only signature header with 401 MISSING_SIGNATURE', async () => {
      await assert.rejects(
        async () => {
          await processWebhookUseCase.execute({
            rawBody: Buffer.from('{"invoiceId":"inv-1"}'),
            signatureHeader: '   ',
            payload: { invoiceId: 'inv-1' },
          });
        },
        (err: AppError) => {
          assert.equal(err.statusCode, 401);
          assert.equal(err.code, 'MISSING_SIGNATURE');
          return true;
        }
      );
    });

    it('2.3 should reject empty or null rawBody with 401 INVALID_SIGNATURE', async () => {
      await assert.rejects(
        async () => {
          await processWebhookUseCase.execute({
            rawBody: Buffer.alloc(0),
            signatureHeader: 'sha256=abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
            payload: {},
          });
        },
        (err: AppError) => {
          assert.equal(err.statusCode, 401);
          assert.equal(err.code, 'INVALID_SIGNATURE');
          return true;
        }
      );
    });

    it('2.4 should successfully verify authentic HMAC-SHA256 signature', async () => {
      const payload = {
        invoiceId: 'inv-valid-1',
        orderId: 'ord-valid-1',
        amount: 8990,
        status: 'SUCCESS',
        transactionId: 'txn-12345',
        paymentMethod: 'KASPI_GOLD',
      };
      const signed = gateway.createSignedWebhook(payload);

      const result = await processWebhookUseCase.execute({
        rawBody: Buffer.from(signed.rawBody),
        signatureHeader: signed.signatureHeader,
        payload,
      });

      assert.equal(result.success, true);
      assert.equal(result.processed, true);
    });

    it('2.5 should verify signature regardless of hex case (uppercase hex header matches lowercase digest)', async () => {
      const payload = {
        invoiceId: 'inv-case-1',
        orderId: 'ord-case-1',
        amount: 4990,
        status: 'SUCCESS',
        transactionId: 'txn-case-1',
      };
      const signed = gateway.createSignedWebhook(payload);
      const upperCaseSig = 'sha256=' + signed.signatureHeader.slice(7).toUpperCase();

      const result = await processWebhookUseCase.execute({
        rawBody: Buffer.from(signed.rawBody),
        signatureHeader: upperCaseSig,
        payload,
      });

      assert.equal(result.success, true);
      assert.equal(result.processed, true);
    });

    it('2.6 should detect single-bit flip anywhere in HMAC signature with 401 INVALID_SIGNATURE', async () => {
      const payload = {
        invoiceId: 'inv-flip-1',
        orderId: 'ord-flip-1',
        amount: 14990,
        status: 'SUCCESS',
        transactionId: 'txn-flip-1',
      };
      const signed = gateway.createSignedWebhook(payload);
      const rawHex = signed.signatureHeader.slice(7);
      const lastChar = rawHex.slice(-1);
      const flipped = lastChar === 'a' ? 'b' : 'a';
      const tamperedHeader = `sha256=${rawHex.slice(0, -1)}${flipped}`;

      await assert.rejects(
        async () => {
          await processWebhookUseCase.execute({
            rawBody: Buffer.from(signed.rawBody),
            signatureHeader: tamperedHeader,
            payload,
          });
        },
        (err: AppError) => {
          assert.equal(err.statusCode, 401);
          assert.equal(err.code, 'INVALID_SIGNATURE');
          return true;
        }
      );
    });

    it('2.7 should detect 1-byte alteration in body after signature computation', async () => {
      const payload = {
        invoiceId: 'inv-tamper-1',
        orderId: 'ord-tamper-1',
        amount: 4990,
        status: 'SUCCESS',
      };
      const signed = gateway.createSignedWebhook(payload);
      const tamperedRawBody = signed.rawBody.replace('4990', '4991');

      await assert.rejects(
        async () => {
          await processWebhookUseCase.execute({
            rawBody: Buffer.from(tamperedRawBody),
            signatureHeader: signed.signatureHeader,
            payload,
          });
        },
        (err: AppError) => {
          assert.equal(err.statusCode, 401);
          assert.equal(err.code, 'INVALID_SIGNATURE');
          return true;
        }
      );
    });

    it('2.8 should reject webhook signature signed with wrong merchant secret', async () => {
      const payload = {
        invoiceId: 'inv-secret-1',
        orderId: 'ord-secret-1',
        amount: 5000,
        status: 'SUCCESS',
      };
      const signedWrongSecret = gateway.createSignedWebhook(payload, 'attacker_secret_key_999');

      await assert.rejects(
        async () => {
          await processWebhookUseCase.execute({
            rawBody: Buffer.from(signedWrongSecret.rawBody),
            signatureHeader: signedWrongSecret.signatureHeader,
            payload,
          });
        },
        (err: AppError) => {
          assert.equal(err.statusCode, 401);
          assert.equal(err.code, 'INVALID_SIGNATURE');
          return true;
        }
      );
    });

    it('2.9 should reject non-hex characters or null-byte injections in signature header', async () => {
      const payload = { invoiceId: 'inv-null-1', status: 'SUCCESS' };
      const rawBody = JSON.stringify(payload);

      const invalidHeaders = [
        'sha256=NOT_HEX_CHARS_ZZZZ',
        'sha256=' + 'a'.repeat(63), // 63 chars instead of 64
        'sha256=' + 'a'.repeat(65), // 65 chars
        'sha256=\x00'.repeat(32),
      ];

      for (const badHeader of invalidHeaders) {
        await assert.rejects(
          async () => {
            await processWebhookUseCase.execute({
              rawBody: Buffer.from(rawBody),
              signatureHeader: badHeader,
              payload,
            });
          },
          (err: AppError) => {
            assert.equal(err.statusCode, 401);
            assert.equal(err.code, 'INVALID_SIGNATURE');
            return true;
          }
        );
      }
    });

    it('2.10 should provide idempotent deduplication for repeated webhook callbacks', async () => {
      const payload = {
        invoiceId: 'inv-dedupe-1',
        orderId: 'ord-dedupe-1',
        amount: 7990,
        status: 'SUCCESS',
        transactionId: 'txn-dedupe-1',
      };
      const signed = gateway.createSignedWebhook(payload);

      const first = await processWebhookUseCase.execute({
        rawBody: Buffer.from(signed.rawBody),
        signatureHeader: signed.signatureHeader,
        payload,
      });
      assert.equal(first.success, true);
      assert.equal(first.processed, true);
      assert.equal(first.deduplicated, undefined);

      const second = await processWebhookUseCase.execute({
        rawBody: Buffer.from(signed.rawBody),
        signatureHeader: signed.signatureHeader,
        payload,
      });
      assert.equal(second.success, true);
      assert.equal(second.deduplicated, true);
    });

    it('2.11 should update order status to paid and commit inventory deduction on SUCCESS webhook', async () => {
      const storeId = 'store-almaty-001';
      const variantId = 'var-001-w-m';

      const invInitial = await inventoryRepo.findByStoreAndVariant(storeId, variantId);
      const initialReserved = invInitial?.reservedQuantity ?? 0;
      const initialQty = invInitial?.quantity ?? 0;

      // Reserve stock in inventory
      await inventoryRepo.reserveStock(storeId, variantId, 3);
      const invBefore = await inventoryRepo.findByStoreAndVariant(storeId, variantId);
      assert.equal(invBefore?.reservedQuantity, initialReserved + 3);

      // Create order with order items
      const phoneVo = KazakhstanPhoneNumber.from('+7 (701) 999-88-77');
      const order = new Order(
        'ord-sync-paid',
        'IT-SYNC-01',
        null,
        'Бахытжан',
        phoneVo,
        null,
        'pending',
        'pickup',
        storeId,
        null,
        null,
        [
          new OrderItem(
            'item-01',
            'ord-sync-paid',
            variantId,
            { titleRu: 'T-shirt', titleKz: 'Футболка', sku: 'SKU-01', size: 'M', colorRu: 'Белый', colorKz: 'Ақ' },
            new Money(4990),
            3,
            storeId
          ),
        ]
      );
      await orderRepo.create(order);

      const payload = {
        invoiceId: 'inv-sync-1',
        orderId: 'ord-sync-paid',
        amount: 14970,
        status: 'SUCCESS',
        transactionId: 'txn-kaspi-success-01',
      };
      const signed = gateway.createSignedWebhook(payload);

      const res = await processWebhookUseCase.execute({
        rawBody: Buffer.from(signed.rawBody),
        signatureHeader: signed.signatureHeader,
        payload,
      });
      assert.equal(res.success, true);

      // Verify order updated
      const updatedOrder = await orderRepo.findById('ord-sync-paid');
      assert.equal(updatedOrder?.status, 'paid');
      assert.equal(updatedOrder?.paymentStatus, 'paid');
      assert.equal(updatedOrder?.kaspiTransactionId, 'txn-kaspi-success-01');

      // Verify inventory committed deduction: reserved decreases by 3, quantity decreases by 3
      const invAfter = await inventoryRepo.findByStoreAndVariant(storeId, variantId);
      assert.equal(invAfter?.reservedQuantity, initialReserved);
      assert.equal(invAfter?.quantity, initialQty - 3);
    });

    it('2.12 should update order status to cancelled and release stock on FAILED or CANCELLED webhook', async () => {
      const storeId = 'store-almaty-001';
      const variantId = 'var-001-w-m';

      const invInitial = await inventoryRepo.findByStoreAndVariant(storeId, variantId);
      const initialReserved = invInitial?.reservedQuantity ?? 0;
      const initialQty = invInitial?.quantity ?? 0;

      // Reserve stock in inventory
      await inventoryRepo.reserveStock(storeId, variantId, 2);
      const invBefore = await inventoryRepo.findByStoreAndVariant(storeId, variantId);
      assert.equal(invBefore?.reservedQuantity, initialReserved + 2);

      const phoneVo = KazakhstanPhoneNumber.from('+7 (701) 999-88-77');
      const order = new Order(
        'ord-sync-fail',
        'IT-FAIL-01',
        null,
        'Бахытжан',
        phoneVo,
        null,
        'pending',
        'pickup',
        storeId,
        null,
        null,
        [
          new OrderItem(
            'item-02',
            'ord-sync-fail',
            variantId,
            { titleRu: 'T-shirt', titleKz: 'Футболка', sku: 'SKU-01', size: 'M', colorRu: 'Белый', colorKz: 'Ақ' },
            new Money(4990),
            2,
            storeId
          ),
        ]
      );
      await orderRepo.create(order);

      const payload = {
        invoiceId: 'inv-sync-fail-1',
        orderId: 'ord-sync-fail',
        amount: 9980,
        status: 'FAILED',
        transactionId: 'txn-failed-01',
      };
      const signed = gateway.createSignedWebhook(payload);

      const res = await processWebhookUseCase.execute({
        rawBody: Buffer.from(signed.rawBody),
        signatureHeader: signed.signatureHeader,
        payload,
      });
      assert.equal(res.success, true);

      // Verify order cancelled
      const updatedOrder = await orderRepo.findById('ord-sync-fail');
      assert.equal(updatedOrder?.status, 'cancelled');
      assert.equal(updatedOrder?.paymentStatus, 'failed');

      // Verify stock released: reserved returned to initial, total quantity unchanged
      const invAfter = await inventoryRepo.findByStoreAndVariant(storeId, variantId);
      assert.equal(invAfter?.reservedQuantity, initialReserved);
      assert.equal(invAfter?.quantity, initialQty);
    });

    it('2.13 should update order status to refunded on REFUNDED webhook', async () => {
      const phoneVo = KazakhstanPhoneNumber.from('+7 (701) 999-88-77');
      const order = new Order(
        'ord-refund-01',
        'IT-REF-01',
        null,
        'Айгуль',
        phoneVo,
        null,
        'paid',
        'pickup',
        'store-almaty-001'
      );
      order.paymentStatus = 'paid';
      await orderRepo.create(order);

      const payload = {
        invoiceId: 'inv-ref-1',
        orderId: 'ord-refund-01',
        amount: 10000,
        status: 'REFUNDED',
        transactionId: 'txn-ref-99',
      };
      const signed = gateway.createSignedWebhook(payload);

      const res = await processWebhookUseCase.execute({
        rawBody: Buffer.from(signed.rawBody),
        signatureHeader: signed.signatureHeader,
        payload,
      });
      assert.equal(res.success, true);

      const updated = await orderRepo.findById('ord-refund-01');
      assert.equal(updated?.status, 'refunded');
      assert.equal(updated?.paymentStatus, 'refunded');
    });

    it('2.14 should handle nested event payload structure (event + invoice)', async () => {
      const nestedPayload = {
        event: 'invoice.status_changed',
        invoice: {
          id: 'inv-nested-999',
          external_order_id: 'ord-nested-999',
          amount: 5000,
          status: 'paid',
        },
        signature: 'legacy-field',
        timestamp: new Date().toISOString(),
      };
      const signed = gateway.createSignedWebhook(nestedPayload);

      const res = await processWebhookUseCase.execute({
        rawBody: Buffer.from(signed.rawBody),
        signatureHeader: signed.signatureHeader,
        payload: nestedPayload,
      });

      assert.equal(res.success, true);
      assert.equal(res.processed, true);
    });

    it('2.15 [REGRESSION INVARIANT] Late CANCELLED webhook on already paid order must NOT revert status and must NOT release stock', async () => {
      const storeId = 'store-almaty-001';
      const variantId = 'var-001-w-m';

      // 1. Initial inventory: 10 units
      const initialStock = 10;
      const initialInv = new StoreInventory('inv-reg-1', storeId, variantId, initialStock, 0, 2);
      (inventoryRepo as any).inventory.set(`${storeId}:${variantId}`, initialInv);

      // Customer A reserves 2 units
      await inventoryRepo.reserveStock(storeId, variantId, 2);
      const phoneVo = KazakhstanPhoneNumber.from('+7 (701) 111-22-33');
      const orderA = new Order(
        'ord-paid-reg',
        'IT-REG-PAID-01',
        null,
        'Куаныш',
        phoneVo,
        null,
        'pending',
        'pickup',
        storeId,
        null,
        null,
        [
          new OrderItem(
            'item-reg-1',
            'ord-paid-reg',
            variantId,
            { titleRu: 'T-shirt', titleKz: 'Футболка', sku: 'SKU-01', size: 'M', colorRu: 'Белый', colorKz: 'Ақ' },
            new Money(4990),
            2,
            storeId
          ),
        ]
      );
      await orderRepo.create(orderA);

      // 2. Successful payment arrives for Order A
      const successPayload = {
        invoiceId: 'inv-reg-success-1',
        orderId: 'ord-paid-reg',
        amount: 9980,
        status: 'SUCCESS',
        transactionId: 'txn-reg-success-1',
      };
      const signedSuccess = gateway.createSignedWebhook(successPayload);
      const resSuccess = await processWebhookUseCase.execute({
        rawBody: Buffer.from(signedSuccess.rawBody),
        signatureHeader: signedSuccess.signatureHeader,
        payload: successPayload,
      });
      assert.equal(resSuccess.success, true);

      // Order A is paid, quantity deducted from 10 to 8, reserved is 0
      const orderAfterPay = await orderRepo.findById('ord-paid-reg');
      assert.equal(orderAfterPay?.status, 'paid');
      assert.equal(orderAfterPay?.paymentStatus, 'paid');
      const invAfterPay = await inventoryRepo.findByStoreAndVariant(storeId, variantId);
      assert.equal(invAfterPay?.quantity, 8);
      assert.equal(invAfterPay?.reservedQuantity, 0);
      assert.equal(invAfterPay?.availableQuantity, 8);

      // 3. Concurrent Customer B arrives and reserves 2 units
      await inventoryRepo.reserveStock(storeId, variantId, 2);
      const invAfterBReserve = await inventoryRepo.findByStoreAndVariant(storeId, variantId);
      assert.equal(invAfterBReserve?.reservedQuantity, 2);
      assert.equal(invAfterBReserve?.availableQuantity, 6);

      // 4. Stale/Late CANCELLED webhook arrives for Order A (e.g., duplicate or previous timeout)
      const lateCancelPayload = {
        invoiceId: 'inv-reg-timeout-1',
        orderId: 'ord-paid-reg',
        amount: 9980,
        status: 'CANCELLED',
        transactionId: 'txn-reg-timeout-1',
      };
      const signedCancel = gateway.createSignedWebhook(lateCancelPayload);
      const resCancel = await processWebhookUseCase.execute({
        rawBody: Buffer.from(signedCancel.rawBody),
        signatureHeader: signedCancel.signatureHeader,
        payload: lateCancelPayload,
      });

      // Verification: Late webhook acknowledged safely without mutating state
      assert.equal(resCancel.success, true);
      assert.equal(resCancel.ignored, true);
      assert.equal(resCancel.processed, false);

      // CRITICAL INVARIANT 1: Order A status must REMAIN 'paid'
      const finalOrderA = await orderRepo.findById('ord-paid-reg');
      assert.equal(finalOrderA?.status, 'paid', 'Order A must remain in paid status');
      assert.equal(finalOrderA?.paymentStatus, 'paid', 'Order A paymentStatus must remain paid');

      // CRITICAL INVARIANT 2: Customer B reserved stock must NOT be wiped out
      const finalInv = await inventoryRepo.findByStoreAndVariant(storeId, variantId);
      assert.equal(finalInv?.quantity, 8, 'Total inventory must remain 8');
      assert.equal(finalInv?.reservedQuantity, 2, 'Customer B reservation of 2 must remain protected');
      assert.equal(finalInv?.availableQuantity, 6, 'Available inventory must remain 6');
    });

    it('2.16 [REGRESSION INVARIANT] Late CANCELLED webhook on DELIVERED order must NOT revert status', async () => {
      const phoneVo = KazakhstanPhoneNumber.from('+7 (701) 222-33-44');
      const deliveredOrder = new Order(
        'ord-delivered-reg',
        'IT-DELIV-01',
        null,
        'Айдос',
        phoneVo,
        null,
        'delivered',
        'pickup',
        'store-almaty-001'
      );
      deliveredOrder.paymentStatus = 'paid';
      await orderRepo.create(deliveredOrder);

      const cancelPayload = {
        invoiceId: 'inv-deliv-cancel-1',
        orderId: 'ord-delivered-reg',
        status: 'CANCELLED',
      };
      const signed = gateway.createSignedWebhook(cancelPayload);
      const res = await processWebhookUseCase.execute({
        rawBody: Buffer.from(signed.rawBody),
        signatureHeader: signed.signatureHeader,
        payload: cancelPayload,
      });

      assert.equal(res.success, true);
      assert.equal(res.ignored, true);

      const orderAfter = await orderRepo.findById('ord-delivered-reg');
      assert.equal(orderAfter?.status, 'delivered');
      assert.equal(orderAfter?.paymentStatus, 'paid');
    });

    it('2.17 [REGRESSION INVARIANT] Late SUCCESS webhook on already CANCELLED order must NOT deduct stock', async () => {
      const storeId = 'store-almaty-001';
      const variantId = 'var-001-w-m';
      const inv = new StoreInventory('inv-cancel-reg', storeId, variantId, 10, 0, 2);
      (inventoryRepo as any).inventory.set(`${storeId}:${variantId}`, inv);

      const phoneVo = KazakhstanPhoneNumber.from('+7 (701) 333-44-55');
      const cancelledOrder = new Order(
        'ord-cancelled-reg',
        'IT-CANC-01',
        null,
        'Ерболат',
        phoneVo,
        null,
        'cancelled',
        'pickup',
        storeId,
        null,
        null,
        [
          new OrderItem(
            'item-canc-1',
            'ord-cancelled-reg',
            variantId,
            { titleRu: 'T-shirt', titleKz: 'Футболка', sku: 'SKU-01', size: 'M', colorRu: 'Белый', colorKz: 'Ақ' },
            new Money(4990),
            1,
            storeId
          ),
        ]
      );
      cancelledOrder.paymentStatus = 'failed';
      await orderRepo.create(cancelledOrder);

      const successPayload = {
        invoiceId: 'inv-canc-success-1',
        orderId: 'ord-cancelled-reg',
        status: 'SUCCESS',
      };
      const signed = gateway.createSignedWebhook(successPayload);
      const res = await processWebhookUseCase.execute({
        rawBody: Buffer.from(signed.rawBody),
        signatureHeader: signed.signatureHeader,
        payload: successPayload,
      });

      assert.equal(res.success, true);
      assert.equal(res.ignored, true);

      const orderAfter = await orderRepo.findById('ord-cancelled-reg');
      assert.equal(orderAfter?.status, 'cancelled');
      assert.equal(orderAfter?.paymentStatus, 'failed');

      // Stock was not deducted
      const invAfter = await inventoryRepo.findByStoreAndVariant(storeId, variantId);
      assert.equal(invAfter?.quantity, 10);
      assert.equal(invAfter?.reservedQuantity, 0);
    });

    it('2.18 [REPOSITORY DEFENSIVE INVARIANT] InMemoryOrderRepository rejects illegal cancellation of paid order', async () => {
      const phoneVo = KazakhstanPhoneNumber.from('+7 (701) 444-55-66');
      const paidOrder = new Order(
        'ord-repo-guard',
        'IT-REPO-01',
        null,
        'Данияр',
        phoneVo,
        null,
        'paid',
        'pickup',
        'store-almaty-001'
      );
      paidOrder.paymentStatus = 'paid';
      await orderRepo.create(paidOrder);

      // Attempt direct repository updateKaspiPayment with cancelled status
      await orderRepo.updateKaspiPayment('ord-repo-guard', {
        invoiceId: 'inv-illegal-cancel',
        status: 'cancelled',
      });

      const orderAfter = await orderRepo.findById('ord-repo-guard');
      assert.equal(orderAfter?.status, 'paid', 'Repository must refuse status override to cancelled');
      assert.equal(orderAfter?.paymentStatus, 'paid', 'Repository must refuse paymentStatus override to failed');
    });
  });

  describe('MockKaspiPaymentAdapter & PaymentGatewayFactory', () => {
    it('3.1 should reject QR invoice cancellation with 409 qr_cancel_unsupported', async () => {
      const qrInvoice = await gateway.createInvoice({
        orderId: 'ord-cancel-qr',
        amountKzt: 4990,
        paymentMode: 'QR',
        description: 'QR cancel test',
      });

      await assert.rejects(
        async () => {
          await gateway.cancelInvoice(qrInvoice.providerInvoiceId);
        },
        (err: AppError) => {
          assert.equal(err.statusCode, 409);
          assert.equal(err.code, 'qr_cancel_unsupported');
          return true;
        }
      );
    });

    it('3.2 should instantiate MockKaspiPaymentAdapter when mock option is true or API key is absent', () => {
      const gw = PaymentGatewayFactory.create({ mock: true });
      assert.ok(gw instanceof MockKaspiPaymentAdapter);
    });

    it('3.3 should instantiate ApiPayKzPaymentAdapter when live mode and API key are configured', () => {
      const gw = PaymentGatewayFactory.create({
        mock: false,
        apiConfig: {
          apiKey: 'test_live_api_key',
          baseUrl: 'https://api.apipay.kz',
        },
      });
      assert.ok(gw instanceof ApiPayKzPaymentAdapter);
    });
  });
});
