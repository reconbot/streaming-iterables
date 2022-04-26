import { AnyIterable, UnwrapAnyIterable } from './types'

async function* _drop<T>(count: number, iterable: AsyncIterable<T>) {
  let skipped = 0
  for await (const val of iterable) {
    if (skipped < count) {
      skipped++
      continue
    }
    yield await val
  }
}

function* _syncDrop<T>(count: number, iterable: Iterable<T>) {
  let skipped = 0
  for (const val of iterable) {
    if (skipped < count) {
      skipped++
      continue
    }
    yield val
  }
}

export type CurriedDropResult = <T, M extends AnyIterable<T>>(curriedIterable: M) => UnwrapAnyIterable<M>

/**
 * Returns a new iterator that skips a specific number of items from `iterable`. When used with generators it advances the generator `count` items, when used with arrays it gets a new iterator and skips `count` items.

```ts
import { pipeline, drop, collect } from 'streaming-iterables'
import { getPokemon } from 'iterable-pokedex'

const allButFirstFive = await collect(drop(5, getPokemon()))
// first five pokemon
```
 */
export function drop(count: number): CurriedDropResult
export function drop<T, M extends AnyIterable<T>>(count: number, iterable: M): UnwrapAnyIterable<M>
export function drop<T>(count: number, iterable?: AnyIterable<T>): CurriedDropResult | UnwrapAnyIterable<any> {
  if (iterable === undefined) {
    return curriedIterable => drop(count, curriedIterable)
  }
  if (iterable[Symbol.asyncIterator]) {
    return _drop(count, iterable as AsyncIterable<T>)
  }
  return _syncDrop(count, iterable as Iterable<T>)
}
