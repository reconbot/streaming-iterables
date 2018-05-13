import { fromIterable } from './from-iterable'

async function* _parallelMap (concurrency: number, func, iterable) {
  const iterator = fromIterable(iterable)
  const concurrentWork = new Set()
  const results = []
  let ended = false

  const queueNext = () => {
    const nextVal = (async () => {
      const { done, value } = await iterator.next()
      if (done) {
        ended = true
      } else {
        const mappedValue = await func(value)
        results.push(mappedValue)
      }
      concurrentWork.delete(nextVal)
    })()
    concurrentWork.add(nextVal)
  }

  for (let i = 0; i < concurrency; i++) {
    queueNext()
  }

  while (true) {
    if (results.length) {
      yield results.shift()
      if (!ended) {
        queueNext()
        continue
      }
    }
    if (concurrentWork.size === 0) {
      return
    }
    await Promise.race(concurrentWork)
  }
}

export function parallelMap (
  concurrency: number,
  func?: (data: any) => any,
  iterable?: Iterable<any>|Iterator<any>|AsyncIterable<any>|AsyncIterator<any>,
) {
  if (func === undefined) {
    return curriedFunc => parallelMap(concurrency, curriedFunc)
  }
  if (iterable === undefined) {
    return curriedIterable => _parallelMap(concurrency, func, curriedIterable)
  }
  return _parallelMap(concurrency, func, iterable)
}
