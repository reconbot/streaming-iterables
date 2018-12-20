import { assert } from 'chai'
import { collect } from './'
import { asyncFromArray } from './util-test'

describe('collect', () => {
  it('collects async iterable data', async () => {
    assert.deepEqual(await collect(asyncFromArray([1, 2, 3, 4])), [1, 2, 3, 4])
  })
  it('collects sync iterable data', async () => {
    assert.deepEqual(collect([1, 2, 3, 4]), [1, 2, 3, 4])
  })
})
