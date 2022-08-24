import { AnyIterable } from './types'

async function* _takeWhile<T>(predicate: (data: T) => boolean | Promise<boolean>, iterable: AnyIterable<T>) {
  for await (const data of iterable) {
    if (!await predicate(data)) {
      return
    }
    yield data
  }
}

/**
 * Takes a `predicate` and a `iterable`, and returns a new async iterator of the same type containing the members of the given iterable until the `predicate` returns false.

```ts
import { takeWhile } from 'streaming-iterables'
import { getPokemon } from 'iterable-pokedex'

const firstSlowOnes = takeWhile(pokemon => pokemon.baseStats.speed < 100)

for await (const pokemon of firstSlowOnes(getPokemon())) {
  console.log(pokemon)
}
// Abomasnow
// Abra
// Absol
```
 */
export function takeWhile<T, S extends T>(
  predicate: (data: T) => data is S
): <A extends T>(curriedIterable: AnyIterable<A>) => AsyncGenerator<S>
export function takeWhile<T>(
  predicate: (data: T) => boolean | Promise<boolean>
): <A>(curriedIterable: AnyIterable<A>) => AsyncGenerator<A>
export function takeWhile<T, S extends T>(predicate: (data: T) => data is S, iterable: AnyIterable<T>): AsyncGenerator<S>
export function takeWhile<T>(
  predicate: (data: T) => boolean | Promise<boolean>,
  iterable: AnyIterable<T>
): AsyncGenerator<T>
export function takeWhile<T>(predicate: (data: T) => boolean | Promise<boolean>, iterable?: AnyIterable<T>) {
  if (iterable === undefined) {
    return (curriedIterable: AnyIterable<any>) => _takeWhile(predicate, curriedIterable)
  }
  return _takeWhile(predicate, iterable)
}
