import { assert } from 'chai'
import { flatten } from './'
import { collect } from './collect'
import { asyncFromArray } from './util-test'

describe('flatten', () => {
  it('flattens arrays', async () => {
    const numbers: number[] = []
    for await (const num of flatten([1, 2, [3, [4], [5], 6], 7, [8]])) {
      numbers.push(num as number)
    }
    assert.deepEqual(numbers, [1, 2, 3, 4, 5, 6, 7, 8])
  })

  it('flattens async and sync iterables', async () => {
    const numbers: number[] = []
    const values = asyncFromArray([1, 2, asyncFromArray([3, [4], asyncFromArray([5]), 6]), 7, [8]])
    for await (const num of flatten(values as any)) {
      numbers.push(num as number)
    }
    assert.deepEqual(numbers, [1, 2, 3, 4, 5, 6, 7, 8])
  })
  it('flattens arrays of null and undefined values', async () => {
    const values = [[[null]], [undefined], 1, '', 0]
    assert.deepEqual((await collect(flatten(values))) as any[], [null, undefined, 1, '', 0])
  })
  it('does not flatten strings', async () => {
    const values = ['a', 'bcdef', 'g']
    assert.deepEqual(await collect(flatten(values)), ['a', 'bcdef', 'g'])
  })
})
