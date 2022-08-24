import { AnyIterable, UnwrapAnyIterable } from './types'

async function* _takeLast<T>(count: number, iterable: AsyncIterable<T>) {
  const buffer : Awaited<T>[] = []
  for await (const res of iterable) {
    buffer.push(res)
    if (buffer.length > count) { buffer.shift() }
  }
  while (buffer.length) { yield await buffer.shift() }
}

function* _syncTakeLast<T>(count: number, iterable: Iterable<T>) {
  const buffer: T[] = []
  for (const res of iterable) {
    buffer.push(res)
    if (buffer.length > count) { buffer.shift() }
  }
  while (buffer.length) { yield buffer.shift() }
}

export type CurriedTakeLastResult = <T, M extends AnyIterable<T>>(curriedIterable: M) => UnwrapAnyIterable<M>

/**
 * Returns a new iterator that reads a specific number of items from the end of `iterable` once it has completed. When used with generators it advances the generator, when used with arrays it gets a new iterator and starts from the beginning.

```ts
import { pipeline, takeLast, collect } from 'streaming-iterables'
import { getPokemon } from 'iterable-pokedex'

const bottomFive = await collect(takeLast(5, getPokemon()))
// last five pokemon
```
 */
export function takeLast(count: number): CurriedTakeLastResult
export function takeLast<T, M extends AnyIterable<T>>(count: number, iterable: M): UnwrapAnyIterable<M>
export function takeLast<T>(count: number, iterable?: AnyIterable<T>): CurriedTakeLastResult | UnwrapAnyIterable<any> {
  if (iterable === undefined) {
    return curriedIterable => takeLast(count, curriedIterable)
  }
  if (iterable[Symbol.asyncIterator]) {
    return _takeLast(count, iterable as AsyncIterable<T>)
  }
  return _syncTakeLast(count, iterable as Iterable<T>)
}
