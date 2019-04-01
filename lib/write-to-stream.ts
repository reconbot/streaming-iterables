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

async function _writeToStream(stream: IWritable, iterable: AnyIterable<any>): Promise<void> {
  let errorListener
  let error
  const errorPromise = new Promise((resolve, reject) => {
    errorListener = err => {
      error = err
      reject(err)
    }
    stream.once('error', errorListener)
  }) as Promise<void>

  for await (const value of iterable) {
    if (stream.write(value) === false) {
      await Promise.race([errorPromise, once('drain', stream)])
    }
    if (error) {
      return errorPromise
    }
  }

  stream.removeListener('error', errorListener)
  if (error) {
    return errorPromise
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
