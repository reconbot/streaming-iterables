import { assert } from 'chai'
import { tap } from './'
import { map } from './map'

function resolveLater<T>(data?: T) {
  return new Promise(resolve => setImmediate(() => resolve(data))) as Promise<T>
}

describe('tap', () => {
  it('iterates a sync function over an async value', async () => {
    const logs: number[] = []
    const log = tap<number>(data => logs.push(data))
    const asyncNumbers = map<number, number>(num => resolveLater(num), [1, 2, 3])
    const values: any[] = []
    for await (const val of log(asyncNumbers)) {
      values.push(val)
    }
    assert.deepEqual(logs, [1, 2, 3])
    assert.deepEqual(values, [1, 2, 3])
  })
  it('iterates a sync function over a sync iterable', async () => {
    const logs: any[] = []
    const log = tap<number>(data => logs.push(data))
    const syncNumbers = [1, 2, 3]
    const values: any[] = []
    for await (const val of log(syncNumbers)) {
      values.push(val)
    }
    assert.deepEqual(logs, [1, 2, 3])
    assert.deepEqual(values, [1, 2, 3])
  })
  it('iterates an async function over an async value', async () => {
    const logs: any[] = []
    const log = tap<number>(async data => {
      await resolveLater()
      logs.push(data)
    })
    const asyncNumbers = map<number, number>(num => resolveLater(num), [1, 2, 3])
    const values: any[] = []
    for await (const val of log(asyncNumbers)) {
      values.push(val)
    }
    assert.deepEqual(logs, [1, 2, 3])
    assert.deepEqual(values, [1, 2, 3])
  })
  it('iterates an async function over a sync value', async () => {
    const logs: any[] = []
    const log = tap<number>(async data => {
      await resolveLater()
      logs.push(data)
    })
    const syncNumbers = [1, 2, 3]
    const values: any[] = []
    for await (const val of log(syncNumbers)) {
      values.push(val)
    }
    assert.deepEqual(logs, [1, 2, 3])
    assert.deepEqual(values, [1, 2, 3])
  })
  it('lets you not curry the function', async () => {
    const logs: any[] = []
    const logNumbers = tap<number>(data => logs.push(data), [1, 2, 3])
    const values: any[] = []
    for await (const val of logNumbers) {
      values.push(val)
    }
    assert.deepEqual(logs, [1, 2, 3])
    assert.deepEqual(values, [1, 2, 3])
  })
})
