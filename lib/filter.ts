/// <reference lib="esnext.asynciterable" />
import { AnyIterable } from './types'

async function* _filter<T>(filterFunc: (data: T) => boolean | Promise<boolean>, iterable: AnyIterable<T>) {
  for await (const data of iterable) {
    if (await filterFunc(data)) {
      yield data
    }
  }
}

export function filter<T, S extends T>(
  filterFunc: (data: T) => data is S
): <A extends T>(curriedIterable: AnyIterable<A>) => AsyncGenerator<S>
export function filter<T>(
  filterFunc: (data: T) => boolean | Promise<boolean>
): <A>(curriedIterable: AnyIterable<A>) => AsyncGenerator<A>
export function filter<T, S extends T>(filterFunc: (data: T) => data is S, iterable: AnyIterable<T>): AsyncGenerator<S>
export function filter<T>(
  filterFunc: (data: T) => boolean | Promise<boolean>,
  iterable: AnyIterable<T>
): AsyncGenerator<T>
export function filter<T>(filterFunc: (data: T) => boolean | Promise<boolean>, iterable?: AnyIterable<T>) {
  if (iterable === undefined) {
    return (curriedIterable: AnyIterable<any>) => _filter(filterFunc, curriedIterable)
  }
  return _filter(filterFunc, iterable)
}
