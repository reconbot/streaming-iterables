import { Writable } from 'stream'
import { AnyIterable } from './types'

function waitForDrain(stream) {
  return new Promise(resolve => {
    stream.once('drain', resolve)
  })
}

async function _writeToStream(stream: Writable, iterable: AnyIterable<any>) {
  for await (const value of iterable) {
    if (stream.write(value) === false) {
      await waitForDrain(stream)
    }
  }
}

export function writeToStream(stream: Writable): (iterable: AnyIterable<any>) => Promise<void>
export function writeToStream(stream: Writable, iterable: AnyIterable<any>): Promise<void>
export function writeToStream(stream: Writable, iterable?: AnyIterable<any>) {
  if (iterable === undefined) {
    return (curriedIterable: AnyIterable<any>) => _writeToStream(stream, curriedIterable)
  }
  return _writeToStream(stream, iterable)
}
