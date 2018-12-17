import { Suite } from 'benchmark'
import {
  batch,
  buffer,
  collect,
  consume,
  flatTransform,
  map,
  parallelFlatMap,
  parallelMap,
  pipeline,
  tap,
  transform,
} from '../'
const suite = new Suite()

const asyncSetImmediate = () => {
  return new Promise(resolve => {
    setImmediate(resolve)
  })
}

const numbersLimit = 10000

const fastNumbers = function*() {
  let num = 0
  while (true) {
    yield ++num
    if (num > numbersLimit) {
      return
    }
  }
}

const slowNumbers = async function*() {
  let num = 0
  while (true) {
    await asyncSetImmediate()
    yield ++num
    if (num > numbersLimit) {
      return
    }
  }
}

const fastStringify = i => [String(i)]
const slowStringify = i => asyncSetImmediate().then(() => [String(i)])

suite.add('async batch', {
  defer: true,
  fn: async deferred => {
    await pipeline(slowNumbers, batch(10), consume)
    deferred.resolve()
  },
})

suite.add('async collect', {
  defer: true,
  fn: async deferred => {
    await pipeline(slowNumbers, collect)
    deferred.resolve()
  },
})

suite.add('async consume', {
  defer: true,
  fn: async deferred => {
    await pipeline(slowNumbers, consume)
    deferred.resolve()
  },
})

suite.add('async buffer', {
  defer: true,
  fn: async deferred => {
    await pipeline(slowNumbers, buffer(10), consume)
    deferred.resolve()
  },
})

suite.add('async flatTransform', {
  defer: true,
  fn: async deferred => {
    await pipeline(slowNumbers, flatTransform(10, slowStringify), consume)
    deferred.resolve()
  },
})

suite.add('async map', {
  defer: true,
  fn: async deferred => {
    await pipeline(slowNumbers, map(slowStringify), consume)
    deferred.resolve()
  },
})

suite.add('async map sync func', {
  defer: true,
  fn: async deferred => {
    await pipeline(slowNumbers, map(fastStringify), consume)
    deferred.resolve()
  },
})

suite.add('async parallelFlatMap', {
  defer: true,
  fn: async deferred => {
    await pipeline(slowNumbers, parallelFlatMap(10, slowStringify), consume)
    deferred.resolve()
  },
})

suite.add('async parallelMap', {
  defer: true,
  fn: async deferred => {
    await pipeline(slowNumbers, parallelMap(10, slowStringify), consume)
    deferred.resolve()
  },
})

suite.add('async parallelMap sync func', {
  defer: true,
  fn: async deferred => {
    await pipeline(slowNumbers, parallelMap(10, fastStringify), consume)
    deferred.resolve()
  },
})

suite.add('async tap', {
  defer: true,
  fn: async deferred => {
    await pipeline(slowNumbers, tap(slowStringify), consume)
    deferred.resolve()
  },
})

suite.add('async transform', {
  defer: true,
  fn: async deferred => {
    await pipeline(slowNumbers, transform(1, slowStringify), consume)
    deferred.resolve()
  },
})

suite.add('async transform sync func', {
  defer: true,
  fn: async deferred => {
    await pipeline(slowNumbers, transform(1, fastStringify), consume)
    deferred.resolve()
  },
})

suite.add('sync batch', {
  fn: async () => {
    await pipeline(fastNumbers, batch(10), consume)
  },
})

suite.add('sync collect', {
  fn: async () => {
    pipeline(fastNumbers, collect)
  },
})

suite.add('sync consume', {
  fn: async () => {
    pipeline(fastNumbers, consume)
  },
})

suite.add('sync buffer', {
  fn: async () => {
    pipeline(fastNumbers, buffer(10), consume)
  },
})

suite.on('cycle', event => {
  console.log(String(event.target))
})

suite.on('complete', function() {
  console.log('Fastest is ' + this.filter('fastest').map('name'))
})

suite.run()
