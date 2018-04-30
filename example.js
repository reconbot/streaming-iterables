const { parallelMap, map, collect } = require('blue-iterate')
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
