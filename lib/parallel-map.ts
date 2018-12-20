import { AnyIterable } from './types'
import { buffer } from './buffer'
import { pipeline } from './pipeline'
import { map } from './map'
import { getIterator } from './get-iterator'

async function* _parallelMap<T, R>(
  concurrency: number,
  func: (data: T) => R | Promise<R>,
  iterable: AnyIterable<T>
): AsyncIterableIterator<R> {
  let transformError: Error | null = null
  const wrapFunc = value => ({
    value: func(value),
  })

  const stopOnError = async function*(source) {
    for await (const value of source) {
      if (transformError) {
        return
      }
      yield value
    }
  }
  const output = pipeline(() => iterable, buffer(1), stopOnError, map(wrapFunc), buffer(concurrency))
  const itr = getIterator<{ value: Promise<R> | R }>(output)
  while (true) {
    const { value, done } = await itr.next()
    if (done) {
      break
    }
    try {
      const val = await value.value
      if (!transformError) {
        yield val
      }
    } catch (error) {
      transformError = error
    }
  }
  if (transformError) {
    throw transformError
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
