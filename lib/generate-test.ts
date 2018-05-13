import { assert } from 'chai'
import { generate } from './'

function promiseImmediate<T> (data?: T): Promise<T> {
  return new Promise(resolve => setImmediate(() => resolve(data)))
}

describe('generate', () => {
  it('takes an async function and yields its return value')
})
