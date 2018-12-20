// tslint:disable:no-console
import { Suite } from 'benchmark'
import { Readable, Transform } from 'stream'
import { obj as through2 } from 'through2-concurrent'
import { consume, map, pipeline, fromStream, parallelMap, transform, buffer } from '../'

/*
 Say you have a file of users and you want to write them to your database. The database responds in between 1-5 ms. What's the fastest way to save them?
*/

const suite = new Suite()

const wait1to5ms = (data?: any) => {
  const randomTime = Math.random() * 5 + 1
  return new Promise(resolve => {
    setTimeout(() => resolve(data), randomTime)
  })
}

const wait1to5msStream = () =>
  new Transform({
    objectMode: true,
    transform(num, encoding, cb) {
      wait1to5ms(num).then(data => cb(undefined, data))
    },
  })

const numbersLimit = 100
const source = () => {
  let num = 0
  return new Readable({
    objectMode: true,
    async read() {
      if (num > numbersLimit) {
        this.push(null)
        return
      }
      this.push(++num)
    },
  })
}

suite.add('map(source)', {
  defer: true,
  fn: async deferred => {
    await pipeline(() => fromStream(source()), map(wait1to5ms), consume)
    deferred.resolve()
  },
})

suite.add('map(buffer(source))', {
  defer: true,
  fn: async deferred => {
    await pipeline(() => fromStream(source()), buffer(10), map(wait1to5ms), consume)
    deferred.resolve()
  },
})

suite.add('parallelMap(source)', {
  defer: true,
  fn: async deferred => {
    await pipeline(() => fromStream(source()), parallelMap(10, wait1to5ms), consume)
    deferred.resolve()
  },
})

suite.add('transform(source)', {
  defer: true,
  fn: async deferred => {
    await pipeline(() => fromStream(source()), transform(10, wait1to5ms), consume)
    deferred.resolve()
  },
})

suite.add('transform stream', {
  defer: true,
  fn: async deferred => {
    const workStream = wait1to5msStream()
    source().pipe(workStream)
    await pipeline(() => fromStream(workStream), consume)
    deferred.resolve()
  },
})

suite.add('through2Concurrent(source)', {
  defer: true,
  fn: async deferred => {
    const throughTransform = through2({ maxConcurrency: 10 }, (data, enc, cb) => {
      wait1to5ms().then(() => cb(undefined, data))
    })
    source().pipe(throughTransform)
    await pipeline(() => fromStream(throughTransform), consume)
    deferred.resolve()
  },
})

suite.on('cycle', event => {
  console.log(String(event.target))
})

suite.on('complete', function() {
  console.log('Fastest is ' + this.filter('fastest').map('name'))
})

suite.run()
