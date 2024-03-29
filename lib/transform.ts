import { AnyIterable } from './types'
import { getIterator } from './get-iterator'
import { defer, IDeferred } from './defer'

function _transform<T, R>(
  concurrency: number,
  func: (data: T) => R | Promise<R>,
  iterable: AnyIterable<T>
): AsyncIterableIterator<R> {
  const iterator = getIterator(iterable)

  const resultQueue: R[] = []
  const readQueue: IDeferred<IteratorResult<R>>[] = []

  let ended = false
  let reading = false
  let inflightCount = 0
  let lastError: Error | null = null

  function fulfillReadQueue() {
    while (readQueue.length > 0 && resultQueue.length > 0) {
      const { resolve } = readQueue.shift() as IDeferred<IteratorResult<R>>
      const value = resultQueue.shift() as R
      resolve({ done: false, value } as any)
    }
    while (readQueue.length > 0 && inflightCount === 0 && ended) {
      const { resolve, reject } = readQueue.shift() as IDeferred<IteratorResult<R>>
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
      resultQueue.push(value)
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
 * Map a function or async function over all the values of an iterable. Order is determined by when `func` resolves. And it will run up to `concurrency` async `func` operations at once. If you care about order see [`parallelMap()`](#parallelmap). Errors from the source `iterable` are raised after all transformed values are yielded. Errors from `func` are raised after all previously transformed values are yielded.

`concurrency` can be between 1 and `Infinity`.

```ts
import { consume, transform } from 'streaming-iterables'
import got from 'got'

const urls = ['https://http.cat/200', 'https://http.cat/201', 'https://http.cat/202']
const download = transform(1000, got)

// download all of these at the same time
for await (page of download(urls)) {
  console.log(page)
}
```
 */
export function transform(
  concurrency: number
): {
  <T, R>(func: (data: T) => R | Promise<R>, iterable: AnyIterable<T>): AsyncIterableIterator<R>
  <T, R>(func: (data: T) => R | Promise<R>): (iterable: AnyIterable<T>) => AsyncIterableIterator<R>
}
export function transform<T, R>(
  concurrency: number,
  func: (data: T) => R | Promise<R>
): (iterable: AnyIterable<T>) => AsyncIterableIterator<R>
export function transform<T, R>(
  concurrency: number,
  func: (data: T) => R | Promise<R>,
  iterable: AnyIterable<T>
): AsyncIterableIterator<R>
export function transform<T, R>(concurrency: number, func?: (data: T) => R | Promise<R>, iterable?: AnyIterable<T>) {
  if (func === undefined) {
    return <A, B>(curriedFunc: (data: A) => B | Promise<B>, curriedIterable?: AnyIterable<A>) =>
      curriedIterable
        ? transform<A, B>(concurrency, curriedFunc, curriedIterable)
        : transform<A, B>(concurrency, curriedFunc)
  }
  if (iterable === undefined) {
    return (curriedIterable: AnyIterable<T>) => transform<T, R>(concurrency, func, curriedIterable)
  }
  return _transform(concurrency, func, iterable)
}
