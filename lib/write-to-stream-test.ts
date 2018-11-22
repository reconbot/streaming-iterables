import { assert } from 'chai'
import { writeToStream } from './'
import { PassThrough, Transform } from 'stream'

function asyncImmediate() {
  return new Promise(resolve => {
    setImmediate(() => resolve())
  })
}

describe('writeToStream', () => {
  it('writes values to a stream', async () => {
    const values = [1, 2, 3]
    const stream = new PassThrough({ highWaterMark: 4, objectMode: true })
    await writeToStream(stream, values)
    assert.equal(stream.read(), 1)
    assert.equal(stream.read(), 2)
    assert.equal(stream.read(), 3)
  })
  it('respects backpressure', async () => {
    let lastYield = 0
    function* values() {
      lastYield = 1
      yield 1
      lastYield = 2
      yield 2
      lastYield = 3
      yield 3
      lastYield = 4
      yield 4
      lastYield = 5
      yield 5
    }
    let lastWrite: null | number = null
    const stream = new Transform({
      highWaterMark: 0,
      objectMode: true,
      transform(value: number, encoding: string, cb: any) {
        lastWrite = value
        cb(null, value)
      },
    })
    const writePromise = writeToStream(stream, values())
    assert.isNull(stream.read())
    await asyncImmediate()
    assert.isAtMost(lastYield, 2)
    assert.equal(lastWrite, 1)
    assert.equal(stream.read(), 1)
    await asyncImmediate()
    assert.equal(stream.read(), 2)
    assert.isAtMost(lastYield, 3)
    assert.equal(lastWrite, 2)
  })
  it("doesn't close the stream", async () => {
    const values = [1, 2, 3]
    const stream = new PassThrough({ highWaterMark: 4, objectMode: true })
    stream.resume()
    await writeToStream(stream, values)
    assert.isTrue(stream.readable)
    assert.isTrue(stream.writable)
  })
})
