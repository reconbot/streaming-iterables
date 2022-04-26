import { AnyIterable } from './types'
export async function _consume<T>(iterable: AnyIterable<T>) {
  for await (const val of iterable) {
    // do nothing
  }
}

/**
 * A promise that resolves after the function drains the iterable of all data. Useful for processing a pipeline of data. Errors from the source `iterable` are raised immediately.

```ts
import { consume, map } from 'streaming-iterables'
import { getPokemon, trainMonster } from 'iterable-pokedex'

const train = map(trainMonster)
await consume(train(getPokemon())) // load all the pokemon and train them!
```
 */
export function consume<T>(iterable: Iterable<T>): void
export function consume<T>(iterable: AsyncIterable<T>): Promise<void>
export function consume<T>(iterable: AnyIterable<T>) {
  if (iterable[Symbol.asyncIterator]) {
    return _consume(iterable)
  }
  for (const val of iterable as Iterable<T>) {
    // do nothing
  }
}
