import { assert } from 'chai'
import { parallelMap, fromStream } from './'
import { PassThrough } from 'stream'
import { asyncString, makeDelay, delayTicks } from './util-test'

process.on('unhandledRejection', error => {
  throw error
})

describe('parallelMap', () => {
  it('iterates a sync function over an async value', async () => {
    const values: any[] = []
    for await (const val of parallelMap(2, String, [1, 2, 3])) {
      values.push(val)
    }
    assert.deepEqual(values, ['1', '2', '3'])
  })
  it('iterates a sync function over a sync iterable', async () => {
    const values: any[] = []
    for await (const val of parallelMap(2, String, [1, 2, 3])) {
      values.push(val)
    }
    assert.deepEqual(values, ['1', '2', '3'])
  })
  it('iterates an async function over an async value', async () => {
    const values: any[] = []
    for await (const val of parallelMap(2, asyncString, [1, 2, 3])) {
      values.push(val)
    }
    assert.deepEqual(values, ['1', '2', '3'])
  })
  it('iterates an async function over a sync value', async () => {
    const values: any[] = []
    for await (const val of parallelMap(2, asyncString, [1, 2, 3])) {
      values.push(val)
    }
    assert.deepEqual(values, ['1', '2', '3'])
  })
  it('lets you curry a function', async () => {
    const values: any[] = []
    const doubleTime = parallelMap(2)
    const stringParallelMap = doubleTime(asyncString)
    for await (const val of stringParallelMap([1, 2, 3])) {
      values.push(val)
    }
    assert.deepEqual(values, ['1', '2', '3'])
  })
  it('runs concurrent mapping operations', async () => {
    let mapCount = 0
    const counter = async () => {
      mapCount++
      await delayTicks(5)
    }
    const iterable = parallelMap(3, counter, [1, 2, 3, 4, 5, 6])
    const itr = iterable[Symbol.asyncIterator]()
    await itr.next()
    assert.isAtLeast(mapCount, 3)
  })
  it('can have a concurrency more than the items in a stream', async () => {
    const stream = new PassThrough()
    stream.end()
    for await (const value of parallelMap(2, asyncString, fromStream(stream))) {
      throw new Error('empty string')
    }
  })
  it('allows infinite parallelism', async () => {
    const values: any[] = []
    for await (const val of parallelMap(Infinity, asyncString, [1, 2, 3])) {
      values.push(val)
    }
    assert.deepEqual(values, ['1', '2', '3'])
  })
  it('propagates source errors after the maps have finished', async () => {
    async function* source() {
      yield 1
      yield 2
      yield 3
      throw new Error('All done!')
    }
    const itr = parallelMap(5, makeDelay(10), source())[Symbol.asyncIterator]()
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
  it('propagates map errors after other maps finish', async () => {
    async function* source() {
      yield 1
      yield 2
      yield 3
    }
    const throwafter2 = async value => {
      await delayTicks(10)
      if (value >= 2) {
        throw new Error('I dont like 2')
      }
      return value
    }
    const itr = parallelMap(5, throwafter2, source())[Symbol.asyncIterator]()
    assert.equal((await itr.next()).value, 1)
    try {
      await itr.next()
      throw new Error('next should have errored')
    } catch (error) {
      assert.equal(error.message, 'I dont like 2')
    }
    assert.deepEqual((await itr.next()) as any, { done: true, value: undefined })
  })
})
