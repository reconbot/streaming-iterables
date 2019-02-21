import { AnyIterable } from './types'

async function* _take<T>(count: number, iterable: AsyncIterable<T>) {
  let taken = 0
  for await (const val of iterable) {
    yield await val
    taken++
    if (taken >= count) {
      return
    }
  }
}

function* _syncTake<T>(count: number, iterable: Iterable<T>) {
  let taken = 0
  for (const val of iterable) {
    yield val
    taken++
    if (taken >= count) {
      return
    }
  }
}

export function take<T>(
  count: number
): {
  (curriedIterable: AsyncIterable<T>): AsyncIterableIterator<T>
  (curriedIterable: Iterable<T>): IterableIterator<T>
}
export function take<T>(count: number, iterable: AsyncIterable<T>): AsyncIterableIterator<T>
export function take<T>(count: number, iterable: Iterable<T>): IterableIterator<T>
export function take<T>(count: number, iterable?: AnyIterable<T>) {
  if (iterable === undefined) {
    return curriedIterable => take(count, curriedIterable)
  }
  if (iterable[Symbol.asyncIterator]) {
    return _take(count, iterable as AsyncIterable<T>)
  }
  return _syncTake(count, iterable as Iterable<T>)
}
