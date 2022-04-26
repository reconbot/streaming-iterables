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

/**
 * Combine multiple iterators into a single iterable. Reads each iterable completely one at a time. Returns a sync iterator if all `iterables` are sync, otherwise it returns an async iterable. Errors from the source `iterable` are raised immediately.

```ts
import { concat } from 'streaming-iterables'
import { getPokemon } from 'iterable-pokedex'
import { getTransformers } from './util'

for await (const hero of concat(getPokemon(2), getTransformers(2))) {
  console.log(hero)
}
// charmander
// bulbasaur <- end of pokemon
// megatron
// bumblebee <- end of transformers
```
 */
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
