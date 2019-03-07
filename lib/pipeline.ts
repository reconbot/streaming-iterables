export function pipeline<T0>(firstFn: () => T0): T0
export function pipeline<T0, T1>(a0: () => T0, a1: (a: T0) => T1): T1
export function pipeline<T0, T1, T2>(a0: () => T0, a1: (a: T0) => T1, a2: (a: T1) => T2): T2
export function pipeline<T0, T1, T2, T3>(a0: () => T0, a1: (a: T0) => T1, a2: (a: T1) => T2, a3: (a: T2) => T3): T3
export function pipeline<T0, T1, T2, T3, T4>(
  a0: () => T0,
  a1: (a: T0) => T1,
  a2: (a: T1) => T2,
  a3: (a: T2) => T3,
  a4: (a: T3) => T4
): T4
export function pipeline<T0, T1, T2, T3, T4, T5>(
  a0: () => T0,
  a1: (a: T0) => T1,
  a2: (a: T1) => T2,
  a3: (a: T2) => T3,
  a4: (a: T3) => T4,
  a5: (a: T4) => T5
): T5
export function pipeline<T0, T1, T2, T3, T4, T5, T6>(
  a0: () => T0,
  a1: (a: T0) => T1,
  a2: (a: T1) => T2,
  a3: (a: T2) => T3,
  a4: (a: T3) => T4,
  a5: (a: T4) => T5,
  a6: (a: T5) => T6
): T6
export function pipeline<T0, T1, T2, T3, T4, T5, T6, T7>(
  a0: () => T0,
  a1: (a: T0) => T1,
  a2: (a: T1) => T2,
  a3: (a: T2) => T3,
  a4: (a: T3) => T4,
  a5: (a: T4) => T5,
  a6: (a: T5) => T6,
  a7: (a: T6) => T7
): T7
export function pipeline<T0, T1, T2, T3, T4, T5, T6, T7, T8>(
  a0: () => T0,
  a1: (a: T0) => T1,
  a2: (a: T1) => T2,
  a3: (a: T2) => T3,
  a4: (a: T3) => T4,
  a5: (a: T4) => T5,
  a6: (a: T5) => T6,
  a7: (a: T6) => T7,
  a8: (a: T7) => T8
): T8
export function pipeline<T0, T1, T2, T3, T4, T5, T6, T7, T8, T9>(
  a0: () => T0,
  a1: (a: T0) => T1,
  a2: (a: T1) => T2,
  a3: (a: T2) => T3,
  a4: (a: T3) => T4,
  a5: (a: T4) => T5,
  a6: (a: T5) => T6,
  a7: (a: T6) => T7,
  a8: (a: T7) => T8,
  a9: (a: T8) => T9
): T9
export function pipeline(firstFn: any, ...fns: any[]) {
  let previousFn = firstFn()
  for (const func of fns) {
    previousFn = func(previousFn)
  }
  return previousFn
}
