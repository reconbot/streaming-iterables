import { assert } from 'chai'
import { transform, fromStream } from '.'
import { PassThrough } from 'stream'
import { promiseImmediate, delayTicks, asyncFromArray, makeDelay } from './util-test'

describe('transform', () => {
  it('runs a concurrent number of functions at a time', async () => {
    const ids = [1, 2, 3, 4]
    let loaded = 0
    const load = id =>
      promiseImmediate({ id }).then(val => {
        loaded++
        return val
      })
    const loadIterator = transform(2, load, ids)[Symbol.asyncIterator]()
    assert.equal(loaded, 0)
    assert.deepEqual(await loadIterator.next(), { value: { id: 1 }, done: false })
    assert.equal(loaded, 2)
    assert.deepEqual(await loadIterator.next(), { value: { id: 2 }, done: false })
    assert.equal(loaded, 2)
    assert.deepEqual(await loadIterator.next(), { value: { id: 3 }, done: false })
    assert.equal(loaded, 4)
    assert.deepEqual(await loadIterator.next(), { value: { id: 4 }, done: false })
    assert.equal(loaded, 4)
    assert.deepEqual((await loadIterator.next()).done, true)
  })
  it('allows the end to finish temporarily before the middle', async () => {
    const ids = [11, 5, 3, 2]
    let loaded = 0
    const load = id =>
      delayTicks(id, { id }).then(val => {
        loaded++
        return val
      })
    const loadIterator = transform(2, load, ids)[Symbol.asyncIterator]()
    assert.equal(loaded, 0)
    assert.deepEqual((await loadIterator.next()).value, { id: 5 })
    assert.equal(loaded, 1)
    assert.deepEqual((await loadIterator.next()).value, { id: 3 })
    assert.equal(loaded, 2)
    assert.deepEqual((await loadIterator.next()).value, { id: 2 })
    assert.equal(loaded, 3)
    assert.deepEqual((await loadIterator.next()).value, { id: 11 })
    assert.equal(loaded, 4)
    assert.deepEqual((await loadIterator.next()).done, true)
  })
  it('iterates a sync function over an async value', async () => {
    const ids = asyncFromArray([1, 2, 3, 4])
    const load = id => ({ id })
    const loadIterator = transform(2, load, ids)[Symbol.asyncIterator]()
    assert.deepEqual((await loadIterator.next()).value, { id: 1 })
    assert.deepEqual((await loadIterator.next()).value, { id: 2 })
    assert.deepEqual((await loadIterator.next()).value, { id: 3 })
    assert.deepEqual((await loadIterator.next()).value, { id: 4 })
    assert.deepEqual((await loadIterator.next()).done, true)
  })
  it('iterates a sync function over a sync value', async () => {
    const ids = [1, 2, 3, 4]
    const load = id => ({ id })
    const loadIterator = transform(2, load, ids)[Symbol.asyncIterator]()
    assert.deepEqual((await loadIterator.next()).value, { id: 1 })
    assert.deepEqual((await loadIterator.next()).value, { id: 2 })
    assert.deepEqual((await loadIterator.next()).value, { id: 3 })
    assert.deepEqual((await loadIterator.next()).value, { id: 4 })
    assert.deepEqual((await loadIterator.next()).done, true)
  })
  it('lets you curry the concurrency and function', async () => {
    const ids = asyncFromArray([1, 2, 3, 4])
    const load = (id: number) => ({ id })
    const twoAtAtime = transform(2)
    const loadTwoAtATime = twoAtAtime(load)
    const loadIterator = loadTwoAtATime(ids)
    const vals: any[] = []
    for await (const val of loadIterator) {
      vals.push(val)
    }
    assert.deepEqual(vals, [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }])
  })
  it('lets you curry the function', async () => {
    const ids = asyncFromArray([1, 2, 3, 4])
    const load = (id: number) => ({ id })
    const loadTwoAtATime = transform(2, load)
    const loadIterator = loadTwoAtATime(ids)
    const vals: any[] = []
    for await (const val of loadIterator) {
      vals.push(val)
    }
    assert.deepEqual(vals, [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }])
  })
  it('allows for resolving nothing', async () => {
    const ids = asyncFromArray([])
    const pass = i => i
    for await (const val of transform(2, pass, ids)) {
      throw new Error(`there should be no value here ${val}`)
    }
  })
  it('works with node streams', async () => {
    const stream = new PassThrough()
    const pass = i => i
    const itr = transform(2, pass, fromStream(stream))
    stream.end()
    for await (const val of itr) {
      throw new Error(`there should be no value here ${val}`)
    }
  })
  it('allows infinite parallelism', async () => {
    const values: any[] = []
    for await (const val of transform(Infinity, promiseImmediate, asyncFromArray([1, 2, 3]))) {
      values.push(val)
    }
    assert.deepEqual(values, [1, 2, 3])
  })
  it('tolerates resolving out of order', async () => {
    const values: any[] = []
    const source = asyncFromArray([3, 2, 1])
    const waitTicks = i => delayTicks(i * 2, i)
    for await (const val of transform(Infinity, waitTicks, source)) {
      values.push(val)
    }
    assert.deepEqual(values, [1, 2, 3])
  })

  it('propagates source errors after the transforms have finished', async () => {
    async function* source() {
      yield 1
      yield 2
      yield 3
      throw new Error('All done!')
    }
    const itr = transform(5, makeDelay(10), source())[Symbol.asyncIterator]()
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
  it('propagates transform errors after other transforms finish', async () => {
    async function* source() {
      yield 1
      yield 2
      yield 3
    }
    const throwafter2 = async value => {
      await promiseImmediate()
      if (value === 2) {
        throw new Error('I dont like 2')
      }
      return value
    }
    const itr = transform(5, throwafter2, source())[Symbol.asyncIterator]()
    assert.equal((await itr.next()).value, 1)
    assert.equal((await itr.next()).value, 3)
    try {
      await itr.next()
      throw new Error('next should have errored')
    } catch (error) {
      assert.equal(error.message, 'I dont like 2')
    }
    assert.deepEqual((await itr.next()) as any, { done: true, value: undefined })
  })
})
