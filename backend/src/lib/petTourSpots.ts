import { assertPublicDataApiKey, extractItems, fetchPublicDataJson, type PublicDataEnvelope } from "./publicData";
import { cached } from "./cache";

const ENDPOINT = "https://apis.data.go.kr/B551011/KorPetTourService2/areaBasedList2";
const IMAGE_ENDPOINT = "https://apis.data.go.kr/B551011/KorPetTourService2/detailImage2";

/** 대전 지역코드 (한국관광공사 지역코드 체계) */
const DAEJEON_AREA_CODE = "3";

/**
 * areaBasedList2의 firstimage는 상당수 장소에서 비어 있다. 그 장소들만 detailImage2로 보충해서 채운다.
 * detailImage2는 일일 트래픽 한도가 1,000회로 다른 오퍼레이션보다 낮아서, 한 번 호출에서 보충하는 개수를 제한한다.
 */
const MAX_IMAGE_SUPPLEMENT_PER_REQUEST = 24;

/** 카테고리 하나로 몰아서 정렬하면(예: 수정일순) 특정 관광타입에 결과가 쏠릴 수 있어, 타입별로 따로 조회해 최소 개수를 보장한다. */
const CATEGORY_CONTENT_TYPE_IDS: PetTourContentTypeId[] = ["12", "14", "28", "32", "39"];
const DEFAULT_MIN_PER_CATEGORY = 12;

/** 12:관광지 14:문화시설 15:축제공연행사 28:레포츠 32:숙박 38:쇼핑 39:음식점 */
export type PetTourContentTypeId = "12" | "14" | "15" | "28" | "32" | "38" | "39";

interface PetTourRawItem {
  contentid: string;
  contenttypeid: string;
  title: string;
  addr1: string;
  addr2?: string;
  mapx: string;
  mapy: string;
  firstimage?: string;
  tel?: string;
}

interface PetTourImageItem {
  originimgurl?: string;
  smallimageurl?: string;
}

export interface PetTourSpot {
  id: string;
  contentTypeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  imageUrl: string | null;
  tel: string | null;
}

interface FetchOptions {
  contentTypeId?: PetTourContentTypeId;
  sigunguCode?: string;
  pageNo?: number;
  /** contentTypeId를 지정하지 않은 기본 모드에서는 "관광타입 하나당" 결과 수로 쓰인다(최소 개수 보장). */
  numOfRows?: number;
}

function mapRawItem(item: PetTourRawItem): PetTourSpot {
  return {
    id: item.contentid,
    contentTypeId: item.contenttypeid,
    name: item.title,
    address: [item.addr1, item.addr2].filter(Boolean).join(" "),
    lat: Number(item.mapy),
    lng: Number(item.mapx),
    imageUrl: item.firstimage || null,
    tel: item.tel || null,
  };
}

async function fetchByContentType(
  key: string,
  contentTypeId: PetTourContentTypeId,
  numOfRows: number,
  sigunguCode?: string
): Promise<PetTourSpot[]> {
  const cacheKey = `pettour:list:${contentTypeId}:${numOfRows}:${sigunguCode ?? ""}`;
  return cached(cacheKey, 60 * 60 * 1000, async () => {
    const search = new URLSearchParams({
      serviceKey: key,
      MobileOS: "ETC",
      MobileApp: "Daejourneyu",
      _type: "json",
      arrange: "C",
      areaCode: DAEJEON_AREA_CODE,
      contentTypeId,
      numOfRows: String(numOfRows),
      pageNo: "1",
    });
    if (sigunguCode) search.set("sigunguCode", sigunguCode);

    const data = await fetchPublicDataJson<PublicDataEnvelope<PetTourRawItem>>(`${ENDPOINT}?${search.toString()}`);
    return extractItems(data).map(mapRawItem);
  });
}

function dedupeById(spots: PetTourSpot[]): PetTourSpot[] {
  const byId = new Map<string, PetTourSpot>();
  for (const spot of spots) {
    if (!byId.has(spot.id)) byId.set(spot.id, spot);
  }
  return [...byId.values()];
}

/** contentId 하나의 대표 이미지를 찾는다. 이미지는 자주 안 바뀌니 하루 단위로 캐시한다. */
async function fetchSupplementalImage(contentId: string, key: string): Promise<string | null> {
  return cached(`pettour:image:${contentId}`, 24 * 60 * 60 * 1000, async () => {
    const search = new URLSearchParams({
      serviceKey: key,
      MobileOS: "ETC",
      MobileApp: "Daejourneyu",
      _type: "json",
      imageYN: "Y",
      numOfRows: "1",
      pageNo: "1",
      contentId,
    });
    try {
      const data = await fetchPublicDataJson<PublicDataEnvelope<PetTourImageItem>>(`${IMAGE_ENDPOINT}?${search.toString()}`);
      const [first] = extractItems(data);
      return first?.smallimageurl || first?.originimgurl || null;
    } catch {
      // 이미지 하나 실패했다고 장소 전체 목록을 실패시키지 않는다 — 그냥 이모지 카드로 남긴다.
      return null;
    }
  });
}

async function supplementMissingImages(spots: PetTourSpot[], key: string): Promise<PetTourSpot[]> {
  const missingImage = spots.filter((spot) => !spot.imageUrl).slice(0, MAX_IMAGE_SUPPLEMENT_PER_REQUEST);
  if (!missingImage.length) return spots;
  const images = await Promise.all(missingImage.map((spot) => fetchSupplementalImage(spot.id, key)));
  missingImage.forEach((spot, index) => {
    spot.imageUrl = images[index];
  });
  return spots;
}

/**
 * 대전 지역의 반려동물 동반 가능 관광지·숙박·음식점 등을 조회한다(한국관광공사 KorPetTourService2).
 * contentTypeId를 안 주면 관광타입(관광지·문화시설·레포츠·숙박·음식점) 별로 각각 따로 조회해서 합친다 —
 * 하나로 묶어서 정렬하면 최근 수정된 타입 하나에 결과가 쏠릴 수 있어서, 카테고리별 최소 개수를 보장하기 위함.
 */
export async function fetchDaejeonPetTourSpots(options: FetchOptions = {}): Promise<PetTourSpot[]> {
  const key = assertPublicDataApiKey();

  if (options.contentTypeId) {
    const spots = await fetchByContentType(key, options.contentTypeId, options.numOfRows ?? 20, options.sigunguCode);
    return supplementMissingImages(spots, key);
  }

  const perCategoryRows = options.numOfRows ?? DEFAULT_MIN_PER_CATEGORY;
  const perCategoryResults = await Promise.all(
    CATEGORY_CONTENT_TYPE_IDS.map((typeId) =>
      fetchByContentType(key, typeId, perCategoryRows, options.sigunguCode).catch(() => [] as PetTourSpot[])
    )
  );
  const merged = dedupeById(perCategoryResults.flat());
  return supplementMissingImages(merged, key);
}
