import { describe, expect, it } from "vitest";
import { stableId } from "./stableId";

describe("stableId", () => {
  it("같은 입력이면 항상 같은 id를 낸다", () => {
    expect(stableId("petfac", "멍멍카페", "대전 유성구 어딘가")).toBe(
      stableId("petfac", "멍멍카페", "대전 유성구 어딘가")
    );
  });

  it("입력이 다르면 id도 다르다", () => {
    expect(stableId("petfac", "멍멍카페", "대전 유성구 어딘가")).not.toBe(
      stableId("petfac", "야옹카페", "대전 유성구 어딘가")
    );
  });

  it("prefix로 시작한다", () => {
    expect(stableId("restaurant", "밥집", "주소")).toMatch(/^restaurant-/);
  });
});
