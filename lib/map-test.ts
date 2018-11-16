import { assert } from 'chai'
import { map } from './'

async function asyncString(str) {
  return String(str)
}

describe('map', () => {
  it('iterates a sync function over an async value', async () => {
    const values: any[] = []
    for await (const val of map(String, [1, 2, 3])) {
      values.push(val)
    }
    assert.deepEqual(values, ['1', '2', '3'])
  })
  it('iterates a sync function over a sync iterable', async () => {
    const values: any[] = []
    for await (const val of map(String, [1, 2, 3])) {
      values.push(val)
    }
    assert.deepEqual(values, ['1', '2', '3'])
  })
  it('iterates an async function over an async value', async () => {
    const values: any[] = []
    for await (const val of map(asyncString, [1, 2, 3])) {
      values.push(val)
    }
    assert.deepEqual(values, ['1', '2', '3'])
  })
  it('iterates an async function over a sync value', async () => {
    const values: any[] = []
    for await (const val of map(asyncString, [1, 2, 3])) {
      values.push(val)
    }
    assert.deepEqual(values, ['1', '2', '3'])
  })
  it('lets you curry a function', async () => {
    const values: any[] = []
    const stringMap = map(asyncString)
    for await (const val of stringMap([1, 2, 3])) {
      values.push(val)
    }
    assert.deepEqual(values, ['1', '2', '3'])
  })
})
