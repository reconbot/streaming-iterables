import { AnyIterable } from './types'
import { getIterator } from './get-iterator'

const mapValue = async <T, R>(itr: Iterator<T> | AsyncIterator<T>, func: (data: T) => R | Promise<R>) => {
  const { done, value } = await itr.next()
  if (done) {
    return {
      done: true,
      value: undefined,
    }
  }
  return {
    done: false,
    value: await func(value),
  }
}

async function* _parallelMap<T, R>(
  concurrency: number,
  func: (data: T) => R | Promise<R>,
  iterable: AnyIterable<T>
): AsyncIterableIterator<R> {
  const work: any[] = []
  const itr = getIterator(iterable)
  while (true) {
    while (work.length < concurrency) {
      work.push(mapValue(itr, func))
    }
    if (work.length > 0) {
      const { done, value } = await work.shift()
      if (done) {
        return
      }
      yield value
    }
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
  return _parallelMap(concurrency, func, iterable)
}
