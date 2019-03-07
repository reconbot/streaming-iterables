/// <reference lib="esnext.asynciterable" />
import { getIterator } from './get-iterator'
import { AnyIterable, UnArrayAnyIterable } from './types'

export async function* parallelMerge<I extends Array<AnyIterable<any>>>(
  ...iterables: I
): AsyncIterable<UnArrayAnyIterable<I>> {
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
