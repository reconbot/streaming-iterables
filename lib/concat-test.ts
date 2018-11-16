import { assert } from 'chai'
import { collect, concat } from './'

describe('concat', () => {
  it('concatenates multiple async iterators', async () => {
    async function* one() {
      yield 1
    }
    async function* two() {
      yield 2
    }
    assert.deepEqual(await collect(concat(one(), two())), [1, 2])
  })
  it('concatenates multiple sync iterators', async () => {
    function* one() {
      yield 1
    }
    function* two() {
      yield 2
    }
    assert.deepEqual(await collect(concat(one(), two())), [1, 2])
  })
  it('concatenates sync iterables', async () => {
    assert.deepEqual(await collect(concat([1], [2], [3], [4])), [1, 2, 3, 4])
  })
})
