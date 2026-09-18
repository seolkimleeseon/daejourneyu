import type { Place } from "@/types";

type QualityPlace = Place & {
  imageUrl?: string | null;
  sourceTier?: number;
  source?: string;
};

/** 공개 데이터에 있는 근거만 사용한다. 사진은 탐색 편의 신호이며 맛 평점으로 취급하지 않는다. */
export function placeQualityScore(place: QualityPlace): number {
  const tier = place.id.startsWith("kakao-") ? 3 : place.sourceTier ?? 2;
  let score = place.petFriendly ? 0 : -100;
  score += (3 - tier) * 30;
  if (place.category === "맛집" && (place.source === "foodsafety" || place.id.startsWith("foodsafety-"))) score += 12;
  if (place.imageUrl) score += 6;
  if (place.condition && !/상세 조건은 현장에서 확인|동반 가능 여부는 방문 전 확인/.test(place.condition)) score += 3;
  if (/^(?:\(?주\)?\s*|주식회사\s*)/.test(place.name) || /(?:\s|^)[2-9]$/.test(place.name)) score -= 8;
  return score;
}

export function sortPlacesByQuality<T extends QualityPlace>(places: T[]): T[] {
  return [...places].sort((a, b) => placeQualityScore(b) - placeQualityScore(a));
}
