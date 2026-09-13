/**
 * 카카오맵에서 핀과 핀을 잇는 "여정 동선" 선 스타일 — 로고 커스텀 핀(kakaoBrandMarker)과 한 세트.
 *
 * 색은 브랜드 민트(#35ad90) 핀과 같은 색상 계열의 가장 진한 톤(app/globals.css의 --color-brand-700)
 * 이라, 밝은 지도 타일·녹색 공원 폴리곤 위에서도 민트 원색보다 대비가 살고 "우리 색"으로 읽힌다.
 * MarkerImage src처럼 CSS 변수를 못 쓰는 자리(Polyline strokeColor)라 값을 하드코딩한다 —
 * globals.css의 --color-brand-700이 바뀌면 같이 고쳐야 한다.
 */
export const ROUTE_PATH_STYLE = {
  /** #1e7d64 = --color-brand-700 */
  color: "#1e7d64",
  weight: 4,
  opacity: 0.9,
  /** 실선이 아니라 파선 — 도로가 아니라 "계획된 여정"으로 읽히게. */
  style: "dash",
} as const;
