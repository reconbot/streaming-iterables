import { AnyIterable, FlatMapValue } from './types'
import { flatten } from './flatten'
import { filter } from './filter'
import { getIterator } from './get-iterator'

interface IDeferred {
  promise: Promise<any>
  resolve: (value?: any) => void
  reject: (error?: Error) => void
}

function defer<T>() {
  let reject
  let resolve
  const promise = new Promise<T>((resolveFunc, rejectFunc) => {
    resolve = resolveFunc
    reject = rejectFunc
  })
  return {
    promise,
    reject,
    resolve,
  }
}

function endReadQueue(readQueue, endValue) {
  while (readQueue.length > 0) {
    const { resolve } = readQueue.shift() as IDeferred
    resolve(endValue)
  }
}

function _flatTransform<T, R>(
  concurrency: number,
  func: (data: T) => R | Promise<R>,
  iterable: AnyIterable<T>
): AsyncIterableIterator<R> {
  const iterator = getIterator(iterable)

  const valueQueue: Array<IteratorResult<R>> = []
  const readQueue: IDeferred[] = []

  let endValue: null | IteratorResult<T> = null
  let reading = false
  let inflightCount = 0

  function fillQueue() {
    if (inflightCount + valueQueue.length >= concurrency) {
      return
    }
    if (endValue && inflightCount === 0 && valueQueue.length === 0) {
      endReadQueue(readQueue, endValue)
      return
    }
    if (reading === true) {
      return
    }
    reading = true
    inflightCount++

    function processResult(transformedValue) {
      const result = { value: transformedValue, done: false }
      if (readQueue.length > 0) {
        const readDeferred = readQueue.shift() as IDeferred
        readDeferred.resolve(result)
      } else {
        valueQueue.push(result)
      }
    }

    Promise.resolve(iterator.next()).then(async ({ done, value }) => {
      if (done) {
        endValue = { done, value }
        inflightCount--
        fillQueue()
        return
      }
      reading = false
      fillQueue()
      const transformedValue = await func(value)

      if (transformedValue && transformedValue[Symbol.asyncIterator]) {
        for await (const item of transformedValue as any) {
          processResult(item)
        }
      } else {
        processResult(transformedValue)
      }

      inflightCount--
      fillQueue()
    })
  }

  async function next() {
    if (valueQueue.length === 0) {
      const deferred = defer<IteratorResult<R>>()
      readQueue.push(deferred)
      fillQueue()
      return deferred.promise
    }
    const value = valueQueue.shift() as IteratorResult<R>
    fillQueue()
    return value
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
