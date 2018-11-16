import { AnyIterable } from './types'
export async function* concat(...iterables: Array<AnyIterable<any>>) {
  for await (const iterable of iterables) {
    for await (const value of iterable) {
      yield value
    }
  }
}
