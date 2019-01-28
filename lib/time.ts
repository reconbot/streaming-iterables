import { AnyIterable } from './types'

interface ITimeConfig {
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

async function* _asyncTime<T>(config: ITimeConfig, iterable: AsyncIterable<T>) {
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

function* _syncTime<T>(config: ITimeConfig, iterable: Iterable<T>) {
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

export function time(
  config?: ITimeConfig
): {
  <R>(iterable: AsyncIterable<R>): AsyncIterableIterator<R>
  <R>(iterable: Iterable<R>): IterableIterator<R>
}

export function time<T>(config: ITimeConfig | undefined, iterable: AnyIterable<T>): AsyncIterableIterator<T>
export function time<T>(config: ITimeConfig = {}, iterable?: AnyIterable<T>) {
  if (iterable === undefined) {
    return <R>(curriedIterable: AnyIterable<R>) => time<R>(config, curriedIterable)
  }

  if (iterable[Symbol.asyncIterator] !== undefined) {
    return _asyncTime(config, iterable as AsyncIterable<T>)
  } else {
    return _syncTime(config, iterable as Iterable<T>)
  }
}
