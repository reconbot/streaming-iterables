import { Iterableish } from './types'

export function getIterator<T>(values: Iterableish<T>): Iterator<T> | AsyncIterator<T> {
  if (typeof (values as Iterator<T>).next === 'function') {
    return values as Iterator<T> | AsyncIterator<T>
  }

  if (typeof values[Symbol.iterator] === 'function') {
    return values[Symbol.iterator]() as Iterator<T>
  }

  if (typeof values[Symbol.asyncIterator] === 'function') {
    return values[Symbol.asyncIterator]() as AsyncIterator<T>
  }

  throw new TypeError('"values" does not to conform to any of the iterator or iterable protocols')
}
