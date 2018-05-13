import { assert } from 'chai'
import { fromIterable } from './'

// const iterator = Symbol.iterator
// const asyncIterator =

describe('fromIterable', () => {
  it('gives a sync iterator for a sync iterable', () => {
    const iterator = fromIterable([1])
    assert.deepEqual(iterator.next(), {
      done: false,
      value: 1,
    })
  })
  it('gives a sync iterator for a sync iterator', () => {
    const iterator = fromIterable([1][Symbol.iterator]())
    assert.deepEqual(iterator.next(), {
      done: false,
      value: 1,
    })
  })
  it('gives an async iterator for an async iterable', async () => {
    const asyncIterable = {
      async *[(Symbol as any).asyncIterator] () { yield 1 },
    }
    const iterator = fromIterable(asyncIterable)
    const next = iterator.next()
    assert.isFunction(next.then)
    assert.deepEqual(await next, {
      done: false,
      value: 1,
    })
  })
  it('gives an async iterator for an async iterator', async () => {
    const asyncIterator = async function* () { yield 1 }
    const iterator = fromIterable(asyncIterator())
    const next = iterator.next()
    assert.isFunction(next.then)
    assert.deepEqual(await next, {
      done: false,
      value: 1,
    })
  })
})
