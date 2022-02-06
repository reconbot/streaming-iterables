import { assert } from 'chai'
import { throttle } from './throttle'
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

describe('throttle', () => {
  let clock: ReturnType<typeof sinon.useFakeTimers>

  beforeEach(() => {
    clock = sinon.useFakeTimers()
  })

  afterEach(() => {
    clock.restore()
  })

  async function* withTimestamp<T>(iterable: AsyncIterable<T>) {
    for await (const value of iterable) {
      yield { value, timestamp: `${clock.now}ms` }
    }
  }

  it('throws if `limit` is not a finite number', () => {
    assert.throws(() => throttle('1' as any, 1000, numbers(5)), 'Expected `limit` to be a finite number')
    assert.throws(() => throttle(-Infinity, 1000)(numbers(5)), 'Expected `limit` to be a finite number')
    assert.throws(() => throttle(-Infinity, 1000)(numbers(5)), 'Expected `limit` to be a finite number')
  })

  it('throws if `interval` is not a finite number', () => {
    assert.throws(() => throttle(1, '1000' as any, numbers(5)), 'Expected `interval` to be a finite number')
    assert.throws(() => throttle(1, -Infinity, numbers(5)), 'Expected `interval` to be a finite number')
    assert.throws(() => throttle(1, Infinity)(numbers(5)), 'Expected `interval` to be a finite number')
  })

  it('throws if limit is <= 0', () => {
    assert.throws(() => throttle(0, 1000, numbers(5)), 'Expected `limit` to be greater than 0')
    assert.throws(() => throttle(-1, 1000, numbers(5)), 'Expected `limit` to be greater than 0')
  })

  it('throttles sync iterators, 1 every 1s', async () => {
    const src = withTimestamp(throttle(1, 1000, numbers(5)))
    const promisedValues = new Promise(async resolve => {
      const vals: any[] = []
      for await (const value of src) {
        vals.push(value)
      }
      resolve(vals)
    })
    clock.runAllAsync()
    const values = await promisedValues
    assert.deepEqual(values, [
      { value: 1, timestamp: '0ms' },
      { value: 2, timestamp: '1000ms' },
      { value: 3, timestamp: '2000ms' },
      { value: 4, timestamp: '3000ms' },
      { value: 5, timestamp: '4000ms' },
    ])
    assert.equal((await src.next()).done, true)
  })

  it('throttles async iterators, 1 every 1s', async () => {
    const src = withTimestamp(throttle(1, 1000, asyncNumbers(5)))
    const promisedValues = new Promise(async resolve => {
      const vals: any[] = []
      for await (const value of src) {
        vals.push(value)
      }
      resolve(vals)
    })
    clock.runAllAsync()
    const values = await promisedValues
    assert.deepEqual(values, [
      { value: 1, timestamp: '0ms' },
      { value: 2, timestamp: '1000ms' },
      { value: 3, timestamp: '2000ms' },
      { value: 4, timestamp: '3000ms' },
      { value: 5, timestamp: '4000ms' },
    ])
    assert.equal((await src.next()).done, true)
  })

  it('throttles async iterators, 2 every 1s', async () => {
    const src = withTimestamp(throttle(2, 1000, asyncNumbers(5)))
    const promisedValues = new Promise(async resolve => {
      const vals: any[] = []
      for await (const value of src) {
        vals.push(value)
      }
      resolve(vals)
    })
    clock.runAllAsync()
    const values = await promisedValues
    assert.deepEqual(values, [
      { value: 1, timestamp: '0ms' },
      { value: 2, timestamp: '0ms' },
      { value: 3, timestamp: '1000ms' },
      { value: 4, timestamp: '1000ms' },
      { value: 5, timestamp: '2000ms' },
    ])
    assert.equal((await src.next()).done, true)
  })

  it('throttles async iterators, 4 every 6s', async () => {
    const src = withTimestamp(throttle(4, 6000, asyncNumbers(9)))
    const promisedValues = new Promise(async resolve => {
      const vals: any[] = []
      for await (const value of src) {
        vals.push(value)
      }
      resolve(vals)
    })
    clock.runAllAsync()
    const values = await promisedValues
    assert.deepEqual(values, [
      { value: 1, timestamp: '0ms' },
      { value: 2, timestamp: '0ms' },
      { value: 3, timestamp: '0ms' },
      { value: 4, timestamp: '0ms' },
      { value: 5, timestamp: '6000ms' },
      { value: 6, timestamp: '6000ms' },
      { value: 7, timestamp: '6000ms' },
      { value: 8, timestamp: '6000ms' },
      { value: 9, timestamp: '12000ms' },
    ])
  })

  it('avoids over-throttling if the consumer is slower than the throttling config', async () => {
    const src = withTimestamp(throttle(1, 500, asyncNumbers(7)))
    const promisedValues = new Promise(async resolve => {
      const vals: any[] = []
      vals.push((await src.next()).value) // 1
      await sleep(1000)
      vals.push((await src.next()).value) // 2
      await sleep(250)
      vals.push((await src.next()).value) // 3
      await sleep(3000)
      vals.push((await src.next()).value) // 4
      await sleep(100)
      vals.push((await src.next()).value) // 5
      await sleep(1000)
      vals.push((await src.next()).value) // 6
      await sleep(60000)
      vals.push((await src.next()).value) // 7
      resolve(vals)
    })
    clock.runAllAsync()
    const values = await promisedValues
    assert.deepEqual(values, [
      { value: 1, timestamp: '0ms' },
      { value: 2, timestamp: '1000ms' },
      { value: 3, timestamp: '1500ms' }, // throttled
      { value: 4, timestamp: '4500ms' },
      { value: 5, timestamp: '5000ms' }, // throttled
      { value: 6, timestamp: '6000ms' },
      { value: 7, timestamp: '66000ms' },
    ])
    assert.equal((await src.next()).done, true)
  })

  it('is curryable', async () => {
    const throttle3PerSecond = throttle(3, 1000)
    const src = withTimestamp(throttle3PerSecond(asyncNumbers(5)))
    const promisedValues = new Promise(async resolve => {
      const vals: any[] = []
      for await (const value of src) {
        vals.push(value)
      }
      resolve(vals)
    })
    clock.runAllAsync()
    const values = await promisedValues
    assert.deepEqual(values, [
      { value: 1, timestamp: '0ms' },
      { value: 2, timestamp: '0ms' },
      { value: 3, timestamp: '0ms' },
      { value: 4, timestamp: '1000ms' },
      { value: 5, timestamp: '1000ms' },
    ])
    assert.equal((await src.next()).done, true)
  })
})
