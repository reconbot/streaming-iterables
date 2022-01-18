import { assert } from 'chai'
import { batchWithTimeout } from '.'
import { promiseImmediate } from './util-test'
import * as sinon from 'sinon'

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

async function* asyncNumbers(max: number) {
  let num = 1
  while (num <= max) {
    yield await promiseImmediate(num)
    num++
  }
}

function* numbers(max: number) {
  let num = 1
  while (num <= max) {
    yield num
    num++
  }
}

describe('batchWithTimeout', () => {
  it('batches async iterators', async () => {
    const batches: number[][] = []
    for await (const numberBatch of batchWithTimeout(5, Infinity, asyncNumbers(11))) {
      batches.push(numberBatch)
    }
    assert.deepEqual(batches, [[1, 2, 3, 4, 5], [6, 7, 8, 9, 10], [11]])
  })

  it('batches sync iterators', async () => {
    const batches: number[][] = []
    for await (const numberBatch of batchWithTimeout(5, Infinity, numbers(11))) {
      batches.push(numberBatch)
    }
    assert.deepEqual(batches, [[1, 2, 3, 4, 5], [6, 7, 8, 9, 10], [11]])
  })

  it('is curryable', async () => {
    const batches: number[][] = []
    const batch5 = batchWithTimeout(5, Infinity)
    for await (const numberBatch of batch5(numbers(10))) {
      assert.equal(numberBatch.length, 5)
      batches.push(numberBatch)
    }
    assert.deepEqual(batches, [
      [1, 2, 3, 4, 5],
      [6, 7, 8, 9, 10],
    ])
  })

  describe('timeout', () => {
    let clock

    before(() => {
      clock = sinon.useFakeTimers()
    })

    after(() => {
      clock.restore()
    })

    async function* delayedAsyncNumbers() {
      await sleep(400)
      yield 0
      await sleep(1)
      yield 1
      await sleep(100)
      yield 2
      await sleep(200)
      yield 3
      await sleep(100)
      yield 4
      await sleep(300)
      yield 5
      await sleep(400)
      yield 6
    }

    it('batches with an infinite timeout', async () => {
      const src = batchWithTimeout(3, Infinity, delayedAsyncNumbers())
      const promisedBatches: Promise<any>[] = [src.next(), src.next(), src.next()]
      clock.runAllAsync()
      const batches = (await Promise.all(promisedBatches)).map(({ value }) => value)
      assert.deepEqual(batches, [[0, 1, 2], [3, 4, 5], [6]])
      assert.equal((await src.next()).done, true)
    })

    it('batches with a 2000ms timeout', async () => {
      const src = batchWithTimeout(3, 2000, delayedAsyncNumbers())
      const promisedBatches: Promise<any>[] = [src.next(), src.next(), src.next()]
      clock.runAllAsync()
      const batches = (await Promise.all(promisedBatches)).map(({ value }) => value)
      assert.deepEqual(batches, [[0, 1, 2], [3, 4, 5], [6]])
      assert.equal((await src.next()).done, true)
    })

    it('batches with a 200ms timeout', async () => {
      const src = batchWithTimeout(3, 200, delayedAsyncNumbers())
      const promisedBatches: Promise<any>[] = [src.next(), src.next(), src.next(), src.next()]
      clock.runAllAsync()
      const batches = (await Promise.all(promisedBatches)).map(({ value }) => value)
      assert.deepEqual(batches, [[0, 1, 2], [3, 4], [5], [6]])
      assert.equal((await src.next()).done, true)
    })

    it('batches with a 20ms timeout', async () => {
      const src = batchWithTimeout(3, 20, delayedAsyncNumbers())
      const promisedBatches: Promise<any>[] = [src.next(), src.next(), src.next(), src.next(), src.next(), src.next()]
      clock.runAllAsync()
      const batches = (await Promise.all(promisedBatches)).map(({ value }) => value)
      assert.deepEqual(batches, [[0, 1], [2], [3], [4], [5], [6]])
      assert.equal((await src.next()).done, true)
    })

    it('batches with a 0ms timeout', async () => {
      const src = batchWithTimeout(3, 0, delayedAsyncNumbers())
      const promisedBatches: Promise<any>[] = [
        src.next(),
        src.next(),
        src.next(),
        src.next(),
        src.next(),
        src.next(),
        src.next(),
      ]
      clock.runAllAsync()
      const batches = (await Promise.all(promisedBatches)).map(({ value }) => value)
      assert.deepEqual(batches, [[0], [1], [2], [3], [4], [5], [6]])
      assert.equal((await src.next()).done, true)
    })

    it('batches with an infinite size and infinite timeout', async () => {
      const src = batchWithTimeout(Infinity, Infinity, delayedAsyncNumbers())
      const promisedBatches: Promise<any>[] = [src.next()]
      clock.runAllAsync()
      const batches = (await Promise.all(promisedBatches)).map(({ value }) => value)
      assert.deepEqual(batches, [[0, 1, 2, 3, 4, 5, 6]])
      assert.equal((await src.next()).done, true)
    })

    it('batches with an infinite size and 200ms timeout', async () => {
      const src = batchWithTimeout(Infinity, 200, delayedAsyncNumbers())
      const promisedBatches: Promise<any>[] = [src.next(), src.next(), src.next(), src.next()]
      clock.runAllAsync()
      const batches = (await Promise.all(promisedBatches)).map(({ value }) => value)
      assert.deepEqual(batches, [[0, 1, 2], [3, 4], [5], [6]])
      assert.equal((await src.next()).done, true)
    })

    // TODO: Is this correct? `batch` actually treats `0` as `Infinity` 🤔
    it('treats size 0 as 1', async () => {
      const src = batchWithTimeout(0, 10, delayedAsyncNumbers())
      const promisedBatches: Promise<any>[] = [
        src.next(),
        src.next(),
        src.next(),
        src.next(),
        src.next(),
        src.next(),
        src.next(),
      ]
      clock.runAllAsync()
      const batches = (await Promise.all(promisedBatches)).map(({ value }) => value)
      assert.deepEqual(batches, [[0], [1], [2], [3], [4], [5], [6]])
      assert.equal((await src.next()).done, true)
    })
  })
})
