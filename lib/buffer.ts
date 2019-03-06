import { getIterator } from './get-iterator'
import { defer, IDeferred } from './defer'
import { AnyIterable } from './types'

interface IValueObj<T> {
  error?: Error
  value?: T
}

function _buffer<T>(size: number, iterable: AsyncIterable<T>): AsyncIterableIterator<T> {
  const iterator = getIterator(iterable)
  const resultQueue: Array<IValueObj<T>> = []
  const readQueue: Array<IDeferred<IteratorResult<T>>> = []

  let reading = false
  let ended: boolean = false

  function fulfillReadQueue() {
    while (readQueue.length > 0 && resultQueue.length > 0) {
      const readDeferred = readQueue.shift() as IDeferred<IteratorResult<T>>
      const { error, value } = resultQueue.shift() as IValueObj<T>
      if (error) {
        readDeferred.reject(error)
      } else {
        readDeferred.resolve({ done: false, value } as any)
      }
    }
    while (readQueue.length > 0 && ended) {
      const { resolve } = readQueue.shift() as IDeferred<IteratorResult<T>>
      resolve({ done: true, value: undefined } as any)
    }
  }

  async function fillQueue() {
    if (ended) {
      return
    }
    if (reading) {
      return
    }
    if (resultQueue.length >= size) {
      return
    }
    reading = true
    try {
      const { done, value } = await iterator.next()
      if (done) {
        ended = true
      } else {
        resultQueue.push({ value })
      }
    } catch (error) {
      ended = true
      resultQueue.push({ error })
    }
    fulfillReadQueue()
    reading = false
    fillQueue()
  }

  async function next() {
    if (resultQueue.length > 0) {
      const { error, value } = resultQueue.shift() as IValueObj<T>
      if (error) {
        throw error
      }
      fillQueue()
      return { done: false, value } as IteratorResult<T>
    }

    if (ended) {
      return { done: true, value: undefined } as any // stupid ts
    }

    const deferred = defer<IteratorResult<T>>()
    readQueue.push(deferred)
    fillQueue()
    return deferred.promise
  }

  const asyncIterableIterator = {
    next,
    [Symbol.asyncIterator]: () => asyncIterableIterator,
  }

  return asyncIterableIterator
}

function* syncBuffer<T>(size: number, iterable: Iterable<T>): IterableIterator<T> {
  const valueQueue: T[] = []
  let e
  try {
    for (const value of iterable) {
      valueQueue.push(value)
      if (valueQueue.length <= size) {
        continue
      }
      yield valueQueue.shift() as T
    }
  } catch (error) {
    e = error
  }
  for (const value of valueQueue) {
    yield value
  }
  if (e) {
    throw e
  }
}

type UnwrapAnyIterable<M extends AnyIterable<any>> = M extends Iterable<infer T>
  ? Iterable<T>
  : M extends AsyncIterable<infer B>
  ? AsyncIterable<B>
  : never
type CurriedBufferResult = <T, M extends AnyIterable<T>>(curriedIterable: M) => UnwrapAnyIterable<M>

export function buffer(size: number): CurriedBufferResult
export function buffer<T, M extends AnyIterable<T>>(size: number, iterable: M): UnwrapAnyIterable<M>
export function buffer(size: number, iterable?: AnyIterable<any>): CurriedBufferResult | UnwrapAnyIterable<any> {
  if (iterable === undefined) {
    return curriedIterable => buffer(size, curriedIterable)
  }
  if (iterable[Symbol.asyncIterator]) {
    return _buffer(size, iterable as AsyncIterable<any>)
  }

  return syncBuffer(size, iterable as Iterable<any>)
}
