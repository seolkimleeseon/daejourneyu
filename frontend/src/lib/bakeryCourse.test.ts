import { describe, expect, it } from "vitest";
import { makePlace } from "@/test/fixtures";
import { recommendBakeryRoute } from "./bakeryCourse";
import { routeDistanceKm } from "./nearestNeighborRoute";

describe("recommendBakeryRoute", () => {
  const bakeries = [
    makePlace({ id: "bakery-a", name: "빵집 A", category: "맛집", petFriendly: false, lat: 36.35, lng: 127.38 }),
    makePlace({ id: "bakery-b", name: "빵집 B", category: "맛집", petFriendly: false, lat: 36.351, lng: 127.381 }),
    makePlace({ id: "bakery-far", name: "먼 빵집", category: "맛집", petFriendly: false, lat: 36.45, lng: 127.5 }),
  ];

  it("가까운 빵집 두 곳과 동반 가능한 산책 장소를 짧은 동선으로 묶는다", () => {
    const places = [
      makePlace({ id: "walk", category: "산책", petFriendly: true, lat: 36.352, lng: 127.382 }),
      makePlace({ id: "meal", name: "만두집", category: "맛집", petFriendly: true, lat: 36.353, lng: 127.383 }),
    ];
    const route = recommendBakeryRoute(bakeries, places);
    expect(route.filter((place) => place.id.startsWith("bakery-"))).toHaveLength(2);
    expect(route.map((place) => place.id)).toContain("walk");
    expect(route.map((place) => place.id)).not.toContain("meal");
    expect(route.map((place) => place.id)).not.toContain("bakery-far");
    expect(routeDistanceKm(route)).toBeLessThan(12);
  });

  it("근처 산책 장소가 없으면 억지로 코스를 만들지 않는다", () => {
    expect(recommendBakeryRoute(bakeries, [])).toEqual([]);
  });

  it("같은 업소의 중복 행이나 숫자만 붙은 지점을 함께 추천하지 않는다", () => {
    const duplicates = [
      makePlace({ id: "bakery-1", name: "정인구팥빵", category: "맛집", petFriendly: false, lat: 36.35, lng: 127.38 }),
      makePlace({ id: "bakery-2", name: "정인구팥빵2", category: "맛집", petFriendly: false, lat: 36.3501, lng: 127.3801 }),
      makePlace({ id: "bakery-3", name: "동네빵집", category: "맛집", petFriendly: false, lat: 36.351, lng: 127.381 }),
    ];
    const walk = makePlace({ id: "walk", category: "산책", petFriendly: true, lat: 36.352, lng: 127.382 });
    const route = recommendBakeryRoute(duplicates, [walk]);
    expect(route.map((place) => place.id)).toContain("bakery-3");
    expect(route.filter((place) => place.name.startsWith("정인구팥빵"))).toHaveLength(1);
  });

  it("성심당과 몽심의 지점이 각각 한 코스에 두 번 들어가지 않는다", () => {
    const candidates = [
      makePlace({ id: "s1", name: "성심당본점", lat: 36.35, lng: 127.38 }),
      makePlace({ id: "s2", name: "성심당 대전역점2", lat: 36.3501, lng: 127.3801 }),
      makePlace({ id: "m1", name: "몽심", lat: 36.351, lng: 127.381 }),
      makePlace({ id: "m2", name: "주식회사몽심대흥", lat: 36.3511, lng: 127.3811 }),
    ];
    const walk = makePlace({ id: "walk", category: "산책", petFriendly: true, lat: 36.352, lng: 127.382 });
    const route = recommendBakeryRoute(candidates, [walk]);
    expect(route.filter((place) => place.name.includes("성심당"))).toHaveLength(1);
    expect(route.filter((place) => place.name.includes("몽심"))).toHaveLength(1);
  });

  it("이전에 받아 캐시된 후보에도 프랜차이즈가 섞이지 않는다", () => {
    const candidates = [
      ...bakeries,
      makePlace({ id: "bakery-chain", name: "호밀호두 대전월평점2", category: "맛집", petFriendly: false, lat: 36.3501, lng: 127.3801 }),
    ];
    const walk = makePlace({ id: "walk", category: "산책", petFriendly: true, lat: 36.352, lng: 127.382 });
    expect(recommendBakeryRoute(candidates, [walk]).map((place) => place.id)).not.toContain("bakery-chain");
  });

  it("이동 제한 안에서는 시민 추천 빵집을 우선하고, 재생성 시 다른 빵집 조합을 준다", () => {
    const candidates = [
      makePlace({ id: "local-a", name: "동네빵집 A", lat: 36.35, lng: 127.38 }),
      makePlace({ id: "local-b", name: "동네빵집 B", lat: 36.3502, lng: 127.3802 }),
      makePlace({ id: "famous", name: "성심당본점", lat: 36.352, lng: 127.382 }),
    ];
    const walk = makePlace({ id: "walk", category: "산책", petFriendly: true, lat: 36.351, lng: 127.381 });
    const first = recommendBakeryRoute(candidates, [walk], 0);
    const second = recommendBakeryRoute(candidates, [walk], 1);
    expect(first.map((place) => place.id)).toContain("famous");
    expect(first.filter((place) => place.id !== "walk").map((place) => place.id).sort())
      .not.toEqual(second.filter((place) => place.id !== "walk").map((place) => place.id).sort());
  });
});
