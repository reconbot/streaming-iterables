import { assert } from 'chai'
import { collect, parallelMerge } from './'

function promiseImmediate<T> (data?: T): Promise<T> {
  return new Promise(resolve => setImmediate(() => resolve(data)))
}

function* numbers () {
  yield 4
  yield 5
  yield 6
}

async function* slowNumbers () {
  await promiseImmediate()
  await promiseImmediate()
  yield 1
  await promiseImmediate()
  await promiseImmediate()
  yield 2
  await promiseImmediate()
  await promiseImmediate()
  yield 3
}

function* strings () {
  yield 'Borekh-Habo'
  yield 'Wilkomme'
  yield 'Benvenuto'
}

async function* fastStrings () {
  await promiseImmediate()
  yield 'Borekh-Habo'
  await promiseImmediate()
  yield 'Wilkomme'
  await promiseImmediate()
  yield 'Benvenuto'
}

describe('merge', () => {
  it('iterates sync iterators', async () => {
    const values = []
    const merged = parallelMerge(numbers(), strings())
    for await (const val of merged) {
      values.push(val)
    }
    assert.deepEqual(values, [4, 'Borekh-Habo', 5, 'Wilkomme', 6, 'Benvenuto'])
  })
  it('iterates async iterators', async () => {
    const values = []
    const merged = parallelMerge(slowNumbers(), fastStrings())
    for await (const val of merged) {
      values.push(val)
    }
    assert.deepEqual(values, [1, 'Borekh-Habo', 2, 'Wilkomme', 3, 'Benvenuto'])
  })
  it('iterates iterables', async () => {
    const values = []
    const merged = parallelMerge([1, 2, 3], ['Borekh-Habo', 'Wilkomme', 'Benvenuto'])
    for await (const val of merged) {
      values.push(val)
    }
    assert.deepEqual(values, [1, 'Borekh-Habo', 2, 'Wilkomme', 3, 'Benvenuto'])
  })
  it('a mix of sync and async iterators and iterables', async () => {
    const values = []
    const merged = parallelMerge(slowNumbers(), numbers(), fastStrings())
    for await (const val of merged) {
      values.push(val)
    }
    assert.deepEqual(values, [4, 5, 6, 'Borekh-Habo', 'Wilkomme', 3, 'Benvenuto'])
  })
})
