import { AnyIterable } from './types'
export async function collect<T>(iterable: AnyIterable<T>) {
  const values: T[] = []
  for await (const value of iterable) {
    values.push(value)
  }
  return values
}
