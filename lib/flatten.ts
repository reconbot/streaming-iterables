import { AnyIterable } from './types'

/**
 * Returns a new iterator by pulling every item out of `iterable` (and all its sub iterables) and yielding them depth-first. Checks for the iterable interfaces and iterates it if it exists. If the value is a string it is not iterated as that ends up in an infinite loop. Errors from the source `iterable` are raised immediately.

*note*: Typescript doesn't have recursive types but you can nest iterables as deep as you like.

```ts
import { flatten } from 'streaming-iterables'

for await (const item of flatten([1, 2, [3, [4, 5], 6])) {
  console.log(item)
}
// 1
// 2
// 3
// 4
// 5
// 6
```
 */
export async function* flatten<B>(iterable: AnyIterable<B | AnyIterable<B>>): AsyncIterableIterator<B> {
  for await (const maybeItr of iterable) {
    if (maybeItr && typeof maybeItr !== 'string' && (maybeItr[Symbol.iterator] || maybeItr[Symbol.asyncIterator])) {
      yield* flatten(maybeItr as AnyIterable<B>)
    } else {
      yield maybeItr as B
    }
  }
}
