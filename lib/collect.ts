import { AnyIterable } from './types'

async function _collect<T>(iterable: AsyncIterable<T>) {
  const values: T[] = []
  for await (const value of iterable) {
    values.push(value)
  }
  return values
}

export type UnwrapToPromiseOrAsyncIterable<M extends AnyIterable<any>> = M extends Iterable<infer T>
  ? T[]
  : M extends AsyncIterable<infer B>
  ? Promise<B[]>
  : never

/**
 * Collect all the values from an iterable into an array. Returns an array if you pass it an iterable and a promise for an array if you pass it an async iterable. Errors from the source `iterable` are raised immediately.

```ts
import { collect } from 'streaming-iterables'
import { getPokemon } from 'iterable-pokedex'

console.log(await collect(getPokemon()))
// [bulbasaur, ivysaur, venusaur, charmander, ...]
```
 */
export function collect<T, M extends AnyIterable<T>>(iterable: M): UnwrapToPromiseOrAsyncIterable<M>
export function collect<T>(iterable: AnyIterable<T>) {
  if (iterable[Symbol.asyncIterator]) {
    return _collect(iterable as AsyncIterable<any>)
  }
  return Array.from(iterable as Iterable<any>)
}
