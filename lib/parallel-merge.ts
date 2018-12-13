import { getIterator } from './get-iterator'
import { AnyIterable } from './types'

export async function* parallelMerge<T>(...iterables: Array<AnyIterable<T>>): AsyncIterableIterator<T> {
  const inputs = iterables.map(getIterator)
  const concurrentWork = new Set()
  const values = new Map()

  const queueNext = input => {
    const nextVal = Promise.resolve(input.next()).then(async ({ done, value }) => {
      if (!done) {
        values.set(input, value)
      }
      concurrentWork.delete(nextVal)
    })
    concurrentWork.add(nextVal)
  }

  for (const input of inputs) {
    queueNext(input)
  }

  while (true) {
    if (concurrentWork.size === 0) {
      return
    }
    await Promise.race(concurrentWork)
    for (const [input, value] of values) {
      values.delete(input)
      yield value
      queueNext(input)
    }
  }
}
