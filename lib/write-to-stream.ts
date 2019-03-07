/// <reference lib="esnext.asynciterable" />
import { AnyIterable } from './types'

interface IWritable {
  once: any
  write: any
}

function waitForDrain(stream: IWritable) {
  return new Promise(resolve => {
    stream.once('drain', resolve)
  })
}

async function _writeToStream(stream: IWritable, iterable: AnyIterable<any>) {
  for await (const value of iterable) {
    if (stream.write(value) === false) {
      await waitForDrain(stream)
    }
  }
}

export function writeToStream(stream: IWritable): (iterable: AnyIterable<any>) => Promise<void>
export function writeToStream(stream: IWritable, iterable: AnyIterable<any>): Promise<void>
export function writeToStream(stream: IWritable, iterable?: AnyIterable<any>) {
  if (iterable === undefined) {
    return (curriedIterable: AnyIterable<any>) => _writeToStream(stream, curriedIterable)
  }
  return _writeToStream(stream, iterable)
}
