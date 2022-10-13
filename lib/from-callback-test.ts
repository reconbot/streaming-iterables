import { assert } from 'chai'
import { fromCallback } from './from-callback'
import { collect } from './collect'
import EventEmitter from 'events'

describe('fromCallback', () => {
  it('buffers values', async () => {
    const itr = fromCallback()
    itr.yield(1)
    itr.yield(2)
    itr.yield(3)
    itr.end()
    const values = await collect(itr)
    assert.deepEqual(values, [1,2,3])
  })
  it('works with event emitters', async () => {
    const emitter = new EventEmitter()
    const itr = fromCallback()
    emitter.on('data', itr.yield)
    emitter.on('close', itr.end)
    emitter.emit('data', 1)
    emitter.emit('data', 2)
    emitter.emit('data', 3)
    emitter.emit('close')
    const values = await collect(itr)
    assert.deepEqual(values, [1,2,3])
  })
  it('ignores values after end', async () => {
    const itr = fromCallback()
    itr.yield(1)
    itr.yield(2)
    itr.yield(3)
    itr.end()
    itr.yield(5)
    const values = await collect(itr)
    assert.deepEqual(values, [1,2,3])
  })
})
