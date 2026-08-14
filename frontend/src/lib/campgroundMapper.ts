import type { DaejeonDistrict } from "@/types";
import type { PickablePlace } from "./petTourMapper";

/** backend(/api/campgrounds)가 돌려주는 원시 항목 형태 — backend/src/lib/campgrounds.ts의 DaejeonCampground와 동일 shape */
export interface ApiDaejeonCampground {
  id: string;
  name: string;
  district: string;
  address: string;
  lat: number;
  lng: number;
  imageUrl: string | null;
}

const DISTRICTS: DaejeonDistrict[] = ["유성구", "중구", "동구", "대덕구", "서구"];

/**
 * 한국관광공사 고캠핑 정보(대전 인근) — 캠핑장은 야외 숙박이라 숙박 카테고리로 다룬다.
 * 백엔드에서 이미 animalCmgCl(동물 동반 가능 여부)이 "가능"인 곳만 걸러서 보내주기 때문에,
 * 다른 소스와 달리 "확인 필요"가 아니라 실제로 동반 가능이 확인된 곳이라고 안내한다.
 */
export function mapCampgroundToPlace(campground: ApiDaejeonCampground): PickablePlace | null {
  const district = DISTRICTS.find((candidate) => candidate === campground.district);
  if (!district) return null;
  if (!Number.isFinite(campground.lat) || !Number.isFinite(campground.lng)) return null;

  return {
    id: `camp-${campground.id}`,
    name: campground.name,
    category: "숙박",
    district,
    condition: "한국관광공사 고캠핑 등록 · 반려동물 동반 가능 확인된 캠핑장이에요",
    petFriendly: true,
    lat: campground.lat,
    lng: campground.lng,
    imageUrl: campground.imageUrl,
  };
}
