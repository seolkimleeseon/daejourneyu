import type { DaejeonDistrict, Place, PlaceCategory } from "@/types";

/** backend(/api/pet-tour-spots)가 돌려주는 원시 항목 형태 — backend/src/lib/petTourSpots.ts의 PetTourSpot과 동일 shape */
export interface ApiPetTourSpot {
  id: string;
  contentTypeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  imageUrl: string | null;
  tel: string | null;
}

const DISTRICTS: DaejeonDistrict[] = ["유성구", "중구", "동구", "대덕구", "서구"];

/** Place + 표시용 사진 URL. src/types/place.ts(Player1 소유)는 건드리지 않고 이 파일에서만 확장해 쓴다. */
export interface PickablePlace extends Place {
  imageUrl: string | null;
}

/** 관광타입(12:관광지 14:문화시설 15:축제 25:여행코스 28:레포츠 32:숙박 38:쇼핑 39:음식점) → 우리 앱 카테고리.
 * 15(축제)·38(쇼핑)은 "장소"로 다루기 애매해 코스에 담지 않는다(매핑에서 제외).
 * PlaceCategory에 숙박이 없어(Player1 소유 타입) 32(숙박)는 문화로 묶는다. */
const CATEGORY_BY_CONTENT_TYPE: Record<string, PlaceCategory> = {
  "12": "산책",
  "14": "문화",
  "28": "산책",
  "32": "문화",
  "39": "맛집",
};

/**
 * KorPetTourService2 응답을 우리 Place 타입으로 변환한다.
 * 이 API는 애초에 "반려동물 동반 가능" 인증 목록만 주기 때문에 petFriendly는 항상 true로 둔다.
 * 다만 목줄 필수/소형견만 가능 같은 세부 조건은 areaBasedList2만으로는 못 얻어(detailCommon2 별도 호출 필요) 안내 문구로 대신한다.
 */
export function mapPetTourSpotToPlace(spot: ApiPetTourSpot): PickablePlace | null {
  const category = CATEGORY_BY_CONTENT_TYPE[spot.contentTypeId];
  if (!category) return null;
  const district = DISTRICTS.find((candidate) => spot.address.includes(candidate));
  if (!district) return null;
  if (!Number.isFinite(spot.lat) || !Number.isFinite(spot.lng)) return null;

  return {
    id: `pettour-${spot.id}`,
    name: spot.name,
    category,
    district,
    condition: "반려동물 동반여행지 인증 · 상세 조건은 현장에서 확인해주세요",
    petFriendly: true,
    lat: spot.lat,
    lng: spot.lng,
    imageUrl: spot.imageUrl,
  };
}

const ALL_CATEGORIES: PlaceCategory[] = ["산책", "놀이터", "맛집", "문화"];

/**
 * 대전 지역은 KorPetTourService2 실데이터 자체가 아직 카테고리별로 아주 적다(예: 관광지 몇 곳뿐이고
 * 문화시설·음식점은 0곳인 경우도 있음). 그래서 카테고리마다 최소 개수를 보장하려면 실데이터만으론 부족해서,
 * 부족한 카테고리는 mockPlaces(폴백 풀)에서 이름이 겹치지 않는 것부터 채워 넣는다.
 */
export function ensureCategoryMinimum(
  primary: PickablePlace[],
  fallbackPool: Place[],
  minPerCategory = 3
): (PickablePlace | Place)[] {
  const result: (PickablePlace | Place)[] = [...primary];
  const usedNames = new Set(primary.map((place) => place.name));

  for (const category of ALL_CATEGORIES) {
    const have = primary.filter((place) => place.category === category).length;
    if (have >= minPerCategory) continue;
    const need = minPerCategory - have;
    const supplements = fallbackPool.filter((place) => place.category === category && !usedNames.has(place.name)).slice(0, need);
    supplements.forEach((place) => usedNames.add(place.name));
    result.push(...supplements);
  }

  return result;
}
