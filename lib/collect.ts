export async function collect (iterable: Iterable<any>) {
  const values = []
  for await (const value of iterable) {
    values.push(value)
  }
  return values
}
