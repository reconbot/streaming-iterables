import { fromIterable } from '.'
import { Iterableish } from './types'
export async function _reduce<T, B> (func: (B, T) => B, start: B, iterable: Iterableish<T>) {
  let value = start
  for await (const nextItem of fromIterable(iterable)) {
    value = await func(value, nextItem)
  }
  return value
}

// export function reduce<T, B> (func: (B, T) => B): (start: B) => (iterable: Iterableish<T>) => Promise<B>
export function reduce<T, B> (func: (B, T) => B, start: B): (iterable: Iterableish<T>) => Promise<B>
export function reduce<T, B> (func: (B, T) => B, start: B, iterable: Iterableish<T>): Promise<B>
export function reduce (func, start?, iterable?) {
  if (start === undefined) {
    return (curriedStart, curriedIterable?) => reduce(func, curriedStart, curriedIterable)
  }
  if (iterable === undefined) {
    return curriedIterable => reduce(func, start, curriedIterable)
  }
  return _reduce(func, start, iterable)
}
