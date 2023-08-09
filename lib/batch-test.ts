import { describe, it } from 'node:test'
import { assert } from 'chai'
import { batch } from './'
import { promiseImmediate } from './test-utils'

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

describe('batch', () => {
  it('batches async iterators', async () => {
    const batches: number[][] = []
    for await (const numberBatch of batch(5, asyncNumbers(11))) {
      batches.push(numberBatch)
    }
    assert.deepEqual(batches, [[1, 2, 3, 4, 5], [6, 7, 8, 9, 10], [11]])
  })

  it('batches sync iterators', async () => {
    const batches: number[][] = []
    for await (const numberBatch of batch(5, numbers(11))) {
      batches.push(numberBatch)
    }
    assert.deepEqual(batches, [[1, 2, 3, 4, 5], [6, 7, 8, 9, 10], [11]])
  })

  it('batches with size Infinity', async () => {
    const batches: number[][] = []
    for await (const numberBatch of batch(Infinity, numbers(11))) {
      batches.push(numberBatch)
    }
    assert.deepEqual(batches, [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]])
  })

  it('treats size 0 as Infinity', async () => {
    const batches: number[][] = []
    for await (const numberBatch of batch(0, numbers(11))) {
      batches.push(numberBatch)
    }
    assert.deepEqual(batches, [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]])
  })

  it('is curryable', async () => {
    const batches: number[][] = []
    const batch5 = batch(5)
    for await (const numberBatch of batch5(numbers(10))) {
      assert.equal(numberBatch.length, 5)
      batches.push(numberBatch)
    }
    assert.deepEqual(batches, [
      [1, 2, 3, 4, 5],
      [6, 7, 8, 9, 10],
    ])
  })
})
