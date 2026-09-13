/**
 * 관광공사·대전관광공사·식약처·대전시·고캠핑·문체부 등 여러 공공데이터 소스를 그때그때 실시간으로
 * 호출해 정규화·dedupe한 장소 목록을 만든다. `backend/routes/places.ts`가 요청마다(짧은 캐시를
 * 두고) 이 함수를 불러 쓴다. 예전엔 이 결과를 DB(Prisma Place 테이블)에 미리 적재해두고
 * `/api/places`가 그 스냅샷만 읽었는데, 공모전 규정상 "원천 데이터를 가공해 DB에 저장"하지 말고
 * "그때그때 실시간 API 호출"이어야 해서 그 방식(및 수동 적재 스크립트)을 완전히 없앴다.
 */
import { fetchDaejeonPetTourSpots } from "./petTourSpots";
import { fetchDaejeonPetFacilities } from "./petFacilities";
import { fetchVerifiedPetRestaurants } from "./verifiedPetRestaurants";
import { fetchDaejeonParks } from "./parks";
import {
  fetchDaejeonCultureFacilities,
  fetchDaejeonLodgings,
  fetchDaejeonTourspots,
  fetchDaejeonExemplaryRestaurants,
  fetchDaejeonShopping,
} from "./daejeonPlaces";
import { fetchDaejeonCampgrounds } from "./campgrounds";
import { PET_ACP_FACILITIES } from "./petAcpFacilities";
import { DAEJEON_DOG_PARKS } from "./daejeonDogParks";
import { assertKakaoRestKey, fetchPlaceImage } from "./kakaoLocal";
import { mapWithConcurrency } from "./concurrency";

export type PlaceCategory = "산책" | "놀이터" | "맛집" | "문화";
const DISTRICTS = ["유성구", "중구", "동구", "대덕구", "서구"];

export interface AggregatedPlace {
  id: string;
  name: string;
  category: PlaceCategory;
  district: string;
  condition: string;
  petFriendly: boolean;
  smallDogOnly: boolean;
  lat: number;
  lng: number;
  imageUrl: string | null;
  source: string;
  sourceTier: number;
}

function findDistrict(text: string): string | undefined {
  return DISTRICTS.find((candidate) => text.includes(candidate));
}

function isFinitePoint(lat: number, lng: number): boolean {
  return Number.isFinite(lat) && Number.isFinite(lng);
}

/** 관광타입(12:관광지 14:문화시설 15:축제공연행사 28:레포츠 38:쇼핑 39:음식점) → 앱 카테고리.
 * 15(축제)·38(쇼핑)은 마땅한 카테고리가 없어 체험·나들이 성격으로 보고 문화로 묶는다.
 * 32(숙박)은 문화가 아니라 완전히 스킵한다 — 모텔/호텔이 "문화형" 코스 추천에 섞여 나오던
 * 버그의 원인이었다. 나머지도 스킵. */
const PETTOUR_CATEGORY: Record<string, PlaceCategory> = {
  "12": "산책",
  "14": "문화",
  "15": "문화",
  "28": "산책",
  "38": "문화",
  "39": "맛집",
};

async function loadPetTourSpots(): Promise<AggregatedPlace[]> {
  const spots = await fetchDaejeonPetTourSpots({ numOfRows: 30 });
  const rows: AggregatedPlace[] = [];
  for (const spot of spots) {
    const category = PETTOUR_CATEGORY[spot.contentTypeId];
    const district = findDistrict(spot.address);
    if (!category || !district || !isFinitePoint(spot.lat, spot.lng)) continue;
    rows.push({
      id: `pettour-${spot.id}`,
      name: spot.name,
      category,
      district,
      condition: "반려동물 동반여행지 인증 · 상세 조건은 현장에서 확인해주세요",
      petFriendly: true,
      smallDogOnly: false,
      lat: spot.lat,
      lng: spot.lng,
      imageUrl: spot.imageUrl,
      source: "pettour",
      sourceTier: 1,
    });
  }
  return rows;
}

/** 프론트 PlaceCategory엔 숙박이 없다. 예전엔(팀 결정, 커밋 fddd7ed) 숙박류를 문화로 묶었는데
 * 모텔/호텔이 "문화형" 코스 추천에 섞여 나오는 문제가 있어 완전히 스킵하는 것으로 바꿨다. */
function normalizeCategory(raw: string): PlaceCategory | null {
  if (raw === "산책" || raw === "놀이터" || raw === "맛집" || raw === "문화") return raw;
  return null;
}

async function loadPetFacilities(): Promise<AggregatedPlace[]> {
  const facilities = await fetchDaejeonPetFacilities();
  const rows: AggregatedPlace[] = [];
  for (const facility of facilities) {
    const category = normalizeCategory(facility.category);
    if (!category || !DISTRICTS.includes(facility.district) || !isFinitePoint(facility.lat, facility.lng)) continue;
    rows.push({
      id: facility.id,
      name: facility.name,
      category,
      district: facility.district,
      condition: "대전관광공사 반려동물 동반시설 인증 · 상세 조건은 현장에서 확인해주세요",
      petFriendly: true,
      smallDogOnly: false,
      lat: facility.lat,
      lng: facility.lng,
      imageUrl: facility.imageUrl,
      source: "petfac",
      sourceTier: 1,
    });
  }
  return rows;
}

async function loadVerifiedRestaurants(): Promise<AggregatedPlace[]> {
  const restaurants = await fetchVerifiedPetRestaurants();
  const rows: AggregatedPlace[] = [];
  for (const restaurant of restaurants) {
    if (!DISTRICTS.includes(restaurant.district) || !isFinitePoint(restaurant.lat, restaurant.lng)) continue;
    const base = "식약처 반려동물 동반출입 음식점 정식 등록 · 법적으로 동반 가능이 확인된 곳이에요";
    rows.push({
      id: restaurant.id,
      name: restaurant.name,
      category: "맛집",
      district: restaurant.district,
      condition: restaurant.representativeMenu ? `${base} · 대표메뉴 ${restaurant.representativeMenu}` : base,
      petFriendly: true,
      smallDogOnly: false,
      lat: restaurant.lat,
      lng: restaurant.lng,
      imageUrl: restaurant.imageUrl,
      source: "foodsafety",
      sourceTier: 1,
    });
  }
  return rows;
}

async function loadParks(): Promise<AggregatedPlace[]> {
  const parks = await fetchDaejeonParks(500, 1);
  const rows: AggregatedPlace[] = [];
  for (const park of parks) {
    const district = findDistrict(park.address);
    if (!district || !isFinitePoint(park.lat, park.lng)) continue;
    rows.push({
      id: `park-${park.id}`,
      // 원시 name이 "찬샘"처럼 옛 마을 이름만 담고 있어 section(공원 종류)을 붙여야 알아볼 수 있다.
      name: `${park.name} ${park.section}`,
      category: "산책",
      district,
      condition: "대전시 공식 도시공원 정보 · 반려동물 동반 가능 여부는 방문 전 확인해주세요",
      petFriendly: true,
      smallDogOnly: false,
      lat: park.lat,
      lng: park.lng,
      imageUrl: park.imageUrl,
      source: "park",
      sourceTier: 2,
    });
  }
  return rows;
}

async function loadDaejeonPlaces(): Promise<AggregatedPlace[]> {
  const [culture, lodging, tourspot, restaurant, shopping] = await Promise.all([
    fetchDaejeonCultureFacilities(),
    fetchDaejeonLodgings(),
    fetchDaejeonTourspots(),
    fetchDaejeonExemplaryRestaurants(),
    fetchDaejeonShopping(),
  ]);
  const rows: AggregatedPlace[] = [];
  const condition = "대전시 공공데이터 · 반려동물 동반 가능 여부는 방문 전 확인해주세요";
  for (const place of [...culture, ...lodging, ...tourspot, ...restaurant, ...shopping]) {
    const category = normalizeCategory(place.category);
    if (!category || !DISTRICTS.includes(place.district) || !isFinitePoint(place.lat, place.lng)) continue;
    rows.push({
      id: place.id,
      name: place.name,
      category,
      district: place.district,
      condition,
      petFriendly: true,
      smallDogOnly: false,
      lat: place.lat,
      lng: place.lng,
      imageUrl: place.imageUrl,
      source: `daejeon-${place.id.split("-")[0]}`,
      sourceTier: 2,
    });
  }
  return rows;
}

async function loadCampgrounds(): Promise<AggregatedPlace[]> {
  const campgrounds = await fetchDaejeonCampgrounds();
  const rows: AggregatedPlace[] = [];
  for (const campground of campgrounds) {
    if (!DISTRICTS.includes(campground.district) || !isFinitePoint(campground.lat, campground.lng)) continue;
    rows.push({
      id: campground.id,
      name: campground.name,
      // 프론트 PlaceCategory엔 숙박이 없어 체험·여가 성격으로 보고 문화로 묶는다(campgroundMapper.ts 선례).
      category: "문화",
      district: campground.district,
      condition: "한국관광공사 고캠핑 등록 · 반려동물 동반 가능 확인된 캠핑장이에요",
      petFriendly: true,
      smallDogOnly: false,
      lat: campground.lat,
      lng: campground.lng,
      imageUrl: campground.imageUrl,
      source: "camp",
      sourceTier: 1,
    });
  }
  return rows;
}

const PETACP_CATEGORY: Record<string, PlaceCategory> = {
  산책: "산책",
  맛집: "맛집",
  문화: "문화",
};

function loadPetAcpFacilities(): AggregatedPlace[] {
  const rows: AggregatedPlace[] = [];
  PET_ACP_FACILITIES.forEach((entry, index) => {
    const category = PETACP_CATEGORY[entry.category];
    if (!category || !DISTRICTS.includes(entry.district) || !isFinitePoint(entry.lat, entry.lng)) return;

    const petFriendly = entry.petPossible === "Y";
    const smallDogOnly = petFriendly && entry.petSize !== "모두 가능" && entry.petSize !== "해당없음";
    const condition = petFriendly
      ? [
          "문화체육관광부 반려동물 동반가능 시설 현황(2023) 인증",
          entry.petSize === "모두 가능" ? "전 견종 동반 가능" : entry.petSize,
          entry.petLimit !== "해당없음" ? entry.petLimit : null,
        ]
          .filter(Boolean)
          .join(" · ")
      : "문화체육관광부 반려동물 동반가능 시설 현황(2023) 조사 · 반려동물 동반 불가로 확인됨";

    rows.push({
      id: `petacp-${index}`,
      name: entry.name,
      category,
      district: entry.district,
      condition,
      petFriendly,
      smallDogOnly,
      lat: entry.lat,
      lng: entry.lng,
      imageUrl: null,
      source: "petacp",
      sourceTier: 1,
    });
  });
  return rows;
}

function loadDaejeonDogParks(): AggregatedPlace[] {
  return DAEJEON_DOG_PARKS.filter(
    (entry) => DISTRICTS.includes(entry.district) && isFinitePoint(entry.lat, entry.lng)
  ).map((entry) => ({
    id: `dogpark-${entry.name}`,
    name: entry.name,
    category: "놀이터",
    district: entry.district,
    condition: `대전시 자치구 조성 반려동물 놀이터 · 무료 · ${entry.note}`,
    petFriendly: true,
    smallDogOnly: false,
    lat: entry.lat,
    lng: entry.lng,
    imageUrl: null,
    source: "daejeon-dogpark",
    sourceTier: 1,
  }));
}

/** 이름(공백 제거) 기준으로 중복을 골라내 신뢰도 티어가 더 높은(숫자가 작은) 쪽만 남긴다.
 * 동률이면 imageUrl이 있는 쪽을 우선한다. */
function dedupeByName(rows: AggregatedPlace[]): AggregatedPlace[] {
  const byName = new Map<string, AggregatedPlace>();
  for (const row of rows) {
    const key = row.name.replace(/\s+/g, "");
    const existing = byName.get(key);
    if (!existing) {
      byName.set(key, row);
      continue;
    }
    const tierDiff = row.sourceTier - existing.sourceTier;
    const better = tierDiff < 0 || (tierDiff === 0 && Boolean(row.imageUrl) && !existing.imageUrl) ? row : existing;
    byName.set(key, better);
  }
  return [...byName.values()];
}

const IMAGE_SEARCH_HINT: Record<PlaceCategory, string> = {
  산책: "공원",
  놀이터: "반려동물 놀이터",
  맛집: "맛집",
  문화: "문화시설",
};

/** 이미지 보강 동시 요청 상한 — 레이트리밋 방지(kakaoLocal.ts의 다른 호출부와 동일 값). */
const IMAGE_BACKFILL_CONCURRENCY = 8;

/** 소스별 fetch 단계에서 이미지를 못 채운 행을 dedupe 이후 한 번 더 훑어 카카오 이미지 검색으로 채운다. */
async function backfillMissingImages(rows: AggregatedPlace[]): Promise<void> {
  let key: string;
  try {
    key = assertKakaoRestKey();
  } catch {
    return;
  }

  const missing = rows.filter((row) => !row.imageUrl);
  if (!missing.length) return;

  const images = await mapWithConcurrency(missing, IMAGE_BACKFILL_CONCURRENCY, (row) =>
    fetchPlaceImage(`대전 ${row.district} ${row.name} ${IMAGE_SEARCH_HINT[row.category]}`, key).catch(() => null)
  );
  missing.forEach((row, index) => {
    row.imageUrl = images[index];
  });
}

/** 모든 공공데이터 소스를 병렬로 실시간 호출해 정규화·dedupe·이미지 보강까지 마친 장소 목록을 만든다.
 * 소스 하나가 실패해도 나머지는 그대로 반환한다(부분 실패 허용). */
export async function fetchAggregatedPlaces(): Promise<AggregatedPlace[]> {
  const loaders: [string, () => Promise<AggregatedPlace[]> | AggregatedPlace[]][] = [
    ["pettour", loadPetTourSpots],
    ["petfac", loadPetFacilities],
    ["foodsafety", loadVerifiedRestaurants],
    ["park", loadParks],
    ["daejeon-places", loadDaejeonPlaces],
    ["camp", loadCampgrounds],
    ["petacp", loadPetAcpFacilities],
    ["dogpark", loadDaejeonDogParks],
  ];

  const results = await Promise.all(
    loaders.map(async ([label, loader]) => {
      try {
        return await loader();
      } catch (error) {
        console.warn(`[places] ${label} 실패 — ${error instanceof Error ? error.message : error}`);
        return [];
      }
    })
  );

  const deduped = dedupeByName(results.flat());
  await backfillMissingImages(deduped);
  return deduped;
}
