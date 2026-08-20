import type { DaejeonDistrict } from "@/types";
import type { PickablePlace } from "./petTourMapper";

/** backend(/api/verified-pet-restaurants)가 돌려주는 원시 항목 형태 — VerifiedPetRestaurant와 동일 shape */
export interface ApiVerifiedPetRestaurant {
  id: string;
  name: string;
  district: string;
  address: string;
  lat: number;
  lng: number;
  phone: string | null;
  representativeMenu: string | null;
  imageUrl: string | null;
}

const DISTRICTS: DaejeonDistrict[] = ["유성구", "중구", "동구", "대덕구", "서구"];

/**
 * 식품의약품안전처 "반려동물 동반출입 가능 업소" 정식 등록 목록(대전) 매핑.
 * 법정 등록 제도 기반이라 지금 있는 소스 중 맛집 카테고리에서 가장 신뢰도가 높다.
 */
export function mapVerifiedRestaurantToPlace(restaurant: ApiVerifiedPetRestaurant): PickablePlace | null {
  const district = DISTRICTS.find((candidate) => candidate === restaurant.district);
  if (!district) return null;
  if (!Number.isFinite(restaurant.lat) || !Number.isFinite(restaurant.lng)) return null;

  const base = "식약처 반려동물 동반출입 음식점 정식 등록 · 법적으로 동반 가능이 확인된 곳이에요";
  const condition = restaurant.representativeMenu ? `${base} · 대표메뉴 ${restaurant.representativeMenu}` : base;

  return {
    id: `foodsafety-${restaurant.id}`,
    name: restaurant.name,
    category: "맛집",
    district,
    condition,
    petFriendly: true,
    lat: restaurant.lat,
    lng: restaurant.lng,
    imageUrl: restaurant.imageUrl,
  };
}
