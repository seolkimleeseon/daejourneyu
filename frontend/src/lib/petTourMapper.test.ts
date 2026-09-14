import { describe, expect, it } from "vitest";
import { ensureCategoryMinimum, type PickablePlace } from "@/lib/petTourMapper";
import { makePlace } from "@/test/fixtures";
import type { Place, PlaceCategory } from "@/types";

function pickable(name: string, category: PlaceCategory): PickablePlace {
  return { ...makePlace({ id: name, name, category }), imageUrl: null };
}

function fallback(name: string, category: PlaceCategory): Place {
  return makePlace({ id: `mock-${name}`, name, category });
}

/** 카테고리마다 기본 3개씩 채워둔 폴백 풀. */
const POOL: Place[] = (["산책", "놀이터", "맛집", "문화"] as const).flatMap((category) =>
  [1, 2, 3].map((n) => fallback(`목${category}${n}`, category))
);

function countByCategory(places: { category: PlaceCategory }[], category: PlaceCategory) {
  return places.filter((place) => place.category === category).length;
}

describe("ensureCategoryMinimum", () => {
  it("실데이터가 없으면 카테고리마다 최소 개수를 폴백으로 채운다", () => {
    const result = ensureCategoryMinimum([], POOL);

    (["산책", "놀이터", "맛집", "문화"] as const).forEach((category) => {
      expect(countByCategory(result, category)).toBe(3);
    });
  });

  it("이미 충분한 카테고리는 건드리지 않는다", () => {
    const primary = [1, 2, 3, 4].map((n) => pickable(`실맛집${n}`, "맛집"));

    const result = ensureCategoryMinimum(primary, POOL);

    expect(countByCategory(result, "맛집")).toBe(4);
    expect(result.filter((p) => p.name.startsWith("목맛집"))).toHaveLength(0);
  });

  it("모자란 만큼만 채운다", () => {
    const primary = [pickable("실산책1", "산책")];

    const result = ensureCategoryMinimum(primary, POOL);

    expect(countByCategory(result, "산책")).toBe(3);
  });

  it("실데이터를 앞에 두고 폴백을 뒤에 붙인다", () => {
    const primary = [pickable("실산책1", "산책")];

    const result = ensureCategoryMinimum(primary, POOL);

    expect(result[0].name).toBe("실산책1");
  });

  it("이름이 겹치는 폴백은 넣지 않는다 — 같은 장소가 두 번 보이면 안 된다", () => {
    const primary = [pickable("목맛집1", "맛집")];

    const result = ensureCategoryMinimum(primary, POOL);

    expect(result.filter((place) => place.name === "목맛집1")).toHaveLength(1);
    expect(countByCategory(result, "맛집")).toBe(3);
  });

  it("폴백 풀이 모자라면 있는 만큼만 채운다", () => {
    const result = ensureCategoryMinimum([], [fallback("목산책1", "산책")]);

    expect(countByCategory(result, "산책")).toBe(1);
    expect(countByCategory(result, "맛집")).toBe(0);
  });

  it("최소 개수를 조절할 수 있다", () => {
    const result = ensureCategoryMinimum([], POOL, 1);

    expect(countByCategory(result, "문화")).toBe(1);
  });

  it("원본 배열을 건드리지 않는다", () => {
    const primary = [pickable("실산책1", "산책")];

    ensureCategoryMinimum(primary, POOL);

    expect(primary).toHaveLength(1);
  });
});
