import type { DaejeonDistrict, PlaceCategory } from "@/types";
import type { PickablePlace } from "./petTourMapper";

/** backend(/api/pet-facilities)가 돌려주는 원시 항목 형태 — backend/src/lib/petFacilities.ts의 DaejeonPetFacility와 동일 shape */
export interface ApiPetFacility {
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
 * 대전관광공사_대전 반려동물 동반 시설 안내(공공데이터, 186건 중 여행지로 쓸 만한 것만) 매핑.
 * 관광공사가 직접 만든 "반려동물 동반 가능" 목록이라 petTourMapper와 동급으로 인증 취급한다.
 */
export function mapPetFacilityToPlace(facility: ApiPetFacility): PickablePlace | null {
  const district = DISTRICTS.find((candidate) => candidate === facility.district);
  if (!district) return null;
  if (!Number.isFinite(facility.lat) || !Number.isFinite(facility.lng)) return null;

  return {
    id: `petfac-${facility.id}`,
    name: facility.name,
    category: facility.category,
    district,
    condition: "대전관광공사 반려동물 동반시설 인증 · 상세 조건은 현장에서 확인해주세요",
    petFriendly: true,
    lat: facility.lat,
    lng: facility.lng,
    imageUrl: facility.imageUrl,
  };
}
