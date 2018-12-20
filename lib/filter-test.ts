import { assert } from 'chai'
import { filter } from './'
import { asyncFromArray } from './util-test'

describe('filter', () => {
  it('filters iterators', async () => {
    const numbers: number[] = []
    for await (const num of filter(i => !!i, [1, 2, null, undefined, 3])) {
      numbers.push(num as number)
    }
    assert.deepEqual(numbers, [1, 2, 3])
  })
  it('filters async iterators', async () => {
    const numbers: number[] = []
    for await (const num of filter(i => !!i, asyncFromArray([1, 2, null, undefined, 3]))) {
      numbers.push(num as number)
    }
    assert.deepEqual(numbers, [1, 2, 3])
  })
  it('async filters iterators', async () => {
    const numbers: number[] = []
    for await (const num of filter(async i => !!i, [1, 2, null, undefined, 3])) {
      numbers.push(num as number)
    }
    assert.deepEqual(numbers, [1, 2, 3])
  })

  it('is curryable', async () => {
    const numbers: number[] = []
    const values = asyncFromArray([1, 2, null, 3])
    const filterFalsy = filter(i => !!i)
    for await (const num of filterFalsy(values)) {
      numbers.push(num as number)
    }
    assert.deepEqual(numbers, [1, 2, 3])
  })
})
