import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { ROUTE_PATH_STYLE } from "./kakaoRouteStyle";

/** app/globals.css의 @theme 토큰 값 — Polyline은 CSS 변수를 못 써서 색을 하드코딩한다. */
function themeToken(name: string): string {
  const css = readFileSync(fileURLToPath(new URL("../../app/globals.css", import.meta.url)), "utf8");
  return new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{3,8});`).exec(css)![1];
}

describe("동선 선 스타일", () => {
  it("브랜드 진한 민트를 쓴다 — globals.css 토큰이 바뀌면 여기도 같이 바꿔야 한다", () => {
    expect(ROUTE_PATH_STYLE.color).toBe(themeToken("color-brand-700"));
  });

  it("실선이 아니라 파선이다 — 도로가 아니라 '계획된 여정'으로 읽히게", () => {
    expect(ROUTE_PATH_STYLE.style).toBe("shortdash");
  });

  it("지도 타일 위에서 비쳐 보이되 묻히지는 않을 만큼만 투명하다", () => {
    expect(ROUTE_PATH_STYLE.opacity).toBeGreaterThan(0.5);
    expect(ROUTE_PATH_STYLE.opacity).toBeLessThanOrEqual(1);
  });

  it("선 두께를 준다 — 0이면 아무것도 안 보인다", () => {
    expect(ROUTE_PATH_STYLE.weight).toBeGreaterThan(0);
  });
});
