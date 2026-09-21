import type { DaejeonDistrict, Place, PlaceCategory } from "@/types";
import type { PickablePlace } from "./petTourMapper";
import { sortPlacesByQuality } from "./placeQuality";

type CandidateSource = Place | PickablePlace;

const DISTRICTS: DaejeonDistrict[] = ["유성구", "중구", "동구", "대덕구", "서구"];

const CATEGORY_KEYWORDS: Record<PlaceCategory, string[]> = {
  산책: ["산책", "공원", "산책로", "숲", "자연"],
  놀이터: ["놀이터"],
  맛집: ["맛집", "카페", "식당", "밥", "음식"],
  문화: ["문화", "전시", "박물관", "미술관", "공연", "체험"],
};

/** AI 챗봇 요청 스키마의 enum 크기·토큰 비용을 감당할 수 있는 후보 상한. */
const MAX_CANDIDATES = 80;

/** sourceTier가 없는 소스(mockPlaces 폴백)는 미인증(2)과 동급으로 취급한다. */
function getSourceTier(place: CandidateSource): number {
  return "sourceTier" in place && typeof place.sourceTier === "number" ? place.sourceTier : 2;
}

/**
 * 실제 장소가 1,000건을 넘을 수 있어 전부 AI 요청에 실어 보내면 스키마(enum) 크기와 토큰 비용을
 * 감당할 수 없다. 사용자 질문에서 구·카테고리를 짐작해 후보를 MAX_CANDIDATES개 이하로 줄인다.
 * 짐작 결과가 너무 좁으면(오탈자·특이한 질문) 필터 없는 전체 후보로 되돌아간다.
 */
export function pickChatCandidates(places: CandidateSource[], prompt: string, cap = MAX_CANDIDATES): CandidateSource[] {
  const bakeryIntent = /빵지순례|빵집|베이커리|제과점/.test(prompt);
  const petFriendly = places.filter((place) => place.petFriendly || (bakeryIntent && place.id.startsWith("bakery-")));

  const matchedDistricts = DISTRICTS.filter((district) => prompt.includes(district));
  const matchedCategories = (Object.keys(CATEGORY_KEYWORDS) as PlaceCategory[]).filter((category) =>
    CATEGORY_KEYWORDS[category].some((keyword) => prompt.includes(keyword))
  );
  const asksForCourse = /코스|여행|일정|동선|루트/.test(prompt);

  let filtered = petFriendly;
  if (matchedDistricts.length > 0) {
    filtered = filtered.filter((place) => matchedDistricts.includes(place.district));
  }
  if (matchedCategories.length > 0 && !asksForCourse) {
    filtered = filtered.filter((place) => matchedCategories.includes(place.category));
  }

  // 일치하는 장소가 적더라도 사용자가 지정한 구·종류를 우선한다.
  // 두 조건을 함께 만족하는 곳이 없으면 구, 종류, 전체 순서로 범위를 넓힌다.
  const districtPool = matchedDistricts.length > 0
    ? petFriendly.filter((place) => matchedDistricts.includes(place.district)) : [];
  const categoryPool = matchedCategories.length > 0
    ? petFriendly.filter((place) => matchedCategories.includes(place.category)) : [];
  const preferred = filtered.length > 0 ? filtered : districtPool.length > 0 ? districtPool : categoryPool.length > 0 ? categoryPool : petFriendly;
  const pool = preferred.length >= 2 ? preferred : [
    ...preferred,
    ...petFriendly.filter((place) => !preferred.some((match) => match.id === place.id)),
  ];
  const preferredIds = new Set(preferred.map((place) => place.id));

  // API 배열의 앞부분만 잘라내면 한 지역·종류가 후보를 독식한다. 품질 등급별로
  // 지역과 종류를 번갈아 뽑아 제한된 후보 안에도 여러 선택지를 남긴다.
  const buckets = new Map<string, CandidateSource[]>();
  for (const place of sortPlacesByQuality(pool)) {
    const key = `${preferredIds.has(place.id) ? 0 : 1}:${getSourceTier(place)}:${place.district}:${place.category}`;
    const bucket = buckets.get(key) ?? [];
    bucket.push(place);
    buckets.set(key, bucket);
  }
  const result: CandidateSource[] = [];
  const keys = [...buckets.keys()].sort();
  while (result.length < cap) {
    let added = false;
    for (const key of keys) {
      const place = buckets.get(key)?.shift();
      if (place) {
        result.push(place);
        added = true;
      }
      if (result.length >= cap) break;
    }
    if (!added) break;
  }
  return result;
}

export interface TripConditions {
  nights: number;
  transport: "자차" | "대중교통";
}

/** AI 코스 추천 API가 받는 박 수 상한(backend/src/routes/ai.ts). */
const MAX_NIGHTS = 4;

/**
 * 챗봇 질문에서 여행 기간·이동수단을 짐작한다. 예전엔 항상 당일치기·자차로 고정해서
 * "1박 2일 코스 추천해줘"도 당일 코스가 나왔다. 말하지 않았으면 기본값(당일치기·자차)을 쓴다.
 * "1박 2일"·"2박"처럼 박이 나오면 그 숫자를, "3일 코스"처럼 일만 나오면 일 수 - 1을 박 수로 본다.
 */
export function parseTripConditions(prompt: string): TripConditions {
  const nightsMatch = prompt.match(/(\d)\s*박/);
  const daysMatch = prompt.match(/(\d)\s*일(?!정)/);
  let nights = 0;
  if (nightsMatch) nights = Number(nightsMatch[1]);
  else if (/당일/.test(prompt)) nights = 0;
  else if (daysMatch && Number(daysMatch[1]) >= 2) nights = Number(daysMatch[1]) - 1;

  const transport = /대중교통|버스|지하철|뚜벅이|기차/.test(prompt) ? "대중교통" : "자차";
  return { nights: Math.min(nights, MAX_NIGHTS), transport };
}
