import { Iterableish } from './types'
async function* _map (func, iterable) {
  for await (const val of iterable) {
    yield await func(val)
  }
}

export function map<T, B> (
  func: (data: T) => B|Promise<B>,
): (iterable: Iterableish<T>) => AsyncIterator<B>
export function map<T, B> (
  func: (data: T) => B|Promise<B>,
  iterable: Iterableish<T>,
): AsyncIterator<B>
export function map (func, iterable?) {
  if (iterable === undefined) {
    return curriedIterable => _map(func, curriedIterable)
  }
  return _map(func, iterable)
}
