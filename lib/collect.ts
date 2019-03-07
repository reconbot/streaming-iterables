/// <reference lib="esnext.asynciterable" />
async function _collect<T>(iterable: AsyncIterable<T>) {
  const values: T[] = []
  for await (const value of iterable) {
    values.push(value)
  }
  return values
}

export function collect<T>(iterable: AsyncIterable<T>): Promise<T[]>
export function collect<T>(iterable: Iterable<T>): T[]
export function collect<T>(iterable: any) {
  if (iterable[Symbol.asyncIterator]) {
    return _collect(iterable as AsyncIterable<T>)
  }
  return Array.from(iterable as Iterable<T>)
}
