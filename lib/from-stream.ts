/// <reference lib="esnext.asynciterable" />
interface IReadable {
  once: any
  read: any
}

async function onceReadable(stream: IReadable) {
  return new Promise(resolve => {
    stream.once('readable', () => {
      resolve()
    })
  })
}

async function* _fromStream(stream: IReadable) {
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

export function fromStream<T>(stream: IReadable): AsyncIterable<T> {
  if (typeof stream[Symbol.asyncIterator] === 'function') {
    return stream as any
  }

  return _fromStream(stream) as AsyncIterable<T>
}
