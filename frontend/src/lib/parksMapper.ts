import type { DaejeonDistrict } from "@/types";
import type { PickablePlace } from "./petTourMapper";

/** backend(/api/parks)가 돌려주는 원시 항목 형태 — backend/src/lib/parks.ts의 DaejeonPark와 동일 shape */
export interface ApiDaejeonPark {
  id: string;
  name: string;
  address: string;
  section: string;
  lat: number;
  lng: number;
  imageUrl: string | null;
}

const DISTRICTS: DaejeonDistrict[] = ["유성구", "중구", "동구", "대덕구", "서구"];

/**
 * 대전시 공식 도시공원정보를 우리 Place 타입으로 변환한다(산책 카테고리 전용).
 * 관광공사 반려동물 동반여행 데이터보다 대전 공원 커버리지가 훨씬 넓지만, "반려동물 동반 가능
 * 인증"까지 확인된 목록은 아니라서 카카오맵 결과와 마찬가지로 안내 문구로 확인을 유도한다.
 */
export function mapParkToPlace(park: ApiDaejeonPark): PickablePlace | null {
  const district = DISTRICTS.find((candidate) => park.address.includes(candidate));
  if (!district) return null;
  if (!Number.isFinite(park.lat) || !Number.isFinite(park.lng)) return null;

  // 원시 데이터의 name은 "찬샘"처럼 옛 마을 이름만 담고 있어 section(공원 종류)을 붙여야 무슨 공원인지 알아볼 수 있다.
  return {
    id: `park-${park.id}`,
    name: `${park.name} ${park.section}`,
    category: "산책",
    district,
    condition: "대전시 공식 도시공원 정보 · 반려동물 동반 가능 여부는 방문 전 확인해주세요",
    petFriendly: true,
    lat: park.lat,
    lng: park.lng,
    imageUrl: park.imageUrl,
  };
}
