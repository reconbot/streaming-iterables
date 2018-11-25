const { buffer, flatten, pipeline, transform } = require('streaming-iterables')
const got = require('got')

// A generator to fetch all the pokemon from the pokemon api
const pokedex = async function* () {
  let offset = 0
  while(true) {
    const url = `https://pokeapi.co/api/v2/pokemon/?offset=${offset}`
    const { body: { results: pokemon } } = await got(url, { json: true })
    if (pokemon.length === 0) {
      return
    }
    offset += pokemon.length
    yield pokemon
  }
}

// lets buffer two pages so they're ready when we want them
const bufferTwo = buffer(2)

// a transform iterator that will load the monsters two at a time and yield them as soon as they're ready
const pokeLoader = transform(2, async ({ url }) => {
  const { body } = await got(url, { json: true })
  return body
})

// string together all our functions
const pokePipe = pipeline(pokedex, bufferTwo, flatten, pokeLoader)

// lets do it team!
const run = async () => {
  for await (const pokemon of pokePipe){
    console.log(pokemon.name)
    console.log(pokemon.sprites.front_default)
  }
}

run().then(() => console.log('caught them all!'))
