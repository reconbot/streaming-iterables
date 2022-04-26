import { AnyIterable } from './types'

async function* _asyncTap<T>(func: (data: T) => any, iterable: AnyIterable<T>) {
  for await (const val of iterable) {
    await func(val)
    yield val
  }
}

/**
 * Returns a new iterator that yields the data it consumes, passing the data through to a function. If you provide an async function, the iterator will wait for the promise to resolve before yielding the value. This is useful for logging, or processing information and passing it along.
 */
export function tap<T>(func: (data: T) => any): (iterable: AnyIterable<T>) => AsyncGenerator<T>
export function tap<T>(func: (data: T) => any, iterable: AnyIterable<T>): AsyncGenerator<T>
export function tap<T>(func: (data: T) => any, iterable?: AnyIterable<T>) {
  if (iterable === undefined) {
    return (curriedIterable: AnyIterable<T>) => _asyncTap(func, curriedIterable)
  }
  return _asyncTap(func, iterable)
}
