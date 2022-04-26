import { AnyIterable, FlatMapValue } from './types'
import { flatten } from './flatten'
import { filter } from './filter'
import { map } from './map'

/**
 * Map `func` over the `iterable`, flatten the result and then ignore all null or undefined values. It's the transform function we've always needed. It's equivalent to;

```ts
(func, iterable) => filter(i => i !== undefined && i !== null, flatten(map(func, iterable)))
```

*note*: The return value for `func` is `FlatMapValue<B>`. Typescript doesn't have recursive types but you can nest iterables as deep as you like.

The ordering of the results is guaranteed. Errors from the source `iterable` are raised after all mapped values are yielded. Errors from `func` are raised after all previously mapped values are yielded.

```ts
import { flatMap } from 'streaming-iterables'
import { getPokemon, lookupStats } from 'iterable-pokedex'

async function getDefeatedGyms(pokemon) {
  if (pokemon.gymBattlesWon > 0) {
    const stats = await lookupStats(pokemon)
    return stats.gyms
  }
}

for await (const gym of flatMap(getDefeatedGyms, getPokemon())) {
  console.log(gym.name)
}
// "Pewter Gym"
// "Cerulean Gym"
// "Vermilion Gym"
```
 */
export function flatMap<T, B>(func: (data: T) => FlatMapValue<B>): (iterable: AnyIterable<T>) => AsyncGenerator<B>
export function flatMap<T, B>(func: (data: T) => FlatMapValue<B>, iterable: AnyIterable<T>): AsyncGenerator<B>
export function flatMap<T, B>(func: (data: T) => FlatMapValue<B>, iterable?: AnyIterable<T>) {
  if (iterable === undefined) {
    return curriedIterable => flatMap(func, curriedIterable)
  }
  return filter<B>(i => i !== undefined && i !== null, flatten(map<any, any>(func, iterable)))
}
