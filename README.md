# streaming-iterables

[![Build Status](https://travis-ci.org/reconbot/streaming-iterables.svg?branch=master)](https://travis-ci.org/reconbot/streaming-iterables) [![Try streaming-iterables on RunKit](https://badge.runkitcdn.com/streaming-iterables.svg)](https://npm.runkit.com/streaming-iterables) [![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

A collection of utilities that work with sync and async iterables and iterators. Designed to replace your streams. Think some sort of combination of [`bluestream`](https://www.npmjs.com/package/bluestream) and [ramda](http://ramdajs.com/) but for a much more simple construct, async iterators. The goal is to make it dead easy to replace your stream based processes with async iterators, which in general should make your code smaller, faster and have less bugs.

Contributors welcome!

## Overview
Every function is curryable, you can call it with any number of arguments. For example:

```ts
import { map } from 'streaming-iterables'

for await (const str of map(String, [1,2,3])) {
  console.log(str)
}
// "1", "2", "3"

const stringable = map(String)
for await (const str of stringable([1,2,3])) {
  console.log(str)
}
// "1", "2", "3"
```

## Examples

```js
const { parallelMap, map, consume } = require('streaming-iterables')
const got = require('got')

const pokeGenerator = async function* () {
  let offset = 0
  while(true) {
    const url = `https://pokeapi.co/api/v2/pokemon/?offset=${offset}`
    const { body: pokemon } = await got(url, { json: true })
    if (pokemon.results.length === 0) {
      return
    }
    offset += pokemon.results.length
    for (const monster of pokemon.results) {
      yield monster
    }
  }
}

const loadUrl = async ({ url }) => {
  const { body } = await got(url, { json: true })
  return body
}

const loadMonsters = parallelMap(2, loadUrl) // two at at time
const logMonsters = map(pokemon => console.log(pokemon.name, pokemon.sprites.front_default))

await consume(logMonsters(loadMonsters(pokeGenerator())))
console.log('caught them all 🎉')

```

## Types

### Iterableish
```ts
type Iterableish<T> = Iterable<T> | Iterator<T> | AsyncIterable<T> | AsyncIterator<T>
```
Any iterable or iterator.

### AnyIterable
```ts
type AnyIterable<T> = Iterable<T> | AsyncIterable<T>
```
Literally any `Iterable` (async or regular).

## API

### buffer
```ts
function buffer<T>(size: number, iterable: AnyIterable<T>): AsyncIterableIterator<T>
```
Buffer keeps a number of objects in reserve available for immediate reading. This is helpful with async iterators as it will prefetch results so you don't have to wait for them to load.

```ts
import { buffer } from 'streaming-iterables'
import { getPokemon, trainMonster } from './util'

// Instantly load 10 monsters while we process them
for await (const monster of buffer(10, getPokemon())) {
  await trainMonster(monster) // got to do some pokéwork
}
```

### collect
```ts
function collect<T>(iterable: AnyIterable<T>): Promise<T[]>
```

Collect all the values from an iterable into an array.

```ts
import { collect } from 'streaming-iterables'
import { getPokemon } from './util'

console.log(await collect(getPokemon()))
// [bulbasaur, ivysaur, venusaur, charmander, ...]
```

### concat
```ts
function concat(...iterables: Array<AnyIterable<any>>): AsyncIterableIterator<any>
```

Combine multiple iterators into a single iterable. Reads each iterable one at a time.

```ts
import { concat } from 'streaming-iterables'
import { getPokemon, getTransformers } from './util'

for await (const hero of concat(getPokemon(2), getTransformers(2))) {
  console.log(hero)
}
// charmander
// bulbasaur <- end of pokemon
// megatron
// bumblebee <- end of transformers
```

### consume
```ts
function consume<T>(iterator: AnyIterable<T>): Promise<void>
```

A promise that resolves after the function drains the iterable of all data. Useful for processing a pipeline of data.

```ts
import { consume, map } from 'streaming-iterables'
import { getPokemon, trainMonster } from './util'

const train = map(trainMonster)
await consume(train(getPokemon())) // load all the pokemon and train them!
```

### getIterator
```ts
function getIterator<T>(values: Iterableish<T>): Iterator<T> | AsyncIterator<T>
```

Get the iterator from any iterable or just return an iterator itself.

### map
```ts
function map<T, B>(func: (data: T) => B | Promise<B>, iterable: AnyIterable<T>): AsyncIterableIterator<B>
```
Map a function or async function over all the values of an iterable.

```ts
import { consume, map } from 'streaming-iterables'
import got from 'got'

const urls = ['https://http.cat/200', 'https://http.cat/201', 'https://http.cat/202']
const download = map(got)

for await (page of download(urls)) {
  console.log(page)
}
```

### merge
```ts
function merge(...iterables: Array<AnyIterable<any>>): AsyncIterableIterator<any>
```

Combine multiple iterators into a single iterable. Reads one item off each iterable in order repeatedly until they are all exhausted.


### parallelMap
```ts
function parallelMap<T, R>(concurrency: number, func: (data: T) => R | Promise<R>, iterable: AnyIterable<T>): AsyncIterableIterator<R>
```

### parallelMerge
```ts
function parallelMerge<T>(...iterables: Array<AnyIterable<T>>): AsyncIterableIterator<T>
```
Combine multiple iterators into a single iterable. Reads one item off of every iterable and yields them as they resolve. This is useful for pulling items out of an array of iterables as soon as they're available.

```ts
import { parallelMerge } from 'streaming-iterables'
import { getPokemon, trainMonster } from './util'

// pokemon are much faster to load btw
const heros = parallelMerge(getPokemon(), trainMonster())
for await (const hero of heros) {
  console.log(hero)
}
// charmander
// bulbasaur
// megatron
// pikachu
// eevee
// bumblebee
// jazz
```


### reduce
```ts
function reduce<T, B>(func: (acc: B, value: T) => B, start: B, iterable: AnyIterable<T>): Promise<B>;
```

An async function that takes a reducer function, an initial value and .

Reduces an iterable to a value which is the accumulated result of running each value from the iterable thru `func`, where each successive invocation is supplied the return value of the previous.

### take
```ts
function take<T>(count: number, iterable: AnyIterable<T>): AsyncIterableIterator<T>
```

A passthrough iterator that reads a specific number of items from an iterator.

### tap
```ts
function tap<T>(func: (data: T) => any, iterable: AnyIterable<T>): AsyncIterableIterator<T>
```

A passthrough iterator that yields the data it consumes passing the data through to a function. If you provide an async function the iterator will wait for the promise to resolve before yielding the value. This is useful for logging, or processing information and passing it along.

## Contributors needed!

Writing docs and code is a lot of work! Thank you advance for helping out.
