import { assert } from 'chai'
import { buffer } from '../lib/buffer'

if ((Symbol as any).asyncIterator === undefined) {
  ((Symbol as any).asyncIterator) = Symbol.for('asyncIterator')
}

function promiseImmediate (data?) {
  return new Promise(resolve => setImmediate(() => resolve(data)))
}

describe('buffer', () => {
  it('buffers async data', async () => {
    let num = 0
    async function* numbers () {
      while (true) {
        yield await promiseImmediate(++num)
      }
    }
    const itr = buffer(5, numbers())
    await promiseImmediate()
    await promiseImmediate()
    assert.equal(num, 0)
    const { value } = await itr.next()
    assert.equal(value, 1)
    await promiseImmediate()
    await promiseImmediate()
    await promiseImmediate()
    await promiseImmediate()
    await promiseImmediate()
    assert.equal(num, 6)
  })
  it('buffers sync data', async () => {
    let num = 0
    function* numbers () {
      while (true) {
        yield ++num
      }
    }
    const itr = buffer(5, numbers())
    assert.equal(num, 0)
    const { value } = await itr.next()
    assert.equal(value, 1)
    assert.equal(num, 6)
  })
})
