import { getIterator } from './get-iterator'
import { AnyIterable } from './types'

async function* _buffer<T>(size: number, iterable: AnyIterable<T>): AsyncIterableIterator<T> {
  const iterator = getIterator(iterable)
  const buff: Array<IteratorResult<T> | Promise<IteratorResult<T>>> = []
  for (let i = 0; i <= size; i++) {
    buff.push(iterator.next())
  }
  while (true) {
    const result = await buff.shift()
    if (!result) {
      // this will literally never happen but lets make ts happy
      return
    }
    const { value, done } = result
    if (done) {
      return
    }
    yield value
    buff.push(iterator.next())
  }
}

export function buffer(size: number): <T>(curriedIterable: AnyIterable<T>) => AsyncIterableIterator<T>
export function buffer<T>(size: number, iterable: AnyIterable<T>): AsyncIterableIterator<T>
export function buffer<T>(size: number, iterable?: AnyIterable<T>) {
  if (iterable === undefined) {
    return (curriedIterable: AnyIterable<T>) => _buffer(size, curriedIterable)
  }
  return _buffer(size, iterable)
}
