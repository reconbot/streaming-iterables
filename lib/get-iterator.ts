/// <reference lib="esnext.asynciterable" />
import { Iterableish } from './types'

export function getIterator<T>(iterable: Iterable<T> | Iterator<T>): Iterator<T>
export function getIterator<T>(iterable: AsyncIterable<T> | AsyncIterator<T>): AsyncIterator<T>
export function getIterator<T>(iterable: AsyncIterable<T> | Iterable<T>): AsyncIterator<T> | Iterator<T>
export function getIterator<T>(iterable: Iterableish<T>) {
  if (typeof (iterable as Iterator<T>).next === 'function') {
    return iterable as Iterator<T> | AsyncIterator<T>
  }

  if (typeof iterable[Symbol.iterator] === 'function') {
    return iterable[Symbol.iterator]() as Iterator<T>
  }

  if (typeof iterable[Symbol.asyncIterator] === 'function') {
    return iterable[Symbol.asyncIterator]() as AsyncIterator<T>
  }

  throw new TypeError('"values" does not to conform to any of the iterator or iterable protocols')
}
