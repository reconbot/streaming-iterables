import { AnyIterable } from './types'
import { getIterator } from './get-iterator'

async function* _transform<T, R>(
  concurrency: number,
  func: (data: T) => R | Promise<R>,
  itr: AnyIterable<T>
): AsyncIterableIterator<R> {
  const iterator = getIterator(itr)
  const concurrentWork = new Set()
  const nextValue: T[] = []
  let readingNextValue = false
  const results: any[] = []
  let ended = false

  const queueNextRead = () => {
    if (ended || readingNextValue) {
      return
    }
    readingNextValue = true
    let nextValWork
    nextValWork = (async () => {
      const { done, value } = await iterator.next()
      if (done) {
        ended = true
      } else {
        nextValue.push(value)
      }
      concurrentWork.delete(nextValWork)
      readingNextValue = false
    })()
    concurrentWork.add(nextValWork)
  }

  const queueNextTransform = value => {
    let transformWork
    transformWork = (async () => {
      const mappedValue = await func(value)
      results.push(mappedValue)
      concurrentWork.delete(transformWork)
    })()
    concurrentWork.add(transformWork)
  }

  while (true) {
    if (nextValue.length > 0 && concurrentWork.size < concurrency) {
      queueNextTransform(nextValue.shift())
    }
    while (results.length > 0) {
      yield results.shift()
    }
    if (nextValue.length === 0) {
      queueNextRead()
    }
    if (concurrentWork.size > 0) {
      await Promise.race(concurrentWork)
    }
    if (ended && nextValue.length === 0 && results.length === 0 && concurrentWork.size === 0) {
      return
    }
  }
}

export function transform<T, R>(
  concurrency: number
): {
  (func: (data: T) => R | Promise<R>, iterable: AnyIterable<T>): AsyncIterableIterator<R>
  (func: (data: T) => R | Promise<R>): (iterable: AnyIterable<T>) => AsyncIterableIterator<R>
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
