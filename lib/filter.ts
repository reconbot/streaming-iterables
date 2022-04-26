import { AnyIterable } from './types'

async function* _filter<T>(filterFunc: (data: T) => boolean | Promise<boolean>, iterable: AnyIterable<T>) {
  for await (const data of iterable) {
    if (await filterFunc(data)) {
      yield data
    }
  }
}

/**
 * Takes a `filterFunc` and a `iterable`, and returns a new async iterator of the same type containing the members of the given iterable which cause the `filterFunc` to return true.

```ts
import { filter } from 'streaming-iterables'
import { getPokemon } from 'iterable-pokedex'

const filterWater = filter(pokemon => pokemon.types.include('Water'))

for await (const pokemon of filterWater(getPokemon())) {
  console.log(pokemon)
}
// squirtle
// vaporeon
// magikarp
```
 */
export function filter<T, S extends T>(
  filterFunc: (data: T) => data is S
): <A extends T>(curriedIterable: AnyIterable<A>) => AsyncGenerator<S>
export function filter<T>(
  filterFunc: (data: T) => boolean | Promise<boolean>
): <A>(curriedIterable: AnyIterable<A>) => AsyncGenerator<A>
export function filter<T, S extends T>(filterFunc: (data: T) => data is S, iterable: AnyIterable<T>): AsyncGenerator<S>
export function filter<T>(
  filterFunc: (data: T) => boolean | Promise<boolean>,
  iterable: AnyIterable<T>
): AsyncGenerator<T>
export function filter<T>(filterFunc: (data: T) => boolean | Promise<boolean>, iterable?: AnyIterable<T>) {
  if (iterable === undefined) {
    return (curriedIterable: AnyIterable<any>) => _filter(filterFunc, curriedIterable)
  }
  return _filter(filterFunc, iterable)
}
