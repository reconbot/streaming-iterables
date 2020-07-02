/// <reference lib="esnext.asynciterable" />
import { AnyIterable } from './types'

async function _collect<T>(iterable: AsyncIterable<T>) {
  const values: T[] = []
  for await (const value of iterable) {
    values.push(value)
  }
  return values
}

export type UnwrapToPromiseOrAsyncIterable<M extends AnyIterable<any>> = M extends Iterable<infer T>
  ? T[]
  : M extends AsyncIterable<infer B>
  ? Promise<B[]>
  : never

export function collect<T, M extends AnyIterable<T>>(iterable: M): UnwrapToPromiseOrAsyncIterable<M>
export function collect<T>(iterable: AnyIterable<T>) {
  if (iterable[Symbol.asyncIterator]) {
    return _collect(iterable as AsyncIterable<any>)
  }
  return Array.from(iterable as Iterable<any>)
}
