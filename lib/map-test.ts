import { assert } from 'chai'
import { map } from './'
import { makeDelay, asyncString } from './util-test'

describe('map', () => {
  it('iterates a sync function over an async value', async () => {
    const values: any[] = []
    for await (const val of map(String, [1, 2, 3])) {
      values.push(val)
    }
    assert.deepEqual(values, ['1', '2', '3'])
  })
  it('iterates a sync function over a sync iterable', async () => {
    const values: any[] = []
    for await (const val of map(String, [1, 2, 3])) {
      values.push(val)
    }
    assert.deepEqual(values, ['1', '2', '3'])
  })
  it('iterates an async function over an async value', async () => {
    const values: any[] = []
    for await (const val of map(asyncString, [1, 2, 3])) {
      values.push(val)
    }
    assert.deepEqual(values, ['1', '2', '3'])
  })
  it('iterates an async function over a sync value', async () => {
    const values: any[] = []
    for await (const val of map(asyncString, [1, 2, 3])) {
      values.push(val)
    }
    assert.deepEqual(values, ['1', '2', '3'])
  })
  it('lets you curry a function', async () => {
    const values: any[] = []
    const stringMap = map(asyncString)
    for await (const val of stringMap([1, 2, 3])) {
      values.push(val)
    }
    assert.deepEqual(values, ['1', '2', '3'])
  })
  it('propagates source errors after the transforms have finished', async () => {
    async function* source() {
      yield 1
      yield 2
      yield 3
      throw new Error('All done!')
    }
    const itr = map(makeDelay(10), source())[Symbol.asyncIterator]()
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
