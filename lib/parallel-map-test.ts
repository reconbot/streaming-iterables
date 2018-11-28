import { assert } from 'chai'
import { parallelMap, fromStream } from './'
import { PassThrough } from 'stream'

async function asyncString(str) {
  return String(str)
}

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
  it('runs conncurent mapping operations', async () => {
    let mapCount = 0
    const counter = () => mapCount++
    const iterable = parallelMap(3, counter, [1, 2, 3, 4, 5, 6])
    const itr = iterable[Symbol.asyncIterator]()
    await itr.next()
    assert.equal(mapCount, 3)
  })
  it('can have a concurrency more than the items in a stream', async () => {
    const stream = new PassThrough()
    stream.end()
    for await (const value of parallelMap(2, asyncString, fromStream(stream))) {
      throw new Error('empty string')
    }
  })
})
