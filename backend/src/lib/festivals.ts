import { assertPublicDataApiKey, extractItems, fetchPublicDataJson, type PublicDataEnvelope } from "./publicData";
import { cached } from "./cache";
import { mapWithConcurrency } from "./concurrency";
import { fetchAggregatedPlaces } from "./placesAggregator";

const ENDPOINT = "https://apis.data.go.kr/B551011/KorService2/searchFestival2";
const DETAIL_COMMON_ENDPOINT = "https://apis.data.go.kr/B551011/KorService2/detailCommon2";

/** 홈페이지 보강 동시 요청 상한 — 레이트리밋 방지(kakaoLocal.ts 등 다른 호출부와 동일한 관례). */
const HOMEPAGE_CONCURRENCY = 8;

/** places.ts와 같은 캐시 키를 써서 장소 애그리게이션 호출을 공유한다(중복 호출 방지). */
const PLACES_CACHE_KEY = "places:all";
const PLACES_CACHE_TTL_MS = 5 * 60 * 1000;

/** 축제 좌표와 이 반경(m) 안에 반려동반 인증 장소가 있으면 "장소는 인증됨"으로 본다.
 * 행사 자체의 동반 허용 여부와는 별개 — 유림공원처럼 넓은 공원 부지 안에서 좌표가 수백 m씩
 * 어긋나는 경우가 있어 도보 권 정도로 넉넉히 잡는다. */
const VENUE_MATCH_RADIUS_M = 300;

/** 법정동 시도코드(대전) — searchFestival2는 areaCode 대신 이 체계를 쓴다. */
const DAEJEON_L_DONG_REGN_CD = "30";

/** 캘린더가 넘나들 수 있는 범위를 넉넉히 커버 — 과거 3개월 ~ 미래 1년. */
const WINDOW_DAYS_PAST = 90;
const WINDOW_DAYS_FUTURE = 365;

export interface DaejeonFestival {
  id: string;
  title: string;
  /** YYYY-MM-DD */
  date: string;
  /** YYYY-MM-DD — 당일 행사면 date와 동일 */
  endDate: string;
  place: string;
  address: string;
  lat: number | null;
  lng: number | null;
  imageUrl: string | null;
  tel: string | null;
  webUrl: string | null;
  /** 행사 좌표 인근에 반려동반 인증 장소가 있는지 — 행사 자체의 동반 허용 여부를 보장하진 않는다. */
  venuePetFriendly: boolean;
  /** venuePetFriendly=true일 때 근거가 된 장소명(안내 문구용). */
  venuePlaceName: string | null;
}

interface RawFestivalItem {
  contentid: string;
  title: string;
  addr1: string;
  addr2?: string;
  eventstartdate: string;
  eventenddate: string;
  mapx?: string;
  mapy?: string;
  firstimage?: string;
  tel?: string;
}

interface RawFestivalCommonItem {
  homepage?: string;
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

function toApiDate(d: Date): string {
  return `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}`;
}

function toYmd(raw: string): string {
  return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
}

/** homepage 필드가 <a href="...">...</a> HTML로 오는 경우와 순수 URL로 오는 경우가 섞여 있다. */
function extractUrl(raw?: string): string | null {
  if (!raw) return null;
  const hrefMatch = raw.match(/href=\\?["']([^"'\\]+)/i);
  if (hrefMatch) return hrefMatch[1];
  const trimmed = raw.trim();
  return trimmed.startsWith("http") ? trimmed : null;
}

function defaultDateRange(): { eventStartDate: string; eventEndDate: string } {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - WINDOW_DAYS_PAST);
  const end = new Date(now);
  end.setDate(end.getDate() + WINDOW_DAYS_FUTURE);
  return { eventStartDate: toApiDate(start), eventEndDate: toApiDate(end) };
}

function mapRawItem(item: RawFestivalItem): DaejeonFestival | null {
  if (!item.eventstartdate || item.eventstartdate.length !== 8) return null;

  const lat = item.mapy ? Number(item.mapy) : NaN;
  const lng = item.mapx ? Number(item.mapx) : NaN;
  const endDate = item.eventenddate && item.eventenddate.length === 8 ? item.eventenddate : item.eventstartdate;

  return {
    id: item.contentid,
    title: item.title,
    date: toYmd(item.eventstartdate),
    endDate: toYmd(endDate),
    place: item.addr2?.trim() || item.addr1,
    address: [item.addr1, item.addr2].filter(Boolean).join(" "),
    lat: Number.isFinite(lat) ? lat : null,
    lng: Number.isFinite(lng) ? lng : null,
    imageUrl: item.firstimage || null,
    tel: item.tel || null,
    webUrl: null,
    venuePetFriendly: false,
    venuePlaceName: null,
  };
}

/** 두 좌표 사이 거리(m) — Haversine 공식. */
function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const EARTH_RADIUS_M = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** 축제 좌표 인근(도보권)에서 가장 가까운 반려동반 인증 장소를 찾는다. */
async function supplementVenuePetFriendly(festivals: DaejeonFestival[]): Promise<DaejeonFestival[]> {
  let places: Awaited<ReturnType<typeof fetchAggregatedPlaces>>;
  try {
    places = await cached(PLACES_CACHE_KEY, PLACES_CACHE_TTL_MS, fetchAggregatedPlaces);
  } catch {
    // 장소 데이터 실패는 축제 목록 자체를 실패시키지 않는다 — 인증 뱃지만 안 뜨게 둔다.
    return festivals;
  }
  // "맛집"·"문화"(개별 업체)는 제외한다 — 축제 근처에 우연히 반려동반 가능한 카페·빵집이 있다고
  // 그 행사장(대개 거리·광장)이 반려동물 출입 가능하다는 근거가 되진 않는다. "산책"(공원 등)·
  // "놀이터"(반려견 놀이터)처럼 실제 공공 야외부지인 경우만 행사장 자체와 견줄 만한 신호로 본다.
  const petFriendlyPlaces = places.filter(
    (place) => place.petFriendly && (place.category === "산책" || place.category === "놀이터")
  );

  for (const festival of festivals) {
    if (festival.lat === null || festival.lng === null) continue;
    const nearby = petFriendlyPlaces.find(
      (place) => distanceMeters(festival.lat as number, festival.lng as number, place.lat, place.lng) <= VENUE_MATCH_RADIUS_M
    );
    if (nearby) {
      festival.venuePetFriendly = true;
      festival.venuePlaceName = nearby.name;
    }
  }
  return festivals;
}

/** contentId 하나의 홈페이지 주소를 찾는다(detailCommon2). 자주 안 바뀌니 하루 단위로 캐시한다. */
async function fetchFestivalHomepage(contentId: string, key: string): Promise<string | null> {
  return cached(`festivals:homepage:${contentId}`, 24 * 60 * 60 * 1000, async () => {
    const search = new URLSearchParams({
      serviceKey: key,
      MobileOS: "ETC",
      MobileApp: "Daejourneyu",
      _type: "json",
      contentId,
    });
    try {
      const data = await fetchPublicDataJson<PublicDataEnvelope<RawFestivalCommonItem>>(
        `${DETAIL_COMMON_ENDPOINT}?${search.toString()}`
      );
      const [first] = extractItems(data);
      return extractUrl(first?.homepage);
    } catch {
      // 홈페이지 하나 실패했다고 축제 목록 전체를 실패시키지 않는다 — 링크 버튼만 안 뜨게 둔다.
      return null;
    }
  });
}

async function supplementHomepages(festivals: DaejeonFestival[], key: string): Promise<DaejeonFestival[]> {
  const webUrls = await mapWithConcurrency(festivals, HOMEPAGE_CONCURRENCY, (festival) =>
    fetchFestivalHomepage(festival.id, key)
  );
  festivals.forEach((festival, index) => {
    festival.webUrl = webUrls[index];
  });
  return festivals;
}

/**
 * 대전 지역의 일반 축제·행사를 조회한다(한국관광공사 KorService2 searchFestival2).
 * 축제 자체의 반려동물 동반 가능 여부는 이 API에 없다. 대신 행사 좌표 인근에 반려동반 인증
 * 장소(공원 등)가 있으면 venuePetFriendly로 표시한다 — "장소는 인증됨"이라는 뜻일 뿐, 행사
 * 주최 측이 그 행사에 한해 별도로 동반을 제한할 수 있으니 확정적인 동반 가능 여부는 아니다.
 */
export async function fetchDaejeonFestivals(): Promise<DaejeonFestival[]> {
  const key = assertPublicDataApiKey();
  const { eventStartDate, eventEndDate } = defaultDateRange();

  const festivals = await cached(`festivals:daejeon:${eventStartDate}:${eventEndDate}`, 60 * 60 * 1000, async () => {
    const search = new URLSearchParams({
      serviceKey: key,
      MobileOS: "ETC",
      MobileApp: "Daejourneyu",
      _type: "json",
      arrange: "C",
      numOfRows: "100",
      pageNo: "1",
      eventStartDate,
      eventEndDate,
      lDongRegnCd: DAEJEON_L_DONG_REGN_CD,
    });

    const data = await fetchPublicDataJson<PublicDataEnvelope<RawFestivalItem>>(`${ENDPOINT}?${search.toString()}`);
    return extractItems(data)
      .map(mapRawItem)
      .filter((festival): festival is DaejeonFestival => festival !== null);
  });

  await supplementVenuePetFriendly(festivals);
  return supplementHomepages(festivals, key);
}
