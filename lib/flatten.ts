import { AnyIterable } from './types'

export async function* flatten<B>(iterable: AnyIterable<B | AnyIterable<B>>): AsyncIterableIterator<B> {
  for await (const maybeItr of iterable) {
    if (maybeItr && typeof maybeItr !== 'string' && (maybeItr[Symbol.iterator] || maybeItr[Symbol.asyncIterator])) {
      yield* flatten(maybeItr as AnyIterable<B>)
    } else {
      yield maybeItr as B
    }
  }
}
