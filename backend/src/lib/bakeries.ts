import source from "../data/bakeries.json";
import { cached } from "./cache";
import { mapWithConcurrency } from "./concurrency";
import { geocodeAddress } from "./kakaoLocal";
import { stableId } from "./stableId";
import { assertPublicDataApiKey, fetchPublicDataJson } from "./publicData";
import type { AggregatedPlace } from "./placesAggregator";

const DISTRICTS = ["대덕구", "동구", "유성구", "중구", "서구"];
const CONDITION = "빵집 · 반려동물 동반 가능 여부는 방문 전 매장에 확인해주세요";
const CHAIN_NAMES = ["파리바게", "뚜레쥬르", "던킨", "크리스피크림", "브레댄코", "파리크라상", "로띠번", "호밀호두"];
const CANDIDATES_PER_DISTRICT = 20;
// 대전시 시민추천 빵집과 대전시 빵지순례 소개 목록. 인허가 데이터에 있는 업소만 추천한다.
// https://daejeon.go.kr/fod/ContentsHtmlView.do?menuSeq=7834
// https://www.daejeon.go.kr/its/ItsdjNormalboardView.do?boardGubun=itsdj01&boardSeq=3318&menuSeq=5942&pageIndex=1
const FEATURED_NAMES = ["성심당", "빵한모금", "연이가베이크샵", "하레하레", "다소리과자점", "정동문화사", "카페지니", "수제빵연구소", "콜드버터베이크샵", "대전사라다", "몽심", "명기네빵집"];
const MULTI_BRANCH_BRANDS = ["성심당", "몽심", "하레하레", "수제빵연구소", "대전사라다", "정인구팥빵"];

function isFeaturedBakery(name: string): boolean {
  const key = bakeryNameKey(name);
  return FEATURED_NAMES.some((featured) => key.includes(featured));
}

/** 소개된 업소를 일부 고정하고, 나머지는 날짜별로 순환해 지역 빵집도 노출한다. */
export function pickBakerySample<T>(rows: T[], nameOf: (row: T) => string, offset: number, limit = 12): T[] {
  const featured = rows.filter((row) => isFeaturedBakery(nameOf(row)));
  const others = rows.filter((row) => !isFeaturedBakery(nameOf(row)));
  const featuredLimit = Math.min(featured.length, Math.ceil(limit / 2));
  const rotatedFeatured = featured.length ? [...featured.slice(offset % featured.length), ...featured.slice(0, offset % featured.length)] : [];
  const rotatedOthers = others.length ? [...others.slice(offset % others.length), ...others.slice(0, offset % others.length)] : [];
  return [...rotatedFeatured.slice(0, featuredLimit), ...rotatedOthers.slice(0, limit - featuredLimit)];
}

/** 같은 업소가 상호 끝의 숫자만 달리해 중복 등록된 경우에도 같은 이름으로 취급한다. */
export function bakeryNameKey(name: string): string {
  return name.replace(/[\s()·._-]/g, "").toLowerCase().replace(/([가-힣])[1-9](?:호점)?$/, "$1");
}

/** AI 코스에서도 같은 브랜드의 지점 두 곳을 서로 다른 빵집으로 세지 않는다. */
export function bakeryBrandKey(name: string): string {
  const key = bakeryNameKey(name).replace(/^(?:주식회사|주)/, "").replace(/(?:대전[가-힣0-9]*점|본점)$/, "");
  return MULTI_BRANCH_BRANDS.find((brand) => key.startsWith(brand)) ?? key;
}

function uniqueNames<T>(rows: T[], nameOf: (row: T) => string): T[] {
  const seen = new Set<string>();
  return rows.filter((row) => {
    const key = bakeryNameKey(nameOf(row));
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** 제과점 인허가만으로는 동네 빵집 여부가 보장되지 않아 전국 체인과 명백한 비제과 상호를 뺀다. */
export function isPilgrimageBakery(name: string): boolean {
  const normalized = bakeryNameKey(name);
  return Boolean(normalized) && !CHAIN_NAMES.some((chain) => normalized.includes(chain)) &&
    !/만두|김밥|국밥|순대|떡볶이/.test(normalized);
}

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
  const rows = uniqueNames((response.response.body?.items ?? []).filter((row) =>
    row.idsty_nm === "제과점영업" && isPilgrimageBakery(row.bssh_nm) && Number.isFinite(row.la) && Number.isFinite(row.lo)
  ), (row) => row.bssh_nm);
  return pickBakerySample(rows, (row) => row.bssh_nm, offset, CANDIDATES_PER_DISTRICT).map((row) => ({
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
export async function fetchBakeryCandidates(district?: string, batch = 0): Promise<AggregatedPlace[]> {
  const selected = district && DISTRICTS.includes(district) ? [district] : DISTRICTS;
  const date = new Date().toISOString().slice(0, 10);
  return cached(`bakeries:${selected.join(",")}:${date}:${batch}`, 24 * 60 * 60 * 1000, async () => {
    const candidates = selected.filter((name) => name !== "서구").flatMap((name) => {
      const group = uniqueNames(source.filter((row) => row.district === name && isPilgrimageBakery(row.name)), (row) => row.name);
      if (!group.length) return [];
      // 한 지점의 앞부분만 반복 노출하지 않도록 날짜별로 시작점을 바꾼다.
      const offset = (Number(date.replace(/-/g, "")) + batch * CANDIDATES_PER_DISTRICT) % group.length;
      return pickBakerySample(group, (row) => row.name, offset, CANDIDATES_PER_DISTRICT);
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
      ? await fetchSeoGuBakeries(Number(date.replace(/-/g, "")) + batch * CANDIDATES_PER_DISTRICT).catch(() => []) : [];
    return [...csvPlaces, ...seoguPlaces];
  });
}
