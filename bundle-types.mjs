import { createBundle } from 'dts-buddy'

await createBundle({
  project: 'tsconfig.json',
  output: 'dist/index.d.ts',
  modules: {
    // 'streaming-iterables': './dist-ts/index.js',
    'streaming-iterables': './lib/index.ts',
  }
})
