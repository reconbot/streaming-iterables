import { assert } from 'chai'
import { collect } from '../lib/collect'
import { fromIterable } from '../lib/from-iterable'

function promiseImmediate (data?) {
  return new Promise(resolve => setImmediate(() => resolve(data)))
}

describe('collect', () => {
  it('collects async data', async () => {
    assert.deepEqual(await collect(fromIterable([1, 2, 3, 4])), [1, 2, 3, 4])
  })
  it('collects sync data', async () => {
    assert.deepEqual(await collect([1, 2, 3, 4]), [1, 2, 3, 4])
  })
})
