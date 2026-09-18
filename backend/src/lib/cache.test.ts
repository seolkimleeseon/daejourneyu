import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cached } from "./cache";

/** 캐시는 모듈 전역 Map이라 테스트끼리 키가 겹치지 않게 매번 새 키를 쓴다. */
let keySeq = 0;
function nextKey() {
  keySeq += 1;
  return `key-${keySeq}`;
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("cached", () => {
  it("동시에 같은 키를 요청하면 진행 중인 load를 공유한다", async () => {
    const key = nextKey();
    let finish!: (value: string) => void;
    const load = vi.fn(() => new Promise<string>((resolve) => { finish = resolve; }));

    const first = cached(key, 1000, load);
    const second = cached(key, 1000, load);
    await Promise.resolve();
    expect(load).toHaveBeenCalledTimes(1);
    finish("공유된 값");
    expect(await Promise.all([first, second])).toEqual(["공유된 값", "공유된 값"]);
  });

  it("처음에는 load를 부르고 값을 돌려준다", async () => {
    const load = vi.fn().mockResolvedValue("값");

    expect(await cached(nextKey(), 1000, load)).toBe("값");
    expect(load).toHaveBeenCalledTimes(1);
  });

  it("TTL 안에서는 다시 부르지 않는다 — 공공데이터 일일 한도를 아끼는 게 목적이다", async () => {
    const key = nextKey();
    const load = vi.fn().mockResolvedValue("값");

    await cached(key, 1000, load);
    vi.advanceTimersByTime(999);
    const second = await cached(key, 1000, load);

    expect(second).toBe("값");
    expect(load).toHaveBeenCalledTimes(1);
  });

  it("TTL이 지나면 다시 불러온다", async () => {
    const key = nextKey();
    const load = vi.fn().mockResolvedValueOnce("옛값").mockResolvedValueOnce("새값");

    await cached(key, 1000, load);
    vi.advanceTimersByTime(1001);

    expect(await cached(key, 1000, load)).toBe("새값");
    expect(load).toHaveBeenCalledTimes(2);
  });

  it("키가 다르면 서로 간섭하지 않는다", async () => {
    const a = vi.fn().mockResolvedValue("A");
    const b = vi.fn().mockResolvedValue("B");

    expect(await cached(nextKey(), 1000, a)).toBe("A");
    expect(await cached(nextKey(), 1000, b)).toBe("B");
  });

  it("load가 실패하면 실패를 그대로 전달하고 캐시에 남기지 않는다", async () => {
    const key = nextKey();
    const load = vi.fn().mockRejectedValueOnce(new Error("API 다운")).mockResolvedValueOnce("복구");

    await expect(cached(key, 1000, load)).rejects.toThrow("API 다운");
    // 실패를 캐싱하면 TTL 동안 계속 실패한 값을 돌려주게 된다.
    expect(await cached(key, 1000, load)).toBe("복구");
  });

  it("falsy 값도 캐시한다 — 빈 배열·0을 매번 다시 불러오면 캐시 의미가 없다", async () => {
    const key = nextKey();
    const load = vi.fn().mockResolvedValue([]);

    await cached(key, 1000, load);
    await cached(key, 1000, load);

    expect(load).toHaveBeenCalledTimes(1);
  });
});
