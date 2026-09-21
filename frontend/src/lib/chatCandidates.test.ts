import { describe, expect, it } from "vitest";
import { parseTripConditions, pickChatCandidates } from "./chatCandidates";
import { makePlace } from "@/test/fixtures";

describe("pickChatCandidates", () => {
  it("빵지순례 요청에서만 동반 여부 미확인 빵집을 후보에 넣는다", () => {
    const places = [
      makePlace({ id: "walk", category: "산책" }),
      makePlace({ id: "bakery-1", name: "동네빵집", category: "맛집", petFriendly: false }),
    ];
    expect(pickChatCandidates(places, "빵지순례 코스").map((place) => place.id)).toContain("bakery-1");
    expect(pickChatCandidates(places, "산책 코스").map((place) => place.id)).not.toContain("bakery-1");
  });
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

  it("산책 코스 요청에는 식사와 다른 활동 후보도 남긴다", () => {
    const places = [
      makePlace({ id: "walk", category: "산책" }),
      makePlace({ id: "food", category: "맛집" }),
      makePlace({ id: "play", category: "놀이터" }),
      makePlace({ id: "culture", category: "문화" }),
    ];
    const categories = pickChatCandidates(places, "산책 코스 추천해줘").map((place) => place.category);
    expect(new Set(categories)).toEqual(new Set(["산책", "맛집", "놀이터", "문화"]));
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

  it("맛집 후보가 많으면 등록 근거와 사진이 있는 장소를 먼저 전달한다", () => {
    const places = [
      { ...makePlace({ id: "raw", category: "맛집" }), sourceTier: 2 },
      { ...makePlace({ id: "foodsafety-1", category: "맛집" }), sourceTier: 1, source: "foodsafety", imageUrl: "https://img/test.jpg" },
    ];
    expect(pickChatCandidates(places, "맛집 추천해줘", 1).map((place) => place.id)).toEqual(["foodsafety-1"]);
  });
});

describe("parseTripConditions", () => {
  it("말하지 않았으면 당일치기·자차로 본다", () => {
    expect(parseTripConditions("유성구에서 산책하기 좋은 곳 알려줘")).toEqual({ nights: 0, transport: "자차" });
  });

  it("'N박'이 나오면 그 숫자를 박 수로 쓴다", () => {
    expect(parseTripConditions("대덕구에서 1박 2일 코스 추천해줘").nights).toBe(1);
    expect(parseTripConditions("2박3일 코스").nights).toBe(2);
    expect(parseTripConditions("1 박 여행").nights).toBe(1);
  });

  it("일만 나오면 일 수 - 1을 박 수로 본다", () => {
    expect(parseTripConditions("3일 코스 짜줘").nights).toBe(2);
  });

  it("당일치기는 0박이고, '일정' 같은 단어의 '일'은 기간으로 읽지 않는다", () => {
    expect(parseTripConditions("당일치기 코스 추천해줘").nights).toBe(0);
    expect(parseTripConditions("5일정 코스").nights).toBe(0);
  });

  it("API 상한(4박)을 넘기지 않는다", () => {
    expect(parseTripConditions("9박 10일 여행").nights).toBe(4);
  });

  it("대중교통 언급이 있으면 대중교통으로 본다", () => {
    expect(parseTripConditions("지하철로 갈 수 있는 코스").transport).toBe("대중교통");
    expect(parseTripConditions("뚜벅이 코스 추천").transport).toBe("대중교통");
    expect(parseTripConditions("차 가지고 갈 수 있는 곳").transport).toBe("자차");
  });
});
