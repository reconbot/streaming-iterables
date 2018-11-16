import { AnyIterable } from './types'
async function* _map<T, B>(func: (data: T) => B | Promise<B>, iterable: AnyIterable<T>) {
  for await (const val of iterable) {
    yield await func(val)
  }
}

export function map<T, B>(func: (data: T) => B | Promise<B>): (iterable: AnyIterable<T>) => AsyncIterableIterator<B>
export function map<T, B>(func: (data: T) => B | Promise<B>, iterable: AnyIterable<T>): AsyncIterableIterator<B>
export function map<T, B>(func: (data: T) => B | Promise<B>, iterable?: AnyIterable<T>) {
  if (iterable === undefined) {
    return (curriedIterable: AnyIterable<T>) => _map(func, curriedIterable)
  }
  return _map(func, iterable)
}
