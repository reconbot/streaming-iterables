import { assert } from 'chai'
import { pipeline } from './'
import { collect } from './collect'
import { map } from './map'

describe('reduce', () => {
  it('calls an argument list of functions', async () => {
    const getData = () => [1, 2, 3]
    function* makeString(arr: number[]) {
      for (const i of arr) {
        yield String(i)
      }
    }
    const manual = await collect(makeString(getData()))
    const pipelined = await pipeline(getData, makeString, collect)
    assert.deepEqual(manual, pipelined)
  })
  it('just invokes the 1st function', async () => {
    const getData = () => [1, 2, 3]
    const pipelined = pipeline(getData)
    assert.deepEqual(getData(), pipelined)
  })
})
