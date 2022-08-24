import { assert } from 'chai'
import { takeWhile } from './'
import { asyncFromArray } from './util-test'

describe('takeWhile', () => {
  const isTruthy = (i : any) => !!i
  const asyncIsTruthy = async (i : any) => !!i

  it('takes iterators while truthy', async () => {
    const numbers: number[] = []
    for await (const num of takeWhile(isTruthy, [1, 2, null, undefined, 3])) {
      numbers.push(num as number)
    }
    assert.deepEqual(numbers, [1, 2])
  })
  it('takes async iterators while truthy', async () => {
    const numbers: number[] = []
    for await (const num of takeWhile(isTruthy, asyncFromArray([1, 2, null, undefined, 3]))) {
      numbers.push(num as number)
    }
    assert.deepEqual(numbers, [1, 2])
  })
  it('async filters iterators', async () => {
    const numbers: number[] = []
    for await (const num of takeWhile(asyncIsTruthy, [1, 2, null, undefined, 3])) {
      numbers.push(num as number)
    }
    assert.deepEqual(numbers, [1, 2])
  })

  it('is curryable', async () => {
    const numbers: number[] = []
    const values = asyncFromArray([1, 2, null, 3])
    const untilFalsy = takeWhile(isTruthy)
    for await (const num of untilFalsy(values)) {
      numbers.push(num as number)
    }
    assert.deepEqual(numbers, [1, 2])
  })
})
