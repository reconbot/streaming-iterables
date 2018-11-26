import { assert } from 'chai'
import { transform } from '.'
import { PassThrough } from 'stream'

function promiseImmediate<T>(data?: T) {
  return new Promise(resolve => setImmediate(() => resolve(data))) as Promise<T>
}

async function delayTicks<T>(count = 1, data?: T) {
  for (let i = 0; i < count; i++) {
    await promiseImmediate()
  }
  return data
}

async function* asyncFromArray<T>(arr: T[]) {
  for (const value of arr) {
    yield value
  }
}

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
    assert.deepEqual((await loadIterator.next()).value, { id: 1 })
    assert.equal(loaded, 2)
    assert.deepEqual((await loadIterator.next()).value, { id: 2 })
    assert.equal(loaded, 2)
    assert.deepEqual((await loadIterator.next()).value, { id: 3 })
    assert.equal(loaded, 4)
    assert.deepEqual((await loadIterator.next()).value, { id: 4 })
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
  // stream iteration only works in node 10+
  if (Number(process.versions.node.split('.')[0]) >= 10) {
    // need to work around https://github.com/nodejs/readable-stream/issues/387
    it('works with node streams', async () => {
      const stream = new PassThrough()
      const pass = i => i
      const itr = transform(2, pass, stream)
      stream.end()
      for await (const val of itr) {
        throw new Error(`there should be no value here ${val}`)
      }
    })
  } else {
    it("this version of node doesn't have async iterable streams")
  }
})
