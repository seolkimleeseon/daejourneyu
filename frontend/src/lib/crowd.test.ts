import { describe, expect, it } from "vitest";
import { computeCrowdLevel, toCrowdPlace } from "@/lib/crowd";
import { makePlace } from "@/test/fixtures";

describe("toCrowdPlace", () => {
  it("티커에 필요한 세 필드만 남긴다", () => {
    const place = makePlace({ id: "p1", name: "한밭수목원", category: "산책" });

    expect(toCrowdPlace(place)).toEqual({ id: "p1", name: "한밭수목원", category: "산책" });
  });
});

describe("computeCrowdLevel", () => {
  it("정해진 세 단계 중 하나를 준다", () => {
    ["한밭수목원", "장태산자연휴양림", "댕댕카페", "유성온천공원"].forEach((name) => {
      expect(["여유", "보통", "혼잡"]).toContain(computeCrowdLevel(name));
    });
  });

  it("같은 이름은 항상 같은 값 — 새로고침마다 혼잡도가 바뀌면 신뢰를 잃는다", () => {
    const first = computeCrowdLevel("한밭수목원");

    expect(computeCrowdLevel("한밭수목원")).toBe(first);
    expect(computeCrowdLevel("한밭수목원")).toBe(first);
  });

  it("이름이 다르면 값도 갈린다 — 전부 같은 단계로 쏠리지 않는다", () => {
    const names = [
      "한밭수목원",
      "장태산자연휴양림",
      "댕댕카페",
      "유성온천공원",
      "대청호",
      "보문산",
      "엑스포과학공원",
      "대전시립미술관",
      "계족산황톳길",
    ];
    const levels = new Set(names.map(computeCrowdLevel));

    expect(levels.size).toBeGreaterThan(1);
  });

  it("빈 이름도 터지지 않는다", () => {
    expect(["여유", "보통", "혼잡"]).toContain(computeCrowdLevel(""));
  });
});
