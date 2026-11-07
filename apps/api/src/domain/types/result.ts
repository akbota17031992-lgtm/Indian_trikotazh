/**
 * Clean Architecture Result / Either envelope
 */
export type Result<T, E = Error> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: E };

export function ok<T>(data: T): Result<T, never> {
  return { success: true, data };
}

export function err<E>(error: E): Result<never, E> {
  return { success: false, error };
}

export function isOk<T, E>(result: Result<T, E>): result is { readonly success: true; readonly data: T } {
  return result.success === true;
}

export function isErr<T, E>(result: Result<T, E>): result is { readonly success: false; readonly error: E } {
  return result.success === false;
}

export function mapResult<T, U, E>(result: Result<T, E>, fn: (val: T) => U): Result<U, E> {
  if (result.success) {
    return { success: true, data: fn(result.data) };
  }
  return result;
}

export function flatMapResult<T, U, E, E2>(
  result: Result<T, E>,
  fn: (val: T) => Result<U, E2>
): Result<U, E | E2> {
  if (result.success) {
    return fn(result.data);
  }
  return result;
}

export function unwrapResult<T, E>(result: Result<T, E>): T {
  if (result.success) {
    return result.data;
  }
  if (result.error instanceof Error) {
    throw result.error;
  }
  throw new Error(String(result.error));
}

export function unwrapResultOr<T, E>(result: Result<T, E>, fallback: T): T {
  return result.success ? result.data : fallback;
}
