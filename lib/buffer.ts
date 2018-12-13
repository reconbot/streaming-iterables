import { getIterator } from './get-iterator'
import { AnyIterable } from './types'

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

function _buffer<T>(size: number, iterable: AsyncIterable<T>): AsyncIterableIterator<T> {
  const iterator = getIterator(iterable)
  const valueQueue: Array<IteratorResult<T>> = []
  const readQueue: IDeferred[] = []

  let reading = false
  let endValue: null | IteratorResult<T> = null

  async function fillQueue() {
    if (reading === true) {
      return
    }
    if (valueQueue.length >= size) {
      return
    }
    reading = true
    const nextValue = await iterator.next()
    if (nextValue.done) {
      endValue = nextValue
      endReadQueue(readQueue, nextValue)
      return
    }
    if (readQueue.length > 0) {
      const readDeferred = readQueue.shift() as IDeferred
      readDeferred.resolve(nextValue)
    } else {
      valueQueue.push(nextValue)
    }
    reading = false
    fillQueue()
  }

  async function next() {
    if (valueQueue.length === 0) {
      if (endValue) {
        return endValue
      }
      const deferred = defer<IteratorResult<T>>()
      readQueue.push(deferred)
      fillQueue()
      return deferred.promise
    }
    const nextValue = valueQueue.shift() as IteratorResult<T>
    fillQueue()
    return nextValue
  }

  const asyncIterableIterator = {
    next,
    [Symbol.asyncIterator]: () => asyncIterableIterator,
  }

  return asyncIterableIterator
}

function* syncBuffer<T>(size: number, iterable: Iterable<T>): IterableIterator<T> {
  const valueQueue: T[] = []

  for (const value of iterable) {
    valueQueue.push(value)
    if (valueQueue.length <= size) {
      continue
    }
    yield valueQueue.shift() as T
  }
  for (const value of valueQueue) {
    yield value
  }
}

export function buffer<T>(
  size: number
): {
  (curriedIterable: AsyncIterable<T>): AsyncIterableIterator<T>
  (curriedIterable: Iterable<T>): IterableIterator<T>
}
export function buffer<T>(size: number, iterable: AsyncIterable<T>): AsyncIterableIterator<T>
export function buffer<T>(size: number, iterable: Iterable<T>): IterableIterator<T>
export function buffer<T>(size: number, iterable?: AnyIterable<T>) {
  if (iterable === undefined) {
    return curriedIterable => buffer(size, curriedIterable)
  }
  if (iterable[Symbol.asyncIterator]) {
    return _buffer(size, iterable as AsyncIterable<T>)
  }

  return syncBuffer(size, iterable as Iterable<T>)
}
