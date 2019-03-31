/// <reference lib="esnext.asynciterable" />
import { AnyIterable } from './types'

interface IWritable {
  once: any
  write: any
  removeListener: any
}

function once(event: string, stream: IWritable): Promise<any> {
  return new Promise(resolve => {
    stream.once(event, resolve)
  })
}

async function _writeToStream(stream: IWritable, iterable: AnyIterable<any>) {
  let errorListener
  const errorPromise = new Promise((resolve, reject) => {
    errorListener = reject
    stream.once('error', reject)
  })

  for await (const value of iterable) {
    await Promise.race([errorPromise, Promise.resolve()])
    if (stream.write(value) === false) {
      await Promise.race([errorPromise, once('drain', stream)])
    }
  }

  stream.removeListener('error', errorListener)
  await Promise.race([errorPromise, Promise.resolve()])
}

export function writeToStream(stream: IWritable): (iterable: AnyIterable<any>) => Promise<void>
export function writeToStream(stream: IWritable, iterable: AnyIterable<any>): Promise<void>
export function writeToStream(stream: IWritable, iterable?: AnyIterable<any>) {
  if (iterable === undefined) {
    return (curriedIterable: AnyIterable<any>) => _writeToStream(stream, curriedIterable)
  }
  return _writeToStream(stream, iterable)
}
