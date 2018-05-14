import { assert } from 'chai'
import { fromIterable } from '../lib/from-iterable'
import { map } from './'

async function asyncString (str) {
  return String(str)
}

describe('map', () => {
  it('iterates a sync function over an async value', async () => {
    const values = []
    for await (const val of map(String, fromIterable([1, 2, 3]))) {
      values.push(val)
    }
    assert.deepEqual(values, ['1', '2', '3'])
  })
  it('iterates a sync function over a sync iterable', async () => {
    const values = []
    for await (const val of map(String, [1, 2, 3])) {
      values.push(val)
    }
    assert.deepEqual(values, ['1', '2', '3'])
  })
  it('iterates an async function over an async value', async () => {
    const values = []
    for await (const val of map(asyncString, fromIterable([1, 2, 3]))) {
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
    for await (const val of stringMap(fromIterable([1, 2, 3]))) {
      values.push(val)
    }
    assert.deepEqual(values, ['1', '2', '3'])
  })
})
