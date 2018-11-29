import { assert } from 'chai'
import { collect, concat } from './'

describe('concat', () => {
  it('concatenates multiple async iterables', async () => {
    async function* one() {
      yield 1
    }
    async function* two() {
      yield 2
    }
    assert.deepEqual(await collect(concat(one(), two())), [1, 2])
  })
  it('concatenates multiple sync iterables', async () => {
    function* one() {
      yield 1
    }
    function* two() {
      yield 2
    }
    assert.deepEqual(collect(concat(one(), two())), [1, 2])
  })
  it('concatenates mixed sync and async iterables', async () => {
    function* one() {
      yield 1
    }
    async function* two() {
      yield 2
    }
    assert.deepEqual(await collect(concat(one(), two())), [1, 2])
  })
})
