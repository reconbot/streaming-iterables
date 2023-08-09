import { describe, it } from 'node:test'
import { assert } from 'chai'
import { drop } from './'

async function* asyncNumbers() {
  yield 1
  yield 2
  yield 3
}

describe('drop', () => {
  it('skips the first n elements of the given async iterable', async () => {
    const values: number[] = []
    for await (const val of drop(2, asyncNumbers())) {
      values.push(val)
    }
    assert.deepEqual(values, [3])
  })
  it('skips the first n elements of the given sync iterable', () => {
    const values: number[] = []
    for (const val of drop(2, [1, 2, 3])) {
      values.push(val)
    }
    assert.deepEqual(values, [3])
  })
  it('lets skip past the end', () => {
    const values: number[] = []
    for (const val of drop(99, [1, 2, 3])) {
      values.push(val)
    }
    assert.deepEqual(values, [])
  })
  it('lets you curry the count', () => {
    const values: any[] = []
    const take1 = drop(1)
    for (const val of take1([1, 2, 3])) {
      values.push(val)
    }
    assert.deepEqual(values, [2, 3])
  })
})
