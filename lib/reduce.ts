import { AnyIterable } from './types'
export async function _reduce<T, B>(func: (acc: B, value: T) => B, start: B, iterable: AnyIterable<T>) {
  let value = start
  for await (const nextItem of iterable) {
    value = await func(value, nextItem)
  }
  return value
}


/**
 * An async function that takes a reducer function, an initial value and an iterable.

Reduces an iterable to a value which is the accumulated result of running each value from the iterable thru `func`, where each successive invocation is supplied the return value of the previous. Errors are immediate raised.
 */
export function reduce<T, B>(
  func: (acc: B, value: T) => B
): {
  (start: B): (iterable: AnyIterable<T>) => Promise<B>
  (start: B, iterable: AnyIterable<T>): Promise<B>
}
export function reduce<T, B>(func: (acc: B, value: T) => B, start: B): (iterable: AnyIterable<T>) => Promise<B>
export function reduce<T, B>(func: (acc: B, value: T) => B, start: B, iterable: AnyIterable<T>): Promise<B>
export function reduce<T, B>(func: (acc: B, value: T) => B, start?: B, iterable?: AnyIterable<T>) {
  if (start === undefined) {
    return (curriedStart: B, curriedIterable?: AnyIterable<T>) =>
      curriedIterable ? _reduce(func, curriedStart, curriedIterable) : reduce(func, curriedStart)
  }
  if (iterable === undefined) {
    return (curriedIterable: AnyIterable<T>) => reduce(func, start, curriedIterable)
  }
  return _reduce(func, start, iterable)
}
