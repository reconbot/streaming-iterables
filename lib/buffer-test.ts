import { assert } from 'chai'
import { buffer } from './'
import { promiseImmediate, asyncFromArray } from './util-test'

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
    const itr = buffer(5, numbers())[Symbol.iterator]()
    assert.equal(num, 0)
    const { value } = await itr.next()
    assert.equal(value, 1)
    assert.equal(num, 6)
  })
  it('buffers sync iterables', async () => {
    const itr = buffer(2, [1, 2, 3, 4, 5, 6])[Symbol.iterator]()
    assert.equal(1, (await itr.next()).value)
    assert.equal(2, (await itr.next()).value)
    assert.equal(3, (await itr.next()).value)
    assert.equal(4, (await itr.next()).value)
    assert.equal(5, (await itr.next()).value)
    assert.equal(6, (await itr.next()).value)
  })

  it('is curryable', async () => {
    const itr = buffer(2)([1, 2, 3, 4, 5, 6])[Symbol.iterator]()
    assert.equal(1, (await itr.next()).value)
    assert.equal(2, (await itr.next()).value)
    assert.equal(3, (await itr.next()).value)
    assert.equal(4, (await itr.next()).value)
    assert.equal(5, (await itr.next()).value)
    assert.equal(6, (await itr.next()).value)
  })
  it('deals with an infinite size', async () => {
    const values: number[] = []
    for await (const value of buffer(Infinity, asyncFromArray([1, 2, 3, 4]))) {
      values.push(value)
    }
    assert.deepEqual(values, [1, 2, 3, 4])
  })
  it('propagates errors after buffer drains sync', () => {
    const source = function*() {
      yield 1
      yield 2
      yield 3
      throw new Error('All done!') // this is how my friend's kid finishes dinner
    }
    // const itr = buffer(5, source())[Symbol.iterator]()
    const itr = source()[Symbol.iterator]()
    assert.equal(itr.next().value, 1)
    assert.equal(itr.next().value, 2)
    assert.equal(itr.next().value, 3)
    try {
      itr.next()
      throw new Error('next should have errored')
    } catch (error) {
      assert.equal(error.message, 'All done!')
    }
    assert.deepEqual(itr.next() as any, { done: true, value: undefined })
  })
  it('propagates errors after buffer drains async', async () => {
    const source = async function*() {
      yield 1
      yield 2
      yield 3
      throw new Error('All done!')
    }
    const itr = buffer(5, source())[Symbol.asyncIterator]()
    assert.equal((await itr.next()).value, 1)
    assert.equal((await itr.next()).value, 2)
    assert.equal((await itr.next()).value, 3)
    try {
      await itr.next()
      throw new Error('next should have errored')
    } catch (error) {
      assert.equal(error.message, 'All done!')
    }
    assert.deepEqual((await itr.next()) as any, { done: true, value: undefined })
  })
})
