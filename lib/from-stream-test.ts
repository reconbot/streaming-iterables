import { assert } from 'chai'
import { fromStream } from '.'
import { PassThrough } from 'stream'

describe('fromStream', () => {
  it('takes a stream and returns an async iterable', async () => {
    const stream = new PassThrough({ objectMode: true })
    stream.write(1)
    const actual: number[] = []
    for await (const value of fromStream<number>(stream)) {
      if (value === 1) {
        setImmediate(() => {
          stream.write(2)
          stream.end()
        })
      }
      actual.push(value)
    }
    assert.deepEqual(actual, [1, 2])
  })
  it('iterates empty streams', async () => {
    const stream = new PassThrough({ objectMode: true })
    stream.end()
    for await (const value of fromStream(stream)) {
      throw new Error(`${value} shouldn't have been resolved`)
    }
  })
  it('propagates errors', async () => {
    const stream = new PassThrough({ objectMode: true })
    stream.write(1)
    const expected = new Error('')
    try {
      for await (const _ of fromStream(stream)) {
        stream.emit('error', expected)
      }
      throw new Error('Iterator should have errored')
    } catch (error) {
      assert.equal(error, expected)
    }
  })
})
