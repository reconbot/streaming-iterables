import { AnyIterable } from './types'
import { getIterator } from './get-iterator'

async function* _transform<T, R>(
  concurrency: number,
  func: (data: T) => R | Promise<R>,
  itr: AnyIterable<T>
): AsyncIterableIterator<R> {
  const iterator = getIterator(itr)
  const concurrentWork = new Set()
  const results: any[] = []
  let ended = false
  const lastRead = Promise.resolve()
  const queueNext = () => {
    let nextVal
    nextVal = (async () => {
      // need to work around https://github.com/nodejs/readable-stream/issues/387
      await lastRead
      if (ended) {
        concurrentWork.delete(nextVal)
        return
      }

      const { done, value } = await iterator.next()
      if (done) {
        ended = true
      } else {
        const mappedValue = await func(value)
        results.push(mappedValue)
      }
      concurrentWork.delete(nextVal)
    })()
    concurrentWork.add(nextVal)
  }

  for (let i = 0; i < concurrency; i++) {
    queueNext()
  }

  while (true) {
    if (results.length) {
      yield results.shift()
      if (!ended) {
        queueNext()
        continue
      }
    }
    if (concurrentWork.size === 0) {
      return
    }
    await Promise.race(concurrentWork)
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
