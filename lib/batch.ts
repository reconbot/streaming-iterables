import { AnyIterable } from './types'

async function* _batch<T>(size: number, iterable: AnyIterable<T>) {
  let dataBatch: T[] = []
  for await (const data of iterable) {
    dataBatch.push(data)
    if (dataBatch.length === size) {
      yield dataBatch
      dataBatch = []
    }
  }
  if (dataBatch.length > 0) {
    yield dataBatch
  }
}

export function batch(size: number): <T>(curriedIterable: AnyIterable<T>) => AsyncIterableIterator<T[]>
export function batch<T>(size: number, iterable: AnyIterable<T>): AsyncIterableIterator<T[]>
export function batch<T>(size: number, iterable?: AnyIterable<T>) {
  if (iterable === undefined) {
    return (curriedIterable: AnyIterable<T>) => _batch(size, curriedIterable)
  }
  return _batch(size, iterable)
}
