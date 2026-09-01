import { assertPublicDataApiKey, extractItems, fetchPublicDataJson, type PublicDataEnvelope } from "./publicData";
import { DAEJEON_CITY_HALL, getLatestForecastBaseDateTime, latLngToGrid } from "./weatherGrid";
import { cached } from "./cache";
import { reverseGeocode } from "./kakaoLocal";

const ENDPOINT = "https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst";

interface ForecastRawItem {
  baseDate: string;
  baseTime: string;
  category: string; // TMP(기온) POP(강수확률) PTY(강수형태) SKY(하늘상태) 등
  fcstDate: string;
  fcstTime: string;
  fcstValue: string;
  nx: number;
  ny: number;
}

export interface DailyForecast {
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  temperatureC: number | null;
  precipitationChancePercent: number | null;
  /** 0=없음 1=비 2=비/눈 3=눈 4=소나기 */
  precipitationType: number | null;
  /** 1=맑음 3=구름많음 4=흐림 */
  skyCondition: number | null;
}

export interface WeatherResult {
  /** 예보를 조회한 지점 라벨 — 대전 안이면 그 구 이름, 대전 밖이거나 위치 정보가 없으면 "대전시청" */
  district: string;
  forecast: DailyForecast[];
}

/** 위치 정보가 없거나 대전 밖일 때 쓰는 기본 지점 라벨. 화면에 "📍 대전시청"으로 노출된다. */
const FALLBACK_DISTRICT = "대전시청";

/**
 * 요청 좌표가 대전 안이면 그 좌표를, 아니면(대전 밖 또는 좌표 없음) 대전시청을 예보 기준점으로
 * 정한다. 대전 밖일 때는 사용자를 그 구에 있는 것처럼 보이게 하지 않으려고 라벨을 "대전시청"으로
 * 고정한다. 역지오코딩 실패도 날씨 조회를 막을 이유가 안 되므로 시청 기본값으로 대체한다.
 */
async function resolveLocation(lat?: number, lng?: number): Promise<{ lat: number; lng: number; district: string }> {
  if (lat !== undefined && lng !== undefined) {
    try {
      const region = await reverseGeocode(lat, lng);
      if (region?.city.includes("대전")) {
        return { lat, lng, district: region.district };
      }
    } catch {
      // 역지오코딩 실패 — 아래 대전시청 기본값으로 대체한다.
    }
  }

  return { ...DAEJEON_CITY_HALL, district: FALLBACK_DISTRICT };
}

/**
 * 지정한 위경도의 단기예보(최대 3일치, 3시간 간격)를 날짜별로 묶어 반환한다.
 * 좌표가 대전 밖이거나 없으면 대전시청 기준으로 대체한다(resolveLocation 참고).
 */
export async function fetchDaejeonForecast(lat?: number, lng?: number): Promise<WeatherResult> {
  const key = assertPublicDataApiKey();
  const location = await resolveLocation(lat, lng);
  const { nx, ny } = latLngToGrid(location.lat, location.lng);
  const { baseDate, baseTime } = getLatestForecastBaseDateTime();
  const cacheKey = `weather:${nx}:${ny}:${baseDate}:${baseTime}`;

  const forecast = await cached(cacheKey, 30 * 60 * 1000, async () => {
    const search = new URLSearchParams({
      serviceKey: key,
      pageNo: "1",
      numOfRows: "1000",
      dataType: "JSON",
      base_date: baseDate,
      base_time: baseTime,
      nx: String(nx),
      ny: String(ny),
    });

    const data = await fetchPublicDataJson<PublicDataEnvelope<ForecastRawItem>>(`${ENDPOINT}?${search.toString()}`);
    const items = extractItems(data);

    const byDateTime = new Map<string, DailyForecast>();
    for (const item of items) {
      const mapKey = `${item.fcstDate}-${item.fcstTime}`;
      const entry =
        byDateTime.get(mapKey) ??
        ({
          date: `${item.fcstDate.slice(0, 4)}-${item.fcstDate.slice(4, 6)}-${item.fcstDate.slice(6, 8)}`,
          time: `${item.fcstTime.slice(0, 2)}:${item.fcstTime.slice(2, 4)}`,
          temperatureC: null,
          precipitationChancePercent: null,
          precipitationType: null,
          skyCondition: null,
        } satisfies DailyForecast);

      if (item.category === "TMP") entry.temperatureC = Number(item.fcstValue);
      if (item.category === "POP") entry.precipitationChancePercent = Number(item.fcstValue);
      if (item.category === "PTY") entry.precipitationType = Number(item.fcstValue);
      if (item.category === "SKY") entry.skyCondition = Number(item.fcstValue);

      byDateTime.set(mapKey, entry);
    }

    return [...byDateTime.values()].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  });

  return { district: location.district, forecast };
}
