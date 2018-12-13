import { AnyIterable, FlatMapValue } from './types'
import { flatten } from './flatten'
import { filter } from './filter'
import { parallelMap } from './parallel-map'

export function parallelFlatMap<T, R>(
  concurrency: number
): {
  (func: (data: T) => R | Promise<R>, iterable: AnyIterable<T>): AsyncIterableIterator<R>
  (func: (data: T) => R | Promise<R>): (iterable: AnyIterable<T>) => AsyncIterableIterator<R>
}
export function parallelFlatMap<T, R>(
  concurrency: number,
  func: (data: T) => R | Promise<R>
): (iterable: AnyIterable<T>) => AsyncIterableIterator<R>
export function parallelFlatMap<T, R>(
  concurrency: number,
  func: (data: T) => R | Promise<R>,
  iterable: AnyIterable<T>
): AsyncIterableIterator<R>
export function parallelFlatMap<T, R>(
  concurrency: number,
  func?: (data: T) => R | Promise<R>,
  iterable?: AnyIterable<T>
) {
  if (func === undefined) {
    return <A, B>(curriedFunc: (data: A) => B | Promise<B>, curriedIterable?: AnyIterable<A>) =>
      curriedIterable
        ? parallelFlatMap<A, B>(concurrency, curriedFunc, curriedIterable)
        : parallelFlatMap<A, B>(concurrency, curriedFunc)
  }
  if (iterable === undefined) {
    return (curriedIterable: AnyIterable<T>) => parallelFlatMap<T, R>(concurrency, func, curriedIterable)
  }
  return filter(i => i !== undefined && i !== null, flatten(parallelMap<any, any>(concurrency, func, iterable)))
}
