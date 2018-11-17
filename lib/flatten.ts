import { AnyIterable } from './types'

export async function* flatten(iterable: AnyIterable<any>): AsyncIterableIterator<any> {
  for await (const maybeItr of iterable) {
    if (maybeItr[Symbol.iterator] || maybeItr[Symbol.asyncIterator]) {
      for await (const item of flatten(maybeItr)) {
        yield item
      }
    } else {
      yield maybeItr
    }
  }
}
