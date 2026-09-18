import { describe, expect, it } from "vitest";
import { pickChatCandidates } from "./chatCandidates";
import { makePlace } from "@/test/fixtures";

describe("pickChatCandidates", () => {
  it("동반 불가 장소는 애초에 후보에서 뺀다", () => {
    const places = [
      makePlace({ id: "a", petFriendly: true }),
      makePlace({ id: "b", petFriendly: false }),
    ];

    const result = pickChatCandidates(places, "아무 데나 추천해줘");

    expect(result.map((p) => p.id)).toEqual(["a"]);
  });

  it("질문에 구 이름이 있으면 그 구로 좁힌다", () => {
    const places = [
      makePlace({ id: "a", district: "유성구" }),
      makePlace({ id: "b", district: "서구" }),
      makePlace({ id: "c", district: "유성구" }),
      makePlace({ id: "d", district: "유성구" }),
      makePlace({ id: "e", district: "유성구" }),
      makePlace({ id: "f", district: "유성구" }),
    ];

    const result = pickChatCandidates(places, "유성구에서 갈만한 곳 있어?");

    expect(result.every((p) => p.district === "유성구")).toBe(true);
  });

  it("질문에 카테고리 키워드가 있으면 그 카테고리로 좁힌다", () => {
    const places = [
      makePlace({ id: "a", category: "맛집" }),
      makePlace({ id: "b", category: "산책" }),
      makePlace({ id: "c", category: "맛집" }),
      makePlace({ id: "d", category: "맛집" }),
      makePlace({ id: "e", category: "맛집" }),
      makePlace({ id: "f", category: "맛집" }),
    ];

    const result = pickChatCandidates(places, "맛집 추천해줘");

    expect(result.every((p) => p.category === "맛집")).toBe(true);
  });

  it("필터 결과가 너무 좁으면 필터 없는 전체 후보로 되돌아간다", () => {
    const places = [
      makePlace({ id: "a", district: "서구" }),
      makePlace({ id: "b", district: "서구" }),
    ];

    const result = pickChatCandidates(places, "유성구 맛집 알려줘");

    expect(result).toHaveLength(2);
  });

  it("cap을 넘는 후보는 잘라낸다", () => {
    const places = Array.from({ length: 100 }, (_, i) => makePlace({ id: `p${i}` }));

    const result = pickChatCandidates(places, "아무 데나 추천해줘", 80);

    expect(result).toHaveLength(80);
  });

  it("한 곳만 맞으면 그 장소를 보존하면서 코스에 필요한 두 번째 후보를 보충한다", () => {
    const places = [makePlace({ id: "y", district: "유성구" }), makePlace({ id: "s", district: "서구" })];
    expect(pickChatCandidates(places, "유성구 추천").map((place) => place.id)).toEqual(["y", "s"]);
  });

  it("후보 제한 안에서도 지역과 카테고리를 섞는다", () => {
    const places = [
      ...Array.from({ length: 8 }, (_, i) => makePlace({ id: `walk-${i}`, district: "서구", category: "산책" })),
      ...Array.from({ length: 8 }, (_, i) => makePlace({ id: `food-${i}`, district: "유성구", category: "맛집" })),
    ];
    const result = pickChatCandidates(places, "추천해줘", 4);
    expect(new Set(result.map((place) => place.category)).size).toBe(2);
    expect(new Set(result.map((place) => place.district)).size).toBe(2);
  });
});
