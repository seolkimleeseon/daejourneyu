import { assertPublicDataApiKey } from "./publicData";
import { cached } from "./cache";

const ENDPOINT = "https://apis.data.go.kr/B551011/GoCamping/locationBasedList";

/** 대전시청 좌표 기준 반경(m) — 전국구 API라 이 반경으로 걸러낸 뒤 시군구명으로 다시 한 번 대전만 남긴다. */
const DAEJEON_CENTER = { mapX: "127.3845", mapY: "36.3504" };
const RADIUS_METERS = 20000;

const DISTRICTS = ["유성구", "중구", "동구", "대덕구", "서구"];

interface RawCampgroundItem {
  facltNm: string;
  sigunguNm: string;
  addr1: string;
  mapX: string;
  mapY: string;
  intro: string;
  /** 동물 동반 가능 여부 — "가능", "가능(소형견)", "불가능", 또는 빈 값(정보 없음) */
  animalCmgCl: string;
  firstImageUrl: string;
}

interface GoCampingResponse {
  response: { body: { items: { item?: RawCampgroundItem[] } } };
}

export interface DaejeonCampground {
  id: string;
  name: string;
  district: string;
  address: string;
  lat: number;
  lng: number;
  imageUrl: string | null;
}

/**
 * 한국관광공사 고캠핑 정보(전국구)를 대전시청 반경 20km로 조회한 뒤, 시군구명이 대전 5개 구에
 * 해당하는 것만 남긴다 — 세종·공주·논산 등 인접 지역 캠핑장은 제외. 숙박 카테고리 보강용.
 * 이 API는 animalCmgCl로 반려동물 동반 가능 여부를 직접 알려주는 몇 안 되는 소스라, "가능"(소형견
 * 조건부 포함)인 곳만 남긴다 — "불가능"이나 정보 없는 곳은 애초에 후보에서 뺀다.
 */
export async function fetchDaejeonCampgrounds(): Promise<DaejeonCampground[]> {
  const key = assertPublicDataApiKey();

  return cached("daejeon-campgrounds:all", 24 * 60 * 60 * 1000, async () => {
    const search = new URLSearchParams({
      serviceKey: key,
      MobileOS: "ETC",
      MobileApp: "Daejourneyu",
      _type: "json",
      numOfRows: "50",
      mapX: DAEJEON_CENTER.mapX,
      mapY: DAEJEON_CENTER.mapY,
      radius: String(RADIUS_METERS),
    });
    const res = await fetch(`${ENDPOINT}?${search.toString()}`);
    if (!res.ok) {
      throw new Error(`고캠핑 정보 요청 실패: ${res.status} ${res.statusText}`);
    }
    const data = (await res.json()) as GoCampingResponse;
    const items = data.response?.body?.items?.item ?? [];

    return items
      .map((item, index) => {
        if (!item.animalCmgCl?.includes("가능")) return null;
        const district = DISTRICTS.find((candidate) => item.sigunguNm === candidate);
        if (!district) return null;
        const lat = Number(item.mapY);
        const lng = Number(item.mapX);
        if (!lat || !lng) return null;
        return {
          id: `camp-${index}`,
          name: item.facltNm,
          district,
          address: item.addr1,
          lat,
          lng,
          imageUrl: item.firstImageUrl || null,
        } satisfies DaejeonCampground;
      })
      .filter((camp): camp is DaejeonCampground => camp !== null);
  });
}
