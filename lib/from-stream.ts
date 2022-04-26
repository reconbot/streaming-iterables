export interface ReadableStreamish {
  once: any
  read: any
}

async function onceReadable(stream: ReadableStreamish) {
  return new Promise<void>(resolve => {
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
      break
    }
    await onceReadable(stream)
  }
}

/**
 * Wraps the stream in an async iterator or returns the stream if it already is an async iterator.

*note*: Since Node 10, streams already async iterators. This function may be used to ensure compatibility with older versions of Node.

```ts
import { fromStream } from 'streaming-iterables'
import { createReadStream } from 'fs'

const pokeLog = fromStream(createReadStream('./pokedex-operating-system.log'))

for await (const pokeData of pokeLog) {
  console.log(pokeData) // Buffer(...)
}
```
 * @deprecated This method is deprecated since, node 10 is out of LTS. It may be removed in an upcoming major release.
 */
export function fromStream<T>(stream: ReadableStreamish): AsyncIterable<T> {
  if (typeof stream[Symbol.asyncIterator] === 'function') {
    return stream as any
  }

  return _fromStream(stream) as AsyncIterable<T>
}
