/// <reference lib="esnext.asynciterable" />

import { AnyIterable } from './types'
import { batch, UnwrapAnyIterableArray } from './batch'

const TIMEOUT = Symbol('TIMEOUT')

const createTimer = (duration: number): [Promise<typeof TIMEOUT>, () => void] => {
  let timeoutId
  return [
    new Promise(resolve => {
      timeoutId = setTimeout(() => resolve(TIMEOUT), duration)
    }),
    () => {
      clearTimeout(timeoutId)
    },
  ]
}

// Like `batch` but flushes early if the `timeout` is reached
// NOTE: The strategy is to only hold onto a single item for a maximum of `timeout` ms.
async function* _batchWithTimeout<T>(size: number, timeout: number, iterable: AsyncIterable<T>) {
  const iterator = iterable[Symbol.asyncIterator]()
  let pendingData: Promise<IteratorResult<T, any>> | undefined
  let batchData: T[] = []
  let timer: Promise<typeof TIMEOUT> | undefined
  let clearTimer: () => void | undefined
  const startTimer = () => {
    deleteTimer()
    ;[timer, clearTimer] = createTimer(timeout)
  }
  const deleteTimer = () => {
    if (clearTimer) {
      clearTimer()
    }
    timer = undefined
  }
  pendingData = iterator.next()

  while (true) {
    const res = await (timer ? Promise.race([pendingData, timer]) : pendingData)

    if (res === TIMEOUT || res.done) {
      // Flush early (before we reach the batch size)
      if (batchData.length) {
        yield batchData
        batchData = []
      }
      deleteTimer()
      // And exit appropriately
      if (res !== TIMEOUT) {
        // done
        break
      }
      continue
    }

    // Fetch next item early doors (before we potentially yield)
    pendingData = iterator.next()

    // Then handle the value
    batchData.push(res.value)
    if (batchData.length === 1) {
      // Start timer once we have at least 1 item ready to go
      startTimer()
    }
    if (batchData.length === size) {
      yield batchData
      batchData = []
      deleteTimer()
      continue
    }
  }
}

export type CurriedBatchWithTimeoutResult = <T, M extends AnyIterable<T>>(
  curriedIterable: M
) => UnwrapAnyIterableArray<M>

export function batchWithTimeout<T, M extends AnyIterable<T>>(
  size: number,
  timeout: number
): CurriedBatchWithTimeoutResult
export function batchWithTimeout<T, M extends AnyIterable<T>>(
  size: number,
  timeout: number,
  iterable: M
): UnwrapAnyIterableArray<M>
export function batchWithTimeout<T>(
  size: number,
  timeout: number,
  iterable?: AnyIterable<T>
): CurriedBatchWithTimeoutResult | UnwrapAnyIterableArray<any> {
  if (iterable === undefined) {
    return curriedIterable => batchWithTimeout(size, timeout, curriedIterable)
  }
  if (iterable[Symbol.asyncIterator] && timeout !== Infinity) {
    return _batchWithTimeout(size, timeout, iterable as AsyncIterable<T>)
  }
  // For sync iterables or an infinite timeout, the timeout is irrelevant so just fallback to regular `batch`.
  return batch(size, iterable as Iterable<T>)
}
