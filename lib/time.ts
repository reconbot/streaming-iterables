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

type UnwrapAnyIterable<M extends AnyIterable<any>> = M extends Iterable<infer T>
  ? Iterable<T>
  : M extends AsyncIterable<infer B>
  ? AsyncIterable<B>
  : never
type CurriedTimeResult = <T, M extends AnyIterable<T>>(curriedIterable: M) => UnwrapAnyIterable<M>

export function time(config?: ITimeConfig): CurriedTimeResult
export function time<T, M extends AnyIterable<T>>(config: ITimeConfig, iterable: M): UnwrapAnyIterable<M>
export function time(
  config: ITimeConfig = {},
  iterable?: AnyIterable<any>
): CurriedTimeResult | UnwrapAnyIterable<any> {
  if (iterable === undefined) {
    return curriedIterable => time(config, curriedIterable)
  }

  if (iterable[Symbol.asyncIterator] !== undefined) {
    return _asyncTime(config, iterable as AsyncIterable<any>)
  } else {
    return _syncTime(config, iterable as Iterable<any>)
  }
}
