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

/** 자유 검색(이름으로 직접 검색)에서 걸려 나오는, 코스에 담을 "장소"로 볼 수 없는 카테고리 —
 * 아파트 같은 게 이름에 검색어가 겹쳐서 같이 나오는 걸 막는다.
 * 주차장·교통시설은 일부러 안 막는다 — 자차로 오는 사람은 목적지 근처 주차장을 검색해볼 수 있다. */
const EXCLUDED_CATEGORY_KEYWORDS = ["부동산"];

/**
 * 카카오 categoryName(예: "음식점 > 카페 > 테마카페 > 애견카페")으로 우리 앱 카테고리를 추정한다.
 * 검색어를 자유 입력으로 카카오에 바로 물어보면(사용자가 직접 이름을 검색하는 경우) 어떤 카테고리가
 * 나올지 미리 알 수 없어서, 카테고리를 미리 정해 넘기던 기존 방식 대신 응답에서 추정해야 한다.
 * 못 알아내면 null — 이때는 호출부가 넘긴 폴백 카테고리를 쓴다.
 */
export function inferCategoryFromKakao(categoryName: string): PlaceCategory | null {
  if (categoryName.includes("반려견놀이터") || categoryName.includes("반려동물 놀이터")) return "놀이터";
  if (categoryName.includes("음식점") || categoryName.includes("카페")) return "맛집";
  if (categoryName.includes("공원") || categoryName.includes("관광,명소") || categoryName.includes("여행")) return "산책";
  if (categoryName.includes("문화") || categoryName.includes("예술") || categoryName.includes("공연") || categoryName.includes("전시")) return "문화";
  return null;
}

/**
 * 카카오 키워드 검색 결과를 우리 Place 모양으로 변환한다.
 * 카카오는 "반려동물 동반 가능" 여부를 전혀 안 줘서, petFriendly는 항상 true로 두되
 * condition 문구로 "확인 필요"를 명시한다(🚫 배지가 잘못 뜨는 것보다, 화면 안내 문구로 알리는 쪽이 안전).
 */
export function mapKakaoPlaceToPlace(spot: ApiKakaoPlace, fallbackCategory: PlaceCategory): PickablePlace | null {
  const district = DISTRICTS.find((candidate) => spot.address.includes(candidate));
  if (!district) return null;
  if (!Number.isFinite(spot.lat) || !Number.isFinite(spot.lng)) return null;
  if (EXCLUDED_CATEGORY_KEYWORDS.some((keyword) => spot.categoryName.includes(keyword))) return null;

  return {
    id: spot.id,
    name: spot.name,
    category: inferCategoryFromKakao(spot.categoryName) ?? fallbackCategory,
    district,
    condition: "카카오맵 검색 결과 · 반려동물 동반 가능 여부는 방문 전 확인해주세요",
    petFriendly: true,
    lat: spot.lat,
    lng: spot.lng,
    imageUrl: spot.imageUrl,
  };
}
