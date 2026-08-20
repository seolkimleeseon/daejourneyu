import { fetchDaejeonOpenApi } from "./daejeonOpenApi";
import { geocodeAddress, supplementImagesByName } from "./kakaoLocal";
import { mapWithConcurrency } from "./concurrency";
import { cached } from "./cache";

/** 카카오 지오코딩 동시 요청 상한 — 레이트리밋(429) 방지. */
const KAKAO_CONCURRENCY = 8;

/** 프론트(src/types/place.ts)의 PlaceCategory와 동일한 값 집합. */
type PlaceCategory = "산책" | "놀이터" | "맛집" | "문화" | "숙박";

const DISTRICTS = ["유성구", "중구", "동구", "대덕구", "서구"];

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

export interface DaejeonPlace {
  id: string;
  name: string;
  category: PlaceCategory;
  district: string;
  address: string;
  lat: number;
  lng: number;
  imageUrl: string | null;
}

interface OpenApiEnvelope<Item> {
  response: { body: { totalCount: number; items: Item[] } };
}

function extractItems<Item>(data: unknown): Item[] {
  const envelope = data as OpenApiEnvelope<Item>;
  return envelope.response?.body?.items ?? [];
}

interface RawExemplaryRestaurantItem {
  restrntNm: string;
  restrntAddr: string;
  mapLat: string;
  mapLot: string;
}

/** 대전시 모범음식점(위생·서비스 우수 인증업소) — mapLat/mapLot을 이미 갖고 있어 지오코딩이 필요 없다. */
export async function fetchDaejeonExemplaryRestaurants(): Promise<DaejeonPlace[]> {
  return cached("daejeon-places:restaurant", 24 * 60 * 60 * 1000, async () => {
    const data = await fetchDaejeonOpenApi("restaurant", { numOfRows: 200 });
    const items = extractItems<RawExemplaryRestaurantItem>(data);

    const places = items
      .map((item, index) => {
        const district = DISTRICTS.find((candidate) => item.restrntAddr.includes(candidate));
        if (!district) return null;
        const lat = Number(item.mapLat);
        const lng = Number(item.mapLot);
        if (!lat || !lng) return null;
        return {
          id: `restaurant-${index}`,
          name: item.restrntNm,
          category: "맛집" as PlaceCategory,
          district,
          address: item.restrntAddr,
          lat,
          lng,
          imageUrl: null as string | null,
        } satisfies DaejeonPlace;
      })
      .filter((place): place is DaejeonPlace => place !== null);

    return supplementImagesByName(places, (place) => `대전 ${place.district} ${place.name} ${IMAGE_SEARCH_HINT[place.category]}`, MAX_IMAGE_SUPPLEMENT);
  });
}

interface RawCultureItem {
  signgu: string;
  fcltyNm: string;
  locplc: string;
}

/** 대전시 문화시설(공연장·전시관 등) — 좌표가 없어 지오코딩으로 채운다. */
export async function fetchDaejeonCultureFacilities(): Promise<DaejeonPlace[]> {
  return cached("daejeon-places:culture", 24 * 60 * 60 * 1000, async () => {
    const data = await fetchDaejeonOpenApi("culture", { numOfRows: 200 });
    const items = extractItems<RawCultureItem>(data);

    const geocoded = await mapWithConcurrency(items, KAKAO_CONCURRENCY, async (item, index) => {
        const district = DISTRICTS.find((candidate) => item.signgu === candidate);
        if (!district) return null;
        const point = await geocodeAddress(`대전 ${item.locplc}`).catch(() => null);
        if (!point) return null;
        return {
          id: `culture-${index}`,
          name: item.fcltyNm,
          category: "문화" as PlaceCategory,
          district,
          address: item.locplc,
          lat: point.lat,
          lng: point.lng,
          imageUrl: null as string | null,
        } satisfies DaejeonPlace;
    });

    const places = geocoded.filter((place): place is DaejeonPlace => place !== null);
    return supplementImagesByName(places, (place) => `대전 ${place.district} ${place.name} ${IMAGE_SEARCH_HINT[place.category]}`, MAX_IMAGE_SUPPLEMENT);
  });
}

interface RawLodgingItem {
  romsNm: string;
  romsAddr: string;
}

/** 대전시 문화관광 숙박업소 목록 — 좌표가 없어 지오코딩으로 채운다. */
export async function fetchDaejeonLodgings(): Promise<DaejeonPlace[]> {
  return cached("daejeon-places:lodging", 24 * 60 * 60 * 1000, async () => {
    const data = await fetchDaejeonOpenApi("lodging", { numOfRows: 200 });
    const items = extractItems<RawLodgingItem>(data);

    const geocoded = await mapWithConcurrency(items, KAKAO_CONCURRENCY, async (item, index) => {
      const district = DISTRICTS.find((candidate) => item.romsAddr.includes(candidate));
      if (!district) return null;
      const point = await geocodeAddress(item.romsAddr).catch(() => null);
      if (!point) return null;
      return {
        id: `lodging-${index}`,
        name: item.romsNm,
        category: "숙박" as PlaceCategory,
        district,
        address: item.romsAddr,
        lat: point.lat,
        lng: point.lng,
        imageUrl: null as string | null,
      } satisfies DaejeonPlace;
    });

    const places = geocoded.filter((place): place is DaejeonPlace => place !== null);
    return supplementImagesByName(places, (place) => `대전 ${place.district} ${place.name} ${IMAGE_SEARCH_HINT[place.category]}`, MAX_IMAGE_SUPPLEMENT);
  });
}

interface RawTourspotItem {
  tourspotNm: string;
  tourspotAddr: string;
  mapLat: string;
  mapLot: string;
}

/** 대전시 관광지 목록 — 상당수가 mapLat/mapLot을 이미 갖고 있어(0인 경우만 지오코딩 폴백), 관광공사
 * 데이터와 같은 산책·나들이류 카테고리로 다룬다. */
export async function fetchDaejeonTourspots(): Promise<DaejeonPlace[]> {
  return cached("daejeon-places:tourspot", 24 * 60 * 60 * 1000, async () => {
    const data = await fetchDaejeonOpenApi("tourspot", { numOfRows: 200 });
    const items = extractItems<RawTourspotItem>(data);

    const geocoded = await mapWithConcurrency(items, KAKAO_CONCURRENCY, async (item, index) => {
      const district = DISTRICTS.find((candidate) => item.tourspotAddr.includes(candidate));
      if (!district) return null;

      const rawLat = Number(item.mapLat);
      const rawLng = Number(item.mapLot);
      let lat = rawLat;
      let lng = rawLng;
      if (!rawLat || !rawLng) {
        const point = await geocodeAddress(item.tourspotAddr).catch(() => null);
        if (!point) return null;
        lat = point.lat;
        lng = point.lng;
      }

      return {
        id: `tourspot-${index}`,
        name: item.tourspotNm,
        category: "산책" as PlaceCategory,
        district,
        address: item.tourspotAddr,
        lat,
        lng,
        imageUrl: null as string | null,
      } satisfies DaejeonPlace;
    });

    const places = geocoded.filter((place): place is DaejeonPlace => place !== null);
    return supplementImagesByName(places, (place) => `대전 ${place.district} ${place.name} ${IMAGE_SEARCH_HINT[place.category]}`, MAX_IMAGE_SUPPLEMENT);
  });
}
