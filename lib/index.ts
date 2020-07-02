/// <reference lib="esnext.asynciterable" />

if ((Symbol as any).asyncIterator === undefined) {
  ;(Symbol as any).asyncIterator = Symbol.for('asyncIterator')
}

export { batch, CurriedBatchResult, UnwrapAnyIterableArray } from './batch'
export { buffer, CurriedBufferResult } from './buffer'
export { collect } from './collect'
export { concat } from './concat'
export { consume } from './consume'
export { filter } from './filter'
export { flatMap } from './flat-map'
export { flatten } from './flatten'
export { flatTransform } from './flat-transform'
export { fromStream, ReadableStreamish } from './from-stream'
export { getIterator } from './get-iterator'
export { Iterableish, AnyIterable, UnwrapAnyIterable, UnArrayAnyIterable, FlatMapValue } from './types'
export { map } from './map'
export { merge } from './merge'
export { parallelFlatMap } from './parallel-flat-map'
export { parallelMap } from './parallel-map'
export { parallelMerge } from './parallel-merge'
export { pipeline } from './pipeline'
export { reduce } from './reduce'
export { take, CurriedTakeResult } from './take'
export { tap } from './tap'
export { time, TimeConfig, CurriedTimeResult } from './time'
export { transform } from './transform'
export { writeToStream, WritableStreamish } from './write-to-stream'
