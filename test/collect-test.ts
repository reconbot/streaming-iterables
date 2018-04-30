import { assert } from 'chai'
import { collect } from '../lib/collect'
import { fromIterator } from '../lib/from-iterator'

if ((Symbol as any).asyncIterator === undefined) {
  ((Symbol as any).asyncIterator) = Symbol.for('asyncIterator')
}

function promiseImmediate (data?) {
  return new Promise(resolve => setImmediate(() => resolve(data)))
}

describe('buffer', () => {
  it('collects async data', async () => {
    assert.deepEqual(await collect(fromIterator([1, 2, 3, 4])), [1, 2, 3, 4])
  })
  it('collects sync data', async () => {
    assert.deepEqual(await collect([1, 2, 3, 4]), [1, 2, 3, 4])
  })
})
