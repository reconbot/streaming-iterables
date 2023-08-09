import typescript from '@rollup/plugin-typescript'

export default {
  input: './lib/index.ts',
  output: [
    {
      format: 'esm',
      file: './dist/index.mjs'
    },
    {
      format: 'umd',
      name: 'streamingIterables',
      file: './dist/index.js'
    },
  ],
  plugins: [typescript()]
}
