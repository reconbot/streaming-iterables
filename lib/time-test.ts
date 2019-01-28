import { assert } from 'chai'
import { time } from './'
import { collect } from './collect'

describe('time', () => {
  it('produces an iterator for an iterator', () => {
    const values = [1, 2, 3, 4]
    const timer = time()
    const timingItr = timer(values)
    assert.deepEqual(values, Array.from(timingItr))
    assert.isFunction(timer(values)[Symbol.iterator])
  })
  it('produces an async iterator for an async iterator', async () => {
    const values = async function*() {
      yield* [1, 2, 3, 4]
    }
    const timer = time()
    const timingItr = timer(values())
    assert.deepEqual([1, 2, 3, 4], await collect(timingItr))
    assert.isFunction(timer(values())[Symbol.asyncIterator])
  })
  it('logs the total time to iterate', async () => {
    const values = [1, 2, 3, 4]
    let delta
    const timer = time({ total: hr => (delta = hr) })
    const timingItr = timer(values)
    assert.deepEqual(values, Array.from(timingItr))
    assert.isNumber(delta[0])
    assert.isAbove(delta[1], 1)
  })
  it('logs the progress events', async () => {
    const values = [1, 2, 3, 4]
    const deltas: Array<[number, number]> = []
    const timer = time({ progress: (delta, total) => deltas.push(total) })
    const timingItr = timer(values)
    assert.deepEqual(values, Array.from(timingItr))
    assert.lengthOf(deltas, 5)
    assert.isAbove(deltas[4][1], deltas[0][1])
  })
  it('logs the total time to iterate async', async () => {
    const values = async function*() {
      yield* [1, 2, 3, 4]
    }
    let delta
    const timer = time({ total: hr => (delta = hr) })
    const timingItr = timer(values())
    assert.deepEqual([1, 2, 3, 4], await collect(timingItr))
    assert.isNumber(delta[0])
    assert.isAbove(delta[1], 1)
  })
  it('logs the progress events async', async () => {
    const values = async function*() {
      yield* [1, 2, 3, 4]
    }
    const deltas: Array<[number, number]> = []
    const timer = time({ progress: (delta, total) => deltas.push(total) })
    const timingItr = timer(values())
    assert.deepEqual([1, 2, 3, 4], await collect(timingItr))
    assert.lengthOf(deltas, 5)
    assert.isAbove(deltas[4][1], deltas[0][1])
  })
})
