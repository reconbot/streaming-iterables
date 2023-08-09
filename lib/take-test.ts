import { describe, it } from 'node:test'
import { assert } from 'chai'
import { take } from './'

async function* asyncNumbers() {
  yield 1
  yield 2
  yield 3
}

describe('take', () => {
  it('Returns the first n elements of the given async iterable', async () => {
    const values: number[] = []
    for await (const val of take(2, asyncNumbers())) {
      values.push(val)
    }
    assert.deepEqual(values, [1, 2])
  })
  it('Returns the first n elements of the given sync iterable', () => {
    const values: number[] = []
    for (const val of take(2, [1, 2, 3])) {
      values.push(val)
    }
    assert.deepEqual(values, [1, 2])
  })
  it('lets you ask for more', () => {
    const values: number[] = []
    for (const val of take(99, [1, 2, 3])) {
      values.push(val)
    }
    assert.deepEqual(values, [1, 2, 3])
  })
  it('lets you curry the count', () => {
    const values: any[] = []
    const take1 = take(1)
    for (const val of take1([1, 2, 3])) {
      values.push(val)
    }
    assert.deepEqual(values, [1])
  })
})
