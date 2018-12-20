import { assert } from 'chai'
import { batch } from './'
import { promiseImmediate } from './util-test'

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
    const batchs: number[][] = []
    for await (const numberBatch of batch(5, asyncNumbers(10))) {
      assert.equal(numberBatch.length, 5)
      batchs.push(numberBatch)
    }
    assert.deepEqual(batchs, [[1, 2, 3, 4, 5], [6, 7, 8, 9, 10]])
  })

  it('batches sync iterators', async () => {
    const batchs: number[][] = []
    for await (const numberBatch of batch(5, numbers(10))) {
      assert.equal(numberBatch.length, 5)
      batchs.push(numberBatch)
    }
    assert.deepEqual(batchs, [[1, 2, 3, 4, 5], [6, 7, 8, 9, 10]])
  })

  it('is curryable', async () => {
    const batchs: number[][] = []
    const batch5 = batch(5)
    for await (const numberBatch of batch5(numbers(10))) {
      assert.equal(numberBatch.length, 5)
      batchs.push(numberBatch)
    }
    assert.deepEqual(batchs, [[1, 2, 3, 4, 5], [6, 7, 8, 9, 10]])
  })
})
