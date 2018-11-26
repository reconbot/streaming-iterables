import { assert } from 'chai'
import { fromStream } from '.'
import { PassThrough } from 'stream'

describe('fromStream', () => {
  it('takes a stream and returns an async iterable', async () => {
    const stream = new PassThrough({ objectMode: true })
    stream.write(1)
    stream.end()
    for await (const value of fromStream(stream)) {
      assert.equal(value, 1)
    }
  })
  it('iterates empty streams', async () => {
    const stream = new PassThrough({ objectMode: true })
    stream.end()
    for await (const value of fromStream(stream)) {
      throw new Error(`${value} shouldn't have been resolved`)
    }
  })
})
