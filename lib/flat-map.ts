/// <reference lib="esnext.asynciterable" />
import { AnyIterable, FlatMapValue } from './types'
import { flatten } from './flatten'
import { filter } from './filter'
import { map } from './map'

export function flatMap<T, B>(
  func: (data: T) => FlatMapValue<B>
): (iterable: AnyIterable<T>) => AsyncIterableIterator<B>
export function flatMap<T, B>(func: (data: T) => FlatMapValue<B>, iterable: AnyIterable<T>): AsyncIterableIterator<B>
export function flatMap<T, B>(func: (data: T) => FlatMapValue<B>, iterable?: AnyIterable<T>) {
  if (iterable === undefined) {
    return (curriedIterable: AnyIterable<T>) => flatMap(func, curriedIterable)
  }
  return filter<B>(i => i !== undefined && i !== null, flatten(map<any, any>(func, iterable)))
}
