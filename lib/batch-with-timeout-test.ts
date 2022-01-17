import { assert } from "chai";
import { batchWithTimeout } from "./batch-with-timeout";
import { promiseImmediate } from "./util-test";

async function* asyncNumbers(max: number) {
  let num = 1;
  while (num <= max) {
    yield await promiseImmediate(num);
    num++;
  }
}

function* numbers(max: number) {
  let num = 1;
  while (num <= max) {
    yield num;
    num++;
  }
}

describe("batchWithTimeout", () => {
  it("batches async iterators", async () => {
    const batches: number[][] = [];
    for await (const numberBatch of batchWithTimeout(
      5,
      10000,
      asyncNumbers(11)
    )) {
      batches.push(numberBatch);
    }
    assert.deepEqual(batches, [[1, 2, 3, 4, 5], [6, 7, 8, 9, 10], [11]]);
  });

  it("batches sync iterators", async () => {
    const batches: number[][] = [];
    for await (const numberBatch of batchWithTimeout(5, 10000, numbers(11))) {
      batches.push(numberBatch);
    }
    assert.deepEqual(batches, [[1, 2, 3, 4, 5], [6, 7, 8, 9, 10], [11]]);
  });

  it("is curryable", async () => {
    const batches: number[][] = [];
    const batch5 = batchWithTimeout(5, 10000);
    for await (const numberBatch of batch5(numbers(10))) {
      assert.equal(numberBatch.length, 5);
      batches.push(numberBatch);
    }
    assert.deepEqual(batches, [
      [1, 2, 3, 4, 5],
      [6, 7, 8, 9, 10],
    ]);
  });
});
