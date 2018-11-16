import { AnyIterable } from './types'
export async function consume<T>(iterator: AnyIterable<T>) {
  for await (const val of iterator) {
    // do nothing
  }
}
