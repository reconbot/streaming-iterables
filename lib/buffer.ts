import { fromIterable } from './from-iterable'
import { Iterableish } from './types'

async function* _buffer<T> (size: number, iterable: Iterableish<T>): AsyncIterableIterator<T> {
  const iterator = fromIterable(iterable as Iterable<T>)
  const buff = []
  for (let i = 0; i <= size; i++) {
    buff.push(iterator.next())
  }
  while (true) {
    const { value, end } = await buff.shift()
    if (!end) {
      yield value
    } else {
      return
    }
    buff.push(iterator.next())
  }
}

export function buffer<T> (size: number): (iterable: Iterableish<T>) => AsyncIterableIterator<T>
export function buffer<T> (size: number, iterable: Iterableish<T>): AsyncIterableIterator<T>
export function buffer (size, iterable?) {
  if (iterable === undefined) {
    return curriedIterable => _buffer(size, curriedIterable)
  }
  return _buffer(size, iterable)
}
