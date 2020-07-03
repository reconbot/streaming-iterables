import { assert } from 'chai'
import { fromStream } from '.'
import { PassThrough } from 'stream'

const once = func => {
  let called = false
  return (...args) => {
    if (called) {
      return
    }
    called = true
    return func(...args)
  }
}

describe('fromStream', () => {
  it('takes a stream and returns an async iterable', async () => {
    const stream = new PassThrough({ objectMode: true })
    stream.write(1)
    stream.end()
    for await (const value of fromStream(stream)) {
      assert.equal(value, 1)
    }
  })
  it('takes an old stream and returns an async iterable', async () => {
    const stream = new PassThrough({ objectMode: true })
    stream[Symbol.asyncIterator] = undefined as any
    stream.write(1)
    const itr = fromStream(stream)[Symbol.asyncIterator]()
    assert.deepEqual(await itr.next(), { value: 1, done: false })
    const next = itr.next()
    stream.end()
    assert.deepEqual(await next, { value: undefined, done: true })
  })

  it('iterates empty streams', async () => {
    const stream = new PassThrough({ objectMode: true })
    stream.end()
    for await (const value of fromStream(stream)) {
      throw new Error(`${value} shouldn't have been resolved`)
    }
  })
})
