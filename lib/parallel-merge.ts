import { fromIterator } from './from-iterator'

export async function* merge (...iterables: Array<Iterable<any>>) {
  const concurrentWork = new Set()
  const results = []
  let ended = false

  const queue = []

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
