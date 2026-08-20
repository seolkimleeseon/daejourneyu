import type { DaejeonDistrict, PlaceCategory } from "@/types";
import type { PickablePlace } from "./petTourMapper";

/** backend(/api/kakao-places)가 돌려주는 원시 항목 형태 — backend/src/lib/kakaoLocal.ts의 KakaoPlace와 동일 shape */
export interface ApiKakaoPlace {
  id: string;
  name: string;
  categoryName: string;
  address: string;
  lat: number;
  lng: number;
  phone: string | null;
  placeUrl: string;
  imageUrl: string | null;
}

const DISTRICTS: DaejeonDistrict[] = ["유성구", "중구", "동구", "대덕구", "서구"];

/**
 * 카카오 키워드 검색 결과를 우리 Place 모양으로 변환한다.
 * 카카오는 "반려동물 동반 가능" 여부를 전혀 안 줘서, petFriendly는 항상 true로 두되
 * condition 문구로 "확인 필요"를 명시한다(🚫 배지가 잘못 뜨는 것보다, 화면 안내 문구로 알리는 쪽이 안전).
 */
export function mapKakaoPlaceToPlace(spot: ApiKakaoPlace, category: PlaceCategory): PickablePlace | null {
  const district = DISTRICTS.find((candidate) => spot.address.includes(candidate));
  if (!district) return null;
  if (!Number.isFinite(spot.lat) || !Number.isFinite(spot.lng)) return null;

  return {
    id: spot.id,
    name: spot.name,
    category,
    district,
    condition: "카카오맵 검색 결과 · 반려동물 동반 가능 여부는 방문 전 확인해주세요",
    petFriendly: true,
    lat: spot.lat,
    lng: spot.lng,
    imageUrl: spot.imageUrl,
  };
}
