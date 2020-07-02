/// <reference lib="esnext.asynciterable" />
import { AnyIterable } from './types'

async function* _batch<T>(size: number, iterable: AsyncIterable<T>) {
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

function* _syncBatch<T>(size: number, iterable: Iterable<T>) {
  let dataBatch: T[] = []
  for (const data of iterable) {
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

export type UnwrapAnyIterableArray<M extends AnyIterable<any>> = M extends Iterable<infer T>
  ? Generator<T[]>
  : M extends AsyncIterable<infer B>
  ? AsyncGenerator<B[]>
  : never

export type CurriedBatchResult = <T, M extends AnyIterable<T>>(curriedIterable: M) => UnwrapAnyIterableArray<M>

export function batch(size: number): CurriedBatchResult
export function batch<T, M extends AnyIterable<T>>(size: number, iterable: M): UnwrapAnyIterableArray<M>
export function batch<T>(size: number, iterable?: AnyIterable<T>): CurriedBatchResult | UnwrapAnyIterableArray<any> {
  if (iterable === undefined) {
    return curriedIterable => batch(size, curriedIterable)
  }
  if (iterable[Symbol.asyncIterator]) {
    return _batch(size, iterable as AsyncIterable<T>)
  }
  return _syncBatch(size, iterable as Iterable<T>)
}
