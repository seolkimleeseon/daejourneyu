import { describe, expect, it } from "vitest";
import {
  CATEGORY_EMOJI,
  CATEGORY_TONE,
  NEEDS_CHECK_LABEL,
  SOURCE_BAND_BG,
  SOURCE_EMOJI,
  SOURCE_LABEL,
  SOURCE_TONE,
  conditionSourceLabel,
  isUnverifiedCondition,
  nightsLabel,
  placeToStop,
  resolveCourseEmoji,
  resolvePlaceImageUrl,
  resolvePlaceUrl,
} from "@/lib/courseFormat";
import { makePlace } from "@/test/fixtures";

describe("nightsLabel", () => {
  it("0박은 당일치기로 쓴다 — 당일치기도 nights:0으로 통일한다", () => {
    expect(nightsLabel(0)).toBe("당일치기");
  });

  it.each([
    [1, "1박 2일"],
    [2, "2박 3일"],
    [5, "5박 6일"],
  ])("%s박은 '%s'", (nights, expected) => {
    expect(nightsLabel(nights)).toBe(expected);
  });
});

describe("사전", () => {
  it("카테고리 4종마다 이모지와 색이 하나씩 있다", () => {
    (["산책", "놀이터", "맛집", "문화"] as const).forEach((category) => {
      expect(CATEGORY_EMOJI[category]).toBeTruthy();
      expect(CATEGORY_TONE[category].bg).toBeTruthy();
      expect(CATEGORY_TONE[category].text).toBeTruthy();
    });
  });

  it("생성 출처 3종마다 라벨·톤·이모지·밴드색이 있다", () => {
    (["ai", "manual", "saved"] as const).forEach((source) => {
      expect(SOURCE_LABEL[source]).toBeTruthy();
      expect(SOURCE_TONE[source]).toBeTruthy();
      expect(SOURCE_EMOJI[source]).toBeTruthy();
      expect(SOURCE_BAND_BG[source]).toBeTruthy();
    });
  });
});

describe("resolveCourseEmoji", () => {
  it("사용자가 고른 이모지가 있으면 그걸 쓴다", () => {
    expect(resolveCourseEmoji("🐶", "ai")).toBe("🐶");
  });

  it.each([null, undefined, ""])("%s이면 출처별 기본 이모지로 채운다", (emoji) => {
    expect(resolveCourseEmoji(emoji, "manual")).toBe(SOURCE_EMOJI.manual);
  });
});

describe("옵셔널 필드 꺼내기", () => {
  it("imageUrl이 없는 타입에서도 null로 안전하게 꺼낸다", () => {
    expect(resolvePlaceImageUrl({ id: "p1" })).toBeNull();
    expect(resolvePlaceImageUrl({ id: "p1", imageUrl: null })).toBeNull();
    expect(resolvePlaceImageUrl({ id: "p1", imageUrl: "https://img/a.jpg" })).toBe(
      "https://img/a.jpg"
    );
  });

  it("카카오 원본 링크도 같은 방식으로 꺼낸다", () => {
    expect(resolvePlaceUrl({ id: "p1" })).toBeNull();
    expect(resolvePlaceUrl({ id: "p1", placeUrl: "http://place.map.kakao.com/1" })).toBe(
      "http://place.map.kakao.com/1"
    );
  });
});

describe("condition 해석", () => {
  it("'확인해주세요'가 들어간 문구는 비확정으로 본다", () => {
    expect(
      isUnverifiedCondition("카카오맵 검색 결과 · 반려동물 동반 가능 여부는 방문 전 확인해주세요")
    ).toBe(true);
    expect(
      isUnverifiedCondition("반려동물 동반여행지 인증 · 상세 조건은 현장에서 확인해주세요")
    ).toBe(true);
  });

  it("확정된 조건은 비확정이 아니다 — 배지와 같이 보여줘도 모순이 없다", () => {
    expect(isUnverifiedCondition("식약처 반려동물 동반출입 음식점 정식 등록")).toBe(false);
    expect(isUnverifiedCondition("전 견종 · 목줄 필수")).toBe(false);
  });

  it("안내 태그 문구는 한 가지로 통일한다", () => {
    expect(NEEDS_CHECK_LABEL).toContain("확인 필요");
  });

  it("출처는 ' · ' 앞부분만 뽑는다", () => {
    expect(
      conditionSourceLabel("카카오맵 검색 결과 · 반려동물 동반 가능 여부는 방문 전 확인해주세요")
    ).toBe("카카오맵 검색 결과");
  });

  it("' · '가 없으면 원문을 그대로 쓴다", () => {
    expect(conditionSourceLabel("전 견종 동반 가능")).toBe("전 견종 동반 가능");
  });
});

describe("placeToStop", () => {
  it("코스에 담을 스냅샷으로 옮긴다 — id는 placeId로 이름이 바뀐다", () => {
    const place = makePlace({
      id: "place-1",
      name: "한밭수목원",
      category: "산책",
      district: "서구",
      condition: "전 견종 · 목줄 필수",
      petFriendly: true,
    });

    expect(placeToStop(place)).toEqual({
      placeId: "place-1",
      name: "한밭수목원",
      category: "산책",
      district: "서구",
      condition: "전 견종 · 목줄 필수",
      petFriendly: true,
      imageUrl: null,
      placeUrl: null,
    });
  });

  it("사진·원본 링크가 있으면 함께 실어 나른다", () => {
    const place = {
      ...makePlace({ id: "place-2" }),
      imageUrl: "https://img/a.jpg",
      placeUrl: "http://place.map.kakao.com/2",
    };

    expect(placeToStop(place)).toMatchObject({
      imageUrl: "https://img/a.jpg",
      placeUrl: "http://place.map.kakao.com/2",
    });
  });

  it("동반 불가인 장소도 값을 그대로 옮긴다 — 담는 쪽에서 판단할 일이다", () => {
    expect(placeToStop(makePlace({ petFriendly: false })).petFriendly).toBe(false);
  });
});
