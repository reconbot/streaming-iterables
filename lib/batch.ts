import { AnyIterable } from './types'

async function* _batch<T>(size: number, iterable: AsyncIterable<T>) {
  let dataBatch: T[] = []
  for await (const data of iterable) {
    dataBatch.push(data)
    if (dataBatch.length === size) {
      yield dataBatch
      dataBatch = []
    }
  }
  if (dataBatch.length > 0) {
    yield dataBatch
  }
}

function* _syncBatch<T>(size: number, iterable: Iterable<T>) {
  let dataBatch: T[] = []
  for (const data of iterable) {
    dataBatch.push(data)
    if (dataBatch.length === size) {
      yield dataBatch
      dataBatch = []
    }
  }
  if (dataBatch.length > 0) {
    yield dataBatch
  }
}

export type UnwrapAnyIterableArray<M extends AnyIterable<any>> = M extends Iterable<infer T>
  ? Generator<T[]>
  : M extends AsyncIterable<infer B>
  ? AsyncGenerator<B[]>
  : never

export type CurriedBatchResult = <T, M extends AnyIterable<T>>(curriedIterable: M) => UnwrapAnyIterableArray<M>

/**
 * Batch objects from `iterable` into arrays of `size` length. The final array may be shorter than size if there is not enough items. Returns a sync iterator if the `iterable` is sync, otherwise an async iterator. Errors from the source `iterable` are immediately raised.

`size` can be between 1 and `Infinity`.

```ts
import { batch } from 'streaming-iterables'
import { getPokemon } from 'iterable-pokedex'

// batch 10 pokemon while we process them
for await (const pokemons of batch(10, getPokemon())) {
  console.log(pokemons) // 10 pokemon at a time!
}
```
 */
export function batch(size: number): CurriedBatchResult
export function batch<T, M extends AnyIterable<T>>(size: number, iterable: M): UnwrapAnyIterableArray<M>
export function batch<T>(size: number, iterable?: AnyIterable<T>): CurriedBatchResult | UnwrapAnyIterableArray<any> {
  if (iterable === undefined) {
    return curriedIterable => batch(size, curriedIterable)
  }
  if (iterable[Symbol.asyncIterator]) {
    return _batch(size, iterable as AsyncIterable<T>)
  }
  return _syncBatch(size, iterable as Iterable<T>)
}
