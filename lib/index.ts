if ((Symbol as any).asyncIterator === undefined) {
  ;(Symbol as any).asyncIterator = Symbol.for('asyncIterator')
}

export { batch } from './batch'
export { buffer } from './buffer'
export { collect } from './collect'
export { concat } from './concat'
export { consume } from './consume'
export { flatten } from './flatten'
export { getIterator } from './get-iterator'
export { Iterableish, AnyIterable } from './types'
export { map } from './map'
export { merge } from './merge'
export { parallelMap } from './parallel-map'
export { parallelMerge } from './parallel-merge'
export { reduce } from './reduce'
export { take } from './take'
export { tap } from './tap'
