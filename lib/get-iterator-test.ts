import { assert } from 'chai'
import { getIterator } from '.'

describe('getIterator', () => {
  it('gives a sync iterator for a sync iterable', () => {
    const iterator = getIterator([1])
    assert.deepEqual(iterator.next(), {
      done: false,
      value: 1,
    })
  })
  it('gives a sync iterator for a sync iterator', () => {
    const iterator = getIterator(
      (function*() {
        yield 1
      })()
    )
    assert.deepEqual(iterator.next(), {
      done: false,
      value: 1,
    })
  })
  it('gives an async iterator for an async iterable', async () => {
    const asyncIterable = {
      async *[Symbol.asyncIterator]() {
        yield 1
      },
    }
    const iterator = getIterator(asyncIterable)
    const next = iterator.next()
    assert.isFunction((next as any).then)
    assert.deepEqual(await next, {
      done: false,
      value: 1,
    })
  })
  it('gives an async iterator for an async iterator', async () => {
    const asyncIterator = async function*() {
      yield 1
    }
    const iterator = getIterator(asyncIterator())
    const next = iterator.next()
    assert.isFunction((next as any).then)
    assert.deepEqual(await next, {
      done: false,
      value: 1,
    })
  })
})
