import { Iterableish } from './types'
export async function collect<T> (iterable: Iterableish<T>) {
  const values = []
  for await (const value of iterable as AsyncIterable<T>) {
    values.push(value)
  }
  return values
}
