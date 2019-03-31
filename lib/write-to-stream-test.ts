import { assert } from 'chai'
import { writeToStream } from './'
import { PassThrough, Transform, Writable } from 'stream'
import { promiseImmediate } from './util-test'

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
    writeToStream(stream, values())
    assert.isNull(stream.read())
    await promiseImmediate()
    assert.isAtMost(lastYield, 2)
    assert.equal(lastWrite, 1)
    assert.equal(stream.read(), 1)
    await promiseImmediate()
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
  it('deals with an empty write', async () => {
    const values = []
    const stream = new PassThrough({ highWaterMark: 4, objectMode: true })
    stream.resume()
    await writeToStream(stream, values)
  })
  it('throws the first stream error it sees', async () => {
    const values = [1, 2, 3, 4, 5]
    const stream = new Writable({ objectMode: true })
    stream._write = (value, env, cb) => {
      if (value % 2 === 0) {
        cb(new Error(`Even numbers are not allowed: ${value}`))
      } else {
        cb()
      }
    }
    try {
      await writeToStream(stream, values)
      assert.fail('writeToStream did not throw')
    } catch (err) {
      assert.equal(err.message, 'Even numbers are not allowed: 2')
    }
  })
  it('stops pulling values from the iterator after an error', async () => {
    let iterations = 0
    function* values() {
      for (let i = 1; i <= 5; i++) {
        yield i
        iterations++
      }
    }
    const stream = new Writable({ objectMode: true })
    stream._write = (value, env, cb) => {
      if (value % 2 === 0) {
        cb(new Error(`Even numbers are not allowed: ${value}`))
      } else {
        cb()
      }
    }
    try {
      await writeToStream(stream, values())
      assert.fail('writeToStream did not throw')
    } catch (err) {
      assert.equal(err.message, 'Even numbers are not allowed: 2')
      assert.equal(iterations, 2)
    }
  })
  it('leaves no dangling error handlers on success', async () => {
    const values = [1, 2, 3]
    const stream = new PassThrough({ highWaterMark: 4, objectMode: true })
    await writeToStream(stream, values)
    assert.equal(stream.listenerCount('error'), 0)
  })
  it('leaves no dangling error handlers on error', async () => {
    const values = [1, 2, 3]
    const stream = new Writable({ objectMode: true })
    stream._write = (value, env, cb) => {
      cb(new Error('nope'))
    }
    try {
      await writeToStream(stream, values)
      assert.fail('writeToStream did not throw')
    } catch (err) {
      assert.equal(err.message, 'nope')
      assert.equal(stream.listenerCount('error'), 0)
    }
  })
})
