/**
 * 카카오맵 커스텀 마커 — 기본 빨간 핀 대신 우리 로고(민트 물방울 + 흰 발바닥)를 쓴다.
 *
 * AppIcon(app/icon.svg 등의 출처)의 물방울+발바닥 실루엣을 그대로 옮긴 SVG를 data URI로 만든다.
 * MarkerImage의 src로 넘길 것이라 CSS 변수(var(--color-brand))는 못 쓰고 브랜드 색을 하드코딩한다
 * — app/globals.css의 --color-brand(#35ad90)와 동일해야 한다.
 */

/** 마커 이미지 픽셀 크기. */
export const BRAND_MARKER_SIZE = { width: 36, height: 44 } as const;

/** 좌표에 닿아야 하는 지점 = 핀 꼭짓점(하단 중앙). MarkerImage offset으로 넘긴다. */
export const BRAND_MARKER_ANCHOR = { x: 18, y: 41 } as const;

const BRAND_MINT = "#35ad90";

const SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="${BRAND_MARKER_SIZE.width}" height="${BRAND_MARKER_SIZE.height}" viewBox="0 0 36 44">
<path d="M18 1.6C9.5 1.6 2.6 8.4 2.6 16.7c0 5.9 3.8 11.4 7.5 15.4 1.9 2 3.8 3.6 5.3 4.7 1.4 1.1 2.2 1.6 2.6 1.6s1.2-.5 2.6-1.6c1.5-1.1 3.4-2.7 5.3-4.7 3.7-4 7.5-9.5 7.5-15.4C33.4 8.4 26.5 1.6 18 1.6z" fill="${BRAND_MINT}" stroke="#ffffff" stroke-width="2.4"/>
<ellipse cx="18" cy="19.3" rx="3.3" ry="2.8" fill="#ffffff"/>
<circle cx="14.4" cy="15.6" r="1.55" fill="#ffffff"/>
<circle cx="18" cy="13.7" r="1.7" fill="#ffffff"/>
<circle cx="21.6" cy="15.6" r="1.55" fill="#ffffff"/>
</svg>`;

/** MarkerImage src로 넘길 data URI. */
export const BRAND_MARKER_SRC = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(SVG)}`;
