import source from "../data/bakeries.json";
import { cached } from "./cache";
import { mapWithConcurrency } from "./concurrency";
import { geocodeAddress } from "./kakaoLocal";
import { stableId } from "./stableId";
import { assertPublicDataApiKey, fetchPublicDataJson } from "./publicData";
import type { AggregatedPlace } from "./placesAggregator";

const DISTRICTS = ["대덕구", "동구", "유성구", "중구", "서구"];
const CONDITION = "빵집 · 반려동물 동반 가능 여부는 방문 전 매장에 확인해주세요";

interface SeoGuRow {
  idsty_nm: string;
  bssh_nm: string;
  rn_adrs: string;
  la: number;
  lo: number;
}

async function fetchSeoGuBakeries(offset: number): Promise<AggregatedPlace[]> {
  const url = new URL("https://www.seogu.go.kr/seoguAPI/3660000/getBakryStts");
  url.searchParams.set("serviceKey", assertPublicDataApiKey());
  url.searchParams.set("pageNo", "1");
  url.searchParams.set("numOfRows", "300");
  url.searchParams.set("type", "json");
  const response = await fetchPublicDataJson<{
    response: { header: { resultCode: string }; body?: { items?: SeoGuRow[] } };
  }>(url.toString());
  if (response.response.header.resultCode !== "C00") throw new Error("서구 제과점 API 응답 오류");
  const rows = (response.response.body?.items ?? []).filter((row) =>
    row.idsty_nm === "제과점영업" && row.bssh_nm && Number.isFinite(row.la) && Number.isFinite(row.lo)
  );
  return [...rows.slice(offset % rows.length), ...rows.slice(0, offset % rows.length)].slice(0, 12).map((row) => ({
    id: stableId("bakery", "서구", row.bssh_nm, row.rn_adrs),
    name: row.bssh_nm,
    category: "맛집" as const,
    district: "서구",
    condition: CONDITION,
    petFriendly: false,
    smallDogOnly: false,
    lat: row.la,
    lng: row.lo,
    imageUrl: null,
    source: "bakery-seogu",
    sourceTier: 2,
  }));
}

/** CSV 원본에는 좌표와 동반 여부가 없다. 추천 요청 시 일부만 지오코딩하고 확인되지 않은 출입은 false로 유지한다. */
export async function fetchBakeryCandidates(district?: string): Promise<AggregatedPlace[]> {
  const selected = district && DISTRICTS.includes(district) ? [district] : DISTRICTS;
  const date = new Date().toISOString().slice(0, 10);
  return cached(`bakeries:${selected.join(",")}:${date}`, 24 * 60 * 60 * 1000, async () => {
    const candidates = selected.filter((name) => name !== "서구").flatMap((name) => {
      const group = source.filter((row) => row.district === name);
      // 한 지점의 앞부분만 반복 노출하지 않도록 날짜별로 시작점을 바꾼다.
      const offset = Number(date.replace(/-/g, "")) % group.length;
      return [...group.slice(offset), ...group.slice(0, offset)].slice(0, 12);
    });
    const points = await mapWithConcurrency(candidates, 8, (row) =>
      geocodeAddress(row.address).catch(() => null)
    );
    const csvPlaces = candidates.flatMap((row, index): AggregatedPlace[] => {
      const point = points[index];
      if (!point) return [];
      return [{
        id: stableId("bakery", row.district, row.name, row.address),
        name: row.name,
        category: "맛집",
        district: row.district,
        condition: CONDITION,
        petFriendly: false,
        smallDogOnly: false,
        lat: point.lat,
        lng: point.lng,
        imageUrl: null,
        source: "bakery-csv",
        sourceTier: 2,
      }];
    });
    const seoguPlaces = selected.includes("서구")
      ? await fetchSeoGuBakeries(Number(date.replace(/-/g, ""))).catch(() => []) : [];
    return [...csvPlaces, ...seoguPlaces];
  });
}
