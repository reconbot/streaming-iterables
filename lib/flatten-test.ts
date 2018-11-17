import { assert } from 'chai'
import { flatten } from './'

async function* asyncValues(values) {
  for await (const value of values) {
    yield value
  }
}

describe('flatten', () => {
  it('flattens arrays', async () => {
    const numbers: number[] = []
    for await (const num of flatten([1, 2, [3, [4], [5], 6], 7, [8]])) {
      numbers.push(num)
    }
    assert.deepEqual(numbers, [1, 2, 3, 4, 5, 6, 7, 8])
  })

  it('flattens async and sync iterables', async () => {
    const numbers: number[] = []
    const values = asyncValues([1, 2, asyncValues([3, [4], asyncValues([5]), 6]), 7, [8]])
    for await (const num of flatten(values)) {
      numbers.push(num)
    }
    assert.deepEqual(numbers, [1, 2, 3, 4, 5, 6, 7, 8])
  })
})
