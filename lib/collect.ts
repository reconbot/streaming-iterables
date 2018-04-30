export async function collect (iterable) {
  const values = []
  for await (const value of iterable) {
    values.push(value)
  }
  return values
}
