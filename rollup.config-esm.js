import resolve from 'rollup-plugin-node-resolve'

export default {
  input: './dist-ts/index.js',
  plugins: [
    resolve({})
  ],
  output: {
    format: 'esm',
    file: './dist/index-esm.js'
  }
}
