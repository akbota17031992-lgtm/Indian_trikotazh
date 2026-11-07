import { describe, it, expect } from 'vitest';
import { ok, err, isOk, isErr, unwrap, unwrapOr, mapResult } from '../utils/result.js';

describe('result utils', () => {
  it('creates success Result with ok()', () => {
    const res = ok(42);
    expect(res.success).toBe(true);
    expect(isOk(res)).toBe(true);
    expect(isErr(res)).toBe(false);
    expect(unwrap(res)).toBe(42);
    expect(unwrapOr(res, 0)).toBe(42);
  });

  it('creates error Result with err()', () => {
    const error = new Error('Operation failed');
    const res = err(error);
    expect(res.success).toBe(false);
    expect(isOk(res)).toBe(false);
    expect(isErr(res)).toBe(true);
    expect(unwrapOr(res, 100)).toBe(100);
    expect(() => unwrap(res)).toThrow('Operation failed');
  });

  it('maps success value using mapResult', () => {
    const res = ok(10);
    const mapped = mapResult(res, (n) => n * 2);
    expect(unwrap(mapped)).toBe(20);

    const fail = err(new Error('err'));
    const mappedFail = mapResult(fail, (n: number) => n * 2);
    expect(isErr(mappedFail)).toBe(true);
  });
});
