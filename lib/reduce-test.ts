import { assert } from 'chai'
import { reduce } from './'

function promiseImmediate<T>(data?: T): Promise<T> {
  return new Promise(resolve => setImmediate(() => resolve(data)))
}

function* numbers() {
  yield 1
  yield 2
  yield 3
}

async function* asyncNumbers() {
  yield 1
  yield await promiseImmediate(2)
  yield 3
}

const add = (num1: number, num2: number) => num1 + num2

describe('reduce', () => {
  it('reduces sync functions with sync iterators', async () => {
    assert.equal(await reduce(add, 0, numbers()), 6)
  })
  it('reduces async functions with async iterators', async () => {
    assert.equal(await reduce(add, 0, asyncNumbers()), 6)
  })
  it('reduces async functions with iterables', async () => {
    assert.equal(await reduce(add, 0, [1, 2, 3]), 6)
  })
  it('curryable', async () => {
    const addAble = reduce(add)
    const addZero = addAble(0)
    assert.equal(await addZero([1, 2, 3]), 6)
  })
})
