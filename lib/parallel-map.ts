import { AnyIterable } from './types'
import { getIterator } from './get-iterator'

async function* _parallelMap<T, R>(
  concurrency: number,
  func: (data: T) => R | Promise<R>,
  itr: AnyIterable<T>
): AsyncIterableIterator<R> {
  const iterator = getIterator(itr)
  const concurrentWork = new Set()
  const results: any[] = []
  let ended = false

  const queueNext = () => {
    let nextVal
    nextVal = (async () => {
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

export function parallelMap<T, R>(
  concurrency: number
): {
  (func: (data: T) => R | Promise<R>, iterable: AnyIterable<T>): AsyncIterableIterator<R>
  (func: (data: T) => R | Promise<R>): (iterable: AnyIterable<T>) => AsyncIterableIterator<R>
}
export function parallelMap<T, R>(
  concurrency: number,
  func: (data: T) => R | Promise<R>
): (iterable: AnyIterable<T>) => AsyncIterableIterator<R>
export function parallelMap<T, R>(
  concurrency: number,
  func: (data: T) => R | Promise<R>,
  iterable: AnyIterable<T>
): AsyncIterableIterator<R>
export function parallelMap<T, R>(concurrency: number, func?: (data: T) => R | Promise<R>, iterable?: AnyIterable<T>) {
  if (func === undefined) {
    return <A, B>(curriedFunc: (data: A) => B | Promise<B>, curriedIterable?: AnyIterable<A>) =>
      curriedIterable
        ? parallelMap<A, B>(concurrency, curriedFunc, curriedIterable)
        : parallelMap<A, B>(concurrency, curriedFunc)
  }
  if (iterable === undefined) {
    return (curriedIterable: AnyIterable<T>) => parallelMap<T, R>(concurrency, func, curriedIterable)
  }
  return _parallelMap<T, R>(concurrency, func, iterable)
}
