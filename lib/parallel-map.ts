import { fromIterator } from './from-iterator'

if ((Symbol as any).asyncIterator === undefined) {
  ((Symbol as any).asyncIterator) = Symbol.for('asyncIterator')
}

async function* _parallelMap (concurrency: number, func, iterable) {
  const concurrentWork = new Set()
  const results = []
  let ended = false

  const queueNext = () => {
    const nextVal = iterable.next().then(async ({ done, value }) => {
      if (done) {
        ended = true
      } else {
        const mappedValue = await func(value)
        results.push(mappedValue)
      }
      concurrentWork.delete(nextVal)
    })
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

export function parallelMap (concurrency, func?, iterable?) {
  if (func === undefined) {
    return curriedFunc => parallelMap(concurrency, curriedFunc)
  }
  if (iterable === undefined) {
    return curriedIterable => parallelMap(concurrency, func, curriedIterable)
  }
  return _parallelMap(concurrency, func, iterable)
}
