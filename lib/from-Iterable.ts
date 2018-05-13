export function fromIterable<T> (values: Iterable<T> | Iterator<T>): Iterator<T>
export function fromIterable<T> (values: AsyncIterable<T>|AsyncIterator<T>): AsyncIterator<T>
export function fromIterable (maybeIterable) {
  if (typeof maybeIterable[Symbol.iterator] === 'function') {
    return maybeIterable[Symbol.iterator]()
  }

  if (typeof maybeIterable[Symbol.asyncIterator] === 'function') {
    return maybeIterable[Symbol.asyncIterator]()
  }

  return maybeIterable
}
