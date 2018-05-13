import { Iterableish } from './types'
export async function consume<T> (iterator: Iterableish<T>) {
  for await (const val of iterator as AsyncIterable<T>) {
    // do nothing
  }
}
