import { assert } from 'chai'
import { buffer } from './'

function promiseImmediate<T>(data?: T): Promise<T> {
  return new Promise(resolve => setImmediate(() => resolve(data)))
}

describe('buffer', () => {
  it('buffers async data', async () => {
    let num = 0
    async function* numbers() {
      while (true) {
        yield await promiseImmediate(++num)
      }
    }
    const itr = buffer(5, numbers())[Symbol.asyncIterator]()
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
    function* numbers() {
      while (true) {
        yield ++num
      }
    }
    const itr = buffer(5, numbers())[Symbol.asyncIterator]()
    assert.equal(num, 0)
    const { value } = await itr.next()
    assert.equal(value, 1)
    assert.equal(num, 6)
  })

  it('buffers sync iterables', async () => {
    const itr = buffer(2, [1, 2, 3, 4, 5, 6])[Symbol.asyncIterator]()
    assert.equal(1, (await itr.next()).value)
    assert.equal(2, (await itr.next()).value)
    assert.equal(3, (await itr.next()).value)
    assert.equal(4, (await itr.next()).value)
    assert.equal(5, (await itr.next()).value)
    assert.equal(6, (await itr.next()).value)
  })

  it('is curryable', async () => {
    const itr = buffer(2)([1, 2, 3, 4, 5, 6])[Symbol.asyncIterator]()
    assert.equal(1, (await itr.next()).value)
    assert.equal(2, (await itr.next()).value)
    assert.equal(3, (await itr.next()).value)
    assert.equal(4, (await itr.next()).value)
    assert.equal(5, (await itr.next()).value)
    assert.equal(6, (await itr.next()).value)
  })
})
