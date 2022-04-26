import { AnyIterable, UnwrapAnyIterable } from './types'

async function* _take<T>(count: number, iterable: AsyncIterable<T>) {
  let taken = 0
  for await (const val of iterable) {
    yield await val
    taken++
    if (taken >= count) {
      break
    }
  }
}

function* _syncTake<T>(count: number, iterable: Iterable<T>) {
  let taken = 0
  for (const val of iterable) {
    yield val
    taken++
    if (taken >= count) {
      break
    }
  }
}

export type CurriedTakeResult = <T, M extends AnyIterable<T>>(curriedIterable: M) => UnwrapAnyIterable<M>


/**
 * Returns a new iterator that reads a specific number of items from `iterable`. When used with generators it advances the generator, when used with arrays it gets a new iterator and starts from the beginning.

```ts
import { pipeline, take, collect } from 'streaming-iterables'
import { getPokemon } from 'iterable-pokedex'

const topFive = await collect(take(5, getPokemon()))
// first five pokemon
```
 */
export function take(count: number): CurriedTakeResult
export function take<T, M extends AnyIterable<T>>(count: number, iterable: M): UnwrapAnyIterable<M>
export function take<T>(count: number, iterable?: AnyIterable<T>): CurriedTakeResult | UnwrapAnyIterable<any> {
  if (iterable === undefined) {
    return curriedIterable => take(count, curriedIterable)
  }
  if (iterable[Symbol.asyncIterator]) {
    return _take(count, iterable as AsyncIterable<T>)
  }
  return _syncTake(count, iterable as Iterable<T>)
}
