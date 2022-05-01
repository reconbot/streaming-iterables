export default {
  input: './dist-ts/index.js',
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
