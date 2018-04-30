import { assert } from 'chai'
import { fromIterator } from '../lib/from-iterator'
import { parallelMap } from '../lib/parallel-map'

function promiseImmediate (data?) {
  return new Promise(resolve => setImmediate(() => resolve(data)))
}

async function delayTicks (count = 1, data?) {
  for (let i = 0; i < count; i++) {
    await promiseImmediate()
  }
  return data
}

async function asyncString (str) {
  return String(str)
}

async function* fromArray (arr) {
  for (const value of arr) {
    yield value
  }
}

describe('parallelMap', () => {
  it('runs a concurrent number of functions at a time', async () => {
    const ids = fromIterator([1, 2, 3, 4])
    let loaded = 0
    const load = id => promiseImmediate({ id }).then(val => {
      loaded++
      return val
    })
    const loadIterator = parallelMap(2, load, ids)
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
    const ids = fromIterator([11, 5, 3, 2])
    let loaded = 0
    const load = id => delayTicks(id, { id }).then(val => {
      loaded++
      return val
    })
    const loadIterator = parallelMap(2, load, ids)
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
    const ids = fromIterator([1, 2, 3, 4])
    const load = id => ({ id })
    const loadIterator = parallelMap(2, load, ids)
    assert.deepEqual((await loadIterator.next()).value, { id: 1 })
    assert.deepEqual((await loadIterator.next()).value, { id: 2 })
    assert.deepEqual((await loadIterator.next()).value, { id: 3 })
    assert.deepEqual((await loadIterator.next()).value, { id: 4 })
    assert.deepEqual((await loadIterator.next()).done, true)
  })
  it('iterates a sync function over a sync value', async () => {
    const ids = fromArray([1, 2, 3, 4])
    const load = id => ({ id })
    const loadIterator = parallelMap(2, load, ids)
    assert.deepEqual((await loadIterator.next()).value, { id: 1 })
    assert.deepEqual((await loadIterator.next()).value, { id: 2 })
    assert.deepEqual((await loadIterator.next()).value, { id: 3 })
    assert.deepEqual((await loadIterator.next()).value, { id: 4 })
    assert.deepEqual((await loadIterator.next()).done, true)
  })
  it('lets you curry the concurrency and function', async () => {
    const ids = fromArray([1, 2, 3, 4])
    const load = id => ({ id })
    const twoAtAtime = parallelMap(2)
    const loadTwoAtATime = twoAtAtime(load)
    const loadIterator = loadTwoAtATime(ids)
    const vals = []
    for await (const val of loadIterator) {
      vals.push(val)
    }
    assert.deepEqual(vals, [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }])
  })
  it('lets you curry the function', async () => {
    const ids = fromArray([1, 2, 3, 4])
    const load = id => ({ id })
    const loadTwoAtATime = parallelMap(2, load)
    const loadIterator = loadTwoAtATime(ids)
    const vals = []
    for await (const val of loadIterator) {
      vals.push(val)
    }
    assert.deepEqual(vals, [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }])
  })
})
