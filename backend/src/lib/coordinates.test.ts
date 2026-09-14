import { describe, expect, it } from "vitest";
import { isUsablePoint, parseCoordinate } from "./coordinates";

/*
 * 공공데이터는 값이 없을 때의 모양이 소스마다 다르다 — 빈 문자열, 공백, "정보없음", 0, 없는 필드.
 * 이 중 빈 문자열이 가장 위험하다: Number("")는 0이고 Number.isFinite(0)은 참이라
 * 그냥 두면 위경도 0,0(기니만 한복판)에 꽂힌 장소가 만들어진다.
 */
describe("parseCoordinate", () => {
  it("숫자 문자열을 숫자로 바꾼다", () => {
    expect(parseCoordinate("36.3669")).toBe(36.3669);
    expect(parseCoordinate("127.3886")).toBe(127.3886);
  });

  it("앞뒤 공백은 털어낸다", () => {
    expect(parseCoordinate("  36.3669 ")).toBe(36.3669);
  });

  it("이미 숫자로 온 값도 받는다 — XML 파서가 숫자로 읽어 내려주기도 한다", () => {
    expect(parseCoordinate(36.3669)).toBe(36.3669);
  });

  it("빈 값은 0이 아니라 없는 것으로 본다 — 여기가 0,0 장소가 생기던 자리다", () => {
    expect(parseCoordinate("")).toBeNull();
    expect(parseCoordinate("   ")).toBeNull();
  });

  it("0도 없는 값으로 본다 — 대전 좌표에 0은 없다", () => {
    expect(parseCoordinate("0")).toBeNull();
    expect(parseCoordinate(0)).toBeNull();
  });

  it("숫자가 아닌 글자는 없는 값이다", () => {
    expect(parseCoordinate("정보없음")).toBeNull();
    expect(parseCoordinate("해당없음")).toBeNull();
  });

  it("필드 자체가 없어도 터지지 않는다", () => {
    expect(parseCoordinate(undefined)).toBeNull();
    expect(parseCoordinate(null)).toBeNull();
  });

  it("음수 좌표도 그대로 둔다 — 이 함수는 대전 밖인지까지 따지지 않는다", () => {
    expect(parseCoordinate("-33.8688")).toBe(-33.8688);
  });
});

describe("isUsablePoint", () => {
  it("대전 좌표는 쓸 수 있다", () => {
    expect(isUsablePoint(36.3669, 127.3886)).toBe(true);
  });

  it("0,0은 쓸 수 없다 — 값이 빠진 것이지 기니만에 있는 게 아니다", () => {
    expect(isUsablePoint(0, 0)).toBe(false);
  });

  it("한 축만 0이어도 쓸 수 없다", () => {
    expect(isUsablePoint(36.3669, 0)).toBe(false);
    expect(isUsablePoint(0, 127.3886)).toBe(false);
  });

  it("NaN도 쓸 수 없다", () => {
    expect(isUsablePoint(NaN, 127.3886)).toBe(false);
  });
});
