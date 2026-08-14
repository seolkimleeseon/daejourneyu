import type { DaejeonDistrict, PlaceCategory } from "@/types";
import type { PickablePlace } from "./petTourMapper";

/** backend(/api/daejeon-places/:type)가 돌려주는 원시 항목 형태 — backend/src/lib/daejeonPlaces.ts의 DaejeonPlace와 동일 shape */
export interface ApiDaejeonPlace {
  id: string;
  name: string;
  category: PlaceCategory;
  district: string;
  address: string;
  lat: number;
  lng: number;
  imageUrl: string | null;
}

const DISTRICTS: DaejeonDistrict[] = ["유성구", "중구", "동구", "대덕구", "서구"];

/**
 * 대전시 문화시설/숙박/관광지 공공데이터 매핑. 반려동물 동반 태그가 없는 일반 시설 목록이라
 * 카카오맵 결과와 동급으로 "확인 필요" 취급한다.
 */
export function mapDaejeonPlaceToPlace(place: ApiDaejeonPlace): PickablePlace | null {
  const district = DISTRICTS.find((candidate) => candidate === place.district);
  if (!district) return null;
  if (!Number.isFinite(place.lat) || !Number.isFinite(place.lng)) return null;

  return {
    id: `daejeon-${place.id}`,
    name: place.name,
    category: place.category,
    district,
    condition: "대전시 공공데이터 · 반려동물 동반 가능 여부는 방문 전 확인해주세요",
    petFriendly: true,
    lat: place.lat,
    lng: place.lng,
    imageUrl: place.imageUrl,
  };
}
