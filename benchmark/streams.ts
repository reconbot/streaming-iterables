import { Suite } from 'benchmark'
import { consume, map, pipeline, tap, fromStream } from '../'
import { Readable, PassThrough, Transform } from 'stream'
const suite = new Suite()

const asyncSetImmediate = () => {
  return new Promise(resolve => {
    setImmediate(resolve)
  })
}

const numbersLimit = 10000

const slowNumbers = () => {
  let num = 0
  return new Readable({
    objectMode: true,
    async read() {
      await asyncSetImmediate()
      if (num > numbersLimit) {
        this.push(null)
        return
      }
      this.push(++num)
    },
  })
}

const fastNumbers = () => {
  let num = 0
  return new Readable({
    objectMode: true,
    read() {
      if (num > numbersLimit) {
        this.push(null)
        return
      }
      this.push(++num)
    },
  })
}

const fastStringify = i => [String(i)]
const slowStringify = i => asyncSetImmediate().then(() => [String(i)])

suite.add('tap slow source', {
  defer: true,
  fn: async deferred => {
    await pipeline(() => fromStream(slowNumbers()), tap(fastStringify), consume)
    deferred.resolve()
  },
})

suite.add('stream tap slow source (PassThrough)', {
  defer: true,
  fn: async deferred => {
    const passThrough = new PassThrough({
      objectMode: true,
      transform(num, encoding, cb) {
        fastStringify(num)
        cb(undefined, num)
      },
    })
    slowNumbers().pipe(passThrough)
    await pipeline(() => fromStream(passThrough), consume)
    deferred.resolve()
  },
})

suite.add('tap fast source', {
  defer: true,
  fn: async deferred => {
    await pipeline(() => fromStream(fastNumbers()), tap(fastStringify), consume)
    deferred.resolve()
  },
})

suite.add('stream tap fast source (PassThrough)', {
  defer: true,
  fn: async deferred => {
    const passThrough = new PassThrough({
      objectMode: true,
      transform(num, encoding, cb) {
        fastStringify(num)
        cb(undefined, num)
      },
    })
    fastNumbers().pipe(passThrough)
    await pipeline(() => fromStream(passThrough), consume)
    deferred.resolve()
  },
})

suite.add('map slow source', {
  defer: true,
  fn: async deferred => {
    await pipeline(() => fromStream(slowNumbers()), map(slowStringify), consume)
    deferred.resolve()
  },
})

suite.add('stream map slow source (transform)', {
  defer: true,
  fn: async deferred => {
    const transformStream = new Transform({
      objectMode: true,
      transform(num, encoding, cb) {
        slowStringify(num).then(str => cb(undefined, str))
      },
    })
    slowNumbers().pipe(transformStream)
    await pipeline(() => fromStream(transformStream), consume)
    deferred.resolve()
  },
})

suite.add('map fast source', {
  defer: true,
  fn: async deferred => {
    await pipeline(() => fromStream(fastNumbers()), map(slowStringify), consume)
    deferred.resolve()
  },
})

suite.add('stream map fast source (transform)', {
  defer: true,
  fn: async deferred => {
    const transformStream = new Transform({
      objectMode: true,
      transform(num, encoding, cb) {
        slowStringify(num).then(str => cb(undefined, str))
      },
    })
    fastNumbers().pipe(transformStream)
    await pipeline(() => fromStream(transformStream), consume)
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
