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

/**
 * Writes the `iterable` to the stream respecting the stream back pressure. Resolves when the iterable is exhausted, rejects if the stream errors during calls to `write()` or if there are `error` events during the write.

As it is when working with streams there are a few caveats;

- It is possible for the stream to error after `writeToStream()` has finished writing due to internal buffering and other concerns, so always handle errors on the stream as well.
- `writeToStream()` doesn't close the stream like `stream.pipe()` might. This is done so you can write to the stream multiple times. You can call `stream.write(null)` or any stream specific end function if you are done with the stream.

```ts
import { pipeline, map, writeToStream } from 'streaming-iterables'
import { getPokemon } from 'iterable-pokedex'
import { createWriteStream } from 'fs'

const file = createWriteStream('pokemon.ndjson')
const serialize = map(pokemon => `${JSON.stringify(pokemon)}\n`)
await pipeline(getPokemon, serialize, writeToStream(file))
file.end() // close the stream
// now all the pokemon are written to the file!
```
 */
export function writeToStream(stream: WritableStreamish): (iterable: AnyIterable<any>) => Promise<void>
export function writeToStream(stream: WritableStreamish, iterable: AnyIterable<any>): Promise<void>
export function writeToStream(stream: WritableStreamish, iterable?: AnyIterable<any>) {
  if (iterable === undefined) {
    return (curriedIterable: AnyIterable<any>) => _writeToStream(stream, curriedIterable)
  }
  return _writeToStream(stream, iterable)
}
