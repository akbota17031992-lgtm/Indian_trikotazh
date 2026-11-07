/**
 * EMPIRICAL DOMAIN & BUSINESS LOGIC ADVERSARIAL CHALLENGE SUITE
 * Milestone 3: Clean Architecture Backend API (apps/api)
 *
 * Executed by Teamwork Challenger (challenger_m3_1).
 * Tests all core domain invariants, value objects, state transitions,
 * financial accuracy, inventory concurrency, and use-case error paths.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  Money,
  KazakhstanPhoneNumber,
  GeoCoordinates,
  Sku,
  StoreSchedule,
  Order,
  OrderItem,
  StoreInventory,
  type DomainOrderStatus,
  type DomainDeliveryType,
  InvalidStateTransitionError,
  ValidationError,
  NotFoundError,
  InsufficientStockError,
  ok,
  err,
  isOk,
  isErr
} from '../dist/domain/index.js';
import { CreateOrderUseCase } from '../dist/use-cases/index.js';
import {
  InMemoryStoreRepository,
  InMemoryProductRepository,
  InMemoryInventoryRepository,
  InMemoryOrderRepository,
  InMemoryPromotionRepository
} from '../dist/adapters/index.js';
import { KZ_OPERATOR_PREFIXES } from '@india-trikotaj/shared';

describe('CHALLENGER STRESS SUITE: Domain & Business Logic Adversarial Verification', () => {

  // =========================================================================
  // 1. Money Value Object Invariant Stress Testing
  // =========================================================================
  describe('1. Money Value Object Invariants', () => {
    it('1.1 should allow zero and positive whole tenge integers', () => {
      const zero = Money.zero();
      assert.equal(zero.amountKzt, 0);
      assert.equal(zero.format(), '0\u00A0₸');

      const regular = new Money(14990);
      assert.equal(regular.amountKzt, 14990);
      assert.equal(regular.format(), '14\u00A0990\u00A0₸');

      const staticFrom = Money.from(5000);
      assert.equal(staticFrom.amountKzt, 5000);
    });

    it('1.2 should strictly reject negative tenge amounts', () => {
      assert.throws(() => new Money(-1), /cannot be negative/);
      assert.throws(() => new Money(-14990), /cannot be negative/);
      assert.throws(() => new Money(-1000000), /cannot be negative/);
    });

    it('1.3 should strictly reject fractional tiyn floating-point numbers', () => {
      assert.throws(() => new Money(10.5), /must be a whole integer/);
      assert.throws(() => new Money(0.001), /must be a whole integer/);
      assert.throws(() => new Money(14990.99), /must be a whole integer/);
      assert.throws(() => new Money(0.1 + 0.2), /must be a whole integer/);
      assert.throws(() => new Money(-0.5), /must be a whole integer/);
    });

    it('1.4 should strictly reject NaN, Infinity, -Infinity and non-numbers', () => {
      assert.throws(() => new Money(NaN), /must be a whole integer/);
      assert.throws(() => new Money(Infinity), /must be a whole integer/);
      assert.throws(() => new Money(-Infinity), /must be a whole integer/);
      assert.throws(() => new Money('14990' as any), /must be a whole integer/);
      assert.throws(() => new Money(null as any), /must be a whole integer/);
      assert.throws(() => new Money(undefined as any), /must be a whole integer/);
    });

    it('1.5 should support safe integer amounts up to MAX_SAFE_INTEGER', () => {
      const huge = new Money(Number.MAX_SAFE_INTEGER);
      assert.equal(huge.amountKzt, 9007199254740991);
      assert.equal(huge.format(), '9\u00A0007\u00A0199\u00A0254\u00A0740\u00A0991\u00A0₸');
    });

    it('1.6 should perform addition and subtraction with balance protection', () => {
      const a = new Money(10000);
      const b = new Money(4500);

      const sum = a.add(b);
      assert.equal(sum.amountKzt, 14500);

      const diff = a.subtract(b);
      assert.equal(diff.amountKzt, 5500);

      const exact = a.subtract(a);
      assert.equal(exact.amountKzt, 0);

      // Subtraction resulting in negative balance must throw Insufficient funds
      assert.throws(() => b.subtract(a), /Insufficient funds: 4500 - 10000 < 0/);
    });

    it('1.7 should multiply while rounding to whole tenge and rejecting negative multipliers', () => {
      const price = new Money(14990);

      // 10% discount multiplier (0.9)
      const discounted = price.multiply(0.9);
      assert.equal(discounted.amountKzt, 13491); // Math.round(14990 * 0.9 = 13491)

      // 15% tax multiplier (1.15)
      const taxed = price.multiply(1.15);
      assert.equal(taxed.amountKzt, 17239); // Math.round(14990 * 1.15 = 17238.5) -> 17239

      // Zero multiplier
      const zero = price.multiply(0);
      assert.equal(zero.amountKzt, 0);

      // Negative multiplier must throw
      assert.throws(() => price.multiply(-0.5), /Multiplier factor cannot be negative/);
      assert.throws(() => price.multiply(-1), /Multiplier factor cannot be negative/);
      // NaN multiplier
      assert.throws(() => price.multiply(NaN), /must be a whole integer/);
    });

    it('1.8 should correctly evaluate equality and comparison operators', () => {
      const low = new Money(1000);
      const mid = new Money(2000);
      const midClone = new Money(2000);

      assert.equal(mid.equals(midClone), true);
      assert.equal(mid.equals(low), false);
      assert.equal(mid.isGreaterThan(low), true);
      assert.equal(low.isGreaterThan(mid), false);
      assert.equal(low.isLessThan(mid), true);
      assert.equal(mid.isLessThan(low), false);
      assert.equal(mid.isLessThan(midClone), false);
    });
  });

  // =========================================================================
  // 2. KazakhstanPhoneNumber Value Object & Normalization Stress Testing
  // =========================================================================
  describe('2. KazakhstanPhoneNumber Value Object & Normalization', () => {
    it('2.1 should accept and normalize all 14 official Kazakhstan operator codes and formats', () => {
      for (const prefix of KZ_OPERATOR_PREFIXES) {
        const raw1 = `+7 (${prefix}) 123-45-67`;
        const phone1 = KazakhstanPhoneNumber.from(raw1);
        assert.equal(phone1.digits, `7${prefix}1234567`);
        assert.equal(phone1.toE164(), `+7${prefix}1234567`);

        const raw2 = `8${prefix}1234567`;
        const phone2 = new KazakhstanPhoneNumber(raw2);
        assert.equal(phone2.toE164(), `+7${prefix}1234567`);
        assert.equal(phone1.equals(phone2), true);
      }
    });

    it('2.2 should format to user-friendly mask "+7 (7XX) XXX-XX-XX"', () => {
      const phone = new KazakhstanPhoneNumber('+77011234567');
      assert.equal(phone.format(), '+7 (701) 123-45-67');
      assert.equal(phone.toString(), '+77011234567');
      assert.equal(JSON.stringify({ phone }), JSON.stringify({ phone: '+77011234567' }));
    });

    it('2.3 should strictly reject foreign numbers (e.g. Russian +79XX, 89XX)', () => {
      assert.equal(KazakhstanPhoneNumber.isValid('+7 (903) 123-45-67'), false);
      assert.throws(() => new KazakhstanPhoneNumber('+7 (903) 123-45-67'), /not recognized in Kazakhstan/);

      assert.equal(KazakhstanPhoneNumber.isValid('89161234567'), false);
      assert.throws(() => new KazakhstanPhoneNumber('89161234567'), /not recognized in Kazakhstan/);

      assert.equal(KazakhstanPhoneNumber.isValid('+7 (999) 000-00-00'), false);
      assert.throws(() => new KazakhstanPhoneNumber('+7 (999) 000-00-00'), /not recognized in Kazakhstan/);
    });

    it('2.4 should strictly reject invalid/unassigned area codes (+7 6XX, +7 1XX, +7 8XX)', () => {
      assert.equal(KazakhstanPhoneNumber.isValid('+77601234567'), false);
      assert.throws(() => new KazakhstanPhoneNumber('+77601234567'), /not recognized in Kazakhstan/);

      assert.equal(KazakhstanPhoneNumber.isValid('+77111234567'), false);
      assert.throws(() => new KazakhstanPhoneNumber('+77111234567'), /not recognized in Kazakhstan/);

      assert.equal(KazakhstanPhoneNumber.isValid('+77801234567'), false);
      assert.throws(() => new KazakhstanPhoneNumber('+77801234567'), /not recognized in Kazakhstan/);
    });

    it('2.5 should strictly reject invalid digit counts (too short, too long, empty)', () => {
      assert.equal(KazakhstanPhoneNumber.isValid(''), false);
      assert.throws(() => new KazakhstanPhoneNumber(''), /Invalid Kazakhstan phone number/);

      assert.equal(KazakhstanPhoneNumber.isValid('12345'), false);
      assert.throws(() => new KazakhstanPhoneNumber('12345'), /Invalid Kazakhstan phone number/);

      // 10 digits without leading trunk or country code
      assert.equal(KazakhstanPhoneNumber.isValid('7011234567'), false);
      assert.throws(() => new KazakhstanPhoneNumber('7011234567'), /Invalid Kazakhstan phone number/);

      // 12 digits (overflow)
      assert.equal(KazakhstanPhoneNumber.isValid('+770112345678'), false);
      assert.throws(() => new KazakhstanPhoneNumber('+770112345678'), /Invalid Kazakhstan phone number/);
    });

    it('2.6 [CHALLENGE FINDING] KazakhstanPhoneNumber.constructor strips non-digits before prefix validation', () => {
      // In KazakhstanPhoneNumber: raw is cleaned with replace(/\D/g, '') first.
      // If dirty text contains digits from script/SQL like '<script>alert(1)</script>+7701123456',
      // digits count becomes 12 ('17701123456') and first char is '1', so it throws cleanly:
      assert.throws(
        () => new KazakhstanPhoneNumber('<script>alert(1)</script>+7701123456'),
        /Invalid Kazakhstan phone number/
      );

      // But if dirty input contains NO digits in the injection, e.g. '/*hello*/+77011234567/*world*/':
      // replace(/\D/g, '') leaves '77011234567', which produces a normalized phone object.
      // Note: At API boundary, KazakhstanPhoneSchema / validateKazakhstanPhone rejects this due to regex:
      const sanitized = new KazakhstanPhoneNumber('/*hello*/+77011234567/*world*/');
      assert.equal(sanitized.toE164(), '+77011234567');
    });
  });

  // =========================================================================
  // 3. GeoCoordinates & Haversine Distance Invariants
  // =========================================================================
  describe('3. GeoCoordinates & Haversine Invariants', () => {
    it('3.1 should validate valid Almaty and worldwide latitude/longitude boundaries', () => {
      const almaty = GeoCoordinates.almatyCenter();
      assert.equal(almaty.latitude, 43.238949);
      assert.equal(almaty.longitude, 76.889709);

      // Boundary limits
      const northPole = new GeoCoordinates(90, 0);
      assert.equal(northPole.latitude, 90);
      const southPole = new GeoCoordinates(-90, 0);
      assert.equal(southPole.latitude, -90);
      const dateLineEast = new GeoCoordinates(0, 180);
      assert.equal(dateLineEast.longitude, 180);
      const dateLineWest = new GeoCoordinates(0, -180);
      assert.equal(dateLineWest.longitude, -180);
    });

    it('3.2 should strictly reject out-of-bounds latitude and longitude', () => {
      assert.throws(() => new GeoCoordinates(90.0001, 76), /Invalid latitude: 90.0001/);
      assert.throws(() => new GeoCoordinates(-90.0001, 76), /Invalid latitude: -90.0001/);
      assert.throws(() => new GeoCoordinates(43, 180.0001), /Invalid longitude: 180.0001/);
      assert.throws(() => new GeoCoordinates(43, -180.0001), /Invalid longitude: -180.0001/);
    });

    it('3.3 should calculate Haversine distance between Almaty shopping centers accurately', () => {
      const megaAlmaAta = new GeoCoordinates(43.2033, 76.8927);
      const dostykPlaza = new GeoCoordinates(43.2335, 76.9567);

      // Distance between MEGA and Dostyk Plaza is approx 6.2 km
      const distance = megaAlmaAta.distanceTo(dostykPlaza);
      assert.ok(distance >= 6.0 && distance <= 6.5, `Expected ~6.2km, got ${distance}`);

      // Distance to self is 0 km
      assert.equal(megaAlmaAta.distanceTo(megaAlmaAta), 0);
    });

    it('3.4 [CHALLENGE FINDING] NaN coordinates bypass GeoCoordinates range comparisons', () => {
      // In JS: (NaN < -90) is false, (NaN > 90) is false.
      // Therefore new GeoCoordinates(NaN, NaN) does NOT throw!
      const nanCoords = new GeoCoordinates(NaN, NaN);
      assert.ok(Number.isNaN(nanCoords.latitude));
      assert.ok(Number.isNaN(nanCoords.longitude));
      // Documents lack of Number.isFinite() check in domain GeoCoordinates constructor.
    });
  });

  // =========================================================================
  // 4. SKU & StoreSchedule Value Object Invariants
  // =========================================================================
  describe('4. SKU & StoreSchedule Invariants', () => {
    it('4.1 should validate and normalize valid SKU codes', () => {
      const sku = new Sku('it-tsh-001-blk-m');
      assert.equal(sku.value, 'IT-TSH-001-BLK-M');
      assert.equal(sku.toString(), 'IT-TSH-001-BLK-M');
    });

    it('4.2 should reject empty or too short SKUs (< 3 chars)', () => {
      assert.throws(() => new Sku(''), /Invalid SKU format/);
      assert.throws(() => new Sku('  '), /Invalid SKU format/);
      assert.throws(() => new Sku('IT'), /Invalid SKU format/);
    });

    it('4.3 should accurately determine store open/closed status by date & time', () => {
      const schedule = StoreSchedule.defaultAlmatyDaily(); // 10:00 to 22:00 daily

      // 14:30 on Wednesday (open)
      const openTime = new Date('2026-11-04T14:30:00');
      assert.equal(schedule.isOpenAt(openTime), true);

      // 08:30 in the morning (closed)
      const morningTime = new Date('2026-11-04T08:30:00');
      assert.equal(schedule.isOpenAt(morningTime), false);

      // 23:15 late night (closed)
      const nightTime = new Date('2026-11-04T23:15:00');
      assert.equal(schedule.isOpenAt(nightTime), false);
    });
  });

  // =========================================================================
  // 5. Order State Machine Transition Matrix (Exhaustive Adversarial Challenge)
  // =========================================================================
  describe('5. Order State Machine Transitions Matrix', () => {
    const ALL_STATUSES: DomainOrderStatus[] = [
      'pending',
      'pending_payment',
      'paid',
      'processing',
      'ready_for_pickup',
      'shipping',
      'in_transit',
      'delivered',
      'cancelled',
      'refunded'
    ];

    function createTestOrder(initialStatus: DomainOrderStatus): Order {
      return new Order(
        'ord_test_001',
        'IT-20261102-1234',
        'user-1',
        'Тест Клиент',
        new KazakhstanPhoneNumber('+77011234567'),
        'test@example.com',
        initialStatus,
        'pickup',
        'store-almaty-001'
      );
    }

    it('5.1 should allow complete valid pickup flow: pending -> pending_payment -> paid -> processing -> ready_for_pickup -> delivered', () => {
      const order = createTestOrder('pending');
      assert.equal(order.status, 'pending');

      assert.equal(order.transitionTo('pending_payment').success, true);
      assert.equal(order.status, 'pending_payment');

      assert.equal(order.markPaid('kaspitx_123').success, true);
      assert.equal(order.status, 'paid');
      assert.equal(order.paymentStatus, 'paid');
      assert.equal(order.kaspiTransactionId, 'kaspitx_123');

      assert.equal(order.transitionTo('processing').success, true);
      assert.equal(order.status, 'processing');

      assert.equal(order.transitionTo('ready_for_pickup').success, true);
      assert.equal(order.status, 'ready_for_pickup');

      assert.equal(order.transitionTo('delivered').success, true);
      assert.equal(order.status, 'delivered');

      // Delivered can then only be refunded
      assert.equal(order.transitionTo('refunded').success, true);
      assert.equal(order.status, 'refunded');
    });

    it('5.2 should allow complete valid courier delivery flow: pending -> pending_payment -> paid -> processing -> shipping/in_transit -> delivered', () => {
      const order = createTestOrder('pending');
      assert.equal(order.transitionTo('pending_payment').success, true);
      assert.equal(order.transitionTo('paid').success, true);
      assert.equal(order.transitionTo('processing').success, true);
      assert.equal(order.transitionTo('shipping').success, true);
      assert.equal(order.status, 'shipping');
      assert.equal(order.transitionTo('delivered').success, true);
      assert.equal(order.status, 'delivered');

      const order2 = createTestOrder('processing');
      assert.equal(order2.transitionTo('in_transit').success, true);
      assert.equal(order2.transitionTo('delivered').success, true);
    });

    it('5.3 [CRITICAL ATTACK] should strictly block pending_payment -> delivered jump (delivery without payment)', () => {
      const order = createTestOrder('pending_payment');
      const res = order.transitionTo('delivered');
      assert.equal(res.success, false);
      if (!res.success) {
        assert.equal(res.error.currentStatus, 'pending_payment');
        assert.equal(res.error.attemptedStatus, 'delivered');
      }
      assert.equal(order.status, 'pending_payment'); // State unchanged!
    });

    it('5.4 [CRITICAL ATTACK] should strictly block delivered -> paid jump', () => {
      const order = createTestOrder('delivered');
      const res = order.transitionTo('paid');
      assert.equal(res.success, false);
      if (!res.success) {
        assert.equal(res.error.currentStatus, 'delivered');
        assert.equal(res.error.attemptedStatus, 'paid');
      }
      assert.equal(order.status, 'delivered');
    });

    it('5.5 [CRITICAL ATTACK] should strictly block cancelled -> paid jump (cannot revive dead order)', () => {
      const order = createTestOrder('cancelled');
      const res = order.markPaid('kaspitx_exploit');
      assert.equal(res.success, false);
      if (!res.success) {
        assert.equal(res.error.currentStatus, 'cancelled');
        assert.equal(res.error.attemptedStatus, 'paid');
      }
      assert.equal(order.status, 'cancelled');
      assert.equal(order.paymentStatus, 'pending'); // Payment status not set!
    });

    it('5.6 [CRITICAL ATTACK] should strictly block delivered -> cancelled and refunded -> cancelled via cancel()', () => {
      const deliveredOrder = createTestOrder('delivered');
      const resDelivered = deliveredOrder.cancel();
      assert.equal(resDelivered.success, false);
      assert.equal(deliveredOrder.status, 'delivered');

      const refundedOrder = createTestOrder('refunded');
      const resRefunded = refundedOrder.cancel();
      assert.equal(resRefunded.success, false);
      assert.equal(refundedOrder.status, 'refunded');
    });

    it('5.7 [EXHAUSTIVE ATTACK] should enforce the complete 10x10 state machine transition matrix', () => {
      // Expected valid transitions map
      const EXPECTED_VALID: Record<DomainOrderStatus, DomainOrderStatus[]> = {
        pending: ['pending_payment', 'paid', 'cancelled'],
        pending_payment: ['paid', 'cancelled'],
        paid: ['processing', 'refunded'],
        processing: ['ready_for_pickup', 'shipping', 'in_transit', 'cancelled'],
        ready_for_pickup: ['delivered', 'cancelled'],
        shipping: ['delivered', 'cancelled'],
        in_transit: ['delivered', 'cancelled'],
        delivered: ['refunded'],
        cancelled: [],
        refunded: []
      };

      let testedPairs = 0;
      let blockedIllegalJumps = 0;

      for (const fromStatus of ALL_STATUSES) {
        for (const toStatus of ALL_STATUSES) {
          testedPairs++;
          const order = createTestOrder(fromStatus);
          const isExpectedAllowed = EXPECTED_VALID[fromStatus].includes(toStatus);
          const canTransition = order.canTransitionTo(toStatus);
          const transitionResult = order.transitionTo(toStatus);

          assert.equal(
            canTransition,
            isExpectedAllowed,
            `Mismatch on canTransitionTo(${fromStatus} -> ${toStatus}): expected ${isExpectedAllowed}, got ${canTransition}`
          );

          assert.equal(
            transitionResult.success,
            isExpectedAllowed,
            `Mismatch on transitionTo(${fromStatus} -> ${toStatus}): expected success=${isExpectedAllowed}, got ${transitionResult.success}`
          );

          if (!isExpectedAllowed) {
            blockedIllegalJumps++;
            assert.equal(order.status, fromStatus, `Order status illegally changed from ${fromStatus} on failed jump`);
          } else {
            assert.equal(order.status, toStatus, `Order status failed to change to ${toStatus} on valid jump`);
          }
        }
      }

      assert.equal(testedPairs, 100);
      assert.equal(blockedIllegalJumps, 82); // Exactly 18 allowed transitions, 82 strictly blocked!
    });
  });

  // =========================================================================
  // 6. Financial Integrity, Delivery Fees & Calculations
  // =========================================================================
  describe('6. Financial Integrity & Delivery Fees', () => {
    it('6.1 should enforce pickup delivery fee = 0 ₸ and courier delivery fee = 1 500 ₸', () => {
      const pickupOrder = new Order(
        'ord_pickup_1',
        'IT-20261102-1001',
        null,
        'Курьер Тест',
        new KazakhstanPhoneNumber('+77011234567'),
        null,
        'pending_payment',
        'pickup',
        'store-almaty-001'
      );
      pickupOrder.recalculate();
      assert.equal(pickupOrder.deliveryFee.amountKzt, 0);

      const courierOrder = new Order(
        'ord_courier_1',
        'IT-20261102-1002',
        null,
        'Курьер Тест',
        new KazakhstanPhoneNumber('+77011234567'),
        null,
        'pending_payment',
        'courier',
        null,
        null,
        {
          city: 'Алматы',
          street: 'Абая',
          building: '10'
        }
      );
      courierOrder.recalculate();
      assert.equal(courierOrder.deliveryFee.amountKzt, 1500);
    });

    it('6.2 should calculate subtotal and total accurately from items without fractional tiyns', () => {
      const order = new Order(
        'ord_calc_1',
        'IT-20261102-1003',
        null,
        'Айбек Тестов',
        new KazakhstanPhoneNumber('+77011234567'),
        null,
        'pending_payment',
        'courier'
      );

      // Item 1: T-Shirt 4 990 ₸ x 2 = 9 980 ₸
      const item1 = new OrderItem(
        'item-1',
        order.id,
        'var-1',
        { titleRu: 'Футболка', titleKz: 'Футболка', sku: 'IT-TSH-001', size: 'M', colorRu: 'Черный', colorKz: 'Қара' },
        new Money(4990),
        2,
        'store-almaty-001'
      );
      assert.equal(item1.totalPrice.amountKzt, 9980);

      // Item 2: Robe 12 500 ₸ x 1 = 12 500 ₸
      const item2 = new OrderItem(
        'item-2',
        order.id,
        'var-2',
        { titleRu: 'Халат', titleKz: 'Халат', sku: 'IT-ROB-001', size: 'L', colorRu: 'Синий', colorKz: 'Көк' },
        new Money(12500),
        1,
        'store-almaty-001'
      );
      assert.equal(item2.totalPrice.amountKzt, 12500);

      order.items = [item1, item2];
      order.recalculate();

      // Subtotal = 9 980 + 12 500 = 22 480 ₸
      assert.equal(order.subtotal.amountKzt, 22480);
      // Courier fee = 1 500 ₸
      assert.equal(order.deliveryFee.amountKzt, 1500);
      // Total = 22 480 + 1 500 = 23 980 ₸
      assert.equal(order.total.amountKzt, 23980);
      assert.equal(order.total.format(), '23\u00A0980\u00A0₸');
    });

    it('6.3 should ensure discount exceeding subtotal never results in negative total (Math.max floor)', () => {
      const order = new Order(
        'ord_calc_2',
        'IT-20261102-1004',
        null,
        'Айбек Тестов',
        new KazakhstanPhoneNumber('+77011234567'),
        null,
        'pending_payment',
        'pickup'
      );

      const item = new OrderItem(
        'item-1',
        order.id,
        'var-1',
        { titleRu: 'Носки', titleKz: 'Шұлық', sku: 'IT-SOC-001', size: 'M', colorRu: 'Белый', colorKz: 'Ақ' },
        new Money(1000),
        1,
        'store-almaty-001'
      );
      order.items = [item];
      // Discount 5 000 ₸ on 1 000 ₸ item
      order.discount = new Money(5000);
      order.recalculate();

      assert.equal(order.subtotal.amountKzt, 1000);
      assert.equal(order.total.amountKzt, 0); // Floored to 0 ₸!
    });

    it('6.4 should reject OrderItem with zero, negative, fractional, or > 100 quantity', () => {
      const snapshot = {
        titleRu: 'Тест',
        titleKz: 'Тест',
        sku: 'IT-TST-001',
        size: 'M',
        colorRu: 'Черный',
        colorKz: 'Қара'
      };

      assert.throws(
        () => new OrderItem('i-1', 'o-1', 'v-1', snapshot, new Money(1000), 0, 's-1'),
        /Quantity must be positive integer/
      );
      assert.throws(
        () => new OrderItem('i-1', 'o-1', 'v-1', snapshot, new Money(1000), -5, 's-1'),
        /Quantity must be positive integer/
      );
      assert.throws(
        () => new OrderItem('i-1', 'o-1', 'v-1', snapshot, new Money(1000), 2.5, 's-1'),
        /Quantity must be positive integer/
      );
      assert.throws(
        () => new OrderItem('i-1', 'o-1', 'v-1', snapshot, new Money(1000), 101, 's-1'),
        /Exceeded single order item maximum limit \(100\)/
      );
    });
  });

  // =========================================================================
  // 7. StoreInventory Invariants & High-Concurrency Stress Testing
  // =========================================================================
  describe('7. StoreInventory Invariants & Concurrency', () => {
    it('7.1 should enforce StoreInventory entity invariants (negative & reserved > total)', () => {
      assert.throws(
        () => new StoreInventory('inv-1', 's-1', 'v-1', -1, 0),
        /Quantity cannot be negative/
      );
      assert.throws(
        () => new StoreInventory('inv-1', 's-1', 'v-1', 10, -1),
        /Reserved quantity cannot be negative/
      );
      assert.throws(
        () => new StoreInventory('inv-1', 's-1', 'v-1', 5, 6),
        /Reserved quantity \(6\) cannot exceed total quantity \(5\)/
      );
    });

    it('7.2 should correctly track availableQuantity, reserve, release, and commitDeduction', () => {
      const inv = new StoreInventory('inv-1', 's-1', 'v-1', 10, 0, 3);
      assert.equal(inv.availableQuantity, 10);
      assert.equal(inv.isLowStock(), false);

      // Reserve 4
      const res1 = inv.reserve(4);
      assert.equal(res1.success, true);
      assert.equal(inv.reservedQuantity, 4);
      assert.equal(inv.availableQuantity, 6);
      assert.equal(inv.isLowStock(), false);

      // Try to reserve 7 (only 6 available) -> must fail!
      const res2 = inv.reserve(7);
      assert.equal(res2.success, false);
      if (!res2.success) {
        assert.equal(res2.error.available, 6);
        assert.equal(res2.error.requested, 7);
      }
      assert.equal(inv.reservedQuantity, 4); // Unchanged!

      // Reserve 3 more -> leaves 3 available (triggers isLowStock)
      const res3 = inv.reserve(3);
      assert.equal(res3.success, true);
      assert.equal(inv.availableQuantity, 3);
      assert.equal(inv.isLowStock(), true); // threshold is 3

      // Release 2
      const relRes = inv.release(2);
      assert.equal(relRes.success, true);
      assert.equal(inv.reservedQuantity, 5);
      assert.equal(inv.availableQuantity, 5);

      // Commit deduction of 3 sold items
      const commitRes = inv.commitDeduction(3);
      assert.equal(commitRes.success, true);
      assert.equal(inv.quantity, 7);
      assert.equal(inv.reservedQuantity, 2);
      assert.equal(inv.availableQuantity, 5);
    });

    it('7.3 [CONCURRENCY STRESS] should prevent over-reservation under high-concurrency race condition', async () => {
      // In-memory repository with initial stock of 10 items
      const repo = new InMemoryInventoryRepository();
      const storeId = 'store-almaty-001';
      const variantId = 'stress-variant-001';

      // Set initial stock to 10
      const initialInv = new StoreInventory('inv-stress-1', storeId, variantId, 10, 0, 3);
      (repo as any).inventory.set(`${storeId}:${variantId}`, initialInv);

      // 50 parallel reservation attempts of 1 unit each
      const attempts = 50;
      const reservationPromises: Promise<boolean>[] = [];

      for (let i = 0; i < attempts; i++) {
        reservationPromises.push(repo.reserveStock(storeId, variantId, 1, `order-rush-${i}`));
      }

      const results = await Promise.all(reservationPromises);
      const successes = results.filter(r => r === true).length;
      const failures = results.filter(r => r === false).length;

      assert.equal(successes, 10, `Expected exactly 10 successes, got ${successes}`);
      assert.equal(failures, 40, `Expected exactly 40 failures, got ${failures}`);

      const finalInv = await repo.findByStoreAndVariant(storeId, variantId);
      assert.ok(finalInv);
      assert.equal(finalInv.reservedQuantity, 10);
      assert.equal(finalInv.availableQuantity, 0);
    });
  });

  // =========================================================================
  // 8. CreateOrderUseCase Domain Workflow & Rollback Stress Testing
  // =========================================================================
  describe('8. CreateOrderUseCase Domain Workflow Stress Testing', () => {
    it('8.1 should reject customerName < 2 characters after trimming', async () => {
      const storeRepo = new InMemoryStoreRepository();
      const productRepo = new InMemoryProductRepository();
      const invRepo = new InMemoryInventoryRepository();
      const orderRepo = new InMemoryOrderRepository();

      const useCase = new CreateOrderUseCase(orderRepo, productRepo, invRepo, storeRepo);

      const res = await useCase.execute({
        customerName: '   A   ', // 1 char trimmed
        customerPhone: '+7 (701) 123-45-67',
        fulfillmentType: 'pickup',
        pickupStoreId: 'store-almaty-001',
        items: [{ variantId: 'var-001-b-m', quantity: 1 }]
      });

      assert.equal(res.success, false);
      if (!res.success) {
        assert.equal(res.error.code, 'VALIDATION_ERROR');
        assert.match(res.error.message, /Customer name must contain at least 2/);
      }
    });

    it('8.2 should reject invalid Kazakhstan phone number', async () => {
      const storeRepo = new InMemoryStoreRepository();
      const productRepo = new InMemoryProductRepository();
      const invRepo = new InMemoryInventoryRepository();
      const orderRepo = new InMemoryOrderRepository();

      const useCase = new CreateOrderUseCase(orderRepo, productRepo, invRepo, storeRepo);

      const res = await useCase.execute({
        customerName: 'Айдос',
        customerPhone: '+7 (903) 123-45-67', // Russian prefix
        fulfillmentType: 'pickup',
        pickupStoreId: 'store-almaty-001',
        items: [{ variantId: 'var-001-b-m', quantity: 1 }]
      });

      assert.equal(res.success, false);
      if (!res.success) {
        assert.equal(res.error.code, 'VALIDATION_ERROR');
        assert.match(res.error.message, /Invalid Kazakhstan phone number/);
      }
    });

    it('8.3 should reject pickup order without pickupStoreId', async () => {
      const storeRepo = new InMemoryStoreRepository();
      const productRepo = new InMemoryProductRepository();
      const invRepo = new InMemoryInventoryRepository();
      const orderRepo = new InMemoryOrderRepository();

      const useCase = new CreateOrderUseCase(orderRepo, productRepo, invRepo, storeRepo);

      const res = await useCase.execute({
        customerName: 'Айдос',
        customerPhone: '+7 (701) 123-45-67',
        fulfillmentType: 'pickup',
        items: [{ variantId: 'var-001-b-m', quantity: 1 }]
      });

      assert.equal(res.success, false);
      if (!res.success) {
        assert.equal(res.error.code, 'VALIDATION_ERROR');
        assert.match(res.error.message, /Pickup store selection is required/);
      }
    });

    it('8.4 should reject courier order without complete delivery address', async () => {
      const storeRepo = new InMemoryStoreRepository();
      const productRepo = new InMemoryProductRepository();
      const invRepo = new InMemoryInventoryRepository();
      const orderRepo = new InMemoryOrderRepository();

      const useCase = new CreateOrderUseCase(orderRepo, productRepo, invRepo, storeRepo);

      const res = await useCase.execute({
        customerName: 'Айдос',
        customerPhone: '+7 (701) 123-45-67',
        fulfillmentType: 'courier',
        deliveryAddress: { city: 'Алматы', street: '', building: '' } as any,
        items: [{ variantId: 'var-001-b-m', quantity: 1 }]
      });

      assert.equal(res.success, false);
      if (!res.success) {
        assert.equal(res.error.code, 'VALIDATION_ERROR');
        assert.match(res.error.message, /Valid delivery address is required/);
      }
    });

    it('8.5 [ROLLBACK STRESS] should rollback already reserved items when a later item has insufficient stock', async () => {
      const storeRepo = new InMemoryStoreRepository();
      const productRepo = new InMemoryProductRepository();
      const invRepo = new InMemoryInventoryRepository();
      const orderRepo = new InMemoryOrderRepository();

      const storeId = 'store-almaty-001';

      // Item 1 (var-001-b-m) has 10 units in stock
      const var1Id = 'var-001-b-m';
      const inv1 = new StoreInventory('inv-rb-1', storeId, var1Id, 10, 0, 3);
      (invRepo as any).inventory.set(`${storeId}:${var1Id}`, inv1);

      // Item 2 (var-003-bl-l) has 0 units in stock
      const var2Id = 'var-003-bl-l';
      const inv2 = new StoreInventory('inv-rb-2', storeId, var2Id, 0, 0, 3);
      (invRepo as any).inventory.set(`${storeId}:${var2Id}`, inv2);

      const useCase = new CreateOrderUseCase(orderRepo, productRepo, invRepo, storeRepo);

      const res = await useCase.execute({
        customerName: 'Данияр',
        customerPhone: '+7 (701) 123-45-67',
        fulfillmentType: 'pickup',
        pickupStoreId: storeId,
        items: [
          { variantId: var1Id, quantity: 2, reservedFromStoreId: storeId },
          { variantId: var2Id, quantity: 1, reservedFromStoreId: storeId }
        ]
      });

      // Order creation must fail due to item 2 insufficient stock
      assert.equal(res.success, false);
      if (!res.success) {
        assert.equal(res.error.code, 'INSUFFICIENT_STOCK');
      }

      // Rollback invariant: Item 1's reserved quantity MUST BE 0 (released!), not 2!
      const checkInv1 = await invRepo.findByStoreAndVariant(storeId, var1Id);
      assert.ok(checkInv1);
      assert.equal(
        checkInv1.reservedQuantity,
        0,
        `Rollback failed: expected reservedQuantity=0, got ${checkInv1.reservedQuantity}`
      );
      assert.equal(checkInv1.availableQuantity, 10);
    });
  });
});
