import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  BRAND_MARKER_ANCHOR,
  BRAND_MARKER_SIZE,
  BRAND_MARKER_SRC,
  createNumberedBrandMarkerSrc,
} from "./kakaoBrandMarker";

/** data URI 안의 SVG 원문을 되돌린다. */
function decode(src: string): string {
  const prefix = "data:image/svg+xml;charset=utf-8,";
  expect(src.startsWith(prefix)).toBe(true);
  return decodeURIComponent(src.slice(prefix.length));
}

/** SVG 속성 하나를 꺼낸다. */
function attr(svg: string, name: string): string | null {
  return new RegExp(`${name}="([^"]+)"`).exec(svg)?.[1] ?? null;
}

/** app/globals.css의 @theme 토큰 값 — 마커는 CSS 변수를 못 써서 색을 하드코딩한다. */
function themeToken(name: string): string {
  const css = readFileSync(fileURLToPath(new URL("../../app/globals.css", import.meta.url)), "utf8");
  return new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{3,8});`).exec(css)![1];
}

describe("발바닥 핀", () => {
  it("data URI로 바로 쓸 수 있는 SVG를 준다 — MarkerImage src에 그대로 들어간다", () => {
    const svg = decode(BRAND_MARKER_SRC);

    expect(svg.startsWith("<svg")).toBe(true);
    expect(attr(svg, "xmlns")).toBe("http://www.w3.org/2000/svg");
  });

  it("선언한 크기와 실제 그림 크기가 같다 — 어긋나면 핀이 늘어나거나 잘린다", () => {
    const svg = decode(BRAND_MARKER_SRC);

    expect(attr(svg, "width")).toBe(String(BRAND_MARKER_SIZE.width));
    expect(attr(svg, "height")).toBe(String(BRAND_MARKER_SIZE.height));
    expect(attr(svg, "viewBox")).toBe(`0 0 ${BRAND_MARKER_SIZE.width} ${BRAND_MARKER_SIZE.height}`);
  });

  it("좌표에 닿는 지점은 핀 꼭짓점 — 가로 한가운데이고 아래쪽이다", () => {
    expect(BRAND_MARKER_ANCHOR.x).toBe(BRAND_MARKER_SIZE.width / 2);
    expect(BRAND_MARKER_ANCHOR.y).toBeGreaterThan(BRAND_MARKER_SIZE.height / 2);
    expect(BRAND_MARKER_ANCHOR.y).toBeLessThanOrEqual(BRAND_MARKER_SIZE.height);
  });

  it("브랜드 민트를 쓴다 — globals.css 토큰이 바뀌면 여기도 같이 바꿔야 한다", () => {
    const svg = decode(BRAND_MARKER_SRC);

    expect(svg).toContain(themeToken("color-brand"));
  });

  it("지도 타일 위에서 묻히지 않게 흰 테두리를 두른다", () => {
    const svg = decode(BRAND_MARKER_SRC);

    expect(attr(svg, "stroke")).toBe("#ffffff");
  });

  it("번호 대신 발바닥을 넣는다 — 핀이 하나뿐인 화면용이다", () => {
    const svg = decode(BRAND_MARKER_SRC);

    expect(svg).toContain("<ellipse");
    expect(svg).not.toContain("<text");
  });
});

describe("번호 핀", () => {
  /** 핀 안에 박힌 순번 글자. */
  function label(order: number): string {
    return />([^<]*)<\/text>/.exec(decode(createNumberedBrandMarkerSrc(order)))![1];
  }

  /** 순번 글자 크기. */
  function fontSize(order: number): number {
    return Number(attr(decode(createNumberedBrandMarkerSrc(order)), "font-size"));
  }

  it("순번을 그대로 박는다", () => {
    expect(label(1)).toBe("1");
    expect(label(12)).toBe("12");
  });

  it("발바닥 핀과 같은 껍데기를 쓴다 — 한 지도에 섞여도 한 세트로 보인다", () => {
    const numbered = decode(createNumberedBrandMarkerSrc(1));
    const paw = decode(BRAND_MARKER_SRC);

    expect(attr(numbered, "viewBox")).toBe(attr(paw, "viewBox"));
    expect(attr(numbered, "fill")).toBe(attr(paw, "fill"));
  });

  it("자릿수가 늘면 글자를 줄인다 — 안 줄이면 핀 밖으로 삐져나간다", () => {
    expect(fontSize(1)).toBeGreaterThan(fontSize(12));
    expect(fontSize(12)).toBeGreaterThan(fontSize(100));
  });

  it("세 자리부터는 99+로 접는다 — 핀은 더 커지지 않는다", () => {
    expect(label(100)).toBe("99+");
    expect(label(9999)).toBe("99+");
    expect(label(99)).toBe("99");
  });

  it("글자를 핀 머리 한가운데에 앉힌다", () => {
    const svg = decode(createNumberedBrandMarkerSrc(1));

    expect(attr(svg, "text-anchor")).toBe("middle");
    expect(attr(svg, "dominant-baseline")).toBe("central");
    expect(Number(/<text x="([^"]+)"/.exec(svg)![1])).toBe(BRAND_MARKER_SIZE.width / 2);
  });
});
