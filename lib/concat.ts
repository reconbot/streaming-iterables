export async function* concat (...iterables: Array<Iterable<any>>) {
  for await (const iterable of iterables) {
    for await (const value of iterable) {
      yield value
    }
  }
}
