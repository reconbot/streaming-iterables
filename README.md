# streaming-iterables

[![Build Status](https://travis-ci.org/reconbot/streaming-iterables.svg?branch=master)](https://travis-ci.org/reconbot/streaming-iterables) [![Try streaming-iterables on RunKit](https://badge.runkitcdn.com/streaming-iterables.svg)](https://npm.runkit.com/streaming-iterables) [![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

A collection of utilities that work with sync and async iterables and iterators. Designed to replace your streams. Think some sort of combination of [`bluestream`](https://www.npmjs.com/package/bluestream) and [ramda](http://ramdajs.com/) but for a much more simple construct, async iterators. The goal is to make it dead easy to replace your stream based processes with async iterators, which in general should make your code smaller, faster and have less bugs.

Contributors welcome! I'd love to finish this release but I can't do it right now, so you're welcome to join the project and run with it.

## Examples

```js
const { parallelMap, map, collect } = require('streaming-iterables')
const got = require('got')

const pokeGenerator = async function* () {
  let offset = 0
  while(true) {
    const url = `https://pokeapi.co/api/v2/pokemon/?offset=${offset}`
    const { body: pokemon } = await got(url, { json: true })
    if (pokemon.results.length > 0) {
      offset += pokemon.results.length
      for (const monster of pokemon.results) {
        yield monster
      }
    } else {
      return
    }
  }
}

const loadUrl = ({ url }) => got(url, { json: true }).then(resp => resp.body)
const loadPages = parallelMap(2, loadUrl)
const logMonsters = map(pokemon => console.log(pokemon.name, pokemon.sprites.front_default))

await collect(logMonsters(loadPages(pokeGenerator())))
console.log('caught them all')

```
