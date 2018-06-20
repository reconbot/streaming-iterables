import { fromIterable } from './from-iterable'

async function* _merge (iterables) {
  const sources = new Set(iterables.map(fromIterable)) as Set<Iterator<any>|AsyncIterator<any>>
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

function* emptyIterator () { }

export function merge (
  ...iterables: Array<Iterable<any>|Iterator<any>|AsyncIterable<any>|AsyncIterator<any>>
): Iterator<any>|AsyncIterator<any> {
  if (iterables.length === 0) {
    return emptyIterator()
  }
  if (iterables.length === 1) {
    return fromIterable(iterables[0] as Iterator<any>)
  }
  return _merge(iterables)
}
