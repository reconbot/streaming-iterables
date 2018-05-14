import { Iterableish } from './types'

export function fromIterable<T> (values: Iterable<T> | Iterator<T>): Iterator<T>
export function fromIterable<T> (values: AsyncIterable<T>|AsyncIterator<T>): AsyncIterator<T>
export function fromIterable<T> (values: Iterableish<T>): AsyncIterable<T>
export function fromIterable (maybeIterable) {
  if (typeof maybeIterable[Symbol.iterator] === 'function') {
    return maybeIterable[Symbol.iterator]()
  }

  if (typeof maybeIterable[Symbol.asyncIterator] === 'function') {
    return maybeIterable[Symbol.asyncIterator]()
  }

  if (maybeIterable && typeof maybeIterable.next === 'function') {
    return maybeIterable
  }

  if (maybeIterable && typeof maybeIterable === 'function') {
    return maybeIterable()
  }

  throw new TypeError('"maybeIterable" does not to conform to any of the iterator or iterable protocols')
}
