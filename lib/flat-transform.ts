import { AnyIterable, FlatMapValue } from './types'
import { flatten } from './flatten'
import { filter } from './filter'
import { getIterator } from './get-iterator'
import { defer, Deferred } from 'inside-out-async'

function _flatTransform<T, R>(
  concurrency: number,
  func: (data: T) => R | Promise<R>,
  iterable: AnyIterable<T>
): AsyncIterableIterator<R> {
  const iterator = getIterator(iterable)

  const resultQueue: R[] = []
  const readQueue: Deferred<IteratorResult<R>>[] = []

  let ended = false
  let reading = false
  let inflightCount = 0
  let lastError: Error | null = null

  function fulfillReadQueue() {
    while (readQueue.length > 0 && resultQueue.length > 0) {
      const { resolve } = readQueue.shift() as Deferred<IteratorResult<R>>
      const value = resultQueue.shift() as R
      resolve({ done: false, value } as any)
    }
    while (readQueue.length > 0 && inflightCount === 0 && ended) {
      const { resolve, reject } = readQueue.shift() as Deferred<IteratorResult<R>>
      if (lastError) {
        reject(lastError)
        lastError = null
      } else {
        resolve({ done: true, value: undefined } as any)
      }
    }
  }

  async function fillQueue() {
    if (ended) {
      fulfillReadQueue()
      return
    }
    if (reading) {
      return
    }
    if (inflightCount + resultQueue.length >= concurrency) {
      return
    }
    reading = true
    inflightCount++
    try {
      const { done, value } = await iterator.next()
      if (done) {
        ended = true
        inflightCount--
        fulfillReadQueue()
      } else {
        mapAndQueue(value)
      }
    } catch (error) {
      ended = true
      inflightCount--
      lastError = error
      fulfillReadQueue()
    }
    reading = false
    fillQueue()
  }

  async function mapAndQueue(itrValue: T) {
    try {
      const value = await func(itrValue)
      if (value && value[Symbol.asyncIterator]) {
        for await (const asyncVal of value as any) {
          resultQueue.push(asyncVal)
        }
      } else {
        resultQueue.push(value)
      }
    } catch (error) {
      ended = true
      lastError = error
    }
    inflightCount--
    fulfillReadQueue()
    fillQueue()
  }

  async function next() {
    if (resultQueue.length === 0) {
      const deferred = defer<IteratorResult<R>>()
      readQueue.push(deferred)
      fillQueue()
      return deferred.promise
    }
    const value = resultQueue.shift() as R
    fillQueue()
    return { done: false, value }
  }

  const asyncIterableIterator = {
    next,
    [Symbol.asyncIterator]: () => asyncIterableIterator,
  }

  return asyncIterableIterator
}

/**
 * Map `func` over the `iterable`, flatten the result and then ignore all null or undefined values. Returned async iterables are flattened concurrently too. It's the transform function we've always wanted.

It's similar to;

```ts
const filterEmpty = filter(i => i !== undefined && i !== null)
(concurrency, func, iterable) => filterEmpty(flatten(transform(concurrency, func, iterable)))
```

*note*: The return value for `func` is `FlatMapValue<B>`. Typescript doesn't have recursive types but you can nest iterables as deep as you like. However only directly returned async iterables are processed concurrently. (Eg, if you use an async generator function as `func` it's output will be processed concurrently, but if it's nested inside other iterables it will be processed sequentially.)

Order is determined by when async operations resolve. And it will run up to `concurrency` async operations at once. This includes promises and async iterables returned from `func`. Errors from the source `iterable` are raised after all transformed values are yielded. Errors from `func` are raised after all previously transformed values are yielded.

`concurrency` can be between 1 and `Infinity`.

Promise Example;

```ts
import { flatTransform } from 'streaming-iterables'
import { getPokemon, lookupStats } from 'iterable-pokedex'

async function getDefeatedGyms(pokemon) {
  if (pokemon.gymBattlesWon > 0) {
    const stats = await lookupStats(pokemon)
    return stats.gyms
  }
}

// lookup 10 stats at a time
for await (const gym of flatTransform(10, getDefeatedGyms, getPokemon())) {
  console.log(gym.name)
}
// "Pewter Gym"
// "Cerulean Gym"
// "Vermilion Gym"
```

Async Generator Example

```ts
import { flatTransform } from 'streaming-iterables'
import { getPokemon } from 'iterable-pokedex'
import { findFriendsFB, findFriendsMySpace } from './util'


async function* findFriends (pokemon) {
  yield await findFriendsFB(pokemon.name)
  yield await findFriendsMySpace(pokemon.name)
}

for await (const pokemon of flatTransform(10, findFriends, getPokemon())) {
  console.log(pokemon.name)
}
// Pikachu
// Meowth
// Ash - FB
// Jessie - FB
// Misty - MySpace
// James - MySpace
```
 */
export function flatTransform(
  concurrency: number
): {
  <T, R>(func: (data: T) => FlatMapValue<R>, iterable: AnyIterable<T>): AsyncGenerator<R>
  <T, R>(func: (data: T) => FlatMapValue<R>): (iterable: AnyIterable<T>) => AsyncGenerator<R>
}
export function flatTransform<T, R>(
  concurrency: number,
  func: (data: T) => FlatMapValue<R>
): (iterable: AnyIterable<T>) => AsyncGenerator<R>
export function flatTransform<T, R>(
  concurrency: number,
  func: (data: T) => FlatMapValue<R>,
  iterable: AnyIterable<T>
): AsyncGenerator<R>
export function flatTransform<T, R>(
  concurrency: number,
  func?: (data: T) => FlatMapValue<R>,
  iterable?: AnyIterable<T>
) {
  if (func === undefined) {
    return <A, B>(curriedFunc: (data: A) => B | Promise<B>, curriedIterable?: AnyIterable<A>) =>
      curriedIterable
        ? flatTransform<A, B>(concurrency, curriedFunc, curriedIterable)
        : flatTransform<A, B>(concurrency, curriedFunc)
  }
  if (iterable === undefined) {
    return (curriedIterable: AnyIterable<T>) => flatTransform<T, R>(concurrency, func, curriedIterable)
  }
  return filter<R>(i => i !== undefined && i !== null, flatten(_flatTransform<any, any>(concurrency, func, iterable)))
}
