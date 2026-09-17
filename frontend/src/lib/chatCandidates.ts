import type { DaejeonDistrict, Place, PlaceCategory } from "@/types";
import type { PickablePlace } from "./petTourMapper";

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
  const petFriendly = places.filter((place) => place.petFriendly);

  const matchedDistricts = DISTRICTS.filter((district) => prompt.includes(district));
  const matchedCategories = (Object.keys(CATEGORY_KEYWORDS) as PlaceCategory[]).filter((category) =>
    CATEGORY_KEYWORDS[category].some((keyword) => prompt.includes(keyword))
  );

  let filtered = petFriendly;
  if (matchedDistricts.length > 0) {
    filtered = filtered.filter((place) => matchedDistricts.includes(place.district));
  }
  if (matchedCategories.length > 0) {
    filtered = filtered.filter((place) => matchedCategories.includes(place.category));
  }

  const pool = filtered.length >= 5 ? filtered : petFriendly;
  const sorted = [...pool].sort((a, b) => getSourceTier(a) - getSourceTier(b));
  return sorted.slice(0, cap);
}
