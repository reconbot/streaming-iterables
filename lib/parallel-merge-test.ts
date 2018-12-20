import { assert } from 'chai'
import { parallelMerge, fromStream } from './'
import { PassThrough } from 'stream'
import { promiseImmediate } from './util-test'

function* numbers() {
  yield 4
  yield 5
  yield 6
}

async function* slowNumbers() {
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

function* strings() {
  yield 'Borekh-Habo'
  yield 'Wilkomme'
  yield 'Benvenuto'
}

async function* fastStrings() {
  await promiseImmediate()
  yield 'Borekh-Habo'
  await promiseImmediate()
  yield 'Wilkomme'
  await promiseImmediate()
  yield 'Benvenuto'
}

describe('parallelMerge', () => {
  it('iterates sync iterators', async () => {
    const values: any[] = []
    const merged = parallelMerge<any>(numbers(), strings())
    for await (const val of merged) {
      values.push(val)
    }
    assert.deepEqual(values, [4, 'Borekh-Habo', 5, 'Wilkomme', 6, 'Benvenuto'])
  })
  it('iterates async iterators', async () => {
    const values: any[] = []
    const merged = parallelMerge<any>(slowNumbers(), fastStrings())
    for await (const val of merged) {
      values.push(val)
    }
    assert.deepEqual(values, ['Borekh-Habo', 1, 'Wilkomme', 'Benvenuto', 2, 3])
  })
  it('iterates iterables', async () => {
    const values: any[] = []
    const merged = parallelMerge<any>([1, 2, 3], ['Borekh-Habo', 'Wilkomme', 'Benvenuto'])
    for await (const val of merged) {
      values.push(val)
    }
    assert.deepEqual(values, [1, 'Borekh-Habo', 2, 'Wilkomme', 3, 'Benvenuto'])
  })
  it('a mix of sync and async iterators and iterables', async () => {
    const values: any[] = []
    const merged = parallelMerge<any>(slowNumbers(), numbers(), fastStrings())
    for await (const val of merged) {
      values.push(val)
    }
    assert.deepEqual(values, [4, 5, 6, 'Borekh-Habo', 1, 'Wilkomme', 'Benvenuto', 2, 3])
  })
  it('works with node streams', async () => {
    const stream = new PassThrough()
    const stream2 = new PassThrough()
    const itr = parallelMerge(fromStream(stream), fromStream(stream2))
    stream.end()
    stream2.end()
    for await (const val of itr) {
      throw new Error(`there should be no value here ${val}`)
    }
  })
})
