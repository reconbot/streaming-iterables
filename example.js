const { transform, map, consume } = require('streaming-iterables')
const got = require('got')

// A generator to fetch all the pokemon from the pokemon api
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

// an async download function to download the data
const loadUrl = async ({ url }) => {
  const { body } = await got(url, { json: true })
  return body
}
// a transform iterator that will load the monsters two at a time and yield them as soon as they're ready
const loadMonsters = transform(2, loadUrl)

// a map function to log monster data
const logMonsters = map(pokemon => console.log(`${pokemon.name} ${pokemon.sprites.front_default}`))

// lets do it team!
await consume(logMonsters(loadMonsters(pokeGenerator())))
console.log('caught them all')
