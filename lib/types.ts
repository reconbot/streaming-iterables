/// <reference lib="esnext.asynciterable" />
export type Iterableish<T> = Iterable<T> | Iterator<T> | AsyncIterable<T> | AsyncIterator<T>
export type AnyIterable<T> = Iterable<T> | AsyncIterable<T>
export type FlatMapValue<B> = B | AnyIterable<B> | undefined | null | Promise<B | AnyIterable<B> | undefined | null>
export type UnArrayAnyIterable<A extends Array<AnyIterable<any>>> = A extends Array<AnyIterable<infer T>> ? T : never
export type NullOrFunction = null | ((anything?: any) => void)
