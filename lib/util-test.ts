export async function asyncString(str) {
  return String(str)
}

export async function asyncStringArr(str) {
  return [String(str)]
}

export function promiseImmediate<T>(data?: T) {
  return new Promise(resolve => setImmediate(() => resolve(data))) as Promise<T>
}

export async function delayTicks<T>(count = 1, data?: T) {
  for (let i = 0; i < count; i++) {
    await promiseImmediate()
  }
  return data
}

export const makeDelay = count => data => delayTicks(count, data)

export async function* asyncFromArray<T>(arr: T[]) {
  for (const value of arr) {
    await promiseImmediate()
    yield value
  }
}
