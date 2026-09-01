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
