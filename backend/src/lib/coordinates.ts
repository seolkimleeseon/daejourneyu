/**
 * 공공데이터 좌표 파싱 — 소스마다 위경도가 문자열로 오고, 값이 없을 때의 모양도 제각각이다
 * (빈 문자열 · 공백 · "정보없음" · 아예 필드 없음).
 *
 * `Number("")`가 0이고 `Number.isFinite(0)`이 참이라, 빈 값을 그대로 통과시키면 위경도 0,0에
 * 꽂힌 장소가 만들어진다 — 대전이 아니라 기니만 한복판이다. 거리순 정렬에선 11,000km짜리
 * 항목이 되고 지도에선 아프리카 앞바다에 찍힌다. 그래서 "숫자로 바뀌는가"만 보지 않고
 * "쓸 수 있는 좌표인가"까지 한곳에서 판단한다.
 */

/** 좌표 문자열을 숫자로 바꾼다. 비었거나 숫자가 아니거나 0이면 null — 대전 좌표에 0은 없다. */
export function parseCoordinate(raw: unknown): number | null {
  if (typeof raw === "number") return isUsableCoordinate(raw) ? raw : null;
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const value = Number(trimmed);
  return isUsableCoordinate(value) ? value : null;
}

function isUsableCoordinate(value: number): boolean {
  return Number.isFinite(value) && value !== 0;
}

/** 지도에 꽂을 수 있는 좌표 한 쌍인지. 둘 중 하나라도 0이면 값이 빠진 것으로 본다. */
export function isUsablePoint(lat: number, lng: number): boolean {
  return isUsableCoordinate(lat) && isUsableCoordinate(lng);
}
