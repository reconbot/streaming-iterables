import { AnyIterable, FlatMapValue } from './types'
import { flatten } from './flatten'
import { filter } from './filter'
import { transform } from './transform'

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
  return filter<R>(i => i !== undefined && i !== null, flatten(transform<any, any>(concurrency, func, iterable)))
}
