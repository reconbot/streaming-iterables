import { Readable } from 'stream'
async function onceReadable(stream: Readable) {
  return new Promise(resolve => {
    stream.once('readable', () => {
      resolve()
    })
  })
}

async function* _fromStream(stream: Readable) {
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

export function fromStream<T>(stream: Readable): AsyncIterable<T> {
  if (typeof stream[Symbol.asyncIterator] === 'function') {
    return stream
  }

  return _fromStream(stream) as AsyncIterable<T>
}
