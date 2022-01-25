/// <reference lib="esnext.asynciterable" />
import { AnyIterable } from './types'

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

async function* _throttle<T>(num: number, ms: number, iterable: AnyIterable<T>) {
  let sent = 0
  let time: number | undefined
  for await (const val of iterable) {
    if (sent < num) {
      if (typeof time === 'undefined') {
        time = Date.now()
      }
      sent++
      yield val
      continue
    }
    // Only wait if the window hasn't already passed while we were
    // yielding the previous values.
    const elapsedMs = Date.now() - time!
    const waitFor = ms - elapsedMs
    if (waitFor > 0) {
      await sleep(waitFor)
    }
    time = Date.now()
    sent = 1
    yield val
  }
}

export function throttle<T>(num: number, ms: number): (iterable: AnyIterable<T>) => AsyncGenerator<T>
export function throttle<T>(num: number, ms: number, iterable: AnyIterable<T>): AsyncGenerator<T>
export function throttle<T>(num: number, ms: number, iterable?: AnyIterable<T>) {
  if (iterable === undefined) {
    return (curriedIterable: AnyIterable<T>) => _throttle(num, ms, curriedIterable)
  }
  return _throttle(num, ms, iterable)
}
