import { AnyIterable, UnwrapAnyIterable } from './types'

export interface TimeConfig {
  progress?: (delta: [number, number], total: [number, number]) => any
  total?: (time: [number, number]) => any
}

function addTime(a: [number, number], b: [number, number]): [number, number] {
  let seconds = a[0] + b[0]
  let nanoseconds = a[1] + b[1]

  if (nanoseconds >= 1000000000) {
    const remainder = nanoseconds % 1000000000
    seconds += (nanoseconds - remainder) / 1000000000
    nanoseconds = remainder
  }

  return [seconds, nanoseconds]
}

async function* _asyncTime<T>(config: TimeConfig, iterable: AsyncIterable<T>) {
  const itr = iterable[Symbol.asyncIterator]()
  let total: [number, number] = [0, 0]
  while (true) {
    const start = process.hrtime()
    const { value, done } = await itr.next()
    const delta = process.hrtime(start)
    total = addTime(total, delta)
    if (config.progress) {
      config.progress(delta, total)
    }
    if (done) {
      if (config.total) {
        config.total(total)
      }
      return value
    }
    yield value
  }
}

function* _syncTime<T>(config: TimeConfig, iterable: Iterable<T>) {
  const itr = iterable[Symbol.iterator]()
  let total: [number, number] = [0, 0]
  while (true) {
    const start = process.hrtime()
    const { value, done } = itr.next()
    const delta = process.hrtime(start)
    total = addTime(total, delta)
    if (config.progress) {
      config.progress(delta, total)
    }
    if (done) {
      if (config.total) {
        config.total(total)
      }
      return value
    }
    yield value
  }
}

export type CurriedTimeResult = <T, M extends AnyIterable<T>>(curriedIterable: M) => UnwrapAnyIterable<M>

/**
 * Returns a new iterator that yields the data it consumes and calls the `progress` and `total` callbacks with the [`hrtime`](https://nodejs.org/api/process.html#process_process_hrtime_time) it took for `iterable` to provide a value when `.next()` was called on it. That is to say, the time returned is the time this iterator spent waiting for data, not the time it took to finish being read. The `hrtime` tuple looks like `[seconds, nanoseconds]`.

```ts
import { consume, transform, time } from 'streaming-iterables'
import got from 'got'

const urls = ['https://http.cat/200', 'https://http.cat/201', 'https://http.cat/202']
const download = transform(1000, got)
const timer = time({
  total: total => console.log(`Spent ${total[0]} seconds and ${total[1]}ns downloading cats`),
})
// download all of these at the same time
for await (page of timer(download(urls))) {
  console.log(page)
}
```
 */
export function time(config?: TimeConfig): CurriedTimeResult
export function time<T, M extends AnyIterable<T>>(config: TimeConfig, iterable: M): UnwrapAnyIterable<M>
export function time(config: TimeConfig = {}, iterable?: AnyIterable<any>): CurriedTimeResult | UnwrapAnyIterable<any> {
  if (iterable === undefined) {
    return curriedIterable => time(config, curriedIterable)
  }

  if (iterable[Symbol.asyncIterator] !== undefined) {
    return _asyncTime(config, iterable as AsyncIterable<any>)
  } else {
    return _syncTime(config, iterable as Iterable<any>)
  }
}
