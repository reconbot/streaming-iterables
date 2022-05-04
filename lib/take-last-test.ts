import { assert } from 'chai'
import { takeLast } from './'

async function* asyncNumbers() {
  yield 6
  yield 5
  yield 4
  yield 3
  yield 2
  yield 1
}

describe('take', () => {
  it('Returns the last n elements of the given async iterable', async () => {
    const values: number[] = []
    for await (const val of takeLast(2, asyncNumbers())) {
      values.push(val)
    }
    assert.deepEqual(values, [2, 1])
  })
  it('Returns the last n elements of the given sync iterable', () => {
    const values: number[] = []
    for (const val of takeLast(2, [3, 2, 1])) {
      values.push(val)
    }
    assert.deepEqual(values, [2, 1])
  })
  it('lets you ask for more', () => {
    const values: number[] = []
    for (const val of takeLast(99, [3, 2, 1])) {
      values.push(val)
    }
    assert.deepEqual(values, [3, 2, 1])
  })
  it('lets you curry the count', () => {
    const values: any[] = []
    const takeLast1 = takeLast(1)
    for (const val of takeLast1([3, 2, 1])) {
      values.push(val)
    }
    assert.deepEqual(values, [1])
  })
})
