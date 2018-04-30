export async function* fromIterator (values) {
  for await (const val of values) {
    yield val
  }
}
