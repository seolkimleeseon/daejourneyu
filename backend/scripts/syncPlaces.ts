/**
 * 관광공사·대전시·식약처·문체부 등 여러 공공데이터 소스를 정규화·dedupe해서 Place 테이블에
 * upsert하는 수동 동기화 스크립트. `npm run sync:places`로 실행한다.
 *
 * PlacePickerSheet가 예전엔 시트를 열 때마다 이 소스들을 라이브로 fetch해서 프론트에서 합쳤는데
 * (커밋 b3c5765), 그 병합 로직(카테고리 매핑·구 매칭·condition 문구·신뢰도 티어)을 여기로 옮겨와
 * 한 번의 스크립트 실행으로 DB에 정착시킨다. 이후 /api/places는 이 테이블만 읽는다.
 */
import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { fetchDaejeonPetTourSpots } from "../src/lib/petTourSpots";
import { fetchDaejeonPetFacilities } from "../src/lib/petFacilities";
import { fetchVerifiedPetRestaurants } from "../src/lib/verifiedPetRestaurants";
import { fetchDaejeonParks } from "../src/lib/parks";
import {
  fetchDaejeonCultureFacilities,
  fetchDaejeonLodgings,
  fetchDaejeonTourspots,
  fetchDaejeonExemplaryRestaurants,
} from "../src/lib/daejeonPlaces";
import { fetchDaejeonCampgrounds } from "../src/lib/campgrounds";
import { PET_ACP_FACILITIES } from "../src/lib/petAcpFacilities";
import { DAEJEON_DOG_PARKS } from "../src/lib/daejeonDogParks";

type PlaceCategory = "산책" | "놀이터" | "맛집" | "문화";
const DISTRICTS = ["유성구", "중구", "동구", "대덕구", "서구"];

interface PlaceRow {
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

/** 관광타입(12:관광지 14:문화시설 28:레포츠 32:숙박 39:음식점) → 앱 카테고리. 나머지는 스킵. */
const PETTOUR_CATEGORY: Record<string, PlaceCategory> = {
  "12": "산책",
  "14": "문화",
  "28": "산책",
  "32": "문화",
  "39": "맛집",
};

async function loadPetTourSpots(): Promise<PlaceRow[]> {
  const spots = await fetchDaejeonPetTourSpots({ numOfRows: 30 });
  const rows: PlaceRow[] = [];
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

/** 프론트 PlaceCategory엔 숙박이 없어(팀 결정, 커밋 fddd7ed) 숙박류는 문화로 묶는다. */
function normalizeCategory(raw: string): PlaceCategory | null {
  if (raw === "산책" || raw === "놀이터" || raw === "맛집" || raw === "문화") return raw;
  if (raw === "숙박") return "문화";
  return null;
}

async function loadPetFacilities(): Promise<PlaceRow[]> {
  const facilities = await fetchDaejeonPetFacilities();
  const rows: PlaceRow[] = [];
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

async function loadVerifiedRestaurants(): Promise<PlaceRow[]> {
  const restaurants = await fetchVerifiedPetRestaurants();
  const rows: PlaceRow[] = [];
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

async function loadParks(): Promise<PlaceRow[]> {
  const parks = await fetchDaejeonParks(500, 1);
  const rows: PlaceRow[] = [];
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

async function loadDaejeonPlaces(): Promise<PlaceRow[]> {
  const [culture, lodging, tourspot, restaurant] = await Promise.all([
    fetchDaejeonCultureFacilities(),
    fetchDaejeonLodgings(),
    fetchDaejeonTourspots(),
    fetchDaejeonExemplaryRestaurants(),
  ]);
  const rows: PlaceRow[] = [];
  const condition = "대전시 공공데이터 · 반려동물 동반 가능 여부는 방문 전 확인해주세요";
  for (const place of [...culture, ...lodging, ...tourspot, ...restaurant]) {
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

async function loadCampgrounds(): Promise<PlaceRow[]> {
  const campgrounds = await fetchDaejeonCampgrounds();
  const rows: PlaceRow[] = [];
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

function loadPetAcpFacilities(): PlaceRow[] {
  const rows: PlaceRow[] = [];
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

function loadDaejeonDogParks(): PlaceRow[] {
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
 * 동률이면 imageUrl이 있는 쪽을 우선한다 — PlacePickerSheet.sortByQuality와 동일 규칙. */
function dedupeByName(rows: PlaceRow[]): PlaceRow[] {
  const byName = new Map<string, PlaceRow>();
  for (const row of rows) {
    const key = row.name.replace(/\s+/g, "");
    const existing = byName.get(key);
    if (!existing) {
      byName.set(key, row);
      continue;
    }
    const tierDiff = row.sourceTier - existing.sourceTier;
    const better =
      tierDiff < 0 || (tierDiff === 0 && Boolean(row.imageUrl) && !existing.imageUrl) ? row : existing;
    byName.set(key, better);
  }
  return [...byName.values()];
}

async function main() {
  const loaders: [string, () => Promise<PlaceRow[]> | PlaceRow[]][] = [
    ["pettour", loadPetTourSpots],
    ["petfac", loadPetFacilities],
    ["foodsafety", loadVerifiedRestaurants],
    ["park", loadParks],
    ["daejeon-places", loadDaejeonPlaces],
    ["camp", loadCampgrounds],
    ["petacp", loadPetAcpFacilities],
    ["dogpark", loadDaejeonDogParks],
  ];

  const all: PlaceRow[] = [];
  for (const [label, loader] of loaders) {
    try {
      const rows = await loader();
      console.log(`  ${label}: ${rows.length}건`);
      all.push(...rows);
    } catch (error) {
      console.warn(`  ${label}: 실패 — ${error instanceof Error ? error.message : error}`);
    }
  }

  const deduped = dedupeByName(all);
  console.log(`\n합계 ${all.length}건 → dedupe 후 ${deduped.length}건. DB에 upsert 중...`);

  for (const row of deduped) {
    await prisma.place.upsert({
      where: { id: row.id },
      update: row,
      create: row,
    });
  }

  console.log(`✅ Place 동기화 완료: ${deduped.length}건`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
