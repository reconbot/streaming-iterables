/// <reference lib="esnext.asynciterable" />
interface IReadable {
  once(event: string, cb: (value: any) => void): any
  read(): any
}

async function once(stream: IReadable, event: string) {
  return new Promise(resolve => {
    stream.once(event, resolve)
  })
}

const ENDED = Symbol('Stream has ended')

async function* _fromStream(stream: IReadable) {
  const ended = once(stream, 'end').then(() => ENDED)
  const errored = once(stream, 'error').then(error => Promise.reject(error))

  while (true) {
    const data = stream.read()
    if (data !== null) {
      yield data
      continue
    }

    const state = await Promise.race([ended, errored, once(stream, 'readable')])
    if (state === ENDED) {
      return
    }
  }
}

export function fromStream<T>(stream: IReadable): AsyncIterable<T> {
  if (typeof stream[Symbol.asyncIterator] === 'function') {
    return stream as any
  }

  return _fromStream(stream) as AsyncIterable<T>
}
