import type { Place, PlaceCategory } from "@/types";

/** 홈 상태 카드 티커가 그리는 데 필요한 최소 필드 — Place 전체 대신 이 모양만 맞추면 된다. 코스에
 * 담긴 CourseStop(placeId 필드명이 다르고 좌표가 없음)을 보여줄 때도 이 타입으로 변환해서 넘긴다. */
export interface TickerPlace {
  id: string;
  name: string;
  category: PlaceCategory;
  /** 좌표가 있어야 그 장소 기준 날씨를 불러올 수 있다 — 없으면(CourseStop 유래) 날씨 배지를 비워둔다. */
  lat?: number;
  lng?: number;
}

export function toTickerPlace(place: Place): TickerPlace {
  return { id: place.id, name: place.name, category: place.category, lat: place.lat, lng: place.lng };
}
