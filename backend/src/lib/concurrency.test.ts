import { describe, expect, it } from "vitest";
import { mapWithConcurrency, Semaphore } from "./concurrency";

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** 동시에 실행 중인 작업 수의 최댓값을 기록하는 헬퍼 */
function createTracker() {
  let active = 0;
  let max = 0;
  return {
    async track<T>(fn: () => Promise<T>): Promise<T> {
      active++;
      max = Math.max(max, active);
      try {
        return await fn();
      } finally {
        active--;
      }
    },
    get max() {
      return max;
    },
  };
}

describe("mapWithConcurrency", () => {
  it("완료 순서와 상관없이 입력 순서대로 결과를 돌려준다", async () => {
    const delays = [30, 5, 20, 1, 10];
    const results = await mapWithConcurrency(delays, 2, async (ms, index) => {
      await sleep(ms);
      return index;
    });
    expect(results).toEqual([0, 1, 2, 3, 4]);
  });

  it("동시 실행 개수가 limit을 넘지 않는다", async () => {
    const tracker = createTracker();
    await mapWithConcurrency(Array.from({ length: 10 }, (_, i) => i), 3, (n) =>
      tracker.track(() => sleep(5).then(() => n))
    );
    expect(tracker.max).toBe(3);
  });

  it("빈 배열이면 빈 결과를 돌려준다", async () => {
    await expect(mapWithConcurrency([], 5, async (n: number) => n)).resolves.toEqual([]);
  });
});

describe("Semaphore", () => {
  it("여러 호출부가 나눠 써도 전체 동시 실행 개수가 limit을 넘지 않는다", async () => {
    const semaphore = new Semaphore(2);
    const tracker = createTracker();
    const results = await Promise.all(
      Array.from({ length: 6 }, (_, i) =>
        semaphore.run(() => tracker.track(() => sleep(5).then(() => i * 10)))
      )
    );
    expect(results).toEqual([0, 10, 20, 30, 40, 50]);
    expect(tracker.max).toBe(2);
  });

  it("작업이 실패해도 슬롯을 반납해 다음 작업이 진행된다", async () => {
    const semaphore = new Semaphore(1);
    await expect(semaphore.run(() => Promise.reject(new Error("실패")))).rejects.toThrow("실패");
    await expect(semaphore.run(async () => "다음 작업")).resolves.toBe("다음 작업");
  });
});
