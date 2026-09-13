import { assertPublicDataApiKey } from "./publicData";
import { geocodeAddress, supplementImagesByName } from "./kakaoLocal";
import { mapWithConcurrency } from "./concurrency";
import { cached } from "./cache";

/** 카카오 지오코딩 동시 요청 상한 — 레이트리밋(429) 방지. */
const KAKAO_CONCURRENCY = 8;

/** 프론트(src/types/place.ts)의 PlaceCategory와 동일한 값 집합 — 백엔드는 별도 프레임워크 의존 없이 문자열로만 다룬다. */
type PlaceCategory = "산책" | "놀이터" | "맛집" | "문화" | "숙박";

const ENDPOINT = "https://api.odcloud.kr/api/15144453/v1/uddi:bf81b4cd-8037-4e73-b643-a63663823656";

/** 사진 보충은 카카오 이미지 검색 호출이 추가로 드니 한 번 조회에서 이만큼만 채운다. */
const MAX_IMAGE_SUPPLEMENT = 80;

/** 이미지 검색 정확도를 높이려고 검색어에 덧붙이는 카테고리별 힌트 단어. */
const IMAGE_SEARCH_HINT: Record<PlaceCategory, string> = {
  산책: "공원",
  놀이터: "반려동물 놀이터",
  맛집: "맛집",
  문화: "문화시설",
  숙박: "숙박",
};

interface RawFacilityItem {
  지역: string;
  사업유형: string;
  업체명: string;
  주소: string;
}

interface RawFacilityResponse {
  data: RawFacilityItem[];
  totalCount: number;
}

/**
 * 원본 사업유형 → 우리 앱 카테고리. "전문업체/인력"(펫호텔 아닌 미용·촬영·공방 등 서비스업)은
 * 여행 코스에 담을 "장소"로 보기 애매해 매핑에서 제외한다(mapPetFacilityCategory가 null 반환).
 */
const CATEGORY_BY_BUSINESS_TYPE: Record<string, PlaceCategory> = {
  동반카페: "맛집",
  "전문 카페": "맛집",
  동반음식점: "맛집",
  "동반공원(광장)": "산책",
  "여가 인프라(산책길, 편의시설, 놀이터)": "놀이터",
  숙박시설: "숙박",
};

export interface DaejeonPetFacility {
  id: string;
  name: string;
  category: PlaceCategory;
  district: string;
  address: string;
  lat: number;
  lng: number;
  imageUrl: string | null;
}

/**
 * 대전관광공사_대전 반려동물 동반 시설 안내(공공데이터포털, 186건)를 조회해 좌표까지 채워 돌려준다.
 * 원본엔 좌표가 없어서 "대전 {지역} {주소}"로 카카오 지오코딩을 한 번씩 태운다(주소는 안 바뀌니
 * geocodeAddress 자체가 30일 캐시를 갖고 있어 이후 호출은 거의 무료).
 */
export async function fetchDaejeonPetFacilities(): Promise<DaejeonPetFacility[]> {
  const key = assertPublicDataApiKey();

  return cached("pet-facilities:all", 24 * 60 * 60 * 1000, async () => {
    const search = new URLSearchParams({ page: "1", perPage: "200", serviceKey: key });
    const res = await fetch(`${ENDPOINT}?${search.toString()}`);
    if (!res.ok) {
      throw new Error(`대전 반려동물 동반 시설 안내 요청 실패: ${res.status} ${res.statusText}`);
    }
    const data = (await res.json()) as RawFacilityResponse;

    const mappable = data.data
      .map((item) => ({ item, category: CATEGORY_BY_BUSINESS_TYPE[item.사업유형] }))
      .filter((entry): entry is { item: RawFacilityItem; category: PlaceCategory } => Boolean(entry.category));

    const geocoded = await mapWithConcurrency(mappable, KAKAO_CONCURRENCY, async ({ item, category }, index) => {
      const point = await geocodeAddress(`대전 ${item.지역} ${item.주소}`).catch(() => null);
      if (!point) return null;
      return {
        id: `petfac-${index}`,
        name: item.업체명,
        category,
        district: item.지역,
        address: item.주소,
        lat: point.lat,
        lng: point.lng,
        imageUrl: null as string | null,
      } satisfies DaejeonPetFacility;
    });

    const facilities = geocoded.filter((facility): facility is DaejeonPetFacility => facility !== null);
    // 이름+구만으로는 무관한 사진이 잡히기 쉬워서, 카테고리 키워드를 같이 붙여 검색을 더 좁힌다.
    return supplementImagesByName(
      facilities,
      (facility) => `대전 ${facility.district} ${facility.name} ${IMAGE_SEARCH_HINT[facility.category]}`,
      MAX_IMAGE_SUPPLEMENT
    );
  });
}
