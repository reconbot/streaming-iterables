import { assert } from 'chai'
import { merge } from './'

function promiseImmediate<T>(data?: T): Promise<T> {
  return new Promise(resolve => setImmediate(() => resolve(data)))
}

function* numbers() {
  yield 1
  yield 2
  yield 3
  return 4
}

async function* asyncNumbers() {
  yield 1
  yield await promiseImmediate(2)
  yield 3
  return 3
}

function* strings() {
  yield 'Borekh-Habo'
  yield 'Wilkomme'
  yield 'Benvenuto'
}

async function* asyncStrings() {
  yield 'Borekh-Habo'
  yield await promiseImmediate('Wilkomme')
  yield 'Benvenuto'
}

describe('merge', () => {
  it('iterates sync iterators', async () => {
    const values: any[] = []
    const merged = merge(numbers(), strings())
    for await (const val of merged) {
      values.push(val)
    }
    assert.deepEqual(values, [1, 'Borekh-Habo', 2, 'Wilkomme', 3, 'Benvenuto'])
  })
  it('iterates async iterators', async () => {
    const values: any[] = []
    const merged = merge(asyncNumbers(), asyncStrings())
    for await (const val of merged) {
      values.push(val)
    }
    assert.deepEqual(values, [1, 'Borekh-Habo', 2, 'Wilkomme', 3, 'Benvenuto'])
  })
  it('iterates iterables', async () => {
    const values: any[] = []
    const merged = merge([1, 2, 3], ['Borekh-Habo', 'Wilkomme', 'Benvenuto'])
    for await (const val of merged) {
      values.push(val)
    }
    assert.deepEqual(values, [1, 'Borekh-Habo', 2, 'Wilkomme', 3, 'Benvenuto'])
  })
  it('a mix of sync and async iterators and iterables', async () => {
    const values: any[] = []
    const merged = merge(numbers(), asyncStrings())
    for await (const val of merged) {
      values.push(val)
    }
    assert.deepEqual(values, [1, 'Borekh-Habo', 2, 'Wilkomme', 3, 'Benvenuto'])
  })
})
