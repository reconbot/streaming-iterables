import { assert } from 'chai'
import { flatTransform } from '.'

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
    await promiseImmediate()
    yield value
  }
}

describe('flatTransform', () => {
  it('runs a concurrent number of functions at a time', async () => {
    const ids = [1, 2, 3, 4]
    let loaded = 0
    const load = async value => {
      loaded++
      await delayTicks(10)
      return [String(value)]
    }
    const loadIterator = flatTransform(2, load, ids)[Symbol.asyncIterator]()
    assert.equal(loaded, 0)
    assert.deepEqual((await loadIterator.next()).value, '1')
    assert.equal(loaded, 3)
    assert.deepEqual((await loadIterator.next()).value, '2')
    assert.equal(loaded, 4)
    assert.deepEqual((await loadIterator.next()).value, '3')
    assert.equal(loaded, 4)
    assert.deepEqual((await loadIterator.next()).value, '4')
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
    const loadIterator = flatTransform(2, load, ids)[Symbol.asyncIterator]()
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
    const loadIterator = flatTransform(2, load, ids)[Symbol.asyncIterator]()
    assert.deepEqual((await loadIterator.next()).value, { id: 1 })
    assert.deepEqual((await loadIterator.next()).value, { id: 2 })
    assert.deepEqual((await loadIterator.next()).value, { id: 3 })
    assert.deepEqual((await loadIterator.next()).value, { id: 4 })
    assert.deepEqual((await loadIterator.next()).done, true)
  })
  it('iterates a sync function over a sync value', async () => {
    const ids = [1, 2, 3, 4]
    const load = id => ({ id })
    const loadIterator = flatTransform(2, load, ids)[Symbol.asyncIterator]()
    assert.deepEqual((await loadIterator.next()).value, { id: 1 })
    assert.deepEqual((await loadIterator.next()).value, { id: 2 })
    assert.deepEqual((await loadIterator.next()).value, { id: 3 })
    assert.deepEqual((await loadIterator.next()).value, { id: 4 })
    assert.deepEqual((await loadIterator.next()).done, true)
  })
  it('iterates a sync function over a sync value and filters the output', async () => {
    const ids = [1, 2, null, 3, undefined, 4]
    const load = id => id && { id }
    const loadIterator = flatTransform(2, load, ids)[Symbol.asyncIterator]()
    assert.deepEqual((await loadIterator.next()).value, { id: 1 })
    assert.deepEqual((await loadIterator.next()).value, { id: 2 })
    assert.deepEqual((await loadIterator.next()).value, { id: 3 })
    assert.deepEqual((await loadIterator.next()).value, { id: 4 })
    assert.deepEqual((await loadIterator.next()).done, true)
  })
  it('lets you curry the concurrency then the function', async () => {
    const ids = asyncFromArray([1, 2, 3, 4])
    const load = (id: number) => String(id)
    const twoAtAtime = flatTransform(2)
    const loadTwoAtATime = twoAtAtime(load)
    const loadIterator = loadTwoAtATime(ids)
    const vals: any[] = []
    for await (const val of loadIterator) {
      vals.push(val)
    }
    assert.deepEqual(vals, ['1', '2', '3', '4'])
  })
  it('lets you curry the concurrency and the function', async () => {
    const ids = asyncFromArray([1, 2, 3, 4])
    const load = (id: number) => ({ id })
    const loadTwoAtATime = flatTransform(2, load)
    const loadIterator = loadTwoAtATime(ids)
    const vals: any[] = []
    for await (const val of loadIterator) {
      vals.push(val)
    }
    assert.deepEqual(vals, [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }])
  })
  it('allows empty iterables', async () => {
    for await (const val of flatTransform(500, () => {}, [])) {
      throw new Error('No data')
    }
  })
  it('allows infinite parallelism', async () => {
    const values: any[] = []
    for await (const val of flatTransform(Infinity, i => i, asyncFromArray([1, 2, 3]))) {
      values.push(val)
    }
    assert.deepEqual(values, [1, 2, 3])
  })
  it('yields all values from a returned sync iterable right away and async iterable in parallel', async () => {
    const valuesToReturn = [asyncFromArray([1, 2, 3]), [4, 5, 6], asyncFromArray([7, 8, 9])]
    const transformFunc = () => valuesToReturn.shift()
    const threeItems = [1, 2, 3]
    const values: any[] = []
    for await (const val of flatTransform(3, transformFunc, threeItems)) {
      values.push(val)
    }
    assert.deepEqual(values, [4, 5, 6, 1, 7, 2, 8, 3, 9])
  })
})
