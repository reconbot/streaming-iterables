/// <reference lib="esnext.asynciterable" />
import { AnyIterable, UnArrayAnyIterable } from './types'

async function* _concat<I extends AnyIterable<any>[]>(iterables: I): AsyncIterable<UnArrayAnyIterable<I>> {
  for await (const iterable of iterables) {
    yield* iterable
  }
}

function* _syncConcat<I extends Iterable<any>[]>(iterables: I): Iterable<UnArrayAnyIterable<I>> {
  for (const iterable of iterables) {
    yield* iterable
  }
}

export function concat<I extends Iterable<any>[]>(...iterables: I): Iterable<UnArrayAnyIterable<I>>
export function concat<I extends AnyIterable<any>[]>(...iterables: I): AsyncIterable<UnArrayAnyIterable<I>>
export function concat(...iterables: AnyIterable<any>[]) {
  const hasAnyAsync = iterables.find(itr => itr[Symbol.asyncIterator] !== undefined)
  if (hasAnyAsync) {
    return _concat(iterables)
  } else {
    return _syncConcat(iterables as Iterable<any>[])
  }
}
