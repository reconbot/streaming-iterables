import { createBundle } from 'dts-buddy'

await createBundle({
  project: 'tsconfig.json',
  output: 'dist/index.d.ts',
  modules: {
    'streaming-iterables': './lib/index.ts',
  }
})

await createBundle({
  project: 'tsconfig.json',
  output: 'dist/index.d.mts',
  modules: {
    'streaming-iterables': './lib/index.ts',
  }
})
