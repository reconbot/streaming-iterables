import { AnyIterable, NullOrFunction } from './types'

export interface WritableStreamish {
  once: any
  write: any
  removeListener: any
}

async function _writeToStream(stream: WritableStreamish, iterable: AnyIterable<any>): Promise<void> {
  let lastError = null
  let errCb: NullOrFunction = null
  let drainCb: NullOrFunction = null

  const notifyError = err => {
    lastError = err
    if (errCb) {
      errCb(err)
    }
  }

  const notifyDrain = () => {
    if (drainCb) {
      drainCb()
    }
  }

  const cleanup = () => {
    stream.removeListener('error', notifyError)
    stream.removeListener('drain', notifyDrain)
  }

  stream.once('error', notifyError)

  const waitForDrain = () =>
    new Promise((resolve, reject) => {
      if (lastError) {
        return reject(lastError)
      }
      stream.once('drain', notifyDrain)
      drainCb = resolve
      errCb = reject
    })

  for await (const value of iterable) {
    if (stream.write(value) === false) {
      await waitForDrain()
    }
    if (lastError) {
      break
    }
  }

  cleanup()
  if (lastError) {
    throw lastError
  }
}

export function writeToStream(stream: WritableStreamish): (iterable: AnyIterable<any>) => Promise<void>
export function writeToStream(stream: WritableStreamish, iterable: AnyIterable<any>): Promise<void>
export function writeToStream(stream: WritableStreamish, iterable?: AnyIterable<any>) {
  if (iterable === undefined) {
    return (curriedIterable: AnyIterable<any>) => _writeToStream(stream, curriedIterable)
  }
  return _writeToStream(stream, iterable)
}
