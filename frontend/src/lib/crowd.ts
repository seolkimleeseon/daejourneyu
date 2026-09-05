import type { Place, PlaceCategory } from "@/types";

export type CrowdLevel = "여유" | "보통" | "혼잡";

/** 혼잡도 티커가 그리는 데 필요한 최소 필드 — Place 전체 대신 이 모양만 맞추면 된다. 코스에
 * 담긴 CourseStop(placeId 필드명이 다름)을 보여줄 때도 이 타입으로 변환해서 넘긴다. */
export interface CrowdPlace {
  id: string;
  name: string;
  category: PlaceCategory;
}

export function toCrowdPlace(place: Place): CrowdPlace {
  return { id: place.id, name: place.name, category: place.category };
}

const LEVELS: CrowdLevel[] = ["여유", "보통", "혼잡"];

/** 실시간 혼잡도 API가 없는 동안 장소명 기반으로 안정적인 혼잡도를 만들어낸다. */
export function computeCrowdLevel(placeName: string): CrowdLevel {
  let hash = 0;
  for (let i = 0; i < placeName.length; i++) {
    hash = (hash * 31 + placeName.charCodeAt(i)) % 9973;
  }
  return LEVELS[hash % LEVELS.length];
}
