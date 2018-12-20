import { AnyIterable } from './types'
export async function _consume<T>(iterable: AnyIterable<T>) {
  for await (const val of iterable) {
    // do nothing
  }
}

export function consume<T>(iterable: Iterable<T>): void
export function consume<T>(iterable: AsyncIterable<T>): Promise<void>
export function consume<T>(iterable: AnyIterable<T>) {
  if (iterable[Symbol.asyncIterator]) {
    return _consume(iterable)
  }
  for (const val of iterable as Iterable<T>) {
    // do nothing
  }
}
