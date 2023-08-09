import { describe, it } from 'node:test'
import { assert } from 'chai'
import { collect } from './'
import { asyncFromArray } from './test-utils'

describe('collect', () => {
  it('collects async iterable data', async () => {
    const value = await collect(asyncFromArray([1, 2, 3, 4]))
    assert.deepEqual(value, [1, 2, 3, 4])
  })
  it('collects sync iterable data', () => {
    function* numbers() {
      yield* [1, 2, 3, 4]
    }
    const value = collect(numbers())
    assert.deepEqual(value, [1, 2, 3, 4])
  })
})
