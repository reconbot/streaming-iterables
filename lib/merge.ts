import { getIterator } from './get-iterator'
import { AnyIterable } from './types'

export async function* merge(...iterables: Array<AnyIterable<any>>) {
  const sources = new Set(iterables.map(getIterator))
  while (sources.size) {
    for (const iterator of sources) {
      const nextVal = await iterator.next()
      if (nextVal.done) {
        sources.delete(iterator)
      } else {
        yield nextVal.value
      }
    }
  }
}
