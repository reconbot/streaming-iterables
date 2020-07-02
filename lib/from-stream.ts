/// <reference lib="esnext.asynciterable" />
export interface ReadableStreamish {
  once: any
  read: any
}

async function onceReadable(stream: ReadableStreamish) {
  return new Promise(resolve => {
    stream.once('readable', () => {
      resolve()
    })
  })
}

async function* _fromStream(stream: ReadableStreamish) {
  while (true) {
    const data = stream.read()
    if (data !== null) {
      yield data
      continue
    }
    if ((stream as any)._readableState.ended) {
      return
    }
    await onceReadable(stream)
  }
}

export function fromStream<T>(stream: ReadableStreamish): AsyncIterable<T> {
  if (typeof stream[Symbol.asyncIterator] === 'function') {
    return stream as any
  }

  return _fromStream(stream) as AsyncIterable<T>
}
