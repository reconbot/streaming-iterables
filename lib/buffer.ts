if ((Symbol as any).asyncIterator === undefined) {
  ((Symbol as any).asyncIterator) = Symbol.for('asyncIterator')
}

async function* _buffer (size: number, iterable: Iterator<any>) {
  const buff = []
  for (let i = 0; i <= size; i++) {
    buff.push(iterable.next())
  }
  while (true) {
    const { value, end } = await buff.shift()
    if (!end) {
      yield value
    } else {
      return
    }
    buff.push(iterable.next())
  }
}

export function buffer (size: number, iterable?: Iterator<any>) {
  if (iterable === undefined) {
    return curriedIterable => _buffer(size, curriedIterable)
  }
  return _buffer(size, iterable)
}
