import { assertPublicDataApiKey, extractItems, fetchPublicDataJson, type PublicDataEnvelope } from "./publicData";
import { DAEJEON_CITY_HALL, getLatestForecastBaseDateTime, latLngToGrid } from "./weatherGrid";
import { cached } from "./cache";

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

/**
 * 지정한 위경도의 단기예보(최대 3일치, 3시간 간격)를 날짜별로 묶어 반환한다.
 * lat/lng를 생략하면 대전시청 좌표를 기본값으로 쓴다.
 */
export async function fetchDaejeonForecast(
  lat = DAEJEON_CITY_HALL.lat,
  lng = DAEJEON_CITY_HALL.lng
): Promise<DailyForecast[]> {
  const key = assertPublicDataApiKey();
  const { nx, ny } = latLngToGrid(lat, lng);
  const { baseDate, baseTime } = getLatestForecastBaseDateTime();
  const cacheKey = `weather:${nx}:${ny}:${baseDate}:${baseTime}`;

  return cached(cacheKey, 30 * 60 * 1000, async () => {
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
}
