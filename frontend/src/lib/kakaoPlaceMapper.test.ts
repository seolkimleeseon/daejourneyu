import { describe, expect, it } from "vitest";
import {
  inferCategoryFromKakao,
  mapKakaoPlaceToPlace,
  type ApiKakaoPlace,
} from "@/lib/kakaoPlaceMapper";

function kakaoPlace(overrides: Partial<ApiKakaoPlace> = {}): ApiKakaoPlace {
  return {
    id: "kakao-1",
    name: "댕댕카페",
    categoryName: "음식점 > 카페 > 테마카페 > 애견카페",
    address: "대전 서구 둔산대로 169",
    lat: 36.36,
    lng: 127.38,
    phone: "042-000-0000",
    placeUrl: "http://place.map.kakao.com/1",
    imageUrl: null,
    ...overrides,
  };
}

describe("inferCategoryFromKakao", () => {
  it.each([
    ["반려견놀이터", "반려동물 > 반려견놀이터", "놀이터"],
    ["애견카페", "음식점 > 카페 > 테마카페 > 애견카페", "맛집"],
    ["음식점", "음식점 > 한식 > 육류,고기", "맛집"],
    ["공원", "여행 > 관광,명소 > 공원", "산책"],
    ["관광명소", "여행 > 관광,명소", "산책"],
    ["문화시설", "문화,예술 > 문화시설", "문화"],
    ["공연장", "문화,예술 > 공연장,연극극장", "문화"],
  ])("%s는 %s로 본다", (_label, categoryName, expected) => {
    expect(inferCategoryFromKakao(categoryName)).toBe(expected);
  });

  it("놀이터 판정이 맛집보다 앞선다 — '반려견놀이터 카페'가 맛집으로 새면 안 된다", () => {
    expect(inferCategoryFromKakao("음식점 > 카페 > 반려견놀이터")).toBe("놀이터");
  });

  it("알 수 없으면 null — 호출부가 폴백을 정한다", () => {
    expect(inferCategoryFromKakao("서비스,산업 > 자동차 > 주차장")).toBeNull();
    expect(inferCategoryFromKakao("")).toBeNull();
  });
});

describe("mapKakaoPlaceToPlace", () => {
  it("카카오 응답을 코스에 담을 수 있는 모양으로 옮긴다", () => {
    expect(mapKakaoPlaceToPlace(kakaoPlace(), "산책")).toEqual({
      id: "kakao-1",
      name: "댕댕카페",
      category: "맛집",
      district: "서구",
      condition: "카카오맵 검색 결과 · 반려동물 동반 가능 여부는 방문 전 확인해주세요",
      petFriendly: true,
      lat: 36.36,
      lng: 127.38,
      imageUrl: null,
      placeUrl: "http://place.map.kakao.com/1",
    });
  });

  it("동반 가능 여부는 카카오가 안 주므로 '확인 필요'로 안내한다", () => {
    const place = mapKakaoPlaceToPlace(kakaoPlace(), "산책");

    // 🚫 배지를 잘못 띄우는 것보다 문구로 알리는 쪽이 안전하다.
    expect(place?.petFriendly).toBe(true);
    expect(place?.condition).toContain("확인해주세요");
  });

  it("카테고리를 못 알아내면 넘겨받은 폴백을 쓴다", () => {
    const place = mapKakaoPlaceToPlace(
      kakaoPlace({ categoryName: "서비스,산업 > 자동차 > 주차장" }),
      "문화"
    );

    expect(place?.category).toBe("문화");
  });

  it("대전 5개 자치구 밖은 버린다", () => {
    expect(mapKakaoPlaceToPlace(kakaoPlace({ address: "세종 한누리대로 2130" }), "산책")).toBeNull();
  });

  it("좌표가 이상하면 버린다 — 지도에 못 찍는다", () => {
    expect(mapKakaoPlaceToPlace(kakaoPlace({ lat: Number.NaN }), "산책")).toBeNull();
    expect(
      mapKakaoPlaceToPlace(kakaoPlace({ lng: Number.POSITIVE_INFINITY }), "산책")
    ).toBeNull();
  });

  it("부동산은 장소로 보지 않는다 — 이름이 겹쳐 딸려 나온다", () => {
    expect(
      mapKakaoPlaceToPlace(
        kakaoPlace({ name: "한밭수목원아파트", categoryName: "부동산 > 주거시설 > 아파트" }),
        "산책"
      )
    ).toBeNull();
  });

  it("주차장은 일부러 남긴다 — 자차로 오면 목적지 근처 주차장을 찾는다", () => {
    const place = mapKakaoPlaceToPlace(
      kakaoPlace({ name: "한밭수목원 주차장", categoryName: "교통,수송 > 주차장" }),
      "산책"
    );

    expect(place).not.toBeNull();
  });
});
