import { Iterableish } from './types'
export async function* concat (...iterables: Array<Iterableish<any>>) {
  for await (const iterable of iterables) {
    for await (const value of iterable as AsyncIterable<any>) {
      yield value
    }
  }
}
