/// <reference lib="esnext.asynciterable" />

import { AnyIterable } from "./types";
import { batch } from "./batch";

const TIMEOUT = Symbol("TIMEOUT");

const createTimer = (
  duration: number
): [Promise<typeof TIMEOUT>, () => void] => {
  let timeoutId;
  return [
    new Promise((resolve) => {
      timeoutId = setTimeout(() => resolve(TIMEOUT), duration);
    }),
    () => {
      clearTimeout(timeoutId);
    },
  ];
};

// Like `batch` but flushes early if the `timeout` is reached
// NOTE: The strategy is to only hold onto a single item for a maximum of `timeout` ms.
async function* _batchWithTimeout<T>(
  size: number,
  timeout: number,
  iterable: AnyIterable<T>
) {
  const iterator = iterable[Symbol.asyncIterator]();
  let pendingData: any;
  let batchData: any[] = [];
  let timer: Promise<unknown> | undefined;
  let clearTimer: () => void | undefined;
  const startTimer = () => {
    deleteTimer();
    [timer, clearTimer] = createTimer(timeout);
  };
  const deleteTimer = () => {
    if (clearTimer) {
      clearTimer();
    }
    timer = undefined;
  };
  pendingData = iterator.next();

  while (true) {
    const res = await (timer
      ? Promise.race([pendingData, timer])
      : pendingData);

    if (res === TIMEOUT || res.done) {
      // Flush early (before we reach the batch size)
      if (batchData.length) {
        yield batchData;
        batchData = [];
      }
      deleteTimer();
      // And exit appropriately
      if (res.done) {
        break;
      }
      continue;
    }

    // Fetch next item early doors (before we potentially yield)
    pendingData = iterator.next();

    // Then handle the value
    batchData.push(res.value);
    if (batchData.length === 1) {
      // Start timer once we have at least 1 item ready to go
      startTimer();
    }
    if (batchData.length === size) {
      yield batchData;
      batchData = [];
      deleteTimer();
      continue;
    }
  }
}

export type UnwrapAnyIterableArray<
  M extends AnyIterable<any>
> = M extends Iterable<infer T>
  ? Generator<T[]>
  : M extends AsyncIterable<infer B>
  ? AsyncGenerator<B[]>
  : never;

export type CurriedBatchWithTimeoutResult = <T, M extends AnyIterable<T>>(
  curriedIterable: M
) => UnwrapAnyIterableArray<M>;

export function batchWithTimeout<T, M extends AnyIterable<T>>(
  size: number,
  timeout: number
): CurriedBatchWithTimeoutResult;
export function batchWithTimeout<T, M extends AnyIterable<T>>(
  size: number,
  timeout: number,
  iterable: M
): UnwrapAnyIterableArray<M>;
export function batchWithTimeout<T>(
  size: number,
  timeout: number,
  iterable?: AnyIterable<T>
): CurriedBatchWithTimeoutResult | UnwrapAnyIterableArray<any> {
  if (iterable === undefined) {
    return (curriedIterable) =>
      batchWithTimeout(size, timeout, curriedIterable);
  }
  if (iterable[Symbol.asyncIterator]) {
    return _batchWithTimeout(size, timeout, iterable as AsyncIterable<T>);
  }
  // For sync iterables the timeout is irrelevant so just fallback to regular `batch`.
  return batch(size, iterable as Iterable<T>);
}

// TODO: Delete the below and write unit tests for the timeout logic.

// const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// async function* src() {
//   await sleep(200);
//   yield { _id: "1" };
//   await sleep(400);
//   yield { _id: "2" };
//   await sleep(100);
//   yield { _id: "3" };
//   await sleep(600);
//   yield { _id: "4" };
//   await sleep(300);
//   yield { _id: "5" };
//   await sleep(100);
//   yield { _id: "6" };
//   await sleep(50);
//   yield { _id: "7" };
//   await sleep(150);
//   yield { _id: "8" };
//   await sleep(200);
//   yield { _id: "9" };
//   await sleep(50);
//   yield { _id: "10" };
// }

// const main = async () => {
//   for await (let thing of batchWithTimeout(2, 200, src())) {
//     console.log(thing);
//   }
//   console.log("DONE");
// };

// main().catch((ex) => console.error(ex));
