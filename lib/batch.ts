async function* _batch<T>(size: number, iterable: AsyncIterable<T>) {
  let dataBatch: T[] = []
  for await (const data of iterable) {
    dataBatch.push(data)
    if (dataBatch.length === size) {
      yield dataBatch
      dataBatch = []
    }
  }
  if (dataBatch.length > 0) {
    yield dataBatch
  }
}

function* _syncBatch<T>(size: number, iterable: Iterable<T>) {
  let dataBatch: T[] = []
  for (const data of iterable) {
    dataBatch.push(data)
    if (dataBatch.length === size) {
      yield dataBatch
      dataBatch = []
    }
  }
  if (dataBatch.length > 0) {
    yield dataBatch
  }
}

export function batch(
  size: number
): {
  <T>(curriedIterable: AsyncIterable<T>): AsyncIterableIterator<T[]>
  <T>(curriedIterable: Iterable<T>): IterableIterator<T[]>
}
export function batch<T>(size: number, iterable: AsyncIterable<T>): AsyncIterableIterator<T[]>
export function batch<T>(size: number, iterable: Iterable<T>): IterableIterator<T[]>
export function batch<T>(size: number, iterable?: Iterable<T> | AsyncIterable<T>) {
  if (iterable === undefined) {
    return curriedIterable => batch(size, curriedIterable)
  }
  if (iterable[Symbol.asyncIterator]) {
    return _batch(size, iterable as AsyncIterable<T>)
  }
  return _syncBatch(size, iterable as Iterable<T>)
}
