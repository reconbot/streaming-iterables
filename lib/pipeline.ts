// tslint:disable-next-line:ban-types
export function pipeline(firstFn: Function, ...fns: Function[]) {
  let previousFn = firstFn()
  for (const func of fns) {
    previousFn = func(previousFn)
  }
  return previousFn
}
