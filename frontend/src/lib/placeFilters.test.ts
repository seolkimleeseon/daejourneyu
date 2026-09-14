import { describe, expect, it } from "vitest";
import { CATEGORIES, CATEGORY_ICON, DISTRICTS, filterPlaces, getConditionTags } from "@/lib/placeFilters";
import { makePlace } from "@/test/fixtures";

describe("사전", () => {
  it("서비스 범위인 대전 5개 자치구만 둔다", () => {
    expect(DISTRICTS).toEqual(["유성구", "중구", "동구", "대덕구", "서구"]);
  });

  it("카테고리마다 아이콘이 하나씩 있다", () => {
    CATEGORIES.forEach((category) => expect(CATEGORY_ICON[category]).toBeTruthy());
  });
});

describe("filterPlaces", () => {
  const places = [
    makePlace({ id: "1", district: "서구", category: "산책" }),
    makePlace({ id: "2", district: "서구", category: "맛집" }),
    makePlace({ id: "3", district: "중구", category: "산책" }),
  ];

  it("조건이 없으면 전부 남긴다", () => {
    expect(filterPlaces({ places })).toHaveLength(3);
  });

  it("자치구로 거른다", () => {
    expect(filterPlaces({ places, district: "서구" }).map((p) => p.id)).toEqual(["1", "2"]);
  });

  it("카테고리로 거른다", () => {
    expect(filterPlaces({ places, category: "산책" }).map((p) => p.id)).toEqual(["1", "3"]);
  });

  it("둘 다 주면 모두 만족하는 것만 남긴다", () => {
    expect(filterPlaces({ places, district: "서구", category: "산책" }).map((p) => p.id)).toEqual([
      "1",
    ]);
  });

  it("null은 '조건 없음'으로 본다 — '전체' 칩이 null을 넘긴다", () => {
    expect(filterPlaces({ places, district: null, category: null })).toHaveLength(3);
  });

  it("맞는 게 없으면 빈 배열", () => {
    expect(filterPlaces({ places, district: "대덕구" })).toEqual([]);
  });
});

describe("getConditionTags", () => {
  it("자유 텍스트에서 알려진 조건만 짧은 라벨로 뽑는다", () => {
    expect(getConditionTags("전 견종 · 목줄 필수 · 배변봉투 지참")).toEqual([
      "목줄 필수",
      "배변봉투 지참",
      "전 견종 가능",
    ]);
  });

  it("앞에 출처 인증 문구가 붙어도 뒷부분의 실속 정보를 잡는다", () => {
    const condition =
      "문화체육관광부 반려동물 동반가능 시설 현황(2023) 인증 · 전 견종 동반 가능 · 목줄";

    expect(getConditionTags(condition)).toContain("목줄 필수");
    expect(getConditionTags(condition)).toContain("전 견종 가능");
  });

  it("출처 표기뿐이면 칩을 띄우지 않는다 — 의미 없는 문구를 억지로 자르지 않는다", () => {
    expect(getConditionTags("대전관광공사 반려동물 동반시설 인증")).toEqual([]);
  });

  it("무게 제한은 숫자와 단위를 살려 라벨로 만든다", () => {
    expect(getConditionTags("10kg 미만 동반 가능")).toEqual(["10kg 미만"]);
    expect(getConditionTags("15 kg 이하")).toEqual(["15kg 이하"]);
  });

  it("실내 가능·불가를 구분한다", () => {
    expect(getConditionTags("실내 동반 불가")).toEqual(["실내 불가"]);
    expect(getConditionTags("실내 동반 가능")).toEqual(["실내 가능"]);
  });

  it("칩이 너무 많아지지 않게 3개로 자른다", () => {
    const tags = getConditionTags("목줄 · 배변봉투 · 전 견종 · 실외만 · 실내 가능");

    expect(tags).toHaveLength(3);
  });

  it("같은 라벨이 두 번 잡혀도 한 번만 넣는다", () => {
    expect(getConditionTags("소형견만 가능 · 소형견 전용 공간")).toEqual(["소형견만"]);
  });

  it("smallDogOnly는 텍스트로 못 잡을 때 보강한다 — 구조화된 필드가 더 믿을 만하다", () => {
    // "10kg 미만"처럼 '소형견'이라는 말이 없어도 서버는 smallDogOnly=true로 준다.
    expect(getConditionTags("10kg 미만 동반 가능", true)).toEqual(["소형견만", "10kg 미만"]);
  });

  it("이미 소형견만이 잡혔으면 중복으로 넣지 않는다", () => {
    expect(getConditionTags("소형견만 가능", true)).toEqual(["소형견만"]);
  });

  it("smallDogOnly 보강은 맨 앞에 온다 — 가장 강한 제약이다", () => {
    expect(getConditionTags("목줄 필수", true)[0]).toBe("소형견만");
  });
});
