# streaming-iterables

[![Build Status](https://travis-ci.org/reconbot/streaming-iterables.svg?branch=master)](https://travis-ci.org/reconbot/streaming-iterables) [![Try streaming-iterables on RunKit](https://badge.runkitcdn.com/streaming-iterables.svg)](https://npm.runkit.com/streaming-iterables)

A collection of utilities that work with sync and async iterables and iterators. Designed to replace your streams. Think some sort of combination of [`bluestream`](https://www.npmjs.com/package/bluestream) and [ramda](http://ramdajs.com/) but for a much more simple construct, async iterators. The goal is to make it dead easy to replace your stream based processes with async iterators, which in general should make your code smaller, faster and have less bugs.

JavaScript iterators are lazy loading which allows you to do multiple operations on a collection of data and not pay a tax for looping over the collection multiple times.

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

Since this works with async iterators it polyfills `Symbol.asyncIterator` if it doesn't exist. (Not an issue since node 10.)

```ts
if ((Symbol as any).asyncIterator === undefined) {
  ;(Symbol as any).asyncIterator = Symbol.for('asyncIterator')
}
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

### FlatMapValue
```ts
type FlatMapValue<B> = B | AnyIterable<B> | undefined | null | Promise<B | AnyIterable<B> | undefined | null>
```
A value, an array of that value, undefined, null or promises for any of them. Used in the `flatMap` and `flatTransform` functions as possible return values of the mapping function.

## API

### batch
```ts
function batch<t>(size: number, iterable: AnyIterable<T>): AsyncIterableIterator<T[]>
```

Batch objects from `iterable` into arrays of `size` length. The final array may be shorter than size if there is not enough items.

```ts
import { batch } from 'streaming-iterables'
import { getPokemon, trainMonster } from './util'

// Instantly load 10 monsters while we process them
for await (const monstes of buffer(10, getPokemon())) {
  console.log(monsters) // 10 pokemon at a time!
}
```

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

### flatMap
```ts
function flatMap<T, B>(func: (data: T) => FlatMapValue<B>, iterable: AnyIterable<T>): AsyncIterableIterator<B>
```

Map `func` over the `iterable`, flatten the result and then ignore all null or undefined values. It's the transform function we've always needed. It's equivalent to;
```ts
(func, iterable) => filter(i => i !== undefined && i !== null, flatten(map(func, iterable)))
```

The return value for `func` is `FlatMapValue<B>`. Typescript doesn't have recursive types but you can nest iterables as deep as you like.

The ordering of the results is guaranteed.

```ts
import { flatMap } from 'streaming-iterables'
import { getPokemon, lookupStats } from './util'

async function getDefeatedGyms(pokemon) {
  if (pokemon.gymBattlesWon > 0) {
    const stats = await lookupStats(pokemon)
    return stats.gyms
  }
}

for await (const gym of flatMap(getDefeatedGyms, getPokemon())) {
  console.log(gym.name)
}
// "Pewter Gym"
// "Cerulean Gym"
// "Vermilion Gym"
```

### flatten
```ts
function flatten<B>(iterable: AnyIterable<B | AnyIterable<B>>): AsyncIterableIterator<B>
```

Returns a new iterator by pulling every item out of `iterable` (and all its sub iterables) and yielding them depth-first. Checks for the iterable interfaces and iterates it if it exists. If the value is a string it is not iterated as that ends up in an infinite loop.

*note*: Typescript doesn't have recursive types but you can nest iterables as deep as you like.

```ts
import { flatten } from 'streaming-iterables'

for await (const item of flatten([1, 2, [3, [4, 5], 6])) {
  console.log(item)
}
// 1
// 2
// 3
// 4
// 5
// 6
```

### flatTransform
```ts
function flatTransform<T, R>(concurrency: number, func: (data: T) => FlatMapValue<R>, iterable: AnyIterable<T>): AsyncIterableIterator<R>
```

Map `func` over the `iterable`, flatten the result and then ignore all null or undefined values. It's the transform function we've always needed. It's equivalent to;
```ts
(concurrency, func, iterable) => filter(i => i !== undefined && i !== null, flatten(transform(concurrency, func, iterable)))
```

The return value for `func` is `FlatMapValue<B>`. Typescript doesn't have recursive types but you can nest iterables as deep as you like.

Order is determined by when `func` resolves. And it will run up to `concurrency` async `func` operations at once.

```ts
import { flatTransform } from 'streaming-iterables'
import { getPokemon, lookupStats } from './util'

async function getDefeatedGyms(pokemon) {
  if (pokemon.gymBattlesWon > 0) {
    const stats = await lookupStats(pokemon)
    return stats.gyms
  }
}

// lookup 10 stats at a time
for await (const gym of flatTransform(10, getDefeatedGyms, getPokemon())) {
  console.log(gym.name)
}
// "Pewter Gym"
// "Cerulean Gym"
// "Vermilion Gym"
```

### filter
```ts
function filter<T>(filterFunc: (data: T) => boolean | Promise<boolean>, iterable: AnyIterable<T>): AsyncIterableIterator<T>
```

Takes a `filterFunc` and a `iterable`, and returns a new async iterator of the same type containing the members of the given iterable which cause the `filterFunc` to return true.

```ts
import { filter } from 'streaming-iterables'
import { getPokemon } from './util'

const filterWater = filter(pokemon => pokemon.elements.include('water'))

for await (const pokemon of filterWater(getPokemon())) {
  console.log(pokemon)
}
// squirtle
// vaporeon
// magikarp
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

// download one at a time
for await (page of download(urls)) {
  console.log(page)
}
```

### merge
```ts
function merge(...iterables: Array<AnyIterable<any>>): AsyncIterableIterator<any>
```

Combine multiple iterators into a single iterable. Reads one item off each iterable in order repeatedly until they are all exhausted.

### parallelMerge
```ts
function parallelMerge<T>(...iterables: Array<AnyIterable<T>>): AsyncIterableIterator<T>
```
Combine multiple iterators into a single iterable. Reads one item off of every iterable and yields them as they resolve. This is useful for pulling items out of a collection of iterables as soon as they're available.

```ts
import { parallelMerge } from 'streaming-iterables'
import { getPokemon, getTransformer } from './util'

// pokemon are much faster to load btw
const heros = parallelMerge(getPokemon(), getTransformer())
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

### pipeline
```ts
function pipeline(firstFn: Function, ...fns: Function[]): any;
```

Calls `firstFn` and then every function in `fns` with the result of the previous function.

```ts
import { pipeline, map, collect } from 'streaming-iterables'
import { getPokemon } from './util'
const getName = map(pokemon => pokemon.name)

// equivalent to `await collect(getName(getPokemon()))`
await pipeline(getPokemon, getName, collect)
// charmander
// bulbasaur
// MissingNo.
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

### transform
```ts
function transform<T, R>(concurrency: number, func: (data: T) => R | Promise<R>, iterable: AnyIterable<T>): AsyncIterableIterator<R>
```
Map a function or async function over all the values of an iterable. Order is determined by when `func` resolves. And it will run up to `concurrency` async `func` operations at once.


```ts
import { consume, transform } from 'streaming-iterables'
import got from 'got'

const urls = ['https://http.cat/200', 'https://http.cat/201', 'https://http.cat/202']
const download = transform(1000, got)

// download all of these at the same time
for await (page of download(urls)) {
  console.log(page)
}
```
### writeToStream
```ts
function writeToStream(stream: Writable, iterable: AnyIterable<any>): Promise<void>
```

Writes the `iterable` to the stream respecting the stream backpressure. Resolves when the iterable is exhausted.


```ts
import { pipeline, map, writeToStream } from 'streaming-iterables'
import { getPokemon } from './util'
import { createWriteStream } from 'fs'

const file = createWriteStream('pokemon.ndjson')
const serialize = map(pokemon => `${JSON.stringify(pokemon)}\n`)
await pipeline(getPokemon, serialize, writeToStream(file))
file.end()
// now all the pokemon are written to the file!
```

## Contributors needed!

Writing docs and code is a lot of work! Thank you in advance for helping out.
