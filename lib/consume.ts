import { AnyIterable } from './types'
export async function _consume<T>(iterator: AnyIterable<T>) {
  for await (const val of iterator) {
    // do nothing
  }
}

export function consume<T>(iterator: Iterable<T>): void
export function consume<T>(iterator: AsyncIterable<T>): Promise<void>
export function consume<T>(iterator: AnyIterable<T>) {
  if (iterator[Symbol.asyncIterator]) {
    return _consume(iterator)
  }
  for (const val of iterator as Iterable<T>) {
    // do nothing
  }
}
