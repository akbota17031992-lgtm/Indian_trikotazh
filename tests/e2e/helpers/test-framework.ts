/**
 * India Trikotaj E2E Testing Suite — Minimalist, High-Performance Test Framework
 * Uses Node.js native assert, tracks tests per tier, and provides rich reporting
 */

import assert from 'node:assert/strict';

export interface TestCaseResult {
  tier: number;
  suiteName: string;
  testName: string;
  passed: boolean;
  error?: Error;
  durationMs: number;
}

export interface SuiteSummary {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  durationMs: number;
  results: TestCaseResult[];
}

class TestRegistry {
  private currentTier: number = 1;
  private currentSuite: string = 'Default';
  public results: TestCaseResult[] = [];
  public startTime: number = Date.now();

  setTier(tier: number) {
    this.currentTier = tier;
  }

  getTier(): number {
    return this.currentTier;
  }

  setSuite(suite: string) {
    this.currentSuite = suite;
  }

  getSuite(): string {
    return this.currentSuite;
  }

  record(result: TestCaseResult) {
    this.results.push(result);
  }

  reset() {
    this.results = [];
    this.startTime = Date.now();
  }

  getSummary(tierFilter?: number): SuiteSummary {
    const filtered = tierFilter !== undefined
      ? this.results.filter(r => r.tier === tierFilter)
      : this.results;

    const total = filtered.length;
    const passed = filtered.filter(r => r.passed).length;
    const failed = filtered.filter(r => !r.passed).length;
    const durationMs = filtered.reduce((acc, r) => acc + r.durationMs, 0);

    return {
      total,
      passed,
      failed,
      skipped: 0,
      durationMs,
      results: filtered
    };
  }
}

export const registry = new TestRegistry();

export function setTestTier(tier: number) {
  registry.setTier(tier);
}

let executionQueue: Promise<void> = Promise.resolve();

export async function describe(name: string, fn: () => void | Promise<void>) {
  const previousSuite = registry.getSuite();
  registry.setSuite(name);
  try {
    await fn();
    await executionQueue;
  } finally {
    registry.setSuite(previousSuite);
  }
}

export function it(name: string, fn: () => void | Promise<void>): Promise<void> {
  const tier = registry.getTier();
  const suiteName = registry.getSuite();

  executionQueue = executionQueue.then(async () => {
    const start = performance.now();
    try {
      await fn();
      const durationMs = Math.round((performance.now() - start) * 100) / 100;
      registry.record({
        tier,
        suiteName,
        testName: name,
        passed: true,
        durationMs
      });
    } catch (err: any) {
      const durationMs = Math.round((performance.now() - start) * 100) / 100;
      registry.record({
        tier,
        suiteName,
        testName: name,
        passed: false,
        error: err,
        durationMs
      });
    }
  });

  return executionQueue;
}

export const test = it;

/**
 * Ergonomic assertion library wrapping node:assert/strict
 */
export function expect<T>(actual: T) {
  return {
    toBe(expected: any) {
      assert.strictEqual(actual, expected);
    },
    not: {
      toBe(expected: any) {
        assert.notStrictEqual(actual, expected);
      },
      toEqual(expected: any) {
        assert.notDeepStrictEqual(actual, expected);
      },
      toContain(expected: any) {
        if (typeof actual === 'string') {
          assert.ok(!actual.includes(expected), `Expected "${actual}" not to contain "${expected}"`);
        } else if (Array.isArray(actual)) {
          assert.ok(!actual.includes(expected), `Expected array not to contain ${JSON.stringify(expected)}`);
        } else if (actual && typeof actual === 'object') {
          assert.ok(!(expected in actual), `Expected key "${expected}" not in object`);
        }
      }
    },
    toEqual(expected: any) {
      assert.deepStrictEqual(actual, expected);
    },
    toBeTruthy() {
      assert.ok(actual);
    },
    toBeFalsy() {
      assert.ok(!actual);
    },
    toBeDefined() {
      assert.notStrictEqual(actual, undefined);
    },
    toBeUndefined() {
      assert.strictEqual(actual, undefined);
    },
    toBeNull() {
      assert.strictEqual(actual, null);
    },
    toBeGreaterThan(expected: number) {
      assert.ok((actual as any) > expected, `Expected ${actual} > ${expected}`);
    },
    toBeGreaterThanOrEqual(expected: number) {
      assert.ok((actual as any) >= expected, `Expected ${actual} >= ${expected}`);
    },
    toBeLessThan(expected: number) {
      assert.ok((actual as any) < expected, `Expected ${actual} < ${expected}`);
    },
    toBeLessThanOrEqual(expected: number) {
      assert.ok((actual as any) <= expected, `Expected ${actual} <= ${expected}`);
    },
    toContain(expected: any) {
      if (typeof actual === 'string') {
        assert.ok((actual as string).includes(expected), `Expected "${actual}" to contain "${expected}"`);
      } else if (Array.isArray(actual)) {
        assert.ok((actual as any[]).includes(expected), `Expected array to contain ${JSON.stringify(expected)}`);
      } else if (actual && typeof actual === 'object') {
        assert.ok(expected in actual, `Expected key "${expected}" in object`);
      } else {
        throw new Error(`Unsupported type for toContain: ${typeof actual}`);
      }
    },
    toMatch(regex: RegExp) {
      assert.match(String(actual), regex);
    },
    toThrow(expectedError?: string | RegExp) {
      if (typeof actual !== 'function') {
        throw new Error('expect(fn).toThrow() requires a function');
      }
      assert.throws(actual as any, (err: any) => {
        if (!expectedError) return true;
        if (typeof expectedError === 'string') {
          return err.message.includes(expectedError);
        }
        return expectedError.test(err.message);
      });
    },
    async toReject(expectedError?: string | RegExp) {
      let threw = false;
      try {
        if (typeof actual === 'function') {
          await (actual as any)();
        } else {
          await actual;
        }
      } catch (err: any) {
        threw = true;
        if (expectedError) {
          if (typeof expectedError === 'string') {
            assert.ok(err.message.includes(expectedError), `Expected error to contain "${expectedError}", got "${err.message}"`);
          } else {
            assert.match(err.message, expectedError);
          }
        }
      }
      assert.ok(threw, 'Expected promise to reject, but it resolved');
    }
  };
}
