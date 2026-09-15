export interface WeatherForecast {
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  temperatureC: number | null;
  precipitationChancePercent: number | null;
  /** 0=없음 1=비 2=비/눈 3=눈 4=소나기 */
  precipitationType: number | null;
  /** 1=맑음 3=구름많음 4=흐림 */
  skyCondition: number | null;
}

export interface WeatherResponse {
  /** 예보를 조회한 지점의 구 이름(대전 밖이거나 위치 정보가 없으면 시청 기준 구) */
  district: string;
  forecast: WeatherForecast[];
}

const SKY_EMOJI: Record<number, string> = { 1: "☀️", 3: "⛅", 4: "☁️" };
const SKY_LABEL: Record<number, string> = { 1: "맑음", 3: "구름 많음", 4: "흐림" };
const PRECIP_EMOJI: Record<number, string> = { 1: "🌧️", 2: "🌨️", 3: "❄️", 4: "🌦️" };
const PRECIP_LABEL: Record<number, string> = { 1: "비", 2: "비/눈", 3: "눈", 4: "소나기" };

function toTimestamp(date: string, time: string): number {
  return new Date(`${date}T${time}:00+09:00`).getTime();
}

/** 3시간 간격 예보 목록 중 지금 시각과 가장 가까운(다음으로 오는) 항목을 고른다. */
export function pickCurrentForecast(forecast: WeatherForecast[]): WeatherForecast | null {
  if (forecast.length === 0) return null;
  const now = Date.now();
  return forecast.find((item) => toTimestamp(item.date, item.time) >= now) ?? forecast[forecast.length - 1];
}

function weatherEmoji(item: WeatherForecast): string {
  const hasPrecip = !!item.precipitationType && item.precipitationType > 0;
  return hasPrecip
    ? PRECIP_EMOJI[item.precipitationType as number]
    : item.skyCondition
      ? SKY_EMOJI[item.skyCondition]
      : "🌡️";
}

function weatherLabel(item: WeatherForecast): string {
  const hasPrecip = !!item.precipitationType && item.precipitationType > 0;
  return hasPrecip
    ? PRECIP_LABEL[item.precipitationType as number]
    : item.skyCondition
      ? SKY_LABEL[item.skyCondition]
      : "";
}

/** "☀️ 18°C · 맑음" 형태의 요약 문구. 강수 예보가 있으면 하늘 상태 대신 강수 종류를 보여준다. */
export function formatWeatherSummary(item: WeatherForecast): string {
  const label = weatherLabel(item);
  const temp = item.temperatureC !== null ? `${Math.round(item.temperatureC)}°C` : "-";
  return `${weatherEmoji(item)} ${temp}${label ? ` · ${label}` : ""}`;
}

/** "☀️ 18°C" 형태의 짧은 요약 — 장소별 날씨 티커처럼 폭이 좁은 배지용. */
export function formatWeatherShort(item: WeatherForecast): string {
  const temp = item.temperatureC !== null ? `${Math.round(item.temperatureC)}°C` : "-";
  return `${weatherEmoji(item)} ${temp}`;
}
