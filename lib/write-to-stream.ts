import { Writable } from 'stream'
import { AnyIterable } from './types'

function write(stream, data) {
  return new Promise(resolve => {
    if (!stream.write(data)) {
      stream.once('drain', resolve)
    } else {
      resolve()
    }
  })
}

async function _writeToStream(stream: Writable, iterable: AnyIterable<any>) {
  for await (const value of iterable) {
    await write(stream, value)
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
