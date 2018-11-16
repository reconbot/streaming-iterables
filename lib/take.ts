import { AnyIterable } from './types'

async function* _take<T>(count: number, iterable: AnyIterable<T>) {
  let taken = 0
  for await (const val of iterable as AsyncIterable<T>) {
    yield await val
    taken++
    if (taken >= count) {
      return
    }
  }
}
export function take<T>(count: number): (iterable: AnyIterable<T>) => AsyncIterableIterator<T>
export function take<T>(count: number, iterable: AnyIterable<T>): AsyncIterableIterator<T>
export function take(count, iterable?) {
  if (iterable === undefined) {
    return curriedIterable => _take(count, curriedIterable)
  }
  return _take(count, iterable)
}
