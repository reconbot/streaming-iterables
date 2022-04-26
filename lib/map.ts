import { AnyIterable } from './types'
async function* _map<T, B>(func: (data: T) => B | Promise<B>, iterable: AnyIterable<T>) {
  for await (const val of iterable) {
    yield await func(val)
  }
}

/**
 * Map a function or async function over all the values of an iterable. Errors from the source `iterable` and `func` are raised immediately.

```ts
import { consume, map } from 'streaming-iterables'
import got from 'got'

const urls = ['https://http.cat/200', 'https://http.cat/201', 'https://http.cat/202']
const download = map(got)

// download one at a time
for await (page of download(urls)) {
  console.log(page)
}
```
 */
export function map<T, B>(func: (data: T) => B | Promise<B>): (iterable: AnyIterable<T>) => AsyncGenerator<B>
export function map<T, B>(func: (data: T) => B | Promise<B>, iterable: AnyIterable<T>): AsyncGenerator<B>
export function map<T, B>(func: (data: T) => B | Promise<B>, iterable?: AnyIterable<T>) {
  if (iterable === undefined) {
    return curriedIterable => _map(func, curriedIterable)
  }
  return _map(func, iterable)
}
