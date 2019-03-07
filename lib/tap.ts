/// <reference lib="esnext.asynciterable" />
import { AnyIterable } from './types'

async function* _asyncTap<T>(func: (data: T) => any, iterable: AnyIterable<T>) {
  for await (const val of iterable) {
    await func(val)
    yield val
  }
}

export function tap<T>(func: (data: T) => any): (iterable: AnyIterable<T>) => AsyncIterableIterator<T>
export function tap<T>(func: (data: T) => any, iterable: AnyIterable<T>): AsyncIterableIterator<T>
export function tap<T>(func: (data: T) => any, iterable?: AnyIterable<T>) {
  if (iterable === undefined) {
    return (curriedIterable: AnyIterable<T>) => _asyncTap(func, curriedIterable)
  }
  return _asyncTap(func, iterable)
}
