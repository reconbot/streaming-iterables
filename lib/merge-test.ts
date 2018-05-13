import { assert } from 'chai'
import { collect } from '../lib/collect'
import { merge } from '../lib/merge'

if ((Symbol as any).asyncIterator === undefined) {
  ((Symbol as any).asyncIterator) = Symbol.for('asyncIterator')
}

function* numbers () {
  yield 1
  yield 2
  return 3
}

function* strings () {
  yield 'Borekh-Habo'
  yield 'Wilkomme'
  yield 'Benvenuto'
}

describe('merge', () => {
  it('iterates sync iterators', async () => {
    const values = []
    const merged = merge(numbers(), strings())
    for await (const val of merged) {
      values.push(val)
    }
    assert.deepEqual(values, [1, 'Borekh-Habo', 2, 'Wilkomme', 3, 'Benvenuto'])
  })
  it('iterates async iterators', async () => {

  })
  it('iterates iterables', async () => {
  })
  it('a mix of sync and async iterators and iterables', async () => {
  })
})
