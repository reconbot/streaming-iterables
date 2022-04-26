import { getIterator } from './get-iterator'
import { AnyIterable, UnArrayAnyIterable, NullOrFunction } from './types'

/**
 *Combine multiple iterators into a single iterable. Reads one item off of every iterable and yields them as they resolve. This is useful for pulling items out of a collection of iterables as soon as they're available. Errors `iterables` are raised immediately.

```ts
import { parallelMerge } from 'streaming-iterables'
import { getPokemon, getTransformer } from 'iterable-pokedex'

// pokemon are much faster to load btw
const heros = parallelMerge(getPokemon(), getTransformer())
for await (const hero of heros) {
  console.log(hero)
}
// charmander
// bulbasaur
// megatron
// pikachu
// eevee
// bumblebee
// jazz
```
 */
export async function* parallelMerge<I extends AnyIterable<any>[]>(
  ...iterables: I
): AsyncIterable<UnArrayAnyIterable<I>> {
  const inputs = iterables.map(getIterator)
  const concurrentWork = new Set()
  const values = new Map()

  let lastError = null
  let errCb: NullOrFunction = null
  let valueCb: NullOrFunction = null

  const notifyError = err => {
    lastError = err
    if (errCb) {
      errCb(err)
    }
  }

  const notifyDone = value => {
    if (valueCb) {
      valueCb(value)
    }
  }

  const waitForQueue = (): Promise<void> =>
    new Promise((resolve, reject) => {
      if (lastError) {
        reject(lastError)
      }
      if (values.size > 0) {
        return resolve()
      }
      valueCb = resolve
      errCb = reject
    })

  const queueNext = input => {
    const nextVal = Promise.resolve(input.next()).then(async ({ done, value }) => {
      if (!done) {
        values.set(input, value)
      }
      concurrentWork.delete(nextVal)
    })
    concurrentWork.add(nextVal)
    nextVal.then(notifyDone, notifyError)
  }

  for (const input of inputs) {
    queueNext(input)
  }

  while (true) {
    // We technically don't have to check `values.size` as the for loop should have emptied it
    // However I haven't yet found specs verifying that behavior, only tests
    // the guard in waitForQueue() checking for values is in place for the same reason
    if (concurrentWork.size === 0 && values.size === 0) {
      return
    }
    await waitForQueue()
    for (const [input, value] of values) {
      values.delete(input)
      yield value
      queueNext(input)
    }
  }
}
