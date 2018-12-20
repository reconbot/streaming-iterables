import { AnyIterable, FlatMapValue } from './types'
import { flatten } from './flatten'
import { filter } from './filter'
import { getIterator } from './get-iterator'
import { defer, IDeferred } from './defer'

function _flatTransform<T, R>(
  concurrency: number,
  func: (data: T) => R | Promise<R>,
  iterable: AnyIterable<T>
): AsyncIterableIterator<R> {
  const iterator = getIterator(iterable)

  const resultQueue: R[] = []
  const readQueue: Array<IDeferred<IteratorResult<R>>> = []

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

export function flatTransform<T, R>(
  concurrency: number
): {
  (func: (data: T) => FlatMapValue<R>, iterable: AnyIterable<T>): AsyncIterableIterator<R>
  (func: (data: T) => FlatMapValue<R>): (iterable: AnyIterable<T>) => AsyncIterableIterator<R>
}
export function flatTransform<T, R>(
  concurrency: number,
  func: (data: T) => FlatMapValue<R>
): (iterable: AnyIterable<T>) => AsyncIterableIterator<R>
export function flatTransform<T, R>(
  concurrency: number,
  func: (data: T) => FlatMapValue<R>,
  iterable: AnyIterable<T>
): AsyncIterableIterator<R>
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
