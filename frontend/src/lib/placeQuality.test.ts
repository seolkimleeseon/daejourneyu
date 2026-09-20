import { describe, expect, it } from "vitest";
import { makePlace } from "@/test/fixtures";
import { sortPlacesByQuality } from "./placeQuality";

describe("장소 기본 정렬", () => {
  it("동반 가능한 식약처 등록 맛집과 상세 정보가 있는 장소를 앞세운다", () => {
    const raw = { ...makePlace({ id: "raw", name: "(주)원시데이터", category: "맛집" }), sourceTier: 2 };
    const verified = { ...makePlace({ id: "foodsafety-1", name: "견우재", category: "맛집" }), sourceTier: 1, source: "foodsafety", imageUrl: "https://img/test.jpg" };
    const unavailable = { ...makePlace({ id: "blocked", petFriendly: false }), sourceTier: 1 };
    expect(sortPlacesByQuality([raw, unavailable, verified]).map((place) => place.id))
      .toEqual(["foodsafety-1", "raw", "blocked"]);
  });

  it("사진 유무를 맛 평가보다 약한 탐색 신호로 사용한다", () => {
    const plain = { ...makePlace({ id: "plain" }), sourceTier: 1, imageUrl: null };
    const photo = { ...makePlace({ id: "photo" }), sourceTier: 1, imageUrl: "https://img/test.jpg" };
    expect(sortPlacesByQuality([plain, photo]).map((place) => place.id)).toEqual(["photo", "plain"]);
  });
});
