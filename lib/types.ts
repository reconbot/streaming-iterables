/**
 * Any iterable or iterator.
 */
export type Iterableish<T> = Iterable<T> | Iterator<T> | AsyncIterable<T> | AsyncIterator<T>
/**
 * Literally any `Iterable` (async or regular).
 */
export type AnyIterable<T> = Iterable<T> | AsyncIterable<T>
/**
 * A value, an array of that value, undefined, null or promises for any of them. Used in the `flatMap` and `flatTransform` functions as possible return values of the mapping function.
 */
export type FlatMapValue<B> = B | AnyIterable<B> | undefined | null | Promise<B | AnyIterable<B> | undefined | null>

export type UnArrayAnyIterable<A extends AnyIterable<any>[]> = A extends AnyIterable<infer T>[] ? T : never
export type NullOrFunction = null | ((anything?: any) => void)
export type UnwrapAnyIterable<M extends AnyIterable<any>> = M extends Iterable<infer T>
  ? Iterable<T>
  : M extends AsyncIterable<infer B>
  ? AsyncIterable<B>
  : never
