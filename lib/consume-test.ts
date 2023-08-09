import { describe, it } from 'node:test'
import { assert } from 'chai'
import { consume } from './'
import { promiseImmediate } from './test-utils'

describe('consume', () => {
  it('consumes the entire async iterator', async () => {
    let num = 0
    async function* numbers() {
      while (num < 10) {
        yield await promiseImmediate(++num)
      }
    }
    assert.equal(num, 0)
    await consume(numbers())
    assert.equal(num, 10)
  })

  it('consumes the entire sync iterator', async () => {
    let num = 0
    function* numbers() {
      while (num < 10) {
        yield ++num
      }
    }
    assert.equal(num, 0)
    consume(numbers())
    assert.equal(num, 10)
  })
})
