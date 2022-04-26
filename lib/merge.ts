import { AnyIterable, UnArrayAnyIterable } from './types'
import { getIterator } from './get-iterator'

/**
 * Combine multiple iterators into a single iterable. Reads one item off each iterable in order repeatedly until they are all exhausted. If you care less about order and want them faster see `parallelMerge()`.
 */
export async function* merge<I extends AnyIterable<any>[]>(...iterables: I): AsyncIterable<UnArrayAnyIterable<I>> {
  const sources = new Set(iterables.map(getIterator))
  while (sources.size > 0) {
    for (const iterator of sources) {
      const nextVal = await iterator.next()
      if (nextVal.done) {
        sources.delete(iterator)
      } else {
        yield nextVal.value as any
      }
    }
  }
}
