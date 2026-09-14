import { describe, expect, it } from "vitest";
import { chunkIntoDays } from "@/lib/chunkDays";

describe("chunkIntoDays", () => {
  it("당일치기는 전부 1일차에 담는다", () => {
    expect(chunkIntoDays(["a", "b", "c"], 1)).toEqual([["a", "b", "c"]]);
  });

  it("나눠떨어지면 고르게 분배한다", () => {
    expect(chunkIntoDays(["a", "b", "c", "d"], 2)).toEqual([
      ["a", "b"],
      ["c", "d"],
    ]);
  });

  it("원래 순서를 흐트러뜨리지 않는다 — 동선이 뒤바뀌면 안 된다", () => {
    const days = chunkIntoDays(["a", "b", "c", "d", "e"], 2);

    expect(days.flat()).toEqual(["a", "b", "c", "d", "e"]);
  });

  it("나눠떨어지지 않아도 요청한 일수만큼 만든다", () => {
    const days = chunkIntoDays(["a", "b", "c", "d", "e"], 3);

    expect(days).toHaveLength(3);
    expect(days.flat()).toHaveLength(5);
  });

  it("장소보다 일수가 많으면 빈 날이 생긴다 — 일수 자체는 요청대로 유지한다", () => {
    const days = chunkIntoDays(["a"], 3);

    expect(days).toHaveLength(3);
    expect(days[0]).toEqual(["a"]);
  });

  it("빈 목록이어도 요청한 일수만큼 빈 날을 만든다", () => {
    expect(chunkIntoDays([], 2)).toEqual([[], []]);
  });

  // dayCount가 0 이하인 경우는 지금 터진다(groups[-1]) — 함수 첫 줄의 Math.max(1, dayCount)
  // 가드가 인덱스 계산까지 이어지지 않아서다. 호출부가 없어 실제로 나는 버그는 아니라
  // 소유자(Player 2) 확인 전까지 동작을 테스트로 못 박지 않는다.
});
