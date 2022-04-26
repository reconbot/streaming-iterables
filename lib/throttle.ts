/// <reference lib="esnext.asynciterable" />
import { AnyIterable } from './types'

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

function _throttle<T>(limit: number, interval: number, iterable: AnyIterable<T>) {
  if (!Number.isFinite(limit)) {
    throw new TypeError('Expected `limit` to be a finite number')
  }
  if (limit <= 0) {
    throw new TypeError('Expected `limit` to be greater than 0')
  }
  if (!Number.isFinite(interval)) {
    throw new TypeError('Expected `interval` to be a finite number')
  }
  return (async function* __throttle() {
    let sent = 0
    let time: number | undefined
    for await (const val of iterable) {
      if (sent < limit) {
        if (typeof time === 'undefined') {
          time = Date.now()
        }
        sent++
        yield val
        continue
      }
      // Only wait if the interval hasn't already passed while we were
      // yielding the previous values.
      const elapsedMs = Date.now() - time!
      const waitFor = interval - elapsedMs
      if (waitFor > 0) {
        await sleep(waitFor)
      }
      time = Date.now()
      sent = 1
      yield val
    }
  })()
}

/**
 * Throttles `iterable` at a rate of `limit` per `interval` without discarding data. Useful for throttling rate limited APIs.

`limit` can be greater than 0 but less than `Infinity`.
`interval` can be greater than or equal to 0 but less than `Infinity`.

```ts
import { throttle } from 'streaming-iterables'
import { getPokemon, trainMonster } from 'iterable-pokedex'

// load monsters at a maximum rate of 1 per second
for await (const monster of throttle(1, 1000, getPokemon())) {
  await trainMonster(monster)
}
```
 */
export function throttle<T>(limit: number, interval: number): (iterable: AnyIterable<T>) => AsyncGenerator<T>
export function throttle<T>(limit: number, interval: number, iterable: AnyIterable<T>): AsyncGenerator<T>
export function throttle<T>(limit: number, interval: number, iterable?: AnyIterable<T>) {
  if (iterable === undefined) {
    return (curriedIterable: AnyIterable<T>) => _throttle(limit, interval, curriedIterable)
  }
  return _throttle(limit, interval, iterable)
}
