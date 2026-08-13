/**
 * 기상청 격자(nx, ny) ↔ 위경도 변환 — 기상청이 공개한 LCC DFS 좌표계 변환 공식.
 * 단기예보 API는 위경도가 아니라 이 격자 좌표를 요구한다.
 */
const RE = 6371.00877; // 지도반경(km)
const GRID = 5.0; // 격자간격(km)
const SLAT1 = 30.0; // 투영위도1(degree)
const SLAT2 = 60.0; // 투영위도2(degree)
const OLON = 126.0; // 기준점 경도(degree)
const OLAT = 38.0; // 기준점 위도(degree)
const XO = 43; // 기준점 X좌표(GRID)
const YO = 136; // 기준점 Y좌표(GRID)

export function latLngToGrid(lat: number, lng: number): { nx: number; ny: number } {
  const DEGRAD = Math.PI / 180.0;
  const re = RE / GRID;
  const slat1 = SLAT1 * DEGRAD;
  const slat2 = SLAT2 * DEGRAD;
  const olon = OLON * DEGRAD;
  const olat = OLAT * DEGRAD;

  let sn = Math.tan(Math.PI * 0.25 + slat2 * 0.5) / Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);
  let sf = Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sf = (Math.pow(sf, sn) * Math.cos(slat1)) / sn;
  let ro = Math.tan(Math.PI * 0.25 + olat * 0.5);
  ro = (re * sf) / Math.pow(ro, sn);

  const ra0 = Math.tan(Math.PI * 0.25 + lat * DEGRAD * 0.5);
  const ra = (re * sf) / Math.pow(ra0, sn);
  let theta = lng * DEGRAD - olon;
  if (theta > Math.PI) theta -= 2.0 * Math.PI;
  if (theta < -Math.PI) theta += 2.0 * Math.PI;
  theta *= sn;

  return {
    nx: Math.floor(ra * Math.sin(theta) + XO + 0.5),
    ny: Math.floor(ro - ra * Math.cos(theta) + YO + 0.5),
  };
}

/** 대전 대략 중심 좌표(시청) — 격자 기본값으로 사용 */
export const DAEJEON_CITY_HALL = { lat: 36.3504, lng: 127.3845 };

function pad2(value: number): string {
  return value < 10 ? `0${value}` : `${value}`;
}

/**
 * 단기예보조회(getVilageFcst)는 하루 8번(02,05,08,11,14,17,20,23시) 발표되고,
 * 발표 후 10분은 지나야 조회 가능하다. "지금 기준으로 가장 최근에 발표된 시각"을 계산한다.
 */
export function getLatestForecastBaseDateTime(now = new Date()): { baseDate: string; baseTime: string } {
  const BASE_HOURS = [2, 5, 8, 11, 14, 17, 20, 23];
  const reference = new Date(now.getTime() - 10 * 60 * 1000); // 발표 10분 유예
  const hour = reference.getHours();
  let date = reference;

  let baseHour = [...BASE_HOURS].reverse().find((h) => h <= hour);
  if (baseHour === undefined) {
    // 자정 직후(00~01시대)라 오늘 발표분이 아직 없음 → 전날 23시 발표분을 사용
    date = new Date(reference.getTime() - 24 * 60 * 60 * 1000);
    baseHour = 23;
  }

  const baseDate = `${date.getFullYear()}${pad2(date.getMonth() + 1)}${pad2(date.getDate())}`;
  const baseTime = `${pad2(baseHour)}00`;
  return { baseDate, baseTime };
}
