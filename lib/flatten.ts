import { AnyIterable } from './types'

export async function* flatten<B>(iterable: AnyIterable<B | AnyIterable<B>>): AsyncIterableIterator<B> {
  for await (const maybeItr of iterable) {
    if (maybeItr && typeof maybeItr !== 'string' && (maybeItr[Symbol.iterator] || maybeItr[Symbol.asyncIterator])) {
      for await (const item of flatten(maybeItr as AnyIterable<B>)) {
        yield item
      }
    } else {
      yield maybeItr as B
    }
  }
}
