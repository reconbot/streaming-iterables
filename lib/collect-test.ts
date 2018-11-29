import { assert } from 'chai'
import { collect } from './'

async function* asyncIterable(arr) {
  for (const val of arr) {
    yield val
  }
}

describe('collect', () => {
  it('collects async iterable data', async () => {
    assert.deepEqual(await collect(asyncIterable([1, 2, 3, 4])), [1, 2, 3, 4])
  })
  it('collects sync iterable data', async () => {
    assert.deepEqual(collect([1, 2, 3, 4]), [1, 2, 3, 4])
  })
})
