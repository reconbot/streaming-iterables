import { AnyIterable } from './types'
import { buffer } from './buffer'
import { pipeline } from './pipeline'
import { map } from './map'

async function* _parallelMap<T, R>(
  concurrency: number,
  func: (data: T) => R | Promise<R>,
  iterable: AnyIterable<T>
): AsyncIterableIterator<R> {
  const wrapFunc = value => ({ value: func(value) })
  const output = pipeline(() => iterable, buffer(1), map(wrapFunc), buffer(concurrency))
  for await (const { value } of output) {
    yield await value
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
