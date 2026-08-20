import { cached } from "./cache";
import { mapWithConcurrency, Semaphore } from "./concurrency";

const GEOCODE_ENDPOINT = "https://dapi.kakao.com/v2/local/search/address.json";
const KEYWORD_ENDPOINT = "https://dapi.kakao.com/v2/local/search/keyword.json";
const IMAGE_SEARCH_ENDPOINT = "https://dapi.kakao.com/v2/search/image";

/** 키워드 검색 1회당 이미지까지 보충할 최대 개수 — 매 검색마다 N번 더 호출되니 과도하게 늘리지 않는다. */
const MAX_IMAGE_SUPPLEMENT_PER_SEARCH = 12;
/** 한 호출 안에서(예: 장소 148곳 지오코딩) 동시에 날릴 요청 수 상한. */
const KAKAO_CONCURRENCY = 8;

/**
 * 프로세스 전체에서 공유하는 카카오 API 동시 요청 게이트.
 * "전체" 카테고리 화면처럼 여러 요청이 동시에 각자 병렬 호출을 쏘면(예: 5개 카테고리 × 8 =
 * 최대 40개) 위 KAKAO_CONCURRENCY 같은 "요청 하나 안" 제한만으론 못 막는다 — 실제로 이것 때문에
 * 카카오 레이트리밋(429)에 걸려 502가 났었다. 모든 실제 fetch를 이 세마포어로 감싸서
 * 프로세스 전체 동시 요청 수 자체를 8개로 강제한다.
 */
const kakaoGate = new Semaphore(KAKAO_CONCURRENCY);

async function kakaoFetch(url: string, init?: RequestInit): Promise<Response> {
  return kakaoGate.run(() => fetch(url, init));
}

export function assertKakaoRestKey(): string {
  const key = process.env.KAKAO_REST_API_KEY;
  if (!key) {
    throw new Error("KAKAO_REST_API_KEY가 backend/.env에 설정되지 않았어요");
  }
  return key;
}

interface KakaoAddressDocument {
  address_name: string;
  x: string; // 경도(lng)
  y: string; // 위도(lat)
}

interface KakaoAddressSearchResponse {
  meta: { total_count: number };
  documents: KakaoAddressDocument[];
}

export interface GeocodedPoint {
  lat: number;
  lng: number;
  /** 카카오가 매칭한 주소 원문 — 우리가 넘긴 주소와 다를 수 있어 디버깅용으로 같이 둠 */
  matchedAddress: string;
}

/**
 * 주소 문자열을 WGS84 좌표로 변환한다(지오코딩). 좌표가 없는 공공데이터셋(대전 문화시설·숙박·축제 등)이나
 * 표준 좌표계가 아닌 데이터(행안부 동물병원의 CRD_INFO_X/Y)를 보정하는 용도.
 * 주소는 시간이 지나도 거의 안 바뀌니 캐시를 길게(30일) 잡는다.
 */
export async function geocodeAddress(address: string): Promise<GeocodedPoint | null> {
  const key = assertKakaoRestKey();
  const trimmed = address.trim();
  if (!trimmed) return null;

  return cached(`kakao:geocode:${trimmed}`, 30 * 24 * 60 * 60 * 1000, async () => {
    const url = `${GEOCODE_ENDPOINT}?query=${encodeURIComponent(trimmed)}`;
    const res = await kakaoFetch(url, { headers: { Authorization: `KakaoAK ${key}` } });
    if (!res.ok) {
      throw new Error(`카카오 지오코딩 요청 실패: ${res.status} ${res.statusText}`);
    }
    const data = (await res.json()) as KakaoAddressSearchResponse;
    const [first] = data.documents;
    if (!first) return null;
    return {
      lat: Number(first.y),
      lng: Number(first.x),
      matchedAddress: first.address_name,
    };
  });
}

interface KakaoKeywordDocument {
  id: string;
  place_name: string;
  category_name: string; // 예: "음식점 > 카페 > 커피전문점"
  road_address_name: string;
  address_name: string;
  phone: string;
  place_url: string;
  x: string; // 경도(lng)
  y: string; // 위도(lat)
}

interface KakaoKeywordSearchResponse {
  meta: { total_count: number; is_end: boolean };
  documents: KakaoKeywordDocument[];
}

export interface KakaoPlace {
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

interface KakaoImageDocument {
  image_url: string;
  width: number;
  height: number;
}

interface KakaoImageSearchResponse {
  documents: KakaoImageDocument[];
}

/** 이 도메인에서 오는 이미지는 실사진이 아니라 오지큐(OGQ)마켓 스티커/이모티콘이라 항상 제외한다. */
const NON_PHOTO_DOMAINS = ["storep-phinf.pstatic.net"];
/** 가로:세로 비율이 이보다 넓으면(또는 좁으면) 블로그 표지 카드뉴스·리뷰 배너일 확률이 높아 제외한다. */
const MAX_ASPECT_RATIO = 1.8;
const MIN_DIMENSION = 300;

/**
 * "여행 전문블로거 팬하기" 배너나 "내돈내산 리뷰입니다" 표지 카드처럼, 이름만으로 이미지 검색을 하면
 * 실제 장소 사진이 아니라 블로그 글의 표지 이미지가 자주 걸린다. 이런 표지는 거의 다 가로로 아주
 * 길쭉한 배너 비율(700x248, 773x244 같은)이라 가로세로비로 걸러낸다. 정상적인 사진 비율만 남긴다.
 */
function isLikelyRealPhoto(doc: KakaoImageDocument): boolean {
  if (NON_PHOTO_DOMAINS.some((domain) => doc.image_url.includes(domain))) return false;
  if (doc.width < MIN_DIMENSION || doc.height < MIN_DIMENSION) return false;
  const ratio = Math.max(doc.width, doc.height) / Math.min(doc.width, doc.height);
  return ratio <= MAX_ASPECT_RATIO;
}

/**
 * 카카오 로컬 API는 사진을 안 준다 — 같은 REST 키로 쓸 수 있는 카카오 이미지 검색으로 장소명 기준
 * 대표 사진 한 장을 따로 찾아 보충한다. 이름 기반 검색이라 100% 정확하진 않지만 이모지보단 낫다.
 * 후보를 여러 개(5개) 받아서 블로그 표지/스티커로 보이는 것들을 거르고, 남는 게 없으면 차라리
 * null(이모지 폴백)을 반환한다 — 억지로 아무 사진이나 붙이지 않는다.
 * 장소명 자체는 거의 안 바뀌니 캐시를 길게(7일) 잡는다.
 */
export async function fetchPlaceImage(name: string, key: string): Promise<string | null> {
  return cached(`kakao:image:${name}`, 7 * 24 * 60 * 60 * 1000, async () => {
    const search = new URLSearchParams({ query: name, size: "5", sort: "accuracy" });
    const res = await kakaoFetch(`${IMAGE_SEARCH_ENDPOINT}?${search.toString()}`, {
      headers: { Authorization: `KakaoAK ${key}` },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as KakaoImageSearchResponse;
    return data.documents.find(isLikelyRealPhoto)?.image_url ?? null;
  });
}

/**
 * fetchPlaceImage를 여러 항목에 한 번에 적용하는 범용 헬퍼 — parks.ts/petFacilities.ts 등 사진이 없는
 * 정부 데이터 소스마다 같은 보충 로직을 반복해서 쓰지 않도록 여기 한 곳에 둔다.
 * 카카오 키가 없으면 조용히 원본을 그대로 반환한다(사진 없이도 목록 자체는 살아있어야 하니).
 */
export async function supplementImagesByName<T extends { imageUrl: string | null }>(
  items: T[],
  getName: (item: T) => string,
  cap: number
): Promise<T[]> {
  let key: string;
  try {
    key = assertKakaoRestKey();
  } catch {
    return items;
  }

  const targets = items.slice(0, cap);
  const images = await mapWithConcurrency(targets, KAKAO_CONCURRENCY, (item) =>
    fetchPlaceImage(getName(item), key).catch(() => null)
  );
  targets.forEach((item, index) => {
    item.imageUrl = images[index];
  });
  return items;
}

async function supplementImages(places: KakaoPlace[], key: string): Promise<KakaoPlace[]> {
  const targets = places.slice(0, MAX_IMAGE_SUPPLEMENT_PER_SEARCH);
  const images = await mapWithConcurrency(targets, KAKAO_CONCURRENCY, (place) => {
    // 이름만으로 검색하면 동명이인 업체나 무관한 블로그 사진이 걸리기 쉬워서, 주소 앞부분(시/구)과
    // 업종(categoryName의 마지막 단계, 예: "커피전문점")을 같이 붙여 검색을 더 좁힌다.
    const areaPrefix = place.address.split(" ").slice(0, 2).join(" ");
    const categoryHint = place.categoryName.split(">").pop()?.trim() ?? "";
    return fetchPlaceImage(`${areaPrefix} ${place.name} ${categoryHint}`, key).catch(() => null); // 사진 하나 실패했다고 목록 전체를 실패시키지 않는다
  });
  targets.forEach((place, index) => {
    place.imageUrl = images[index];
  });
  return places;
}

/**
 * 카카오 키워드 검색 — 정부 공공데이터가 빈약한 구역/카테고리 조합을 보완하는 실시간 소스.
 * 반려동물 동반 여부는 카카오도 태그를 안 줘서(우리가 아는 한) 항상 "확인 필요"로 다뤄야 한다.
 */
export async function searchKakaoPlaces(query: string, size = 15): Promise<KakaoPlace[]> {
  const key = assertKakaoRestKey();
  const trimmed = query.trim();
  if (!trimmed) return [];

  return cached(`kakao:keyword:${trimmed}:${size}`, 60 * 60 * 1000, async () => {
    const search = new URLSearchParams({ query: trimmed, size: String(size) });
    const res = await kakaoFetch(`${KEYWORD_ENDPOINT}?${search.toString()}`, {
      headers: { Authorization: `KakaoAK ${key}` },
    });
    if (!res.ok) {
      throw new Error(`카카오 키워드 검색 실패: ${res.status} ${res.statusText}`);
    }
    const data = (await res.json()) as KakaoKeywordSearchResponse;
    const places = data.documents.map((doc) => ({
      id: `kakao-${doc.id}`,
      name: doc.place_name,
      categoryName: doc.category_name,
      address: doc.road_address_name || doc.address_name,
      lat: Number(doc.y),
      lng: Number(doc.x),
      phone: doc.phone || null,
      placeUrl: doc.place_url,
      imageUrl: null as string | null,
    }));
    return supplementImages(places, key);
  });
}
