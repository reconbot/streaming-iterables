import { AnyIterable, UnwrapAnyIterable } from './types'

async function* _drop<T>(count: number, iterable: AsyncIterable<T>) {
  let skipped = 0
  for await (const val of iterable) {
    if (skipped < count) {
      skipped++
      continue
    }
    yield await val
  }
}

function* _syncDrop<T>(count: number, iterable: Iterable<T>) {
  let skipped = 0
  for (const val of iterable) {
    if (skipped < count) {
      skipped++
      continue
    }
    yield val
  }
}

export type CurriedDropResult = <T, M extends AnyIterable<T>>(curriedIterable: M) => UnwrapAnyIterable<M>

export function drop(count: number): CurriedDropResult
export function drop<T, M extends AnyIterable<T>>(count: number, iterable: M): UnwrapAnyIterable<M>
export function drop<T>(count: number, iterable?: AnyIterable<T>): CurriedDropResult | UnwrapAnyIterable<any> {
  if (iterable === undefined) {
    return curriedIterable => drop(count, curriedIterable)
  }
  if (iterable[Symbol.asyncIterator]) {
    return _drop(count, iterable as AsyncIterable<T>)
  }
  return _syncDrop(count, iterable as Iterable<T>)
}
