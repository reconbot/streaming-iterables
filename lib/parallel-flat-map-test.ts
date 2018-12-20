import { assert } from 'chai'
import { parallelFlatMap, fromStream } from './'
import { PassThrough } from 'stream'
import { asyncStringArr, delayTicks } from './util-test'

describe('parallelFlatMap', () => {
  it('iterates a sync function over an async value', async () => {
    const values: any[] = []
    for await (const val of parallelFlatMap(2, String, [1, 2, 3])) {
      values.push(val)
    }
    assert.deepEqual(values, ['1', '2', '3'])
  })
  it('iterates a sync function over a sync iterable', async () => {
    const values: any[] = []
    for await (const val of parallelFlatMap(2, String, [1, 2, 3])) {
      values.push(val)
    }
    assert.deepEqual(values, ['1', '2', '3'])
  })
  it('iterates an async function over an async value', async () => {
    const values: any[] = []
    for await (const val of parallelFlatMap(2, asyncStringArr, [1, 2, 3])) {
      values.push(val)
    }
    assert.deepEqual(values, ['1', '2', '3'])
  })
  it('iterates an async function over a sync value', async () => {
    const values: any[] = []
    for await (const val of parallelFlatMap(2, asyncStringArr, [1, 2, 3])) {
      values.push(val)
    }
    assert.deepEqual(values, ['1', '2', '3'])
  })
  it('lets you curry a function', async () => {
    const values: any[] = []
    const doubleTime = parallelFlatMap(2)
    const stringParallelFlatMap = doubleTime(asyncStringArr)
    for await (const val of stringParallelFlatMap([1, 2, 3])) {
      values.push(val)
    }
    assert.deepEqual(values, ['1', '2', '3'])
  })
  it('runs concurrent mapping operations', async () => {
    let mapCount = 0
    const counter = () => mapCount++
    const iterable = parallelFlatMap(3, counter, [1, 2, 3, 4, 5, 6])
    const itr = iterable[Symbol.asyncIterator]()
    await itr.next()
    await delayTicks(5)
    await assert.equal(mapCount, 4)
  })
  it('can have a concurrency more than the items in a stream', async () => {
    const stream = new PassThrough()
    stream.end()
    for await (const value of parallelFlatMap(2, asyncStringArr, fromStream(stream))) {
      throw new Error('empty string')
    }
  })
  it('allows infinite parallelism', async () => {
    const values: any[] = []
    for await (const val of parallelFlatMap(Infinity, asyncStringArr, [1, 2, 3])) {
      values.push(val)
    }
    assert.deepEqual(values, ['1', '2', '3'])
  })
})
