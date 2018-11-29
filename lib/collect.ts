import { AnyIterable } from './types'
async function _collect<T>(iterable: AsyncIterable<T>) {
  const values: T[] = []
  for await (const value of iterable) {
    values.push(value)
  }
  return values
}

function _syncCollect<T>(iterable: Iterable<T>) {
  const values: T[] = []
  for (const value of iterable) {
    values.push(value)
  }
  return values
}

export function collect<T>(iterable: Iterable<T>): T[]
export function collect<T>(iterable: AsyncIterable<T>): Promise<T[]>
export function collect<T>(iterable: AnyIterable<T>) {
  if (iterable[Symbol.asyncIterator]) {
    return _collect(iterable as AsyncIterable<T>)
  }
  return _syncCollect(iterable as Iterable<T>)
}
