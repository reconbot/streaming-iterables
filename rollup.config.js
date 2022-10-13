import { nodeResolve } from '@rollup/plugin-node-resolve'

export default {
  input: './dist-ts/index.js',
  plugins: [nodeResolve()],
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
  ]
}
