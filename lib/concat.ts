import { AnyIterable } from './types'
async function* _concat(iterables: Array<AnyIterable<any>>) {
  for await (const iterable of iterables) {
    for await (const value of iterable) {
      yield value
    }
  }
}

function* _syncConcat(iterables: Array<Iterable<any>>) {
  for (const iterable of iterables) {
    for (const value of iterable) {
      yield value
    }
  }
}

export function concat(...iterables: Array<Iterable<any>>): IterableIterator<any>
export function concat(...iterables: Array<AnyIterable<any>>): AsyncIterableIterator<any>
export function concat(...iterables: Array<AnyIterable<any>>) {
  const hasAsync = iterables.find(itr => itr[Symbol.asyncIterator] !== undefined)
  if (hasAsync) {
    return _concat(iterables)
  } else {
    return _syncConcat(iterables as Array<Iterable<any>>)
  }
}
