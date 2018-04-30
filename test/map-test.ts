import { assert } from 'chai'
import { fromIterator } from '../lib/from-iterator'
import { map } from '../lib/map'

if ((Symbol as any).asyncIterator === undefined) {
  ((Symbol as any).asyncIterator) = Symbol.for('asyncIterator')
}

async function asyncString (str) {
  return String(str)
}

describe('map', () => {
  it('iterates a sync function over an async value', async () => {
    const values = []
    for await (const val of map(String, fromIterator([1, 2, 3]))) {
      values.push(val)
    }
    assert.deepEqual(values, ['1', '2', '3'])
  })
  it('iterates a sync function over a sync value', async () => {
    const values = []
    for await (const val of map(String, [1, 2, 3])) {
      values.push(val)
    }
    assert.deepEqual(values, ['1', '2', '3'])
  })
  it('iterates an async function over an async value', async () => {
    const values = []
    for await (const val of map(asyncString, fromIterator([1, 2, 3]))) {
      values.push(val)
    }
    assert.deepEqual(values, ['1', '2', '3'])
  })
  it('iterates an async function over a sync value', async () => {
    const values = []
    for await (const val of map(asyncString, [1, 2, 3])) {
      values.push(val)
    }
    assert.deepEqual(values, ['1', '2', '3'])
  })
  it('lets you curry a function', async () => {
    const values = []
    const stringMap = map(asyncString)
    for await (const val of stringMap(fromIterator([1, 2, 3]))) {
      values.push(val)
    }
    assert.deepEqual(values, ['1', '2', '3'])
  })
})
