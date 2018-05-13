import { assert } from 'chai'
import { collect, fromIterable } from './'

async function* asyncIterable (arr) {
 for (const val of arr) {
   yield val
 }
}

describe('collect', () => {
  it('collects async iterator data', async () => {
    assert.deepEqual(await collect(asyncIterable([1, 2, 3, 4])), [1, 2, 3, 4])
  })
  it('collects sync iterable data', async () => {
    assert.deepEqual(await collect([1, 2, 3, 4]), [1, 2, 3, 4])
  })
})
