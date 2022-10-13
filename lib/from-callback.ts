import { deferGenerator } from 'inside-out-async'

export interface CallbackIterable<T> extends AsyncIterable<T> {
  yield(data: T): void
  end(): void
}

/**
 * Returns an iterable with methods to help turn event emitters or callbacks into async iterables.

This leverages the [`inside-out-async`](https://www.npmjs.com/package/inside-out-async#deferGenerator) package which can be used directly if you want something similar for generators. (It is bundled so it's not a dependency.)

It adds two methods to the returned iterable.

- `itr.yield(data: T): void` queues data to be read
- `itr.end(): void` ends the iterable

And will buffer *all* data given to `yield()` until it's read.

```ts
import { fromCallback } from 'streaming-iterables'

const pokeLog = fromCallback()
itr.yield('Charmander')
itr.yield('Ash')
itr.yield('Pokeball')
itr.end()

for await (const pokeData of pokeLog) {
  console.log(pokeData) // Charmander, Ash, Pokeball
}

// To use it as a callback
const emitter = new EventEmitter()
const consoles = fromCallback()
emitter.on('data', consoles.yield)
emitter.on('close', consoles.end)

emitter.emit('data', 'nintendo')
emitter.emit('data', 'sony')
emitter.emit('data', 'sega')
emitter.emit('close')

for await (const console of consoles) {
  console.log(console) // 'nintendo', 'sony', 'sega'
}

```
 */
export function fromCallback<T>(): CallbackIterable<T> {
  const { generator, queueValue, queueReturn } = deferGenerator<T, T, undefined>()

  const cbIterable: CallbackIterable<T> = {
    ...generator,
    yield: queueValue,
    end: () => queueReturn()
  }
  return cbIterable
}
