import type { DaejeonDistrict, Place, PlaceCategory } from "@/types";

export const DISTRICTS: DaejeonDistrict[] = ["유성구", "중구", "동구", "대덕구", "서구"];

export const CATEGORIES: PlaceCategory[] = ["산책", "놀이터", "맛집", "문화"];

export const CATEGORY_ICON: Record<PlaceCategory, string> = {
  산책: "🌳",
  놀이터: "🐾",
  맛집: "🍔",
  문화: "🏛️",
};

interface FilterPlacesInput {
  places: Place[];
  district?: DaejeonDistrict | null;
  category?: PlaceCategory | null;
}

/** 목데이터 폴백 전용 클라이언트 필터. 실 API 경로는 서버 쿼리스트링(`?district=&category=`)으로 거른다. */
export function filterPlaces({ places, district, category }: FilterPlacesInput): Place[] {
  return places.filter((place) => {
    if (district && place.district !== district) return false;
    if (category && place.category !== category) return false;
    return true;
  });
}

/** 카드에 칩으로 노출할 최대 개수 — 라벨을 짧게 고정했지만 그래도 너무 많으면 카드가 늘어진다. */
const MAX_CONDITION_TAGS = 3;

type ConditionTagRule = {
  test: RegExp;
  label: string | ((match: RegExpMatchArray) => string);
};

/**
 * `Place.condition`은 소스마다 형식이 제각각인 자유 텍스트다 — "전 견종 · 목줄 필수" 같은 목데이터부터
 * "문화체육관광부 반려동물 동반가능 시설 현황(2023) 인증 · 전 견종 동반 가능 · 목줄" 처럼 앞에
 * 출처 인증 문구가 붙는 공공데이터 문구까지 섞여 있다("·"로 앞부분만 잘라 보여주면 정작 필요한
 * 뒷부분의 목줄·배변봉투 같은 실속 정보가 잘려나간다 — backend/src/lib/placesAggregator.ts의
 * loadPetAcpFacilities가 [출처 인증] · [견종] · [petLimit] 순서로 이어붙이는 걸 확인함).
 * 그래서 위치가 아니라 알려진 키워드로 매칭해 짧은 라벨로 바꾼다. 매칭되는 키워드가 없으면(대부분
 * 출처 표기뿐인 문구) 칩을 아예 띄우지 않는다 — 의미 없는 문구를 억지로 잘라 보여주지 않기 위함.
 */
const CONDITION_TAG_RULES: ConditionTagRule[] = [
  { test: /목줄/, label: "목줄 필수" },
  { test: /배변봉투/, label: "배변봉투 지참" },
  { test: /(\d+)\s*kg\s*(미만|이하)/, label: (m) => `${m[1]}kg ${m[2]}` },
  { test: /소형견만|소형견\s*전용/, label: "소형견만" },
  { test: /전\s*견종/, label: "전 견종 가능" },
  { test: /야외만|실외만/, label: "실외만 가능" },
  { test: /실내.*(불가|안\s*됨)/, label: "실내 불가" },
  { test: /실내.*가능/, label: "실내 가능" },
];

/**
 * `smallDogOnly`는 petLimit 원문이 "소형견만"이라고 딱 떨어지지 않는 경우도(예: "10kg 미만")
 * true로 잡히는 구조화된 필드라 텍스트 매칭보다 신뢰도가 높다 — 매칭이 안 됐을 때만 보강한다.
 */
export function getConditionTags(condition: string, smallDogOnly?: boolean): string[] {
  const tags: string[] = [];
  for (const rule of CONDITION_TAG_RULES) {
    const match = condition.match(rule.test);
    if (!match) continue;
    const label = typeof rule.label === "function" ? rule.label(match) : rule.label;
    if (!tags.includes(label)) tags.push(label);
  }
  if (smallDogOnly && !tags.includes("소형견만")) tags.unshift("소형견만");
  return tags.slice(0, MAX_CONDITION_TAGS);
}
