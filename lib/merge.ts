/// <reference lib="esnext.asynciterable" />
import { AnyIterable, UnArrayAnyIterable } from './types'
import { getIterator } from './get-iterator'

export async function* merge<I extends Array<AnyIterable<any>>>(...iterables: I): AsyncIterable<UnArrayAnyIterable<I>> {
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
